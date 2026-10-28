import { useAccount, useReadContract } from "wagmi";
import { TokenVotingPluginAbi } from "../artifacts/TokenVoting.sol";
import { PUB_TOKEN_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { useChainIdTypesafe } from "@/utils/chains";

export function useCanVote(proposalId: number) {
  const { address } = useAccount();
  const chainId = useChainIdTypesafe();

  const { data: canVote } = useReadContract({
    address: PUB_TOKEN_VOTING_PLUGIN_ADDRESS[chainId],
    chainId,
    abi: TokenVotingPluginAbi,
    functionName: "canVote",
    args: [BigInt(proposalId), address!, 1],
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  return canVote;
}
