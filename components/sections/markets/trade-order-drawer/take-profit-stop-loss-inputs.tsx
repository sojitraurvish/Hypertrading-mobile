
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import {
  calculatePercentFromPrice,
  calculatePriceFromPercent,
  calculatePriceFromProfitLoss,
  calculateProfitLossFromPrice,
  parseNumberOrUndefined,
} from "@/lib/services/tpsl-utils";
import {
  ORDER_DIRECTION,
  type AnchorField,
  type OrderDirection,
  type TpSlValidationError,
} from "@/types/tpsl";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { PnlInput } from "./pnl-input";

type TakeProfitStopLossInputsProps = {
  className?: string;
  entryPrice: number | null | undefined;
  direction: OrderDirection;
  leverage: number;
  takeProfitPrice: number | undefined;
  stopLossPrice: number | undefined;
  onTakeProfitPriceChange: (value: number | undefined) => void;
  onStopLossPriceChange: (value: number | undefined) => void;
  szDecimals: number;
  onValidationChange?: (error: TpSlValidationError) => void;
  priceLabel?: "entry" | "mark";
  positionSize?: number | undefined;
  thresholdPrice: number | null | undefined;
  tpslVariant: "percent" | "dollar";
  setTpslVariant: (value: "percent" | "dollar") => void;
  disabled?: boolean;
  hideTakeProfit?: boolean;
  hideStopLoss?: boolean;
};

