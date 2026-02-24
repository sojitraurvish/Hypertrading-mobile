import {
  ExchangeClient,
  HttpTransport,
  InfoClient,
  SubscriptionClient,
  WebSocketTransport,
} from "@nktkas/hyperliquid";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";
import { privateKeyToAccount } from "viem/accounts";

import { ENVIRONMENT, ENVIRONMENT_TYPES } from "@/lib/constants";

const isTestnet = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT;

export const transport = new HttpTransport({
  isTestnet,
  timeout: 30_000,
});

export const infoClient = new InfoClient({ transport });

let symbolConverterCache: Awaited<
  ReturnType<typeof SymbolConverter.create>
> | null = null;

export async function getSymbolConverter() {
  if (!symbolConverterCache) {
    symbolConverterCache = await SymbolConverter.create({ transport });
  }
  return symbolConverterCache;
}

export function getAgentExchangeClient(agentPrivateKey: `0x${string}`) {
  if (!agentPrivateKey) {
    throw new Error(
      "Agent private key is required but was not provided. Please ensure the API wallet is initialized.",
    );
  }
  const account = privateKeyToAccount(agentPrivateKey);
  return new ExchangeClient({ transport, wallet: account });
}

export function getUserExchangeClient(walletClient: AbstractWallet) {
  return new ExchangeClient({
    transport,
    wallet: walletClient,
  });
}

const wsTransport = new WebSocketTransport({ isTestnet });

export const subscriptionClient = new SubscriptionClient({
  transport: wsTransport,
});
