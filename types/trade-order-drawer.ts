export type PlaceOrderTif =
  | "FrontendMarket"
  | "Gtc"
  | "Ioc"
  | "Alo"
  | "LiquidationMarket";

export type TimeInForceOption = "GTC" | "IOC" | "ALO";

export type PlaceOrderWithAgentParams = {
  agentPrivateKey: string;
  a: string;
  b: boolean;
  s: string;
  p: string;
  r: boolean;
  tif?: PlaceOrderTif;
  builderAddress?: `0x${string}`;
  desiredBps?: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
};

export type LimitOrderWire = {
  a: string;
  b: boolean;
  p: string;
  r: boolean;
  s: string;
  t: {
    limit: {
      tif: PlaceOrderTif;
    };
  };
};

export type TriggerOrderWire = {
  a: string;
  b: boolean;
  p: string;
  r: boolean;
  s: string;
  t: {
    trigger: {
      isMarket: true;
      tpsl: "sl" | "tp";
      triggerPx: string;
    };
  };
};

export type AgentOrderWire = LimitOrderWire | TriggerOrderWire;

export type AgentOrderRequest = {
  grouping: "na" | "normalTpsl";
  orders: AgentOrderWire[];
  builder?: {
    b: `0x${string}`;
    f: number;
  };
};

export type FilledOrderStatus = {
  filled: {
    totalSz: string;
    avgPx: string;
  };
};

export type RawOrderStatus = {
  filled?: {
    totalSz: string;
    avgPx: string;
  };
  [key: string]: unknown;
};

export type PlaceOrderWithAgentOkResponse = {
  status: "ok";
  response: {
    type?: string;
    data: {
      statuses: RawOrderStatus[];
    };
  };
};

export type PlaceOrderWithAgentErrResponse = {
  status: "err";
  response: {
    type: string;
    data?: {
      statuses?: RawOrderStatus[];
    };
  };
};

export type OrderPayload =
  | PlaceOrderWithAgentOkResponse
  | PlaceOrderWithAgentErrResponse;
