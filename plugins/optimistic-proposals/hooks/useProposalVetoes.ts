import { useState, useEffect } from "react";
import { getAbiItem } from "viem";
import { OptimisticTokenVotingPluginAbi } from "@/plugins/optimistic-proposals/artifacts/OptimisticTokenVotingPlugin.sol";
import { VetoCastEvent } from "@/plugins/optimistic-proposals/utils/types";
import { usePublicClient } from "wagmi";
import { PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS } from "@/constants";
import { useChainIdTypesafe } from "@/utils/chains";
import { getProposalEventArgs } from "@/utils/proposal-events";

const event = getAbiItem({
  abi: OptimisticTokenVotingPluginAbi,
  name: "VetoCast",
});

export function useProposalVetoes(proposalId?: bigint) {
  const publicClient = usePublicClient();
  const [proposalLogs, setLogs] = useState<VetoCastEvent[]>([]);
  const chainId = useChainIdTypesafe();

  useEffect(() => {
    if (proposalId === undefined || !publicClient) return;

    getProposalEventArgs<VetoCastEvent>({
      publicClient,
      chainId,
      event,
      address: PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS[chainId],
      proposalId,
    })
      .then((logs) => {
        if (logs.length > proposalLogs.length) setLogs(logs);
      })
      .catch((error) => console.error(`Could not fetch vetoes for proposal ${proposalId}.`, error));
  }, [proposalId, chainId]);

  return proposalLogs;
}
