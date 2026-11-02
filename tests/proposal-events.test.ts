import { afterEach, describe, expect, mock, test } from "bun:test";
import { encodeAbiParameters, encodeEventTopics, parseAbiItem, type PublicClient } from "viem";
import { getProposalEventArgs } from "@/utils/proposal-events";

const originalFetch = globalThis.fetch;
const vetoCastEvent = parseAbiItem(
  "event VetoCast(uint256 indexed proposalId, address indexed voter, uint256 votingPower)"
);

function vetoLog(proposalId: bigint) {
  return {
    topics: encodeEventTopics({
      abi: [vetoCastEvent],
      eventName: "VetoCast",
      args: { proposalId, voter: "0x0000000000000000000000000000000000000001" },
    }),
    data: encodeAbiParameters([{ type: "uint256" }], [10n]),
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("proposal event history", () => {
  test("filters paginated address logs locally without the explorer's broken topic filter", async () => {
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.has("topic")).toBe(false);
      if (!url.searchParams.has("index")) {
        return Response.json({
          items: [vetoLog(42n), { topics: ["0x" + "00".repeat(32)], data: "0x" }],
          next_page_params: { index: 10, block_number: 123 },
        });
      }
      return Response.json({ items: [vetoLog(43n)], next_page_params: null });
    });
    const getLogs = mock(async () => {
      throw new Error("Archive RPC should not be needed");
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const publicClient = { getLogs } as unknown as PublicClient;
    const args = {
      address: "0x0000000000000000000000000000000000001234" as const,
      chainId: 1 as const,
      event: vetoCastEvent,
      publicClient,
    };

    const logs = await getProposalEventArgs<{ proposalId: bigint; votingPower: bigint }>({ ...args, proposalId: 42n });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ proposalId: 42n, votingPower: 10n });
    expect(await getProposalEventArgs({ ...args, proposalId: 43n })).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getLogs).not.toHaveBeenCalled();
  });

  test("treats unrelated events as a valid empty history without an archive request", async () => {
    const fetchMock = mock(async () =>
      Response.json({
        items: [{ topics: ["0x" + "00".repeat(32)], data: "0x" }],
        next_page_params: null,
      })
    );
    const getLogs = mock(async () => {
      throw new Error("Archive RPC should not be needed");
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(
      await getProposalEventArgs({
        address: "0x0000000000000000000000000000000000005678",
        chainId: 1,
        event: vetoCastEvent,
        proposalId: 42n,
        publicClient: { getLogs } as unknown as PublicClient,
      })
    ).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getLogs).not.toHaveBeenCalled();
  });

  test("treats a Blockscout response with no matching logs as a valid empty history", async () => {
    const fetchMock = mock(async () => Response.json({ items: [], next_page_params: null }));
    const getLogs = mock(async () => {
      throw new Error("RPC fallback should not be called");
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await getProposalEventArgs({
      address: "0x05E50fE39C5E4d6caab8648BA327d0a0e9E923bb",
      chainId: 1,
      event: vetoCastEvent,
      proposalId: 99_999n,
      publicClient: { getLogs } as unknown as PublicClient,
    });
    const secondResult = await getProposalEventArgs({
      address: "0x05E50fE39C5E4d6caab8648BA327d0a0e9E923bb",
      chainId: 1,
      event: vetoCastEvent,
      proposalId: 99_998n,
      publicClient: { getLogs } as unknown as PublicClient,
    });

    expect(result).toEqual([]);
    expect(secondResult).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getLogs).not.toHaveBeenCalled();
  });
});
