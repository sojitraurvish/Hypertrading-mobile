import { AppButton } from "@/components/ui/app-button";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { useOrderBookStore } from "@/store/order-book";
import type { Position } from "@/types/bottom-pannel";
import React, { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import SizeSlider from "../trade-order-drawer/size-slider";

type LimitCloseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position | null;
  markPrice?: number;
  onConfirm: (price: string, percentage: number) => Promise<void>;
};

export const LimitCloseModal: React.FC<LimitCloseModalProps> = ({
  isOpen,
  onClose,
  position,
  markPrice,
  onConfirm,
}) => {
  const bids = useOrderBookStore((state) => state.bids);
  const asks = useOrderBookStore((state) => state.asks);
  const pos = position?.position;
  const [closePrice, setClosePrice] = useState("");
  const [closePercentage, setClosePercentage] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeCurrency, setSizeCurrency] = useState<"currency" | "USDC">(
    "currency",
  );

  const midPrice = useMemo(() => {
    const bestBid = Number.parseFloat(bids[0]?.price ?? "0");
    const bestAsk = Number.parseFloat(asks[0]?.price ?? "0");
    if (bestBid > 0 && bestAsk > 0) return (bestBid + bestAsk) / 2;

    if (Number.isFinite(markPrice) && (markPrice ?? 0) > 0) {
      return markPrice as number;
    }

    const posValue = Number.parseFloat(pos?.positionValue ?? "0");
    const posSize = Math.abs(Number.parseFloat(pos?.szi ?? "0"));
    return posSize > 0 ? posValue / posSize : 0;
  }, [asks, bids, markPrice, pos?.positionValue, pos?.szi]);

  const currentSize = useMemo(
    () => Math.abs(Number.parseFloat(pos?.szi ?? "0")),
    [pos?.szi],
  );
  const sizeDisplayDecimals = useMemo(() => {
    const fraction = (pos?.szi ?? "").split(".")[1] ?? "";
    const cleanedLength = fraction.replace(/0+$/, "").length;
    return Math.min(Math.max(cleanedLength, 2), 6);
  }, [pos?.szi]);
  const entryPrice = useMemo(
    () => Number.parseFloat(pos?.entryPx ?? "0"),
    [pos?.entryPx],
  );
  const closeSize = (currentSize * closePercentage) / 100;
  const closePriceNum = Number.parseFloat(closePrice);
  const formattedCloseSize = addDecimals(closeSize, sizeDisplayDecimals).toString();
  const closeSizeInUsdc = closeSize * (closePriceNum > 0 ? closePriceNum : midPrice);
  const formattedCloseSizeInUsdc = addDecimals(closeSizeInUsdc, 2).toString();
  const displaySize =
    sizeCurrency === "USDC" ? formattedCloseSizeInUsdc : formattedCloseSize;
  const displayCurrency = sizeCurrency === "USDC" ? "USDC" : (pos?.coin ?? "--");

  const estimatedPnl = useMemo(() => {
    if (!pos || closeSize <= 0 || closePriceNum <= 0) return 0;
    const isLong = Number.parseFloat(pos.szi) > 0;
    const pnlPerUnit = isLong
      ? closePriceNum - entryPrice
      : entryPrice - closePriceNum;
    return pnlPerUnit * closeSize;
  }, [closePriceNum, closeSize, entryPrice, pos]);

  useEffect(() => {
    if (!isOpen) return;
    setClosePercentage(100);
    setSizeCurrency("currency");
    if (midPrice > 0) {
      setClosePrice(addDecimals(midPrice, 2).toFixed(2));
    } else {
      setClosePrice("");
    }
  }, [isOpen, midPrice]);

  const handlePriceChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setClosePrice(value);
    }
  };

  const handleConfirm = async () => {
    if (!pos) return;
    if (!closePrice || closePriceNum <= 0) {
      return;
    }
    if (closeSize <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(closePrice, closePercentage);
    } catch (error) {
      console.error("Error confirming limit close:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Limit Close"
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick
      showCloseButton
      contentClassName="gap-4"
    >
      <View className="gap-4">
        <AppText className="text-[11px] text-text-octonary-dark">
          Close {pos?.coin ?? "--"} with a reduce-only limit order.
        </AppText>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
              Price (USDC)
            </AppText>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() => {
                if (midPrice > 0) {
                  setClosePrice(addDecimals(midPrice, 2).toFixed(2));
                }
              }}
              className="px-0 py-0"
              isDisabled={isSubmitting || midPrice <= 0}
            >
              <AppText className="text-[12px] font-semibold text-text-quaternary-dark">
                Mid: {midPrice > 0 ? addDecimals(midPrice, 2).toFixed(2) : "--"}
              </AppText>
            </AppButton>
          </View>
          <View className="h-12 px-3 rounded-xl border border-border-primary-dark/20 bg-bg-quaternary-dark/80 flex-row items-center">
            <TextInput
              value={closePrice}
              onChangeText={handlePriceChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#4b5563"
              className="flex-1 text-text-primary-dark font-mono"
              editable={!isSubmitting}
            />
            <AppText className="text-[12px] text-text-octonary-dark font-semibold">
              USDC
            </AppText>
          </View>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
              Size
            </AppText>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() =>
                setSizeCurrency((prev) =>
                  prev === "USDC" ? "currency" : "USDC",
                )
              }
              className="px-0 py-0"
              isDisabled={isSubmitting}
            >
              <AppText className="text-[12px] font-semibold text-text-quaternary-dark">
                Show in {sizeCurrency === "USDC" ? (pos?.coin ?? "--") : "USDC"}
              </AppText>
            </AppButton>
          </View>
          <View className="h-12 px-3 rounded-xl border border-border-primary-dark/20 bg-bg-quaternary-dark/80 flex-row items-center justify-between">
            <AppText className="text-[15px] text-text-primary-dark font-mono">
              {displaySize}
            </AppText>
            <AppText className="text-[12px] text-text-octonary-dark font-semibold">
              {displayCurrency}
            </AppText>
          </View>
        </View>

        <View className="gap-2">
          <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
            Position Size
          </AppText>
          <SizeSlider
            value={closePercentage}
            onChange={setClosePercentage}
            disabled={isSubmitting}
          />
          <View className="flex-row items-center gap-2">
            {[25, 50, 75, 100].map((value) => (
              <AppButton
                key={value}
                variant={VARIANT_TYPES.NOT_SELECTED}
                onPress={() => setClosePercentage(value)}
                className={
                  closePercentage === value
                    ? "flex-1 h-8 rounded-lg bg-bg-senary-dark border border-[#4ade80]/30 items-center justify-center"
                    : "flex-1 h-8 rounded-lg bg-bg-tertiary-dark border border-border-primary-dark/20 items-center justify-center"
                }
                isDisabled={isSubmitting}
              >
                <AppText
                  className={
                    closePercentage === value
                      ? "text-[11px] font-semibold text-black"
                      : "text-[11px] font-semibold text-text-secondary-dark"
                  }
                >
                  {value}%
                </AppText>
              </AppButton>
            ))}
          </View>
        </View>

        <View className="p-3 rounded-xl bg-bg-quaternary-dark/80 border border-border-primary-dark/20">
          <View className="flex-row items-center justify-between">
            <AppText className="text-[11px] text-text-octonary-dark">
              Est. Closed PnL
            </AppText>
            <AppText
              className={
                estimatedPnl >= 0
                  ? "text-[13px] font-semibold text-[#86efac]"
                  : "text-[13px] font-semibold text-[#f87171]"
              }
            >
              {estimatedPnl >= 0 ? "+" : "-"}$
              {addDecimals(Math.abs(estimatedPnl), 2).toFixed(2)}
            </AppText>
          </View>
        </View>

        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={() => void handleConfirm()}
          isLoading={isSubmitting}
          isDisabled={isSubmitting || closePriceNum <= 0 || closeSize <= 0 || !pos}
          className={
            isSubmitting || closePriceNum <= 0 || closeSize <= 0 || !pos
              ? "h-11 rounded-xl bg-bg-quaternary-dark border border-border-primary-dark/20 items-center justify-center"
              : "h-11 rounded-xl bg-bg-senary-dark border border-[#4ade80]/30 items-center justify-center"
          }
        >
          <AppText
            className={
              isSubmitting || closePriceNum <= 0 || closeSize <= 0 || !pos
                ? "text-[14px] font-semibold text-text-octonary-dark"
                : "text-[14px] font-semibold text-black"
            }
          >
            {isSubmitting ? "Confirming..." : "Confirm"}
          </AppText>
        </AppButton>
      </View>
    </AppModal>
  );
};

export default LimitCloseModal;
