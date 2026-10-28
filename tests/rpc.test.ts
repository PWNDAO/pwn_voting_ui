import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createPublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { createRpcTransport, RPC_COOLDOWN_MS } from "@/utils/rpc";

const originalFetch = globalThis.fetch;
const primaryUrl = "https://primary.example";
const fallbackUrl = "https://ethereum-rpc.publicnode.com";

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

function success(init?: RequestInit) {
  const body = JSON.parse(init?.body as string);
  const result = (request: { id: number }) => ({ jsonrpc: "2.0", id: request.id, result: "0x1" });
  return Response.json(Array.isArray(body) ? body.map(result) : result(body));
}

function client() {
  return createPublicClient({ chain: mainnet, transport: createRpcTransport(1, primaryUrl) });
}

describe("RPC failover", () => {
  test.each([429, 403, 503])("fails over immediately on HTTP %i and pauses the failing endpoint", async (status) => {
    const fetchMock = mock(async (url: RequestInfo | URL, init?: RequestInit) =>
      String(url) === primaryUrl ? new Response("Unavailable", { status }) : success(init)
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const rpc = client();

    expect(await rpc.getChainId()).toBe(1);
    expect(await rpc.getChainId()).toBe(1);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([primaryUrl, fallbackUrl, fallbackUrl]);
  });

  test("fails over when the browser hides the response behind a CORS/network error", async () => {
    const fetchMock = mock(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url) === primaryUrl) throw new TypeError("Failed to fetch");
      return success(init);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const rpc = client();
    expect(await rpc.getChainId()).toBe(1);
    expect(await rpc.getChainId()).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test.each([429, -32005])("pauses endpoints that return a JSON-RPC rate limit (%i)", async (code) => {
    const fetchMock = mock(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url) !== primaryUrl) return success(init);
      const requests = JSON.parse(init?.body as string) as { id: number }[];
      return Response.json(
        requests.map(({ id }) => ({ jsonrpc: "2.0", id, error: { code, message: "Rate limited" } }))
      );
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const rpc = client();
    expect(await rpc.getChainId()).toBe(1);
    expect(await rpc.getChainId()).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("allows the primary to recover after the cooldown", async () => {
    const now = Date.now();
    const clock = spyOn(Date, "now").mockReturnValue(now);
    let available = false;
    const fetchMock = mock(async (url: RequestInfo | URL, init?: RequestInit) =>
      String(url) === primaryUrl && !available ? new Response("Rate limited", { status: 429 }) : success(init)
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const rpc = client();
    expect(await rpc.getChainId()).toBe(1);
    available = true;
    clock.mockReturnValue(now + RPC_COOLDOWN_MS + 1);
    expect(await rpc.getChainId()).toBe(1);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([primaryUrl, fallbackUrl, primaryUrl]);
  });

  test("returns a bounded error when all providers are unavailable, without retry storms", async () => {
    const fetchMock = mock(async () => new Response("Rate limited", { status: 429 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const rpc = client();
    await expect(rpc.getChainId()).rejects.toThrow();
    await expect(rpc.getChainId()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("batches concurrent requests on both the primary and fallback", async () => {
    const fetchMock = mock(async (url: RequestInfo | URL, init?: RequestInit) =>
      String(url) === primaryUrl ? new Response("Rate limited", { status: 429 }) : success(init)
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const rpc = client();
    expect(await Promise.all([rpc.getChainId(), rpc.getBlockNumber()])).toEqual([1, 1n]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) expect(JSON.parse(init?.body as string)).toHaveLength(2);
  });

  test("does not disable a provider for a contract-specific revert", async () => {
    let reverting = true;
    const fetchMock = mock(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url) !== primaryUrl || !reverting) return success(init);
      const requests = JSON.parse(init?.body as string) as { id: number }[];
      return Response.json(
        requests.map(({ id }) => ({ jsonrpc: "2.0", id, error: { code: 3, message: "execution reverted" } }))
      );
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const rpc = client();
    expect(await rpc.getChainId()).toBe(1);
    reverting = false;
    expect(await rpc.getChainId()).toBe(1);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([primaryUrl, fallbackUrl, primaryUrl]);
  });

  test("uses a public endpoint when no URL is configured, without duplicating it", async () => {
    const fetchMock = mock(async (_url: RequestInfo | URL, init?: RequestInit) => success(init));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    for (const url of [undefined, "", fallbackUrl]) {
      const rpc = createPublicClient({ chain: mainnet, transport: createRpcTransport(1, url) });
      expect(await rpc.getChainId()).toBe(1);
    }
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([fallbackUrl, fallbackUrl, fallbackUrl]);
  });

  test("never switches a configured Sepolia fork to real Sepolia", async () => {
    const fetchMock = mock(async (_url: RequestInfo | URL) => new Response("Unavailable", { status: 503 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const rpc = createPublicClient({ chain: sepolia, transport: createRpcTransport(11155111, primaryUrl) });
    await expect(rpc.getChainId()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(primaryUrl);
  });
});
