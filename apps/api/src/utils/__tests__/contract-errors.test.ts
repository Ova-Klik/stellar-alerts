import { describe, it, expect } from 'vitest';
import {
  AlertRegistryError,
  parseContractError,
  type RawSorobanResponse,
} from '@stellar-alerts/shared';

describe('ContractError type mapping (acceptance criterion)', () => {
  it('mock NotAuthorized result → AlertRegistryError with code === 1', () => {
    const mockResponse: RawSorobanResponse = {
      error: 'soroban contract error',
      result: {
        error: 'contract_error',
        contract_error: { code: 1 },
      },
    };

    const err = parseContractError(mockResponse);

    expect(err).toBeInstanceOf(AlertRegistryError);
    expect(err.code).toBe(1);
    expect((err as AlertRegistryError).contractName).toBe('alert_registry');
    expect(err.message).toContain('NotAuthorized');
  });

  it('mock InvalidChannel result → AlertRegistryError with code === 2', () => {
    const mockResponse: RawSorobanResponse = {
      error: 'soroban contract error',
      result: {
        error: 'contract_error',
        contract_error: { code: 2 },
      },
    };

    const err = parseContractError(mockResponse);

    expect(err).toBeInstanceOf(AlertRegistryError);
    expect(err.code).toBe(2);
    expect(err.message).toContain('InvalidChannel');
  });

  it('mock EmptyTarget result → AlertRegistryError with code === 3', () => {
    const mockResponse: RawSorobanResponse = {
      result: {
        error: 'contract_error',
        contract_error: { code: 3 },
      },
    };

    const err = parseContractError(mockResponse);

    expect(err).toBeInstanceOf(AlertRegistryError);
    expect(err.code).toBe(3);
    expect(err.message).toContain('EmptyTarget');
  });
});


