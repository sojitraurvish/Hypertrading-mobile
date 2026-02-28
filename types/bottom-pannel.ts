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
