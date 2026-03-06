import { AppButton } from "@/components/ui/app-button";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { ORDER_DIRECTION, type OrderDirection } from "@/types/tpsl";
import type { Position } from "@/types/bottom-pannel";
import React, { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import SizeSlider from "../trade-order-drawer/size-slider";
import { TakeProfitStopLossInputs } from "../trade-order-drawer/take-profit-stop-loss-inputs";

type ExistingTpsl = {
  takeProfit?: { triggerPx: string; limitPx?: string; orderId?: string };
  stopLoss?: { triggerPx: string; limitPx?: string; orderId?: string };
};

type PositionTpslModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
  szDecimals: number;
  onConfirm: (params: {
    takeProfitPrice?: number;
    stopLossPrice?: number;
    takeProfitLimitPrice?: number;
    stopLossLimitPrice?: number;
    orderSize?: number;
  }) => Promise<void>;
  existingTpsl?: ExistingTpsl;
  onCancelTpsl?: (type: "tp" | "sl") => Promise<void>;
};

const parseDecimalInput = (value: string) => {
  if (value === "") return value;
  if (!/^\d*\.?\d*$/.test(value)) return null;
  return value;
};

const calculateExpectedProfitLoss = ({
  triggerPrice,
  entryPrice,
  direction,
  positionSize,
  kind,
}: {
  triggerPrice: string;
  entryPrice: number;
  direction: OrderDirection;
  positionSize: number;
  kind: "tp" | "sl";
}) => {
  const trigger = Number.parseFloat(triggerPrice);
  if (!Number.isFinite(trigger) || !Number.isFinite(entryPrice) || entryPrice <= 0) {
    return "--";
  }

  const priceDiff =
    direction === ORDER_DIRECTION.LONG
      ? kind === "tp"
        ? trigger - entryPrice
        : entryPrice - trigger
      : kind === "tp"
        ? entryPrice - trigger
        : trigger - entryPrice;

  const pnl = priceDiff * positionSize;
  const sign = pnl >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(pnl).toFixed(2)}`;
};

export const PositionTpslModal: React.FC<PositionTpslModalProps> = ({
  isOpen,
  onClose,
  position,
  szDecimals,
  onConfirm,
  existingTpsl,
  onCancelTpsl,
}) => {
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | undefined>(
    undefined,
  );
  const [stopLossPrice, setStopLossPrice] = useState<number | undefined>(undefined);
  const [takeProfitLimitPrice, setTakeProfitLimitPrice] = useState("");
  const [stopLossLimitPrice, setStopLossLimitPrice] = useState("");
  const [isLimitPriceEnabled, setIsLimitPriceEnabled] = useState(false);
  const [isConfigureAmountEnabled, setIsConfigureAmountEnabled] = useState(false);
  const [orderSizePercent, setOrderSizePercent] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tpslVariant, setTpslVariant] = useState<"percent" | "dollar">(
    "percent",
  );

  const pos = position?.position;
  const entryPrice = pos ? Number.parseFloat(pos.entryPx) : undefined;
  const markPrice = pos
    ? Number.parseFloat(pos.positionValue) / Math.abs(Number.parseFloat(pos.szi))
    : undefined;
  const positionSize = pos ? Math.abs(Number.parseFloat(pos.szi)) : 0;
  const direction: OrderDirection =
    pos && Number.parseFloat(pos.szi) > 0
      ? ORDER_DIRECTION.LONG
      : ORDER_DIRECTION.SHORT;
  const leverage = pos?.leverage?.value || 1;
  const coin = pos?.coin || "";

  useEffect(() => {
    if (!isOpen) return;

    if (existingTpsl) {
      setTakeProfitPrice(
        existingTpsl.takeProfit?.triggerPx
          ? Number.parseFloat(existingTpsl.takeProfit.triggerPx)
          : undefined,
      );
      setStopLossPrice(
        existingTpsl.stopLoss?.triggerPx
          ? Number.parseFloat(existingTpsl.stopLoss.triggerPx)
          : undefined,
      );
      setTakeProfitLimitPrice(existingTpsl.takeProfit?.limitPx ?? "");
      setStopLossLimitPrice(existingTpsl.stopLoss?.limitPx ?? "");
      setIsLimitPriceEnabled(
        Boolean(existingTpsl.takeProfit?.limitPx || existingTpsl.stopLoss?.limitPx),
      );
    } else {
      setTakeProfitPrice(undefined);
      setStopLossPrice(undefined);
      setTakeProfitLimitPrice("");
      setStopLossLimitPrice("");
      setIsLimitPriceEnabled(false);
    }

    setIsConfigureAmountEnabled(false);
    setOrderSizePercent(100);
    setIsSubmitting(false);
    setTpslVariant("percent");
  }, [existingTpsl, isOpen]);

  const calculatedOrderSize = useMemo(() => {
    if (!isConfigureAmountEnabled) return positionSize;
    return (positionSize * orderSizePercent) / 100;
  }, [isConfigureAmountEnabled, orderSizePercent, positionSize]);

  const handleConfirm = async () => {
    if (!position) return;
    if (takeProfitPrice === undefined && stopLossPrice === undefined) return;

    setIsSubmitting(true);
    try {
      const orderSize = isConfigureAmountEnabled
        ? (positionSize * orderSizePercent) / 100
        : 0;

      await onConfirm({
        takeProfitPrice,
        stopLossPrice,
        takeProfitLimitPrice:
          isLimitPriceEnabled && takeProfitLimitPrice
            ? Number.parseFloat(takeProfitLimitPrice)
            : undefined,
        stopLossLimitPrice:
          isLimitPriceEnabled && stopLossLimitPrice
            ? Number.parseFloat(stopLossLimitPrice)
            : undefined,
        orderSize,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTp = async () => {
    if (!onCancelTpsl) return;
    setIsSubmitting(true);
    try {
      await onCancelTpsl("tp");
      setTakeProfitPrice(undefined);
      setTakeProfitLimitPrice("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSl = async () => {
    if (!onCancelTpsl) return;
    setIsSubmitting(true);
    try {
      await onCancelTpsl("sl");
      setStopLossPrice(undefined);
      setStopLossLimitPrice("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!position || !pos) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="TP/SL for Position"
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick
      showCloseButton
      contentClassName="gap-4"
    >
      <View className="gap-4">
        <View className="grid grid-cols-2 gap-2.5 p-3.5 bg-bg-quaternary-dark/70 rounded-xl border border-border-primary-dark/60">
          <View className="gap-1">
            <AppText className="text-[10px] text-text-octonary-dark uppercase tracking-[0.7px]">
              Coin
            </AppText>
            <AppText className="text-[13px] text-text-primary-dark font-semibold">
              {coin}
            </AppText>
          </View>
          <View className="gap-1">
            <AppText className="text-[10px] text-text-octonary-dark uppercase tracking-[0.7px]">
              Position
            </AppText>
            <AppText
              className={
                Number.parseFloat(pos.szi) < 0
                  ? "text-[13px] font-semibold text-[#f87171]"
                  : "text-[13px] font-semibold text-[#86efac]"
              }
            >
              {addDecimals(Math.abs(Number.parseFloat(pos.szi)), szDecimals)} {coin}
            </AppText>
          </View>
          <View className="gap-1">
            <AppText className="text-[10px] text-text-octonary-dark uppercase tracking-[0.7px]">
              Entry Price
            </AppText>
            <AppText className="text-[13px] text-text-primary-dark font-mono">
              {addDecimals(entryPrice || 0, 3)}
            </AppText>
          </View>
          <View className="gap-1">
            <AppText className="text-[10px] text-text-octonary-dark uppercase tracking-[0.7px]">
              Mark Price
            </AppText>
            <AppText className="text-[13px] text-text-primary-dark font-mono">
              {addDecimals(markPrice || 0, 3)}
            </AppText>
          </View>
        </View>

        {existingTpsl?.takeProfit ? (
          <View className="flex-row items-center justify-between p-3 rounded-xl border border-[#78f39a]/30 bg-[#163b2f]/35">
            <View className="gap-1">
              <AppText className="text-[12px] text-text-primary-dark font-semibold">
                TP: {existingTpsl.takeProfit.triggerPx}
              </AppText>
              <AppText className="text-[11px] text-[#86efac]">
                {calculateExpectedProfitLoss({
                  triggerPrice: existingTpsl.takeProfit.triggerPx,
                  entryPrice: entryPrice || 0,
                  direction,
                  positionSize,
                  kind: "tp",
                })}
              </AppText>
            </View>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() => void handleCancelTp()}
              isDisabled={isSubmitting}
              className="h-8 min-w-[76px] px-3 rounded-lg border border-[#f87171]/35 bg-[#3f1d22]/50 items-center justify-center"
            >
              <AppText className="text-[11px] leading-[14px] font-semibold text-[#f87171] text-center">
                Cancel
              </AppText>
            </AppButton>
          </View>
        ) : null}

        {existingTpsl?.stopLoss ? (
          <View className="flex-row items-center justify-between p-3 rounded-xl border border-[#f87171]/30 bg-[#3f1d22]/35">
            <View className="gap-1">
              <AppText className="text-[12px] text-text-primary-dark font-semibold">
                SL: {existingTpsl.stopLoss.triggerPx}
              </AppText>
              <AppText className="text-[11px] text-[#f87171]">
                {calculateExpectedProfitLoss({
                  triggerPrice: existingTpsl.stopLoss.triggerPx,
                  entryPrice: entryPrice || 0,
                  direction,
                  positionSize,
                  kind: "sl",
                })}
              </AppText>
            </View>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() => void handleCancelSl()}
              isDisabled={isSubmitting}
              className="h-8 min-w-[76px] px-3 rounded-lg border border-[#f87171]/35 bg-[#3f1d22]/50 items-center justify-center"
            >
              <AppText className="text-[11px] leading-[14px] font-semibold text-[#f87171] text-center">
                Cancel
              </AppText>
            </AppButton>
          </View>
        ) : null}

        {!existingTpsl?.takeProfit || !existingTpsl?.stopLoss ? (
          <TakeProfitStopLossInputs
            entryPrice={entryPrice}
            direction={direction}
            leverage={leverage}
            takeProfitPrice={takeProfitPrice}
            stopLossPrice={stopLossPrice}
            onTakeProfitPriceChange={setTakeProfitPrice}
            onStopLossPriceChange={setStopLossPrice}
            szDecimals={szDecimals}
            priceLabel="mark"
            positionSize={calculatedOrderSize}
            thresholdPrice={markPrice || null}
            tpslVariant={tpslVariant}
            setTpslVariant={setTpslVariant}
            disabled={false}
            hideTakeProfit={Boolean(existingTpsl?.takeProfit)}
            hideStopLoss={Boolean(existingTpsl?.stopLoss)}
          />
        ) : null}

        <View className="gap-2">
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={() => setIsConfigureAmountEnabled((prev) => !prev)}
            className="flex-row items-center justify-start gap-2 px-0 py-0"
          >
            <View
              className={
                isConfigureAmountEnabled
                  ? "w-5 h-5 rounded-md border border-[#78f39a]/50 bg-bg-senary-dark items-center justify-center"
                  : "w-5 h-5 rounded-md border border-border-primary-dark/70 bg-transparent items-center justify-center"
              }
            >
              {isConfigureAmountEnabled ? (
                <AppText className="text-[10px] font-bold text-black">✓</AppText>
              ) : null}
            </View>
            <AppText className="text-[12px] text-text-tertiary-dark font-medium">
              Configure Amount
            </AppText>
          </AppButton>

          {isConfigureAmountEnabled ? (
            <View className="gap-2 pl-7">
              <SizeSlider
                value={orderSizePercent}
                onChange={setOrderSizePercent}
                disabled={isSubmitting}
              />
              <AppText className="text-[11px] text-text-octonary-dark">
                {addDecimals(calculatedOrderSize, szDecimals)} {coin}
              </AppText>
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={() => setIsLimitPriceEnabled((prev) => !prev)}
            className="flex-row items-center justify-start gap-2 px-0 py-0"
          >
            <View
              className={
                isLimitPriceEnabled
                  ? "w-5 h-5 rounded-md border border-[#78f39a]/50 bg-bg-senary-dark items-center justify-center"
                  : "w-5 h-5 rounded-md border border-border-primary-dark/70 bg-transparent items-center justify-center"
              }
            >
              {isLimitPriceEnabled ? (
                <AppText className="text-[10px] font-bold text-black">✓</AppText>
              ) : null}
            </View>
            <AppText className="text-[12px] text-text-tertiary-dark font-medium">
              Limit Price
            </AppText>
          </AppButton>

          {isLimitPriceEnabled ? (
            <View className="flex-row gap-2 pl-7">
              <View className="flex-1 gap-1">
                <AppText className="text-[10px] text-text-octonary-dark uppercase tracking-[0.7px]">
                  TP Limit
                </AppText>
                <View className="h-11 px-3 rounded-xl border border-border-primary-dark/70 bg-bg-quaternary-dark/80 justify-center">
                  <TextInput
                    value={takeProfitLimitPrice}
                    onChangeText={(value) => {
                      const parsed = parseDecimalInput(value);
                      if (parsed !== null) setTakeProfitLimitPrice(parsed);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    className="text-text-primary-dark font-mono"
                    editable={!isSubmitting}
                  />
                </View>
              </View>
              <View className="flex-1 gap-1">
                <AppText className="text-[10px] text-text-octonary-dark uppercase tracking-[0.7px]">
                  SL Limit
                </AppText>
                <View className="h-11 px-3 rounded-xl border border-border-primary-dark/70 bg-bg-quaternary-dark/80 justify-center">
                  <TextInput
                    value={stopLossLimitPrice}
                    onChangeText={(value) => {
                      const parsed = parseDecimalInput(value);
                      if (parsed !== null) setStopLossLimitPrice(parsed);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    className="text-text-primary-dark font-mono"
                    editable={!isSubmitting}
                  />
                </View>
              </View>
            </View>
          ) : null}
        </View>

        {!existingTpsl?.takeProfit || !existingTpsl?.stopLoss ? (
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={() => void handleConfirm()}
            isLoading={isSubmitting}
            isDisabled={
              isSubmitting ||
              (takeProfitPrice === undefined && stopLossPrice === undefined)
            }
            className={
              isSubmitting ||
              (takeProfitPrice === undefined && stopLossPrice === undefined)
                ? "h-11 rounded-xl bg-bg-quaternary-dark border border-border-primary-dark/60 items-center justify-center"
                : "h-11 rounded-xl bg-bg-senary-dark border border-[#78f39a]/45 items-center justify-center"
            }
          >
            <AppText
              className={
                isSubmitting ||
                (takeProfitPrice === undefined && stopLossPrice === undefined)
                  ? "text-[14px] font-semibold text-text-octonary-dark"
                  : "text-[14px] font-semibold text-black"
              }
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </AppText>
          </AppButton>
        ) : null}

        <AppText className="text-[11px] text-text-octonary-dark leading-5">
          TP/SL orders apply to the whole position by default and auto-cancel
          after position close. You can optionally configure size and limit trigger
          behavior.
        </AppText>
      </View>
    </AppModal>
  );
};

export default PositionTpslModal;
