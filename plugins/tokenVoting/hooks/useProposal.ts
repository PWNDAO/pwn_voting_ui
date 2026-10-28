import { useReadContract } from "wagmi";
import { getAbiItem } from "viem";
import { TokenVotingPluginAbi } from "@/plugins/tokenVoting/artifacts/TokenVoting.sol";
import { RawAction, ProposalMetadata } from "@/utils/types";
import { Proposal, ProposalParameters, Tally } from "../utils/types";
import { PUB_TOKEN_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { useProposalMetadata } from "@/hooks/useProposalMetadata";
import { useChainIdTypesafe } from "@/utils/chains";

const ProposalCreatedEvent = getAbiItem({
  abi: TokenVotingPluginAbi,
  name: "ProposalCreated",
});

export function useProposal(proposalId: number, autoRefresh = true) {
  const chainId = useChainIdTypesafe();

  // Proposal on-chain data
  const {
    data: proposalResult,
    error: proposalError,
    fetchStatus: proposalFetchStatus,
  } = useReadContract({
    address: PUB_TOKEN_VOTING_PLUGIN_ADDRESS[chainId],
    chainId,
    abi: TokenVotingPluginAbi,
    functionName: "getProposal",
    args: [BigInt(proposalId)],
    query: {
      refetchInterval: (query) => (autoRefresh && !query.state.data?.[1] ? 30_000 : false),
    },
  });
  const proposalData = decodeProposalResultData(proposalResult as any);

  const {
    creationEvent: proposalCreationEvent,
    data: metadataContent,
    isLoading: metadataLoading,
    error: metadataError,
    retryMetadata,
  } = useProposalMetadata({
    address: PUB_TOKEN_VOTING_PLUGIN_ADDRESS[chainId],
    chainId,
    event: ProposalCreatedEvent,
    proposalId: BigInt(proposalId),
  });

  const proposal = arrangeProposalData(proposalData, proposalCreationEvent, metadataContent);

  return {
    proposal,
    retryMetadata,
    status: {
      proposalReady: !!proposalResult,
      proposalLoading: !proposalResult && proposalFetchStatus === "fetching",
      proposalError,
      metadataReady: !metadataError && !metadataLoading && !!metadataContent,
      metadataLoading,
      metadataError: !!metadataError,
    },
  };
}

// Helpers

function decodeProposalResultData(data?: Array<any>) {
  if (!data?.length || data.length < 6) return null;

  return {
    active: data[0] as boolean,
    executed: data[1] as boolean,
    parameters: data[2] as ProposalParameters,
    tally: data[3] as Tally,
    actions: data[4] as Array<RawAction>,
    allowFailureMap: data[5] as bigint,
  };
}

function arrangeProposalData(
  proposalData?: ReturnType<typeof decodeProposalResultData>,
  creationEvent?: { creator: string },
  metadata?: ProposalMetadata
): Proposal | null {
  if (!proposalData) return null;

  return {
    actions: proposalData.actions,
    active: proposalData.active,
    executed: proposalData.executed,
    parameters: proposalData.parameters,
    tally: proposalData.tally,
    allowFailureMap: proposalData.allowFailureMap,
    creator: creationEvent?.creator || "",
    title: metadata?.title || "",
    summary: metadata?.summary || "",
    description: metadata?.description || "",
    resources: metadata?.resources || [],
  };
}
