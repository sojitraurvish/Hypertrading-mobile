export const ORDER_DIRECTION = {
  LONG: "long",
  SHORT: "short",
} as const;

export type OrderDirection =
  (typeof ORDER_DIRECTION)[keyof typeof ORDER_DIRECTION];

export type PnlKind = "takeProfit" | "stopLoss";

export type TpslVariant = "percent" | "dollar";

export type AnchorField = "price" | "pnl";

export type TpSlValidationError = {
  takeProfitError: boolean;
  stopLossError: boolean;
};
