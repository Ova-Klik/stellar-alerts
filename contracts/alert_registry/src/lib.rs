#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, symbol_short, Address, Env, String, Symbol};

const REGISTRATION_KEY: Symbol = symbol_short!("REGISTERED");

#[derive(Clone, Copy, PartialEq)]
#[contracterror]
pub enum AlertRegistryError {
    NotAuthorized = 1,
    InvalidChannel = 2,
    EmptyTarget = 3,
}

#[contract]
pub struct AlertRegistryContract;

#[contractimpl]
impl AlertRegistryContract {
    /// Registers an alert listener preference on-chain for a user address.
    pub fn register_listener(
        env: Env,
        user: Address,
        channel: Symbol,
        target: String,
    ) -> Result<(), AlertRegistryError> {
        user.require_auth();

        if target.len() == 0 {
            return Err(AlertRegistryError::EmptyTarget);
        }

        // Store user preference in instance storage
        env.storage().instance().set(&(user.clone(), channel.clone()), &target);

        // Publish event for off-chain ingestion watchers
        env.events().publish(
            (REGISTRATION_KEY, user, channel),
            target,
        );

        Ok(())
    }

    /// Queries the registered alert target for a given user and channel.
    pub fn get_listener(env: Env, user: Address, channel: Symbol) -> Option<String> {
        env.storage().instance().get(&(user, channel))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn register_and_get_listener() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AlertRegistryContract);
        let client = AlertRegistryContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let channel = symbol_short!("EMAIL");
        let target = String::from_str(&env, "user@example.com");

        client.register_listener(&user, &channel, &target);

        let result = client.get_listener(&user, &channel);
        assert_eq!(result, Some(target));
    }

    #[test]
    fn empty_target_returns_error() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AlertRegistryContract);
        let client = AlertRegistryContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let channel = symbol_short!("EMAIL");
        let target = String::from_str(&env, "");

        let result = client.try_register_listener(&user, &channel, &target);
        assert!(result.is_err());
    }

    #[test]
    fn get_nonexistent_listener_returns_none() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AlertRegistryContract);
        let client = AlertRegistryContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let channel = symbol_short!("EMAIL");

        let result = client.get_listener(&user, &channel);
        assert_eq!(result, None);
    }
}
