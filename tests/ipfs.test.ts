import { afterEach, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;

mock.module("@/constants", () => ({
  PUB_APP_NAME: "PWN DAO",
  PUB_IPFS_ENDPOINTS: "https://first.example/ipfs, https://second.example/ipfs/",
  WEB3_STORAGE_PROOF: "",
}));

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("IPFS gateway fallback", () => {
  test("uses the next gateway when the first one fails", async () => {
    let requestCount = 0;
    const fetchMock = mock(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      requestCount += 1;
      if (requestCount === 1) throw new TypeError("Failed to fetch");

      return new Response(JSON.stringify({ title: "Proposal metadata" }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { fetchIpfsAsJson } = await import("@/utils/ipfs");
    const metadata = await fetchIpfsAsJson("ipfs://bafktest");

    expect(metadata).toEqual({ title: "Proposal metadata" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://first.example/ipfs/bafktest");
    expect(fetchMock.mock.calls[1][0]).toBe("https://second.example/ipfs/bafktest");
  });
});
