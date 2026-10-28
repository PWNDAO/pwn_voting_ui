import ProposalHeader from "@/plugins/optimistic-proposals/components/proposal/header";
import { ProposalLoadState } from "@/components/proposal/proposalLoadState";
import { useProposalVeto } from "@/plugins/optimistic-proposals/hooks/useProposalVeto";
import { useProposalExecute } from "@/plugins/optimistic-proposals/hooks/useProposalExecute";
import { BodySection } from "@/components/proposal/proposalBodySection";
import { IBreakdownMajorityVotingResult, ProposalVoting } from "@/components/proposalVoting";
import type { ITransformedStage, IVote } from "@/utils/types";
import { ProposalStages } from "@/utils/types";
import { useProposalStatus } from "../hooks/useProposalVariantStatus";
import dayjs from "dayjs";
import { ProposalActions } from "@/components/proposalActions/proposalActions";
import { CardResources } from "@/components/proposal/cardResources";
import { formatEther } from "viem";
import { useToken } from "../hooks/useToken";
import { ProposalStatus } from "@aragon/gov-ui-kit";
import { PUB_TOKEN_SYMBOL } from "@/constants";
import { useGovernanceSettings } from "../hooks/useGovernanceSettings";
import { ProposalDetails } from "@/components/proposal/proposalDetails";

export default function ProposalDetail({ index: proposalIdx }: { index: number }) {
  const {
    proposal,
    proposalFetchStatus,
    canVeto,
    vetoes,
    isConfirming: isConfirmingVeto,
    vetoProposal,
    retryMetadata,
  } = useProposalVeto(proposalIdx);
  const { symbol: tokenSymbol } = useToken();

  const { minVetoRatio } = useGovernanceSettings();

  const { executeProposal, canExecute, isConfirming: isConfirmingExecution } = useProposalExecute(proposalIdx);

  const startDate = dayjs(Number(proposal?.parameters.startDate) * 1000).toString();
  const endDate = dayjs(Number(proposal?.parameters.endDate) * 1000).toString();

  const proposalStatus = useProposalStatus(proposal!);
  let vetoPercentage = 0;
  if (proposal?.vetoTally && proposal.parameters.minVetoVotingPower) {
    vetoPercentage = Number((proposal.vetoTally * 10_000n) / proposal.parameters.minVetoVotingPower) / 100;
  }

  let cta: IBreakdownMajorityVotingResult["cta"];
  if (proposal?.executed) {
    cta = {
      disabled: true,
      label: "Executed",
    };
  } else if (proposalStatus === ProposalStatus.ACCEPTED) {
    cta = {
      disabled: !canExecute || !proposal?.actions.length,
      isLoading: isConfirmingExecution,
      label: proposal?.actions.length ? "Execute" : "No actions to execute",
      onClick: executeProposal,
    };
  } else if (proposalStatus === ProposalStatus.ACTIVE) {
    cta = {
      disabled: !canVeto,
      isLoading: isConfirmingVeto,
      label: "Veto",
      onClick: vetoProposal,
    };
  }

  const proposalStage: ITransformedStage[] = [
    {
      id: "1",
      type: ProposalStages.OPTIMISTIC_EXECUTION,
      variant: "majorityVoting", // this is misleading title, but correct
      title: "Community vetoing",
      status: proposalStatus!,
      disabled: false,
      proposalId: proposalIdx.toString(),
      providerId: "1",
      result: {
        cta,
        votingScores: [
          {
            option: "Veto",
            voteAmount: formatEther(proposal?.vetoTally || BigInt(0)),
            votePercentage: vetoPercentage,
            tokenSymbol: tokenSymbol || PUB_TOKEN_SYMBOL,
            vetoAmount: formatEther(proposal?.parameters.minVetoVotingPower || BigInt(0)),
          },
        ],
        proposalId: proposalIdx.toString(),
      },
      details: {
        startDate,
        endDate,
        strategy: "Veto",
        snapshotEpoch: proposal?.parameters?.snapshotEpoch,
        quorum: minVetoRatio ? `${minVetoRatio / 10000}%` : "",
      },
      votes: vetoes.map(({ voter }) => ({ address: voter, variant: "veto" }) as IVote),
    },
  ];

  if (!proposal) {
    return (
      <section className="mx-auto w-full max-w-screen-xl px-4 py-10 md:px-16">
        <ProposalLoadState error={proposalFetchStatus.proposalError} />
      </section>
    );
  }

  return (
    <section className="flex w-screen min-w-full max-w-full flex-col items-center">
      <ProposalHeader proposalIdx={proposalIdx} proposal={proposal} />

      <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-16 md:pb-20 md:pt-10">
        <div className="flex w-full flex-col gap-x-12 gap-y-6 md:flex-row">
          <div className="flex flex-col gap-y-6 md:w-[63%] md:shrink-0">
            <BodySection
              body={proposal.description}
              isLoading={proposalFetchStatus.metadataLoading}
              onRetry={retryMetadata}
            />
            <ProposalVoting
              stages={proposalStage}
              description="Proposals proposed by the Stewards become eventually executable, unless the community reaches the veto threshold during the community veto stage."
              isVeto={true}
            />
            <ProposalActions
              actions={proposal.actions}
              description={
                proposal.executed
                  ? "These actions were executed by the DAO when this proposal passed."
                  : "These are the on-chain actions included in this proposal."
              }
            />
          </div>
          <div className="flex flex-col gap-y-6 md:w-[33%]">
            <ProposalDetails
              index={proposalIdx}
              group="Stewards"
              creator={proposal.creator}
              startDate={proposal.parameters.startDate}
              endDate={proposal.parameters.endDate}
              actionCount={proposal.actions.length}
            />
            {proposal.resources.length > 0 && <CardResources resources={proposal.resources} title="Resources" />}
          </div>
        </div>
      </div>
    </section>
  );
}
