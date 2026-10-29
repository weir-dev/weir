export const PROJECT_NAME = 'WEIR';
export const WEIR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_CA || '';
export const WEIR_SYMBOL = '$WEIR';
export const WEIR_CHAIN = 'Solana Mainnet';
export const NETWORK = 'mainnet';

// Backward compatibility aliases
export const EPOCH_CONTRACT_ADDRESS = WEIR_CONTRACT_ADDRESS;
export const EPOCH_SYMBOL = WEIR_SYMBOL;
export const EPOCH_CHAIN = WEIR_CHAIN;
export const EMILE_CONTRACT_ADDRESS = WEIR_CONTRACT_ADDRESS;
export const EMILE_SYMBOL = WEIR_SYMBOL;
export const EMILE_CHAIN = WEIR_CHAIN;

export const getApiBaseUrl = (): string => {
  const url =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    '';
  return url.replace(/\/+$/, '');
};

export const getWsBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_BASE_URL) {
    return process.env.NEXT_PUBLIC_WS_BASE_URL.replace(/\/+$/, '');
  }
  const apiBase = getApiBaseUrl();
  if (apiBase) {
    return apiBase.replace(/^http(s?):/, 'ws$1:');
  }
  if (typeof window !== 'undefined') {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${window.location.host}`;
  }
  return 'ws://localhost:8000';
};
