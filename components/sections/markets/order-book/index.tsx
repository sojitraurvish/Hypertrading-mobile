import { AppButton } from "@/components/ui/app-button";
import { AppDropdown } from "@/components/ui/app-dropdown";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { useOrderBookStore } from "@/store/order-book";
import { Feather } from "@expo/vector-icons";
import type { ISubscription, L2BookParameters } from "@nktkas/hyperliquid";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, ScrollView, View } from "react-native";
import { OrderList } from "./OrderList";
import { SpreadIndicator } from "./SpreadIndicator";

type Props = {
  currency: string;
};

type PrecisionOption = {
  value: string;
  config: Pick<L2BookParameters, "nSigFigs" | "mantissa">;
};

const PRECISION_OPTIONS: PrecisionOption[] = [
  { value: "0.01", config: { nSigFigs: 5 } },
  { value: "0.02", config: { nSigFigs: 5, mantissa: 2 } },
  { value: "0.05", config: { nSigFigs: 5, mantissa: 5 } },
  { value: "0.1", config: { nSigFigs: 4 } },
  { value: "1", config: { nSigFigs: 3 } },
  { value: "10", config: { nSigFigs: 2 } },
];
const VISIBLE_ROWS = 9;
const ROW_VIEW_HEIGHT = 22;
const LIST_HEIGHT = VISIBLE_ROWS * ROW_VIEW_HEIGHT;

