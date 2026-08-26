import * as StellarSdk from 'stellar-sdk';
import {
  ContractError,
  parseContractError,
  type RawSorobanResponse,
} from '@stellar-alerts/shared';

const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

export const sorobanServer = new (StellarSdk as any).rpc.Server(SOROBAN_RPC_URL);

export interface ParsedSorobanTransfer {
  contractId: string;
  from: string;
  to: string;
  amount: string;
  topic: string;
}

/**
 * Wraps a raw Soroban RPC error into a typed ContractError.
 * If the error is already a ContractError, re-throws as-is.
 */
function wrapSorobanError(error: unknown, context: string): ContractError {
  if (error instanceof ContractError) {
    return error;
  }

  const raw = error as Record<string, unknown>;
  if (raw && typeof raw === 'object' && ('result' in raw || 'error' in raw)) {
    return parseContractError(raw as RawSorobanResponse);
  }

  const message =
    error instanceof Error ? error.message : String(error);
  return new ContractError(0, 'soroban_rpc', `[${context}] ${message}`);
}

/**
 * Fetches latest ledger sequence from Soroban RPC endpoint.
 * @throws {ContractError} if the RPC call fails.
 */
export async function getSorobanLatestLedger(): Promise<number> {
  const health = await sorobanServer.getLatestLedger().catch((error: unknown) => {
    throw wrapSorobanError(error, 'getSorobanLatestLedger');
  });
  return health.sequence;
}

/**
 * Fetches contract events from Soroban RPC for a specific contract address.
 * @throws {ContractError} if the RPC call fails with a contract error.
 */
export async function fetchContractEvents(
  contractId: string,
  startLedger: number
): Promise<any[]> {
  const response = await sorobanServer.getEvents({
    startLedger,
    filters: [
      {
        type: 'contract',
        contractIds: [contractId],
      },
    ],
  }).catch((error: unknown) => {
    throw wrapSorobanError(error, `fetchContractEvents(${contractId})`);
  });
  return response.events || [];
}

/**
 * Parses raw Soroban RPC event data into a clean transfer object.
 */
export function parseSorobanTransferEvent(event: any): ParsedSorobanTransfer | null {
  if (!event || !event.topic || event.topic.length === 0) {
    return null;
  }

  const contractId = event.contractId || '';
  const topic = event.topic[0] || '';

  // Extract from, to, amount if structured payload exists
  const value = event.value || {};
  const from = value.from || value.transfer?.from || '';
  const to = value.to || value.transfer?.to || '';
  const amount = value.amount ? String(value.amount) : '0';

  return {
    contractId,
    from,
    to,
    amount,
    topic,
  };
}
