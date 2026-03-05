import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { cn } from "@/lib/utils/tailwind-configs";
import type { OrderBookData } from "@/store/order-book";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

type OrderRowProps = {
  order: OrderBookData;
  isAsk: boolean;
  maxTotal: number;
  currency: string;
  isHighlighted?: boolean;
  isUserOrder?: boolean;
  compact?: boolean;
};

export const OrderRow: React.FC<OrderRowProps> = ({
  order,
  isAsk,
  maxTotal,
  currency,
  isHighlighted = false,
  isUserOrder = false,
}) => {
  const priceNum = Number.parseFloat(order.price) || 0;
  const sizeNum = Number.parseFloat(order.size) || 0;
  const totalNum = Number.parseFloat(order.total) || 0;
  const displaySize = currency === "USDC" ? sizeNum * priceNum : sizeNum;
  const displayTotal = currency === "USDC" ? totalNum * priceNum : totalNum;
  const formatTwoDecimals = (value: number) => addDecimals(value, 2).toFixed(2);
  const barWidth = Math.min((totalNum / Math.max(maxTotal, 1)) * 100, 100);
  const animatedBarWidth = useRef(new Animated.Value(barWidth)).current;
  const highlightOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedBarWidth, {
      toValue: barWidth,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedBarWidth, barWidth]);

  useEffect(() => {
    if (!isHighlighted) return;

    highlightOpacity.setValue(1);
    Animated.timing(highlightOpacity, {
      toValue: 0,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [highlightOpacity, isHighlighted, order.size, order.total]);

  return (
    <View
      className={cn(
        "relative flex-row items-center px-2 py-[3px] border-b border-border-primary-dark/10 overflow-hidden",
        isUserOrder && "border-l-2 border-l-[#facc15] bg-[#facc15]/[0.06]",
      )}
    >
      <Animated.View
        className={
          isAsk
            ? "absolute inset-y-0 left-0 bg-red-500/10"
            : "absolute inset-y-0 left-0 bg-bg-senary-dark/15"
        }
        style={{
          width: animatedBarWidth.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
      {isHighlighted ? (
        <Animated.View
          className={
            isAsk
              ? "absolute inset-0 bg-red-500/25"
              : "absolute inset-0 bg-bg-senary-dark/25"
          }
          style={{ opacity: highlightOpacity }}
        />
      ) : null}
      {isUserOrder ? (
        <View className="absolute right-1.5 top-1 rounded-sm border border-[#facc15]/60 bg-[#facc15]/10 px-1">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[8px] leading-[10px] font-bold text-[#facc15]"
          >
            OPEN
          </AppText>
        </View>
      ) : null}
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className={
          isAsk
            ? "w-1/3 text-[10px] text-text-senary-dark font-semibold tabular-nums"
            : "w-1/3 text-[10px] text-text-quaternary-dark font-semibold tabular-nums"
        }
        numberOfLines={1}
      >
        {formatTwoDecimals(priceNum)}
      </AppText>
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="w-1/3 text-[10px] text-text-tertiary-dark text-center tabular-nums px-[2px]"
        numberOfLines={1}
      >
        {formatTwoDecimals(displaySize)}
      </AppText>
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="w-1/3 text-[10px] text-text-tertiary-dark text-right tabular-nums"
        numberOfLines={1}
      >
        {formatTwoDecimals(displayTotal)}
      </AppText>
    </View>
  );
};
