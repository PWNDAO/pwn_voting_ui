import { useProposalVeto } from "@/plugins/optimistic-proposals/hooks/useProposalVeto";
import { ProposalDataListItemStructure, ProposalStatus } from "@aragon/gov-ui-kit";
import { useProposalStatus } from "../../hooks/useProposalVariantStatus";
import { PUB_TOKEN_SYMBOL } from "@/constants";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useToken } from "../../hooks/useToken";
import { getProposalSummary, getProposalTitle } from "@/utils/proposal-display";
import { ProposalLoadState } from "@/components/proposal/proposalLoadState";

type ProposalInputs = {
  proposalIndex: number;
};

export default function ProposalCard(props: ProposalInputs) {
  const { address } = useAccount();
  const { proposal, proposalFetchStatus, vetoes } = useProposalVeto(props.proposalIndex);
  const { symbol: tokenSymbol } = useToken();

  const proposalStatus = useProposalStatus(proposal!);
  const hasVetoed = vetoes?.some((veto) => veto.voter === address);

  if (!proposal) {
    return (
      <section className="mb-4 w-full">
        <ProposalLoadState error={proposalFetchStatus.proposalError} />
      </section>
    );
  }

  let vetoPercentage = 0;
  if (proposal?.vetoTally && proposal.parameters.minVetoVotingPower) {
    vetoPercentage = Number((proposal.vetoTally * 10_000n) / proposal.parameters.minVetoVotingPower) / 100;
  }

  return (
    <ProposalDataListItemStructure
      title={getProposalTitle(proposal.title, props.proposalIndex, "Stewards")}
      summary={getProposalSummary(proposal)}
      href={`#/stewards/proposals/${props.proposalIndex}`}
      voted={hasVetoed}
      date={
        [ProposalStatus.ACTIVE, ProposalStatus.ACCEPTED].includes(proposalStatus!) && proposal.parameters.endDate
          ? Number(proposal.parameters.endDate) * 1000
          : undefined
      }
      result={{
        option: "Veto",
        voteAmount: formatEther(proposal.vetoTally) + " " + (tokenSymbol || PUB_TOKEN_SYMBOL),
        votePercentage: vetoPercentage,
        stage: {
          id: `${vetoPercentage}%`,
          title: "Proposal vetoes",
        },
      }}
      publisher={proposal.creator ? { address: proposal.creator } : []}
      status={proposalStatus!}
      type={"majorityVoting"}
      className="customStewardsProposalCardWrapper"
    />
  );
}
