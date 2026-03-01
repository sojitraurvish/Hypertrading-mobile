export type Balance = {
  coin: string;
  total_balance: string;
  available_balance: string;
  usdc_value: number;
};

export type Position = {
  type: "oneWay";
  position: {
    coin: string;
    szi: string;
    leverage:
      | {
          type: "isolated";
          value: number;
          rawUsd: string;
        }
      | {
          type: "cross";
          value: number;
        };
    entryPx: string;
    positionValue: string;
    unrealizedPnl: string;
    returnOnEquity: string;
    liquidationPx: string | null;
    marginUsed: string;
    maxLeverage: number;
    cumFunding: {
      allTime: string;
      sinceOpen: string;
      sinceChange: string;
    };
  };
};

export type OpenOrder = {
  coin: string;
  [key: string]: unknown;
};

export interface FundingHistory {
  time: number;
  hash: string;
  delta: {
    type: string;
    coin: string;
    usdc: string;
    szi: string;
    fundingRate: string;
    nSamples: number | null;
  };
}

export interface TradeHistory {
  coin: string;
  px: string;
  sz: string;
  side: "B" | "A";
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: `0x${string}`;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  cloid?: `0x${string}` | undefined;
  liquidation?:
    | {
        liquidatedUser: `0x${string}`;
        markPx: string;
        method: "market" | "backstop";
      }
    | undefined;
  feeToken: string;
  twapId: number | null;
}

export type HistoricalOrder = {
  order: {
    coin: string;
    side: "B" | "A";
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    triggerCondition: string;
    isTrigger: boolean;
    triggerPx: string;
    children: unknown[];
    isPositionTpsl: boolean;
    reduceOnly: boolean;
    orderType: string;
    origSz: string;
    tif?: string;
    cloid?: string | null;
  };
  status: string;
  statusTimestamp: number;
};
