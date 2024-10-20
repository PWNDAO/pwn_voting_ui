import { useRouter } from "next/router";
import { useState } from "react";
import { ProposalMetadata, RawAction } from "@/utils/types";
import { useAlerts } from "@/context/Alerts";
import { PUB_APP_NAME, PUB_CHAIN, PUB_TOKEN_VOTING_PLUGIN_ADDRESS, PUB_PROJECT_URL } from "@/constants";
import { uploadToWeb3Storage } from "@/utils/ipfs";
import { TokenVotingAbi } from "../artifacts/TokenVoting.sol";
import { URL_PATTERN } from "@/utils/input-values";
import { toHex } from "viem";
import { VotingMode } from "../utils/types";
import { useTransactionManager } from "@/hooks/useTransactionManager";

const UrlRegex = new RegExp(URL_PATTERN);

export function useCreateProposal() {
  const { push } = useRouter();
  const { addAlert } = useAlerts();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [actions, setActions] = useState<RawAction[]>([]);
  const [resources, setResources] = useState<{ name: string; url: string }[]>([
    { name: PUB_APP_NAME, url: PUB_PROJECT_URL },
  ]);

  const { writeContract: createProposalWrite, isConfirming } = useTransactionManager({
    onSuccessMessage: "Proposal created",
    onSuccess() {
      setTimeout(() => {
        push("#/");
        window.scroll(0, 0);
      }, 1000 * 2);
    },
    onErrorMessage: "Could not create the proposal",
    onError: () => setIsCreating(false),
  });

  const submitProposal = async () => {
    // Check metadata
    if (!title.trim()) {
      return addAlert("Invalid proposal details", {
        description: "Please enter a title",
        type: "error",
      });
    }

    if (!summary.trim()) {
      return addAlert("Invalid proposal details", {
        description: "Please enter a summary of what the proposal is about",
        type: "error",
      });
    }

    for (const item of resources) {
      if (!item.name.trim()) {
        return addAlert("Invalid resource name", {
          description: "Please enter a name for all the resources",
          type: "error",
        });
      } else if (!UrlRegex.test(item.url.trim())) {
        return addAlert("Invalid resource URL", {
          description: "Please enter valid URL for all the resources",
          type: "error",
        });
      }
    }

    try {
      setIsCreating(true);
      const proposalMetadataJsonObject: ProposalMetadata = {
        title,
        summary,
        description,
        resources,
      };

      console.log(proposalMetadataJsonObject);
      const ipfsPin = await uploadToWeb3Storage(JSON.stringify(proposalMetadataJsonObject));
      const startDate = BigInt(0);
      const endDate = BigInt(0);

      const tryEarlyExecution = false;
      createProposalWrite({
        chainId: PUB_CHAIN.id,
        abi: TokenVotingAbi,
        address: PUB_TOKEN_VOTING_PLUGIN_ADDRESS,
        functionName: "createProposal",
        //args: [toHex(ipfsPin), actions, BigInt(0), startDate, endDate, VotingMode.Standard, tryEarlyExecution],
        args: [toHex(ipfsPin), actions, BigInt(0), startDate, endDate, VotingMode.Standard],
      });
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
    console.log("at the end");
  };

  return {
    isCreating: isCreating || isConfirming || status === "pending",
    title,
    summary,
    description,
    actions,
    resources,
    setTitle,
    setSummary,
    setDescription,
    setActions,
    setResources,
    submitProposal,
  };
}
