import {
  ContractError,
  AlertRegistryError,
  ALERT_REGISTRY_ERROR_CODES,
} from './errors';

export interface RawSorobanResponse {
  error?: string;
  result?: Record<string, unknown>;
  transactionResult?: unknown;
  events?: unknown[];
  [key: string]: unknown;
}

function extractContractErrorCode(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  return null;
}

function deepSearchErrorCode(obj: unknown, depth = 0): number | null {
  if (depth > 8 || obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return null;

  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (
      (key === 'contract_error' || key === 'ContractError') &&
      typeof val === 'object' &&
      val !== null
    ) {
      const inner = val as Record<string, unknown>;
      const code = extractContractErrorCode(inner.code);
      if (code !== null) return code;
    }
    if (typeof val === 'object' && val !== null) {
      const found = deepSearchErrorCode(val, depth + 1);
      if (found !== null) return found;
    }
  }
  return null;
}

function resolveAlertRegistryError(
  code: number,
  fallbackMessage: string,
): AlertRegistryError {
  const variantName = ALERT_REGISTRY_ERROR_CODES[code];
  const message = variantName
    ? `AlertRegistryError: ${variantName} (code ${code})`
    : fallbackMessage;
  return new AlertRegistryError(code, message);
}

export function parseContractError(
  response: RawSorobanResponse,
): ContractError {
  const resultError =
    typeof response.result?.error === 'string' ? response.result.error : undefined;
  const rawMessage =
    response.error || resultError || 'Unknown contract error';

  const errorCode = deepSearchErrorCode(response);
  if (errorCode !== null) {
    return resolveAlertRegistryError(errorCode, rawMessage);
  }

  const codeFromMessage = rawMessage.match(/\bcode\s+(\d+)\b/i);
  if (codeFromMessage) {
    const code = parseInt(codeFromMessage[1], 10);
    return resolveAlertRegistryError(code, rawMessage);
  }

  return new ContractError(0, 'unknown', rawMessage);
}
