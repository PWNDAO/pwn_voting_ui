import { useAccount, useReadContract } from "wagmi";
import { type ReactNode } from "react";
import ProposalCard from "../components/proposal";
import { TokenVotingPluginAbi } from "../artifacts/TokenVoting.sol";
import {
  Button,
  DataListContainer,
  DataListPagination,
  DataListRoot,
  IconType,
  ProposalDataListItemSkeleton,
  type DataListState,
} from "@aragon/gov-ui-kit";
import { useCanCreateProposal } from "../hooks/useCanCreateProposal";
import Link from "next/link";
import { Else, If, Then } from "@/components/if";
import { PUB_TOKEN_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { MainSection } from "@/components/layout/main-section";
import { MissingContentView } from "@/components/MissingContentView";
import { useChainIdTypesafe } from "@/utils/chains";

const DEFAULT_PAGE_SIZE = 6;

const img = "/images/empty.png";

export default function Proposals() {
  const { isConnected } = useAccount();
  const canCreate = useCanCreateProposal();
  const chainId = useChainIdTypesafe();

  const {
    data: proposalCountResponse,
    error: isError,
    isLoading,
    refetch,
  } = useReadContract({
    address: PUB_TOKEN_VOTING_PLUGIN_ADDRESS[chainId],
    abi: TokenVotingPluginAbi,
    functionName: "proposalCount",
    chainId,
    query: { refetchInterval: 60_000 },
  });
  const proposalCount = Number(proposalCountResponse ?? 0n);

  const entityLabel = proposalCount === 1 ? "Proposal" : "Proposals";

  let dataListState: DataListState = "idle";
  if (isLoading && !proposalCount) {
    dataListState = "initialLoading";
  } else if (isError && proposalCountResponse === undefined) {
    dataListState = "error";
  }

  return (
    <MainSection narrow>
      <SectionView>
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-normal leading-tight text-neutral-800 md:text-3xl">Community Proposals</h1>
          <p className="text-sm leading-relaxed text-neutral-500">Community decisions and their voting results.</p>
        </div>
        <div className="justify-self-end">
          <Link href="#/community-voting/new">
            <Button disabled={!isConnected || !canCreate} iconLeft={IconType.PLUS} size="md" variant="secondary">
              Submit Proposal
            </Button>
          </Link>
        </div>
      </SectionView>

      <If true={!isLoading && !isError && !proposalCount}>
        <Then>
          <MissingContentView img={img}>
            No proposals have been created yet. Here you will see the available proposals.{" "}
            <If true={canCreate}>Create your first proposal.</If>
          </MissingContentView>
        </Then>
        <Else>
          <DataListRoot
            entityLabel={entityLabel}
            itemsCount={proposalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            state={dataListState}
            //onLoadMore={fetchNextPage}
          >
            <DataListContainer
              style={{ rowGap: "1rem" }}
              SkeletonElement={ProposalDataListItemSkeleton}
              errorState={{
                heading: "Unable to load proposals",
                description: "We couldn't connect to the selected network. Please try again.",
                primaryButton: { label: "Try again", onClick: () => refetch() },
              }}
            >
              {proposalCount &&
                Array.from(Array(proposalCount || 0)?.keys())
                  .reverse()
                  ?.map((proposalIndex) => (
                    // TODO: update with router agnostic ODS DataListItem
                    <ProposalCard key={proposalIndex} proposalIndex={proposalIndex} />
                  ))}
            </DataListContainer>
            {proposalCount > DEFAULT_PAGE_SIZE && <DataListPagination />}
          </DataListRoot>
        </Else>
      </If>
    </MainSection>
  );
}

function SectionView({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}
