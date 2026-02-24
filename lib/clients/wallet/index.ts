import { createAppKit } from "@reown/appkit-react-native";
import { EthersAdapter } from "@reown/appkit-ethers-react-native";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import Constants from "expo-constants";

import { ENVIRONMENT, ENVIRONMENT_TYPES } from "@/lib/constants";
import { walletStorage } from "./storage";

const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID!;

const scheme = Constants.expoConfig?.scheme ?? "app-scheme-prod";

const ethersAdapter = new EthersAdapter();

export const allChains = [arbitrum, arbitrumSepolia] as const;

export const activeChain =
  ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? arbitrumSepolia : arbitrum;

export const walletKit = createAppKit({
  projectId,
  networks: [arbitrum, arbitrumSepolia],
  defaultNetwork: activeChain,
  adapters: [ethersAdapter],
  storage: walletStorage,
  metadata: {
    name: "Hypertrading",
    description: "Hyperliquid Mobile Trading",
    url: "https://hypertrading.app",
    icons: ["https://hypertrading.app/icon.png"],
    redirect: {
      native: `${scheme}://`,
    },
  },
  features: {
    swaps: false,
    onramp: false,
  },
});
