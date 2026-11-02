import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { fromHex, type AbiEvent, type Address } from "viem";
import { useMetadata } from "@/hooks/useMetadata";
import { getProposalCreatedEvent } from "@/utils/proposal-events";
import type { ChainId } from "@/utils/chains";
import type { ProposalMetadata } from "@/utils/types";
import { isUnavailableHistoricalMetadata } from "@/utils/historical-metadata";

export function useProposalMetadata({
  address,
  chainId,
  event,
  proposalId,
}: {
  address: Address;
  chainId: ChainId;
  event: AbiEvent;
  proposalId?: bigint;
}) {
  const publicClient = usePublicClient({ chainId });
  const { data: creationEvent } = useQuery({
    queryKey: ["proposal-created", chainId, address, proposalId?.toString()],
    enabled: proposalId !== undefined && !!publicClient,
    queryFn: () => {
      if (!publicClient || proposalId === undefined) throw new Error("Proposal or public client is unavailable.");
      return getProposalCreatedEvent({ address, chainId, event, proposalId, publicClient });
    },
    staleTime: Infinity,
    retry: 1,
  });
  const metadataUri = creationEvent?.metadata ? fromHex(creationEvent.metadata, "string") : undefined;
  const metadata = useMetadata<ProposalMetadata>(metadataUri, {
    enabled: !isUnavailableHistoricalMetadata(chainId, metadataUri),
  });

  return {
    creationEvent,
    ...metadata,
    retryMetadata: metadataUri
      ? () => {
          void metadata.refetch();
        }
      : undefined,
  };
}
