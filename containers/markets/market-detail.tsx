import { MarketChart } from "@/components/sections/markets/market-chart";
import { OrderBook } from "@/components/sections/markets/order-book";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { BottomPannel } from "@/containers/markets/bottom-pannel";
import { getCoinIconUrls } from "@/lib/config";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { useMarketStore } from "@/store/markets";
import { useTradeOrderDrawerStore } from "@/store/trade-order-drawer";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";

type Props = {
  coin: string;
  pair: string;
  onBack?: () => void;
};

const MemoizedMarketChart = React.memo(function MemoizedMarketChart({
  coin,
}: {
  coin: string;
}) {
  return (
    <View className="mt-2">
      <MarketChart currency={coin} />
    </View>
  );
});

const MemoizedOrderBook = React.memo(function MemoizedOrderBook({
  coin,
}: {
  coin: string;
}) {
  return <OrderBook currency={coin} />;
});

export const MarketDetailContainer: React.FC<Props> = ({
  coin,
  pair,
  onBack,
}) => {
  const market = useMarketStore((state) => state.markets.get(`${coin}-USDC`));
  const favoriteSymbols = useMarketStore((state) => state.favoriteSymbols);
  const addToFavorite = useMarketStore((state) => state.addToFavorite);
  const removeFromFavorite = useMarketStore(
    (state) => state.removeFromFavorite,
  );

  const [symbolIconIndex, setSymbolIconIndex] = useState(0);
  const [showSymbolFallback, setShowSymbolFallback] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const isTradeDrawerOpen = useTradeOrderDrawerStore((state) => state.isOpen);
  const openTradeOrderDrawer = useTradeOrderDrawerStore(
    (state) => state.openTradeOrderDrawer,
  );
  const dragStartOffsetYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const lastSwipeOpenTimeRef = useRef(0);
  const favoriteSymbol = pair;
  const isFavoriteInStore = favoriteSymbols.includes(favoriteSymbol);
  const [optimisticFavorite, setOptimisticFavorite] =
    useState(isFavoriteInStore);
  const symbolIconUris = useMemo(() => getCoinIconUrls(coin), [coin]);
  const symbolIconUri = symbolIconUris[symbolIconIndex] ?? "";
  const lastPrice = market?.lastPrice ?? null;
  const signedChangeText =
    market?.change24hPer != null
      ? `${market.change24hPer >= 0 ? "+" : ""}${market.change24hPer.toFixed(2)}%`
      : "—";
  const headerPrice =
    lastPrice == null
      ? "—"
      : `$${lastPrice.toLocaleString("en-US", {
          maximumFractionDigits: lastPrice >= 1000 ? 0 : 2,
        })}`;
  const leverageText = market?.leverage ?? "—";
  const fundingText =
    market?.fundingPer != null
      ? `${market.fundingPer >= 0 ? "+" : ""}${market.fundingPer.toFixed(4)}%`
      : "—";
  const formatCompactUsd = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value)) return "—";
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: value >= 1000 ? 0 : 2 })}`;
  };
  const formatCompactValue = (
    value: number | null | undefined,
    withDollar = false,
  ) => {
    if (value == null || !Number.isFinite(value)) return "—";
    const formatted = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
    return withDollar ? `$${formatted}` : formatted;
  };

  useEffect(() => {
    setSymbolIconIndex(0);
    setShowSymbolFallback(false);
  }, [coin, symbolIconUris.length]);

  useEffect(() => {
    setOptimisticFavorite(isFavoriteInStore);
  }, [isFavoriteInStore]);

  const handleSymbolIconError = () => {
    if (symbolIconIndex < symbolIconUris.length - 1) {
      setSymbolIconIndex((prev) => prev + 1);
      return;
    }
    setShowSymbolFallback(true);
  };

  const handleFavoriteToggle = useCallback(() => {
    const nextIsFavorite = !optimisticFavorite;
    setOptimisticFavorite(nextIsFavorite);
    requestAnimationFrame(() => {
      if (nextIsFavorite) {
        addToFavorite(favoriteSymbol);
      } else {
        removeFromFavorite(favoriteSymbol);
      }
    });
  }, [addToFavorite, favoriteSymbol, optimisticFavorite, removeFromFavorite]);

  const openTradeDrawer = useCallback((side: "long" | "short") => {
    openTradeOrderDrawer({ side });
  }, [openTradeOrderDrawer]);
  const handleScrollBeginDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragStartOffsetYRef.current = event.nativeEvent.contentOffset.y;
      dragStartTimeRef.current = Date.now();
    },
    [],
  );
  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isTradeDrawerOpen) return;

      const endOffsetY = event.nativeEvent.contentOffset.y;
      const deltaY = endOffsetY - dragStartOffsetYRef.current;
      const elapsedMs = Date.now() - dragStartTimeRef.current;
      const velocityY = event.nativeEvent.velocity?.y ?? 0;

      // Open only on an intentional quick, long upward swipe.
      const isIntentionalOpenGesture =
        deltaY > 120 && elapsedMs < 280 && velocityY > 1.15;
      const isInCooldown = Date.now() - lastSwipeOpenTimeRef.current < 500;
      if (isIntentionalOpenGesture && !isInCooldown) {
        lastSwipeOpenTimeRef.current = Date.now();
        openTradeDrawer("long");
      }
    },
    [isTradeDrawerOpen, openTradeDrawer],
  );

  return (
    <View className="flex-1 bg-bg-primary-dark">
      <View className="mx-2 rounded-xl border border-border-primary-dark/30 bg-bg-secondary-dark overflow-hidden z-20">
        <View
          className={cn(
            "px-3 py-2 flex-row items-center justify-between",
            isStatsExpanded ? "border-b border-border-primary-dark/30" : "",
          )}
        >
          <View className="flex-1 min-w-0 flex-row items-center">
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="w-7 h-7 items-center justify-center mr-1"
              onPress={onBack}
            >
              <Feather name="arrow-left" size={14} color="#6b7280" />
            </AppButton>
            <View className="w-5 h-5 rounded-full bg-[#f7931a] overflow-hidden items-center justify-center mr-1.5">
              {!showSymbolFallback && symbolIconUri ? (
                <Image
                  source={{ uri: symbolIconUri }}
                  style={{ width: 18, height: 18 }}
                  onError={handleSymbolIconError}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[8px] text-black font-bold"
                >
                  {(coin[0] ?? "C").toUpperCase()}
                </AppText>
              )}
            </View>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[16px] text-text-primary-dark font-bold uppercase"
              numberOfLines={1}
            >
              {pair}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[10px] text-accent-green font-semibold ml-1.5 px-1.5 py-[2px] rounded bg-accent-green/10 uppercase"
            >
              {leverageText}
            </AppText>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="w-7 h-7 items-center justify-center ml-1"
              onPress={handleFavoriteToggle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={optimisticFavorite ? "star" : "star-outline"}
                size={14}
                color={optimisticFavorite ? "#4ade80" : "#6b7280"}
              />
            </AppButton>
          </View>

          <View className="flex-row items-center ml-2">
            <View className="items-end mr-2">
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[18px] leading-[20px] font-extrabold text-text-primary-dark"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {headerPrice}
              </AppText>
              <View
                className={cn(
                  "mt-1 px-1.5 py-[1px] rounded",
                  (market?.change24hPer ?? 0) >= 0
                    ? "bg-accent-green/10"
                    : "bg-accent-red/10",
                )}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className={cn(
                    "text-[10px] font-semibold",
                    (market?.change24hPer ?? 0) >= 0
                      ? "text-accent-green"
                      : "text-accent-red",
                  )}
                >
                  {signedChangeText}
                </AppText>
              </View>
            </View>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="w-6 h-6 items-center justify-center"
              onPress={() => setIsStatsExpanded((prev) => !prev)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name={isStatsExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color="#6b7280"
              />
            </AppButton>
          </View>
        </View>

        {isStatsExpanded ? (
          <View className="px-3 py-2">
            <View className="flex-row border-b border-border-primary-dark/30 pb-2">
              <View className="flex-1 pr-2">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[9px] text-text-octonary-dark uppercase"
                >
                  Mark
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[15px] text-text-primary-dark font-bold mt-1"
                >
                  {formatCompactUsd(market?.mark)}
                </AppText>
              </View>
              <View className="flex-1 px-2 border-l border-border-primary-dark/30">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[9px] text-text-octonary-dark uppercase"
                >
                  Oracle
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[15px] text-text-primary-dark font-bold mt-1"
                >
                  {formatCompactUsd(market?.oracle)}
                </AppText>
              </View>
              <View className="flex-1 pl-2 border-l border-border-primary-dark/30 items-end">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[9px] text-text-octonary-dark uppercase"
                >
                  24h Volume
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[15px] text-text-primary-dark font-bold mt-1 text-right"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {formatCompactValue(market?.volume24h, true)}
                </AppText>
              </View>
            </View>

            <View className="flex-row pt-2">
              <View className="flex-1 pr-2">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[9px] text-text-octonary-dark uppercase"
                >
                  Open Interest
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[15px] text-text-primary-dark font-bold mt-1"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {formatCompactValue(market?.openInterest, true)}
                </AppText>
              </View>
              <View className="flex-1 pl-2 border-l border-border-primary-dark/30 items-end">
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[9px] text-text-octonary-dark uppercase"
                >
                  Funding / Countdown
                </AppText>
                <View className="flex-row items-center mt-1">
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className={cn(
                      "text-[14px] font-bold",
                      (market?.fundingPer ?? 0) >= 0
                        ? "text-text-quaternary-dark"
                        : "text-text-senary-dark",
                    )}
                  >
                    {fundingText}
                  </AppText>
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-[14px] text-text-primary-dark font-bold ml-2"
                  >
                    {market?.countdown ?? "--:--:--"}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView
        className="flex-1"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
        contentContainerClassName="pb-16"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
      >
        <MemoizedMarketChart coin={coin} />
        <MemoizedOrderBook coin={coin} />
        <BottomPannel coin={coin} mode="header" enableDataSync={false} />
        <BottomPannel coin={coin} mode="content" />
      </ScrollView>

      <View className="px-3 py-2 border-t border-border-primary-dark/30 bg-bg-secondary-dark">
        <View className="rounded-2xl border border-border-primary-dark/30 bg-bg-primary-dark p-1.5 flex-row items-center overflow-hidden">
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="flex-1 h-[42px] rounded-xl bg-accent-green border border-accent-green/30 flex-row items-center justify-center gap-1"
            onPress={() => openTradeDrawer("long")}
          >
            <Feather name="trending-up" size={13} color="#000000" />
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-black text-[12px] font-extrabold tracking-[1.2px]"
            >
              LONG
            </AppText>
          </AppButton>
          <View className="w-px h-6 bg-border-primary-dark/30 mx-1.5" />
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="flex-1 h-[42px] rounded-xl bg-accent-red border border-accent-red/30 flex-row items-center justify-center gap-1"
            onPress={() => openTradeDrawer("short")}
          >
            <Feather name="trending-down" size={13} color="#ffffff" />
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-white text-[12px] font-extrabold tracking-[1.2px]"
            >
              SHORT
            </AppText>
          </AppButton>
        </View>
      </View>

    </View>
  );
};

export default MarketDetailContainer;
