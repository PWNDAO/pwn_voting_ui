import { getSimpleRelativeTimeFromDate } from "@/utils/dates";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemHeader,
  Heading,
  type ProposalStatus,
  TabsList,
  TabsTrigger,
  TabsContent,
  DefinitionListContainer,
  DefinitionListItem,
} from "@aragon/gov-ui-kit";
import { Tabs as RadixTabsRoot } from "@radix-ui/react-tabs";
import dayjs from "dayjs";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { VotingBreakdown, type IBreakdownMajorityVotingResult, type ProposalType } from "../votingBreakdown";
import { type IBreakdownApprovalThresholdResult } from "../votingBreakdown/approvalThresholdResult";
import { VotingDetails } from "../votingDetails";
import { VotingStageStatus } from "./votingStageStatus";
import type { IVote, IVotingStageDetails } from "@/utils/types";
import { VotesDataList } from "../votesDataList/votesDataList";
import { formatUnits } from "viem";

export interface IVotingStageProps<TType extends ProposalType = ProposalType> {
  title: string;
  number: number | undefined;
  disabled: boolean;
  status: ProposalStatus; // "accepted" | "rejected" | "active";

  variant: TType;
  result?: TType extends "approvalThreshold" ? IBreakdownApprovalThresholdResult : IBreakdownMajorityVotingResult;
  details?: IVotingStageDetails;
  votes?: IVote[];
  totalReward?: bigint;
  showStageKey?: boolean;
}

export const VotingStage: React.FC<IVotingStageProps> = (props) => {
  const { details, disabled, title, number, result, status, variant, votes, totalReward, showStageKey } = props;

  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Callback ref to capture the portalled node when it is available
  const setRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setNode(node);
    }
  }, []);

  const resize = useCallback(() => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newHeight = `${entry.contentRect.height}px`;
          const oldHeight = contentRef.current?.style["--radix-collapsible-content-height" as any];

          // Only update if the height has actually changed
          if (oldHeight !== newHeight) {
            requestAnimationFrame(() => {
              contentRef.current?.style.setProperty("--radix-collapsible-content-height", newHeight);
            });
          }
        }
      });

      resizeObserver.observe(node);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [node]);

  useLayoutEffect(resize, [resize]);

  const defaultTab = "breakdown";
  const stageKey = number === undefined ? "" : `Stage ${number}`;

  return (
    <AccordionItem
      key={stageKey}
      value={stageKey}
      disabled={disabled}
      className="border-t border-t-neutral-100 bg-neutral-0"
    >
      <AccordionItemHeader className="!items-start !gap-y-5">
        <div className="flex w-full gap-x-6">
          <div className="flex flex-1 flex-col items-start gap-y-2">
            <Heading size="h3" className="line-clamp-1 text-left">
              {title}
            </Heading>
            <VotingStageStatus status={status} endDate={getSimpleRelativeTimeFromDate(dayjs(details?.endDate))} />
          </div>
          {showStageKey && <span className="hidden leading-tight text-neutral-500 sm:block">{stageKey}</span>}
        </div>
      </AccordionItemHeader>

      <AccordionItemContent ref={contentRef} className="!md:pb-0 !pb-0">
        <RadixTabsRoot defaultValue={defaultTab} ref={setRef}>
          <TabsList>
            <TabsTrigger value="breakdown" label="Breakdown" />
            <TabsTrigger value="votes" label={details?.strategy === "Veto" ? "Vetoes" : "Votes"} />
            <TabsTrigger value="details" label="Details" />
            <TabsTrigger value="rewards" label="Rewards" />
          </TabsList>
          <TabsContent value="breakdown">
            <div className="py-4 pb-8">
              {result && <VotingBreakdown status={status} cta={result.cta} variant={variant} result={result} />}
            </div>
          </TabsContent>
          <TabsContent value="votes">
            <div className="py-4 pb-8">
              <VotesDataList strategy={details?.strategy} votes={votes ?? []} />
            </div>
          </TabsContent>
          <TabsContent value="details">
            <div className="py-4 pb-8">
              {details && (
                <VotingDetails
                  startDate={details.startDate}
                  endDate={details.endDate}
                  tokenAddress={details.tokenAddress}
                  strategy={details.strategy}
                  snapshotEpoch={details.snapshotEpoch}
                  supportThreshold={details.supportThreshold}
                  quorum={details.quorum}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="rewards">
            <Heading size="h4">Rewards</Heading>
            <DefinitionListContainer className="mt-4 border-b border-t border-neutral-100">
              {totalReward !== undefined && (
                <DefinitionListItem term="Voting rewards" className="!gap-y-1">
                  <div className="w-full text-neutral-800 md:text-right">{formatUnits(totalReward, 18)} PWN</div>
                </DefinitionListItem>
              )}
            </DefinitionListContainer>
          </TabsContent>
        </RadixTabsRoot>
      </AccordionItemContent>
    </AccordionItem>
  );
};
