import { ProposalStatus, ProposalDataListItemStructure } from "@aragon/gov-ui-kit";
import { useProposal } from "../../hooks/useProposal";
import { useProposalStatus } from "../../hooks/useProposalVariantStatus";
import { useToken } from "../../hooks/useToken";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { PUB_TOKEN_SYMBOL } from "@/constants";
import { useProposalVoteList } from "../../hooks/useProposalVoteList";
import {
  BreakdownMajorityVotingResult,
  IBreakdownMajorityVotingResult,
} from "@/components/proposalVoting/votingBreakdown/majorityVotingResult";
import { getProposalSummary, getProposalTitle } from "@/utils/proposal-display";
import { ProposalLoadState } from "@/components/proposal/proposalLoadState";

type ProposalInputs = {
  proposalIndex: number;
};

export default function ProposalCard(props: ProposalInputs) {
  const { address } = useAccount();
  const { proposal, status: proposalFetchStatus } = useProposal(props.proposalIndex);
  const votes = useProposalVoteList(props.proposalIndex, proposal);
  const { symbol: tokenSymbol } = useToken();
  const proposalStatus = useProposalStatus(proposal!);
  const hasVoted = votes?.some((vote) => vote.voter === address);
  const totalVotes =
    (proposal?.tally.yes || BigInt(0)) + (proposal?.tally.no || BigInt(0)) + (proposal?.tally.abstain || BigInt(0));

  if (!proposal) {
    return (
      <section className="mb-4 w-full">
        <ProposalLoadState error={proposalFetchStatus.proposalError} />
      </section>
    );
  }

  const votingResults: IBreakdownMajorityVotingResult["votingScores"] = [
    {
      option: "Yes",
      voteAmount: formatEther(proposal.tally.yes) + " " + (tokenSymbol || PUB_TOKEN_SYMBOL),
      votePercentage: Number(((proposal?.tally.yes || BigInt(0)) * BigInt(10_000)) / (totalVotes || BigInt(1))) / 100,
      tokenSymbol: PUB_TOKEN_SYMBOL,
    },
    {
      option: "No",
      voteAmount: formatEther(proposal.tally.no) + " " + (tokenSymbol || PUB_TOKEN_SYMBOL),
      votePercentage: Number(((proposal?.tally.no || BigInt(0)) * BigInt(10_000)) / (totalVotes || BigInt(1))) / 100,
      tokenSymbol: PUB_TOKEN_SYMBOL,
    },
    {
      option: "Abstain",
      voteAmount: formatEther(proposal.tally.abstain) + " " + (tokenSymbol || PUB_TOKEN_SYMBOL),
      votePercentage:
        Number(((proposal?.tally.abstain || BigInt(0)) * BigInt(10_000)) / (totalVotes || BigInt(1))) / 100,
      tokenSymbol: PUB_TOKEN_SYMBOL,
    },
  ];

  return (
    <ProposalDataListItemStructure
      title={getProposalTitle(proposal.title, props.proposalIndex, "Community")}
      summary={getProposalSummary(proposal)}
      href={`#/community-voting/proposals/${props.proposalIndex}`}
      voted={hasVoted}
      date={
        [ProposalStatus.ACTIVE, ProposalStatus.ACCEPTED].includes(proposalStatus!) && proposal.parameters.endDate
          ? Number(proposal.parameters.endDate) * 1000
          : undefined
      }
      publisher={proposal.creator ? { address: proposal.creator } : []}
      status={proposalStatus!}
      // @ts-expect-error intentionally passing unspecified type to prevent a score graph
      //  being displayed
      type={"customMajorityVoting"}
      className="custom-proposal-card-wrapper hover:border-primary-400"
    >
      {proposal?.active && (
        <BreakdownMajorityVotingResult status={proposalStatus} cta={undefined} votingScores={votingResults} />
      )}
    </ProposalDataListItemStructure>
  );
}
