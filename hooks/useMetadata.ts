import { fetchIpfsAsJson } from "@/utils/ipfs";
import { JsonValue } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";

export function useMetadata<T = JsonValue>(ipfsUri?: string, options: { enabled?: boolean } = {}) {
  const {
    data,
    isFetching: isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<T, Error>({
    queryKey: ["ipfs", ipfsUri || ""],
    queryFn: () => fetchIpfsAsJson(ipfsUri!),
    enabled: Boolean(ipfsUri) && options.enabled !== false,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retryOnMount: false,
    staleTime: Infinity,
  });

  return {
    data,
    isLoading,
    isSuccess,
    error,
    refetch,
  };
}

export const useIpfsJsonData = useMetadata;