const ShimmerOrderRows: React.FC = () => {
  const shimmerOpacity = React.useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 0.65,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [shimmerOpacity]);

  return (
    <View>
      {Array.from({ length: VISIBLE_ROWS }).map((_, index) => (
        <View
          key={`shimmer-row-${index}`}
          className="flex-row items-center py-[3px] border-b border-border-primary-dark/10"
        >
          <View className="w-1/3 pr-[2px]">
            <Animated.View
              className="h-[11px] rounded-sm bg-bg-quaternary-dark"
              style={{
                opacity: shimmerOpacity,
                width: `${62 + ((index * 7) % 26)}%`,
              }}
            />
          </View>
          <View className="w-1/3 px-[2px] items-center">
            <Animated.View
              className="h-[11px] rounded-sm bg-bg-quaternary-dark"
              style={{
                opacity: shimmerOpacity,
                width: `${56 + ((index * 5) % 30)}%`,
              }}
            />
          </View>
          <View className="w-1/3 pl-[2px] items-end">
            <Animated.View
              className="h-[11px] rounded-sm bg-bg-quaternary-dark"
              style={{
                opacity: shimmerOpacity,
                width: `${60 + ((index * 9) % 24)}%`,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const ShimmerSpreadIndicator: React.FC = () => {
  const shimmerOpacity = React.useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 0.6,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerOpacity]);

  return (
    <View className="flex-row items-center px-2 py-2 border-y border-border-primary-dark/35 bg-bg-tertiary-dark mt-1">
      <View className="flex-1">
        <Animated.View
          className="h-[10px] rounded-sm bg-bg-quaternary-dark"
          style={{ opacity: shimmerOpacity, width: 56 }}
        />
      </View>
      <View className="flex-1 items-center">
        <Animated.View
          className="h-[10px] rounded-sm bg-bg-quaternary-dark"
          style={{ opacity: shimmerOpacity, width: 38 }}
        />
      </View>
      <View className="flex-1 items-end">
        <Animated.View
          className="h-[10px] rounded-sm bg-bg-quaternary-dark"
          style={{ opacity: shimmerOpacity, width: 38 }}
        />
      </View>
    </View>
  );
};

export const OrderBook: React.FC<Props> = ({ currency }) => {
  const formatTwoDecimals = (value: number) => addDecimals(value, 2).toFixed(2);
  const [activeTab, setActiveTab] = useState<"orderbook" | "trades">(
    "orderbook",
  );
  const [precision, setPrecision] = useState("0.02");
  const [displayCurrency, setDisplayCurrency] = useState(currency);
  const [hasReceivedOrderBookData, setHasReceivedOrderBookData] =
    useState(false);
  const subscriptionRef = useRef<ISubscription | null>(null);
  const tradesSubscriptionRef = useRef<ISubscription | null>(null);

  const {
    asks,
    bids,
    spread,
    spreadPercent,
    highlightedAskPrices,
    highlightedBidPrices,
    setAsks,
    setBids,
    setHighlightedAskPrices,
    setHighlightedBidPrices,
    setSpread,
    setSpreadPercent,
    trades,
    setTrades,
    getLiveOrderBook,
    getLiveTrades,
  } = useOrderBookStore();

  useEffect(() => {
    setDisplayCurrency(currency);
  }, [currency]);

  const selectedPrecision = useMemo(
    () => PRECISION_OPTIONS.find((item) => item.value === precision),
    [precision],
  );

  const allTotals = useMemo(
    () => [...asks, ...bids].map((item) => Number.parseFloat(item.total) || 0),
    [asks, bids],
  );
  const maxTotal = useMemo(() => Math.max(...allTotals, 1), [allTotals]);
  useEffect(() => {
    let isActive = true;
    setHasReceivedOrderBookData(false);

    setAsks([]);
    setBids([]);
    setHighlightedAskPrices(new Set());
    setHighlightedBidPrices(new Set());
    setSpread(null);
    setSpreadPercent(null);

    const subscribe = async () => {
      const nextSubscription = await getLiveOrderBook(
        currency,
        selectedPrecision?.config ?? PRECISION_OPTIONS[1].config,
        setAsks,
        setBids,
        setHighlightedAskPrices,
        setHighlightedBidPrices,
        setSpread,
        setSpreadPercent,
      );

      if (!isActive) {
        nextSubscription?.unsubscribe();
        return;
      }

      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = nextSubscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [
    currency,
    getLiveOrderBook,
    selectedPrecision,
    setAsks,
    setBids,
    setHighlightedAskPrices,
    setHighlightedBidPrices,
    setSpread,
    setSpreadPercent,
  ]);

  useEffect(() => {
    let isActive = true;
    tradesSubscriptionRef.current?.unsubscribe();
    tradesSubscriptionRef.current = null;
    setTrades([]);
    const safeSetTrades: typeof setTrades = (nextTrades) => {
      if (!isActive) {
        return;
      }
      setTrades(nextTrades);
    };

    const subscribe = async () => {
      const nextSubscription = await getLiveTrades(currency, safeSetTrades);

      if (!isActive) {
        nextSubscription?.unsubscribe();
        return;
      }

      tradesSubscriptionRef.current?.unsubscribe();
      tradesSubscriptionRef.current = nextSubscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      tradesSubscriptionRef.current?.unsubscribe();
      tradesSubscriptionRef.current = null;
    };
  }, [currency, getLiveTrades, setTrades]);

  useEffect(() => {
    if (asks.length > 0 || bids.length > 0) {
      setHasReceivedOrderBookData(true);
    }
  }, [asks.length, bids.length]);

  return (
    <View className="mx-1 mt-3 rounded-xl border border-border-primary-dark/20 bg-bg-secondary-dark overflow-hidden">
      <View className="px-1.5 pt-2 pb-1">
        <View className="flex-row rounded-lg bg-bg-tertiary-dark p-1">
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className={
              activeTab === "orderbook"
                ? "flex-1 py-1 rounded-md bg-bg-quaternary-dark"
                : "flex-1 py-1 rounded-md"
            }
            onPress={() => setActiveTab("orderbook")}
          >
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={
                activeTab === "orderbook"
                  ? "text-[10px] text-text-primary-dark text-center font-semibold"
                  : "text-[10px] text-text-tertiary-dark text-center font-semibold"
              }
            >
              Order Book
            </AppText>
          </AppButton>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className={
              activeTab === "trades"
                ? "flex-1 py-1 rounded-md bg-bg-quaternary-dark"
                : "flex-1 py-1 rounded-md"
            }
            onPress={() => setActiveTab("trades")}
          >
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={
                activeTab === "trades"
                  ? "text-[10px] text-text-primary-dark text-center font-semibold"
                  : "text-[10px] text-text-tertiary-dark text-center font-semibold"
              }
            >
              Trades
            </AppText>
          </AppButton>
        </View>
      </View>

      <View className="px-2 pb-2 flex-row items-center justify-between">
        <AppDropdown
          value={precision}
          options={PRECISION_OPTIONS.map((option) => ({
            label: option.value,
            value: option.value,
          }))}
          onChange={setPrecision}
        />
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="px-2 py-1 rounded-md bg-bg-tertiary-dark border border-border-primary-dark/20 flex-row items-center"
          onPress={() =>
            setDisplayCurrency((prev) => (prev === "USDC" ? currency : "USDC"))
          }
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[11px] text-text-primary-dark font-semibold uppercase mr-1"
          >
            {displayCurrency}
          </AppText>
          <Feather name="chevron-down" size={12} color="#6b7280" />
        </AppButton>
      </View>

      {activeTab === "orderbook" ? (
        <View className="px-1.5 py-1.5">
          <View className="flex-row">
            <View className="flex-1 border-r border-border-primary-dark/20 pr-1">
              <View className="flex-row pb-1.5 border-b border-border-primary-dark/25">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-1/3 text-[8px] text-text-octonary-dark uppercase"
                  numberOfLines={1}
                >
                  Price
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-1/3 text-[8px] text-text-octonary-dark uppercase text-center px-[2px]"
                  numberOfLines={1}
                >
                  Size ({displayCurrency})
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-1/3 text-[8px] text-text-octonary-dark uppercase text-right"
                  numberOfLines={1}
                >
                  Total ({displayCurrency})
                </AppText>
              </View>
              <ScrollView
                className="pt-1"
                style={{ height: LIST_HEIGHT }}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {hasReceivedOrderBookData ? (
                  <OrderList
                    orders={asks}
                    isAsk
                    maxTotal={maxTotal}
                    currency={displayCurrency}
                    highlightedPrices={highlightedAskPrices}
                  />
                ) : (
                  <ShimmerOrderRows />
                )}
              </ScrollView>
            </View>

            <View className="flex-1 pl-1">
              <View className="flex-row pb-1.5 border-b border-border-primary-dark/25">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-1/3 text-[8px] text-text-octonary-dark uppercase"
                  numberOfLines={1}
                >
                  Price
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-1/3 text-[8px] text-text-octonary-dark uppercase text-center px-[2px]"
                  numberOfLines={1}
                >
                  Size ({displayCurrency})
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-1/3 text-[8px] text-text-octonary-dark uppercase text-right"
                  numberOfLines={1}
                >
                  Total ({displayCurrency})
                </AppText>
              </View>
              <ScrollView
                className="pt-1"
                style={{ height: LIST_HEIGHT }}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {hasReceivedOrderBookData ? (
                  <OrderList
                    orders={bids}
                    isAsk={false}
                    maxTotal={maxTotal}
                    currency={displayCurrency}
                    highlightedPrices={highlightedBidPrices}
                  />
                ) : (
                  <ShimmerOrderRows />
                )}
              </ScrollView>
            </View>
          </View>

          {hasReceivedOrderBookData ? (
            <SpreadIndicator spread={spread} spreadPercent={spreadPercent} />
          ) : (
            <ShimmerSpreadIndicator />
          )}
        </View>
      ) : (
        <View className="px-1.5 py-1.5">
          <View className="flex-row pb-1.5 border-b border-border-primary-dark/25">
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="w-1/3 text-[8px] text-text-octonary-dark uppercase"
              numberOfLines={1}
            >
              Price
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="w-1/3 text-[8px] text-text-octonary-dark uppercase text-center px-[2px]"
              numberOfLines={1}
            >
              Size ({displayCurrency})
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="w-1/3 text-[8px] text-text-octonary-dark uppercase text-right pr-[2px]"
              numberOfLines={1}
            >
              Time
            </AppText>
          </View>
          <ScrollView
            className="pt-1"
            style={{ height: LIST_HEIGHT }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {trades.map((trade, index) => (
              <View
                key={`${trade.txnHash}-${trade.timestamp}-${trade.price}-${index}`}
                className="flex-row items-center py-[3px] border-b border-border-primary-dark/10"
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className={
                    trade.isBuy
                      ? "w-1/3 text-[10px] text-text-quaternary-dark font-semibold tabular-nums"
                      : "w-1/3 text-[10px] text-text-senary-dark font-semibold tabular-nums"
                  }
                  numberOfLines={1}
                >
                  {formatTwoDecimals(trade.price)}
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-1/3 text-[10px] text-text-tertiary-dark text-center tabular-nums px-[2px]"
                  numberOfLines={1}
                >
                  {formatTwoDecimals(trade.size)}
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-1/3 text-[10px] text-text-octonary-dark text-right tabular-nums pr-[2px]"
                  numberOfLines={1}
                >
                  {trade.time}
                </AppText>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
