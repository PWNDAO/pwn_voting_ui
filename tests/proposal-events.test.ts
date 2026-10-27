import { afterEach, describe, expect, mock, test } from "bun:test";
import { parseAbiItem, type PublicClient } from "viem";
import { getProposalEventArgs } from "@/utils/proposal-events";

const originalFetch = globalThis.fetch;
const vetoCastEvent = parseAbiItem(
  "event VetoCast(uint256 indexed proposalId, address indexed voter, uint256 votingPower)"
);

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("proposal event history", () => {
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
