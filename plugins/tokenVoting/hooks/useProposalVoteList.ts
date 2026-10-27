import { useState, useEffect } from "react";
import { getAbiItem } from "viem";
import { TokenVotingPluginAbi } from "../artifacts/TokenVoting.sol";
import { Proposal, VoteCastEvent } from "../utils/types";
import { usePublicClient } from "wagmi";
import { PUB_TOKEN_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { useChainIdTypesafe } from "@/utils/chains";
import { getProposalEventArgs } from "@/utils/proposal-events";

const event = getAbiItem({ abi: TokenVotingPluginAbi, name: "VoteCast" });

export function useProposalVoteList(proposalId: number, proposal: Proposal | null) {
  const publicClient = usePublicClient();
  const [proposalLogs, setLogs] = useState<VoteCastEvent[]>([]);
  const chainId = useChainIdTypesafe();

  async function getLogs() {
    // TODO do we need some kind of if here?
    //if (!proposal?.parameters?.snapshotBlock) return;
    if (!publicClient) return;

    const logs = await getProposalEventArgs<VoteCastEvent>({
      publicClient,
      chainId,
      event,
      address: PUB_TOKEN_VOTING_PLUGIN_ADDRESS[chainId],
      proposalId: BigInt(proposalId),
    });

    if (logs.length > proposalLogs.length) setLogs(logs);
  }

  useEffect(() => {
    getLogs().catch((error) => console.error(`Could not fetch votes for proposal ${proposalId}.`, error));
  }, [proposalId, proposal?.parameters?.snapshotEpoch, chainId]);

  return proposalLogs;
}
