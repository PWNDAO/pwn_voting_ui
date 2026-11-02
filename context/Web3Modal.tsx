import { Config } from "wagmi";
import { ENABLED_CHAINS, PUB_RPC_URL, PUB_WALLET_CONNECT_PROJECT_ID } from "@/constants";
import { ChainId } from "@/utils/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createRpcTransport } from "@/utils/rpc";

export const wagmiAdapter = new WagmiAdapter({
  networks: ENABLED_CHAINS,
  // TODO do we need to have this enabled?
  ssr: true,
  transports: {
    [1]: createRpcTransport(1, PUB_RPC_URL[1]),
    [11155111]: createRpcTransport(11155111, PUB_RPC_URL[11155111]),
  } satisfies Record<ChainId, unknown>,
  projectId: PUB_WALLET_CONNECT_PROJECT_ID,
});

export const config = wagmiAdapter.wagmiConfig as Config;
