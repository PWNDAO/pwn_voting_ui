import { BaseError, HttpRequestError, RpcRequestError, TimeoutError, fallback, http, type Transport } from "viem";

export const RPC_COOLDOWN_MS = 60_000;

const PUBLIC_RPC_URLS = {
  1: "https://ethereum-rpc.publicnode.com",
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
} as const;

function isUnavailable(error: unknown): boolean {
  if (!(error instanceof BaseError)) return false;
  const cause = error.walk(
    (cause) => cause instanceof HttpRequestError || cause instanceof TimeoutError || cause instanceof RpcRequestError
  );
  if (cause instanceof TimeoutError) return true;
  if (cause instanceof HttpRequestError) {
    // Browsers hide the status of CORS failures, including some rate-limit responses.
    return !cause.status || [401, 403, 408, 429].includes(cause.status) || cause.status >= 500;
  }
  return cause instanceof RpcRequestError && [429, -32005].includes(cause.code);
}

function withCooldown(transport: Transport): Transport {
  // Keep this state outside the factory: viem's fallback recreates child transports per request.
  let retryAt = 0;
  let lastError: unknown;
  return (options) => {
    const inner = transport(options);
    return {
      ...inner,
      async request(args, requestOptions) {
        if (Date.now() < retryAt) throw lastError;
        try {
          return await inner.request(args, requestOptions);
        } catch (error) {
          if (isUnavailable(error)) {
            retryAt = Date.now() + RPC_COOLDOWN_MS;
            lastError = error;
          }
          throw error;
        }
      },
    };
  };
}

export function createRpcTransport(chainId: keyof typeof PUBLIC_RPC_URLS, configuredUrl?: string) {
  const primaryUrl = configuredUrl?.trim();
  // Development uses a Tenderly Sepolia fork. Never silently mix its state with real Sepolia.
  const urls = [
    ...new Set(
      [primaryUrl, chainId === 1 || !primaryUrl ? PUBLIC_RPC_URLS[chainId] : undefined].filter(
        (url): url is string => !!url
      )
    ),
  ];
  return fallback(
    urls.map((url) => withCooldown(http(url, { batch: { batchSize: 20, wait: 20 }, timeout: 5_000, retryCount: 0 }))),
    // Switch providers immediately instead of multiplying HTTP and query retries.
    { retryCount: 0 }
  );
}
