import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { useOrderBookStore } from "@/store/order-book";
import { useTradeOrderDrawerStore } from "@/store/trade-order-drawer";
import React, { memo, useCallback, useMemo } from "react";
import { TextInput, View } from "react-native";

type Props = {
  isVisible: boolean;
};

const LimitPriceInput: React.FC<Props> = ({ isVisible }) => {
  const bids = useOrderBookStore((state) => state.bids);
  const asks = useOrderBookStore((state) => state.asks);
  const trades = useOrderBookStore((state) => state.trades);

  const limitOrderPrice = useTradeOrderDrawerStore((state) => state.limitOrderPrice);
  const setLimitOrderPrice = useTradeOrderDrawerStore(
    (state) => state.setLimitOrderPrice,
  );
  const szDecimals = useTradeOrderDrawerStore((state) => state.szDecimals);

  const handleLimitOrderPriceInput = useCallback(
    (value: string) => {
      if (value === "") {
        setLimitOrderPrice("");
        return;
      }

      // Allow only digits and a single decimal point.
      if (!/^\d*\.?\d*$/.test(value)) return;

      const hasDecimal = value.includes(".");
      const maxLength = hasDecimal ? 11 : 12;
      if (value.length > maxLength) return;

      setLimitOrderPrice(value);
    },
    [setLimitOrderPrice],
  );

  const formatPrice = useCallback((value: string, decimals: number | null) => {
    const parsedValue = Number.parseFloat(value);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) return "";
    const safeDecimals =
      typeof decimals === "number" && Number.isFinite(decimals)
        ? Math.max(0, decimals)
        : 2;
    return addDecimals(parsedValue, safeDecimals).toString();
  }, []);

  // Calculate mid price from orderbook store (bid + ask) / 2, fallback to trade price
  const midPrice = useMemo(() => {
    const currencyPrice =
      trades.length > 0 && Number.isFinite(trades[0]?.price) ? trades[0].price : 0;
    const bestBid = bids.length > 0 ? Number.parseFloat(bids[0]?.price ?? "0") : 0;
    const bestAsk = asks.length > 0 ? Number.parseFloat(asks[0]?.price ?? "0") : 0;

    if (bestBid > 0 && bestAsk > 0) {
      return (bestBid + bestAsk) / 2;
    }

    return currencyPrice > 0 ? currencyPrice : 0;
  }, [asks, bids, trades]);

  // Handle mid price click - set limit order price to mid price
  const handleMidPriceClick = useCallback(() => {
    if (midPrice <= 0) return;
    const formattedPrice = formatPrice(String(midPrice), szDecimals);
    if (formattedPrice) {
      setLimitOrderPrice(formattedPrice);
    }
  }, [formatPrice, midPrice, setLimitOrderPrice, szDecimals]);

  if (!isVisible) return null;

  return (
    <View className="gap-1">
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="text-[13px] leading-[16px] text-text-octonary-dark uppercase tracking-[0.8px]"
      >
        Price (USDC)
      </AppText>
      <View className="h-14 rounded-2xl border border-border-primary-dark/70 bg-bg-secondary-dark/95 px-3 flex-row items-center justify-between">
        <TextInput
          value={limitOrderPrice}
          onChangeText={handleLimitOrderPriceInput}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#64748b"
          className="flex-1 text-[22px] leading-[26px] font-semibold text-text-primary-dark pt-0 pb-0"
        />
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="h-7 min-w-[44px] px-2 rounded-lg border border-[#78f39a]/30 bg-[#1b3f33] items-center justify-center"
          onPress={handleMidPriceClick}
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] font-semibold text-[#86efac]"
          >
            Mid
          </AppText>
        </AppButton>
      </View>
    </View>
  );
};

export default memo(LimitPriceInput);
