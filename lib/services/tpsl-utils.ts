import type { OrderDirection, PnlKind } from "@/types/tpsl";

type PriceCalcBase = {
  entry: number;
  direction: OrderDirection;
  kind: PnlKind;
};

type PriceCalcWithTarget = PriceCalcBase & {
  targetPrice: number;
};

type PriceCalcWithPercent = PriceCalcBase & {
  percent: number;
  leverage: number;
  szDecimals: number;
};

type PriceCalcWithProfitLoss = PriceCalcBase & {
  profitLoss: number;
  positionSize: number;
  szDecimals: number;
};

const toSafeNumber = (value: number) => {
  return Number.isFinite(value) ? value : undefined;
};

const roundToDecimals = (value: number, decimals: number) => {
  const safeDecimals = Number.isFinite(decimals) ? Math.max(0, decimals) : 2;
  return Number(value.toFixed(safeDecimals));
};

export const parseNumberOrUndefined = (
  value: string | number | null | undefined,
) => {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const formatNumber = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(Math.max(0, decimals))).toString();
};

export const sanitizeDecimalInput = (value: string) => {
  if (!value) return "";
  if (value === ".") return "0.";

  const sanitized = value.replace(/[^\d.]/g, "");
  const [integerPart = "", ...rest] = sanitized.split(".");
  const decimalPart = rest.join("");

  if (rest.length === 0) return integerPart;
  return `${integerPart}.${decimalPart}`;
};

export const processUserInput = (value: string, cursorPos: number) => {
  const display = sanitizeDecimalInput(value);
  return {
    display,
    value: display,
    cursorPosition: Math.min(display.length, Math.max(0, cursorPos)),
  };
};

export const calculatePercentFromPrice = ({
  targetPrice,
  entry,
  leverage,
  direction,
  kind,
}: PriceCalcWithTarget & { leverage: number }) => {
  if (!Number.isFinite(targetPrice) || !Number.isFinite(entry) || entry <= 0) {
    return undefined;
  }
  if (!Number.isFinite(leverage) || leverage <= 0) return undefined;

  let ratio: number;
  if (direction === "long") {
    ratio =
      kind === "takeProfit"
        ? (targetPrice - entry) / entry
        : (entry - targetPrice) / entry;
  } else {
    ratio =
      kind === "takeProfit"
        ? (entry - targetPrice) / entry
        : (targetPrice - entry) / entry;
  }

  const percent = ratio * 100 * leverage;
  if (!Number.isFinite(percent) || percent < 0) return undefined;
  return toSafeNumber(percent);
};

export const calculatePriceFromPercent = ({
  percent,
  entry,
  leverage,
  direction,
  kind,
  szDecimals,
}: PriceCalcWithPercent) => {
  if (!Number.isFinite(percent) || percent < 0) return undefined;
  if (!Number.isFinite(entry) || entry <= 0) return undefined;
  if (!Number.isFinite(leverage) || leverage <= 0) return undefined;

  const delta = (percent / (100 * leverage)) * entry;
  let price: number;

  if (direction === "long") {
    price = kind === "takeProfit" ? entry + delta : entry - delta;
  } else {
    price = kind === "takeProfit" ? entry - delta : entry + delta;
  }

  if (!Number.isFinite(price) || price <= 0) return undefined;
  return roundToDecimals(price, szDecimals);
};

export const calculateProfitLossFromPrice = ({
  targetPrice,
  entry,
  direction,
  kind,
  positionSize,
}: PriceCalcWithTarget & { positionSize: number }) => {
  if (!Number.isFinite(targetPrice) || !Number.isFinite(entry) || entry <= 0) {
    return undefined;
  }
  if (!Number.isFinite(positionSize) || positionSize <= 0) return undefined;

  let pnl: number;
  if (direction === "long") {
    pnl =
      kind === "takeProfit"
        ? (targetPrice - entry) * positionSize
        : (entry - targetPrice) * positionSize;
  } else {
    pnl =
      kind === "takeProfit"
        ? (entry - targetPrice) * positionSize
        : (targetPrice - entry) * positionSize;
  }

  if (!Number.isFinite(pnl) || pnl < 0) return undefined;
  return toSafeNumber(pnl);
};

export const calculatePriceFromProfitLoss = ({
  profitLoss,
  entry,
  direction,
  kind,
  positionSize,
  szDecimals,
}: PriceCalcWithProfitLoss) => {
  if (!Number.isFinite(profitLoss) || profitLoss < 0) return undefined;
  if (!Number.isFinite(positionSize) || positionSize <= 0) return undefined;
  if (!Number.isFinite(entry) || entry <= 0) return undefined;

  const delta = profitLoss / positionSize;
  let price: number;

  if (direction === "long") {
    price = kind === "takeProfit" ? entry + delta : entry - delta;
  } else {
    price = kind === "takeProfit" ? entry - delta : entry + delta;
  }

  if (!Number.isFinite(price) || price <= 0) return undefined;
  return roundToDecimals(price, szDecimals);
};