export function TakeProfitStopLossInputs({
  className,
  entryPrice,
  direction,
  leverage,
  takeProfitPrice,
  stopLossPrice,
  onTakeProfitPriceChange,
  onStopLossPriceChange,
  szDecimals,
  onValidationChange,
  priceLabel = "entry",
  positionSize,
  thresholdPrice,
  tpslVariant,
  setTpslVariant,
  disabled = false,
  hideTakeProfit = false,
  hideStopLoss = false,
}: TakeProfitStopLossInputsProps) {
  const entry =
    typeof entryPrice === "number" && Number.isFinite(entryPrice)
      ? entryPrice
      : undefined;

  const isDisabled =
    disabled || positionSize === undefined || positionSize === 0;

  useEffect(() => {
    if (isDisabled) {
      onTakeProfitPriceChange(undefined);
      onStopLossPriceChange(undefined);
    }
  }, [isDisabled, onTakeProfitPriceChange, onStopLossPriceChange]);

  const { takeProfitError, stopLossError } = useMemo(() => {
    if (thresholdPrice === undefined || thresholdPrice === null) {
      return { takeProfitError: false, stopLossError: false };
    }

    let tpError = false;
    let slError = false;

    if (takeProfitPrice !== undefined) {
      if (direction === ORDER_DIRECTION.LONG) {
        tpError = takeProfitPrice <= thresholdPrice;
      } else {
        tpError = takeProfitPrice >= thresholdPrice;
      }
    }

    if (stopLossPrice !== undefined) {
      if (direction === ORDER_DIRECTION.LONG) {
        slError = stopLossPrice >= thresholdPrice;
      } else {
        slError = stopLossPrice <= thresholdPrice;
      }
    }

    return { takeProfitError: tpError, stopLossError: slError };
  }, [takeProfitPrice, stopLossPrice, direction, thresholdPrice]);

  useEffect(() => {
    onValidationChange?.({ takeProfitError, stopLossError });
  }, [takeProfitError, stopLossError, onValidationChange]);

  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const tpAnchorRef = useRef<AnchorField>("price");
  const slAnchorRef = useRef<AnchorField>("price");

  useEffect(() => {
    if (entry === undefined || leverage <= 0 || isDisabled) {
      return;
    }
    if (tpAnchorRef.current === "price") {
      const priceNum = takeProfitPrice;
      let nextTakeProfit: string | undefined;
      if (priceNum !== undefined) {
        if (tpslVariant === "percent") {
          nextTakeProfit = calculatePercentFromPrice({
            targetPrice: priceNum,
            entry,
            leverage,
            direction,
            kind: "takeProfit",
          })?.toFixed(2);
        } else if (tpslVariant === "dollar") {
          nextTakeProfit = calculateProfitLossFromPrice({
            targetPrice: priceNum,
            entry,
            direction,
            kind: "takeProfit",
            positionSize: positionSize || 0,
          })?.toFixed(0);
        }
      }
      setTakeProfit(nextTakeProfit === undefined ? "" : nextTakeProfit);
    } else if (tpAnchorRef.current === "pnl") {
      const percent = parseNumberOrUndefined(takeProfit);
      if (percent === undefined) {
        onTakeProfitPriceChange(undefined);
        return;
      }
      let price: number | undefined;
      if (tpslVariant === "percent") {
        price = calculatePriceFromPercent({
          percent,
          entry,
          leverage,
          direction,
          kind: "takeProfit",
          szDecimals,
        });
      } else if (tpslVariant === "dollar") {
        price = calculatePriceFromProfitLoss({
          profitLoss: percent,
          entry,
          direction,
          kind: "takeProfit",
          positionSize: positionSize || 0,
          szDecimals,
        });
      }
      onTakeProfitPriceChange(price);
    }
  }, [
    direction,
    entry,
    isDisabled,
    leverage,
    szDecimals,
    takeProfit,
    takeProfitPrice,
    tpslVariant,
    positionSize,
    onTakeProfitPriceChange,
  ]);

  useEffect(() => {
    if (entry === undefined || leverage <= 0 || isDisabled) {
      return;
    }
    if (slAnchorRef.current === "price") {
      const priceNum = stopLossPrice;
      let nextStopLoss: string | undefined;
      if (priceNum !== undefined) {
        if (tpslVariant === "percent") {
          nextStopLoss = calculatePercentFromPrice({
            targetPrice: priceNum,
            entry,
            leverage,
            direction,
            kind: "stopLoss",
          })?.toFixed(2);
        } else if (tpslVariant === "dollar") {
          nextStopLoss = calculateProfitLossFromPrice({
            targetPrice: priceNum,
            entry,
            direction,
            kind: "stopLoss",
            positionSize: positionSize || 0,
          })?.toFixed(0);
        }
      }
      setStopLoss(nextStopLoss === undefined ? "" : nextStopLoss);
    } else if (slAnchorRef.current === "pnl") {
      const percent = parseNumberOrUndefined(stopLoss);
      if (percent === undefined) {
        onStopLossPriceChange(undefined);
        return;
      }
      let price: number | undefined;
      if (tpslVariant === "percent") {
        price = calculatePriceFromPercent({
          percent,
          entry,
          leverage,
          direction,
          kind: "stopLoss",
          szDecimals,
        });
      } else if (tpslVariant === "dollar") {
        price = calculatePriceFromProfitLoss({
          profitLoss: percent,
          entry,
          direction,
          kind: "stopLoss",
          positionSize: positionSize || 0,
          szDecimals,
        });
      }
      onStopLossPriceChange(price);
    }
  }, [
    direction,
    entry,
    leverage,
    stopLoss,
    stopLossPrice,
    szDecimals,
    isDisabled,
    tpslVariant,
    positionSize,
    onStopLossPriceChange,
  ]);

  const hasError = takeProfitError || stopLossError;

  return (
    <View className={className || "gap-3"}>
      {!hideTakeProfit ? (
        <PnlInput
          anchorRef={tpAnchorRef}
          disabled={isDisabled}
          entry={entry}
          error={takeProfitError}
          kind="takeProfit"
          onPriceChange={onTakeProfitPriceChange}
          pnlValue={takeProfit}
          price={takeProfitPrice}
          setPnLValue={setTakeProfit}
          setTpslVariant={setTpslVariant}
          szDecimals={szDecimals}
          tpslVariant={tpslVariant}
        />
      ) : null}

      {!hideStopLoss ? (
        <PnlInput
          anchorRef={slAnchorRef}
          disabled={isDisabled}
          entry={entry}
          error={stopLossError}
          kind="stopLoss"
          onPriceChange={onStopLossPriceChange}
          pnlValue={stopLoss}
          price={stopLossPrice}
          setPnLValue={setStopLoss}
          setTpslVariant={setTpslVariant}
          szDecimals={szDecimals}
          tpslVariant={tpslVariant}
        />
      ) : null}

      {hasError ? (
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-[12px] leading-[16px] text-[#ef4444] font-medium"
        >
          {takeProfitError && stopLossError
            ? `Both ${priceLabel === "entry" ? "entry" : "mark"} prices are invalid`
            : takeProfitError
              ? `Take profit price crosses ${priceLabel === "entry" ? "entry" : "mark"} price`
              : `Stop loss price crosses ${priceLabel === "entry" ? "entry" : "mark"} price`}
        </AppText>
      ) : null}
    </View>
  );
}
