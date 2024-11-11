import { useState, useEffect } from "react";
import { getAbiItem } from "viem";
import { TokenVotingPluginAbi } from "../artifacts/TokenVoting.sol";
import { Proposal, VoteCastEvent } from "../utils/types";
import { usePublicClient } from "wagmi";
import { PUB_TOKEN_VOTING_PLUGIN_ADDRESS } from "@/constants";

const event = getAbiItem({ abi: TokenVotingPluginAbi, name: "VoteCast" });

export function useProposalVoteList(proposalId: number, proposal: Proposal | null) {
  const publicClient = usePublicClient();
  const [proposalLogs, setLogs] = useState<VoteCastEvent[]>([]);

  async function getLogs() {
    // TODO do we need some kind of if here?
    //if (!proposal?.parameters?.snapshotBlock) return;
    if (!publicClient) return;

    const logs = await publicClient.getLogs({
      address: PUB_TOKEN_VOTING_PLUGIN_ADDRESS,
      event: event,
      args: {
        proposalId: BigInt(proposalId),
      },
      fromBlock: 0n,
      toBlock: "latest", // TODO: Make this variable between 'latest' and proposal last block
    });

    const newLogs = logs.flatMap((log) => log.args);
    if (newLogs.length > proposalLogs.length) setLogs(newLogs);
  }

  useEffect(() => {
    getLogs();
  }, [proposalId, proposal?.parameters?.snapshotBlock]);

  return proposalLogs;
}
