import { useReadContract } from "wagmi";
import { getAbiItem } from "viem";
import { ProposalMetadata, type RawAction } from "@/utils/types";
import {
  type OptimisticProposal,
  type OptimisticProposalParameters,
  type OptimisticProposalResultType,
} from "@/plugins/optimistic-proposals/utils/types";
import { PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS } from "@/constants";
import { useProposalMetadata } from "@/hooks/useProposalMetadata";
import { OptimisticTokenVotingPluginAbi } from "../artifacts/OptimisticTokenVotingPlugin.sol";
import { parseProposalId } from "../utils/proposal-id";
import { useChainIdTypesafe } from "@/utils/chains";

const ProposalCreatedEvent = getAbiItem({
  abi: OptimisticTokenVotingPluginAbi,
  name: "ProposalCreated",
});

export function useProposal(proposalId?: bigint, autoRefresh = false) {
  const chainId = useChainIdTypesafe();

  // Proposal onchain data
  const {
    data: proposalResult,
    error: proposalError,
    fetchStatus: proposalFetchStatus,
    refetch: proposalRefetch,
  } = useReadContract({
    address: PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS[chainId],
    abi: OptimisticTokenVotingPluginAbi,
    functionName: "getProposal",
    args: [proposalId ?? BigInt(0)],
    chainId,
    query: {
      enabled: proposalId !== undefined,
      refetchInterval: (query) => (autoRefresh && !query.state.data?.[1] ? 30_000 : false),
    },
  });

  const proposalData = decodeProposalResultData(proposalResult);

  const {
    creationEvent: proposalCreationEvent,
    data: metadataContent,
    isLoading: metadataLoading,
    error: metadataError,
  } = useProposalMetadata({
    address: PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS[chainId],
    chainId,
    event: ProposalCreatedEvent,
    proposalId,
  });

  const proposal = arrangeProposalData(proposalId, proposalData, proposalCreationEvent, metadataContent);
  return {
    proposal,
    refetch: proposalRefetch,
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

function decodeProposalResultData(data?: OptimisticProposalResultType) {
  if (!data?.length || data.length < 6) return null;

  return {
    active: data[0] as boolean,
    executed: data[1] as boolean,
    parameters: data[3] as OptimisticProposalParameters,
    vetoTally: data[4] as bigint,
    // TODO what about this metadataUri?
    // metadataUri: data[4] as string,
    actions: data[5] as Array<RawAction>,
    allowFailureMap: data[6] as bigint,
  };
}

function arrangeProposalData(
  proposalId?: bigint,
  proposalData?: ReturnType<typeof decodeProposalResultData>,
  creationEvent?: { creator: string },
  metadata?: ProposalMetadata
): OptimisticProposal | null {
  if (!proposalData || proposalId === undefined) return null;

  const { index, startDate: vetoStartDate, endDate: vetoEndDate } = parseProposalId(proposalId);

  return {
    index,
    actions: proposalData.actions,
    active: proposalData.active,
    executed: proposalData.executed,
    parameters: proposalData.parameters,
    //  {
    //   minVetoRatio: proposalData.parameters.minVetoRatio,
    //   skipL2: proposalData.parameters.skipL2,
    //   snapshotTimestamp: proposalData.parameters.snapshotTimestamp,
    //   vetoStartDate,
    //   vetoEndDate,
    // },
    vetoTally: proposalData.vetoTally,
    allowFailureMap: proposalData.allowFailureMap,
    creator: creationEvent?.creator ?? "",
    title: metadata?.title ?? "",
    summary: metadata?.summary ?? "",
    description: metadata?.description ?? "",
    resources: metadata?.resources ?? [],
  };
}
