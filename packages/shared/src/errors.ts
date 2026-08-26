/**
 * Typed error classes mapping to Soroban contract error variants.
 *
 * Each class carries a numeric `code` that matches the Rust `#[contracterror]`
 * enum discriminant exactly, plus the contract name that produced it.
 */

export class ContractError extends Error {
  constructor(
    public readonly code: number,
    public readonly contractName: string,
    message: string,
  ) {
    super(message);
    this.name = 'ContractError';
  }
}

export class AlertRegistryError extends ContractError {
  constructor(code: number, message: string) {
    super(code, 'alert_registry', message);
    this.name = 'AlertRegistryError';
  }
}

/** Numeric codes matching the Rust AlertRegistryError enum discriminants. */
export const ALERT_REGISTRY_ERROR_CODES: Record<number, string> = {
  1: 'NotAuthorized',
  2: 'InvalidChannel',
  3: 'EmptyTarget',
};
