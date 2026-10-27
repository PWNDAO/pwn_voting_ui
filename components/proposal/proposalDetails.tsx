import { Card, Heading } from "@aragon/gov-ui-kit";
import { AddressText } from "@/components/text/address";
import { formatProposalDate } from "@/utils/proposal-display";
import { getViemChain, useChainIdTypesafe } from "@/utils/chains";
import { PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS, PUB_TOKEN_VOTING_PLUGIN_ADDRESS } from "@/constants";

type ProposalDetailsProps = {
  index: number;
  group: "Stewards" | "Community";
  creator: string;
  startDate: bigint;
  endDate: bigint;
  actionCount: number;
};

export function ProposalDetails({ index, group, creator, startDate, endDate, actionCount }: ProposalDetailsProps) {
  const chainId = useChainIdTypesafe();
  const chain = getViemChain(chainId);
  const pluginAddress =
    group === "Stewards" ? PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS[chainId] : PUB_TOKEN_VOTING_PLUGIN_ADDRESS[chainId];
  const explorer = chain.blockExplorers?.default;

  return (
    <Card className="flex flex-col gap-y-5 p-6 shadow-neutral">
      <Heading size="h3">Proposal details</Heading>
      <dl className="flex flex-col gap-y-4 text-sm">
        <Detail label="Proposal">#{index + 1}</Detail>
        <Detail label="Governance">{group}</Detail>
        {creator && (
          <Detail label="Proposed by">
            <AddressText bold={false}>{creator}</AddressText>
          </Detail>
        )}
        {formatProposalDate(startDate) && <Detail label="Voting opened">{formatProposalDate(startDate)}</Detail>}
        {formatProposalDate(endDate) && <Detail label="Voting deadline">{formatProposalDate(endDate)}</Detail>}
        <Detail label="On-chain actions">{actionCount}</Detail>
      </dl>
      {explorer && (
        <a
          href={`${explorer.url}/address/${pluginAddress}#events`}
          target="_blank"
          rel="noopener noreferrer"
          className="border-t border-neutral-100 pt-4 text-sm text-primary-400 hover:underline"
        >
          View governance contract on {explorer.name} ↗
        </a>
      )}
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-800">{children}</dd>
    </div>
  );
}
