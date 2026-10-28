import { describe, expect, test } from "bun:test";
import { CID } from "multiformats/cid";
import { isUnavailableHistoricalMetadata, UNAVAILABLE_HISTORICAL_METADATA } from "@/utils/historical-metadata";

describe("historical proposal metadata policy", () => {
  test("covers exactly the nine original mainnet CIDs, without fabricated metadata", () => {
    expect(UNAVAILABLE_HISTORICAL_METADATA).toHaveLength(9);
    expect(new Set(UNAVAILABLE_HISTORICAL_METADATA).size).toBe(9);
    for (const uri of UNAVAILABLE_HISTORICAL_METADATA) {
      expect(CID.parse(uri.slice("ipfs://".length)).toString()).toBe(uri.slice("ipfs://".length));
      expect(isUnavailableHistoricalMetadata(1, uri)).toBe(true);
    }
  });

  test("does not disable metadata on Sepolia or any other chain", () => {
    for (const uri of UNAVAILABLE_HISTORICAL_METADATA) {
      expect(isUnavailableHistoricalMetadata(11155111, uri)).toBe(false);
      expect(isUnavailableHistoricalMetadata(137, uri)).toBe(false);
    }
  });

  test("keeps new, unknown and absent metadata out of the unavailable list", () => {
    expect(isUnavailableHistoricalMetadata(1, "ipfs://bafkreinewproposal")).toBe(false);
    expect(isUnavailableHistoricalMetadata(1, undefined)).toBe(false);
    expect(isUnavailableHistoricalMetadata(1, "")).toBe(false);
    expect(isUnavailableHistoricalMetadata(1, UNAVAILABLE_HISTORICAL_METADATA[0] + "/other.json")).toBe(false);
  });
});
