import { type AbiEvent, type Address, type Hex, type PublicClient, decodeEventLog, toEventSelector } from "viem";
import type { ChainId } from "@/utils/chains";

type ProposalCreatedArgs = {
  actions: unknown[];
  allowFailureMap: bigint;
  creator: Address;
  endDate: bigint;
  metadata: Hex;
  proposalId: bigint;
  startDate: bigint;
};

type BlockscoutLog = {
  data: Hex;
  topics: Array<Hex | null>;
};

type BlockscoutResponse = {
  items: BlockscoutLog[];
  next_page_params: Record<string, number | string> | null;
};

type ProposalEventRequest = {
  address: Address;
  chainId: ChainId;
  event: AbiEvent;
  proposalId: bigint;
  publicClient: PublicClient;
};

const eventHistoryCache = new Map<string, Promise<unknown[]>>();

const BLOCKSCOUT_API_URL: Record<ChainId, string> = {
  1: "https://eth.blockscout.com/api/v2",
  11155111: "https://eth-sepolia.blockscout.com/api/v2",
};

const PROPOSAL_EVENT_START_BLOCK: Record<ChainId, bigint> = {
  // Both mainnet governance plugins were deployed in these adjacent blocks.
  1: 21_313_302n,
  11155111: 0n,
};

export async function getProposalCreatedEvent(args: ProposalEventRequest): Promise<ProposalCreatedArgs> {
  const logs = await getProposalEventArgs<ProposalCreatedArgs>(args);
  if (!logs.length) throw new Error(`Could not find the creation event for proposal ${args.proposalId}.`);
  return logs[0];
}

export async function getProposalEventArgs<TArgs>(args: ProposalEventRequest): Promise<TArgs[]> {
  const cacheKey = [args.chainId, args.address.toLowerCase(), toEventSelector(args.event)].join(":");
  let request = eventHistoryCache.get(cacheKey) as Promise<TArgs[]> | undefined;
  if (!request) {
    request = getProposalEventHistoryFromBlockscout<TArgs>(args);
    eventHistoryCache.set(cacheKey, request as Promise<unknown[]>);
  }

  try {
    const history = await request;
    return history.filter((eventArgs) => (eventArgs as { proposalId?: bigint }).proposalId === args.proposalId);
  } catch {
    eventHistoryCache.delete(cacheKey);
    return getProposalEventArgsFromRpc<TArgs>(args);
  }
}

async function getProposalEventArgsFromRpc<TArgs>({
  address,
  chainId,
  event,
  proposalId,
  publicClient,
}: ProposalEventRequest): Promise<TArgs[]> {
  const logs = await publicClient.getLogs({
    address,
    event,
    args: { proposalId },
    fromBlock: PROPOSAL_EVENT_START_BLOCK[chainId],
    toBlock: "latest",
  } as any);

  return logs.map((log) => (log as any).args as TArgs);
}

async function getProposalEventHistoryFromBlockscout<TArgs>({
  address,
  chainId,
  event,
}: ProposalEventRequest): Promise<TArgs[]> {
  const result: TArgs[] = [];
  let nextPageParams: BlockscoutResponse["next_page_params"] = null;

  do {
    const params = new URLSearchParams({ topic: toEventSelector(event) });
    for (const [key, value] of Object.entries(nextPageParams || {})) params.set(key, value.toString());

    const url = `${BLOCKSCOUT_API_URL[chainId]}/addresses/${address}/logs?${params}`;
    const payload = await fetchBlockscoutPage(url);
    for (const log of payload.items) {
      const topics = log.topics.filter((topic): topic is Hex => topic !== null) as [Hex, ...Hex[]];
      const decoded = decodeEventLog({
        abi: [event],
        data: log.data,
        topics,
      });
      result.push(decoded.args as TArgs);
    }
    nextPageParams = payload.next_page_params;
  } while (nextPageParams);

  return result;
}

async function fetchBlockscoutPage(url: string): Promise<BlockscoutResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Blockscout responded with HTTP ${response.status}.`);
      const payload = (await response.json()) as BlockscoutResponse;
      if (!Array.isArray(payload.items)) throw new Error("Blockscout returned an invalid logs response.");
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}
