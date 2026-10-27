type ProposalDisplayData = {
  actions: readonly unknown[];
  parameters: { startDate: bigint };
  summary?: string;
};

const proposalDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatProposalDate(timestamp?: bigint) {
  if (!timestamp || timestamp <= 0n) return undefined;
  const date = new Date(Number(timestamp) * 1000);
  return Number.isNaN(date.getTime()) ? undefined : proposalDateFormatter.format(date);
}

export function getProposalTitle(title: string, index: number, group: "Stewards" | "Community") {
  return title.trim() || `${group} proposal #${index + 1}`;
}

export function getProposalSummary(proposal: ProposalDisplayData) {
  if (proposal.summary?.trim()) return proposal.summary;

  const actionCount = proposal.actions.length;
  const actions = actionCount
    ? `${actionCount} on-chain ${actionCount === 1 ? "action" : "actions"}`
    : "Signaling proposal";
  const date = formatProposalDate(proposal.parameters.startDate);
  return date ? `${actions} · Voting opened ${date}` : actions;
}
