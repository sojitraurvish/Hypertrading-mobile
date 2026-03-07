import { AllocationCard } from "@/components/sections/home-v2/allocation-card";
import { ExecutionQualityCard } from "@/components/sections/home-v2/execution-quality-card";
import { FundingCarryCard } from "@/components/sections/home-v2/funding-carry-card";
import { HeroBanner } from "@/components/sections/home-v2/hero-banner";
import { IntelligenceFeed } from "@/components/sections/home-v2/intelligence-feed";
import { HomeLoadingState } from "@/components/sections/home-v2/loading-state";
import { MarketStructureCard } from "@/components/sections/home-v2/market-structure-card";
import { MoversCarousel } from "@/components/sections/home-v2/movers-carousel";
import { PerformanceCard } from "@/components/sections/home-v2/performance-card";
import { RiskSnapshotCard } from "@/components/sections/home-v2/risk-snapshot-card";
import { StatCardsRow } from "@/components/sections/home-v2/stat-cards-row";
import { WatchlistCard } from "@/components/sections/home-v2/watchlist-card";
import { HOME_V2_COLORS } from "@/components/sections/home-v2/theme";
import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { formatSignedPercent, formatSignedUsd, formatUsd } from "@/lib/home/formatters";
import {
  buildAllocation,
  buildExecutionQuality,
  buildFundingCarry,
  buildIntelligenceFeed,
  buildMarketStructure,
  buildMovers,
  buildPortfolioMetrics,
  buildRiskSnapshot,
  buildWatchlist,
} from "@/lib/home/metrics";
import { useBottomPannelStore } from "@/store/bottom-pannel";
import { useMarketStore } from "@/store/markets";
import type {
  Balance,
  FundingHistory,
  HistoricalOrder,
  OpenOrder,
  Position,
  TradeHistory,
} from "@/types/bottom-pannel";
import type { HomeStatCard, HomeTimeframe } from "@/types/home";
import type { MarketItem, PerpetualMarket } from "@/types/markets";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useAccount } from "@reown/appkit-react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, View, useWindowDimensions } from "react-native";

function mapMarketToItem(market: PerpetualMarket): MarketItem {
  const formatUsdValue = (value: number | null): string => {
    if (value == null || Number.isNaN(value)) return "—";
    return `$${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: value >= 1000 ? 0 : 3,
    }).format(value)}`;
  };
  const formatSigned = (value: number | null, digits = 2): string => {
    if (value == null || Number.isNaN(value)) return "—";
    return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
  };
  const formatSignedPct = (value: number | null, digits = 2): string => {
    if (value == null || Number.isNaN(value)) return "—";
    return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
  };

  return {
    symbol: market.coin,
    pair: market.symbol,
    iconLabel: market.coin[0] ?? "?",
    iconBgColor: "bg-bg-octonary-dark",
    price: formatUsdValue(market.lastPrice),
    priceChange: formatSigned(market.change24h, 2),
    changePercent: formatSignedPct(market.change24hPer, 2),
    isPositive: (market.change24hPer ?? 0) >= 0,
    leverage: market.leverage ?? "—",
    mark: formatUsdValue(market.mark),
    oracle: formatUsdValue(market.oracle),
    fundingPer: market.fundingPer,
    fundingDisplay: market.fundingDisplay ?? "—",
    funding8hour: market.funding8hour,
    funding8hourDisplay: formatSignedPct(market.funding8hour, 4),
    fundingCountdown: market.countdown ?? "—",
    volume: formatUsdValue(market.volume),
    volume24h: formatUsdValue(market.volume24h),
    openInterest: formatUsdValue(market.openInterest),
    isFavorite: market.isFavorite,
  };
}

export const HomeV2Container: React.FC = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [selectedTimeframe, setSelectedTimeframe] = useState<HomeTimeframe>("1M");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const markets = useMarketStore((state) => state.markets);
  const favoriteSymbols = useMarketStore((state) => state.favoriteSymbols);
  const fetchMarkets = useMarketStore((state) => state.fetchMarkets);
  const setMarkets = useMarketStore((state) => state.setMarkets);
  const getLiveMarketUpdates = useMarketStore((state) => state.getLiveMarketUpdates);
  const setSelectedMarket = useMarketStore((state) => state.setSelectedMarket);

  const balances = useBottomPannelStore((state) => state.balances);
  const userPositions = useBottomPannelStore((state) => state.userPositions);
  const userOpenOrders = useBottomPannelStore((state) => state.userOpenOrders);
  const tradeHistory = useBottomPannelStore((state) => state.tradeHistory);
  const userFundings = useBottomPannelStore((state) => state.userFundings);
  const historicalOrders = useBottomPannelStore((state) => state.historicalOrders);
  const setBalances = useBottomPannelStore((state) => state.setBalances);
  const setUserPositions = useBottomPannelStore((state) => state.setUserPositions);
  const setOpenOrders = useBottomPannelStore((state) => state.setOpenOrders);
  const setTradeHistory = useBottomPannelStore((state) => state.setTradeHistory);
  const setUserFundings = useBottomPannelStore((state) => state.setUserFundings);
  const setHistoricalOrders = useBottomPannelStore(
    (state) => state.setHistoricalOrders,
  );
  const getAllBalances = useBottomPannelStore((state) => state.getAllBalances);
  const getUserPositions = useBottomPannelStore((state) => state.getUserPositions);
  const getUserOpenOrders = useBottomPannelStore((state) => state.getUserOpenOrders);
  const getUserTradeHistory = useBottomPannelStore((state) => state.getUserTradeHistory);
  const getUserFundings = useBottomPannelStore((state) => state.getUserFundings);
  const getHistoricalOrders = useBottomPannelStore((state) => state.getHistoricalOrders);
  const getLiveBalances = useBottomPannelStore((state) => state.getLiveBalances);
  const getLiveUserPositions = useBottomPannelStore((state) => state.getLiveUserPositions);
  const getLiveUserOpenOrders = useBottomPannelStore(
    (state) => state.getLiveUserOpenOrders,
  );
  const getLiveUserTradeHistory = useBottomPannelStore(
    (state) => state.getLiveUserTradeHistory,
  );
  const getLiveUserFundings = useBottomPannelStore((state) => state.getLiveUserFundings);
  const getLiveHistoricalOrders = useBottomPannelStore(
    (state) => state.getLiveHistoricalOrders,
  );

  const marketSubRef = useRef<ISubscription | null>(null);
  const balancesSubRef = useRef<ISubscription | null>(null);
  const positionsSubRef = useRef<ISubscription | null>(null);
  const openOrdersSubRef = useRef<ISubscription | null>(null);
  const tradesSubRef = useRef<ISubscription | null>(null);
  const fundingsSubRef = useRef<ISubscription | null>(null);
  const orderHistorySubRef = useRef<ISubscription | null>(null);

  const loadDashboardData = useCallback(
    async (withRefreshLoader = false) => {
      if (withRefreshLoader) setIsRefreshing(true);
      try {
        const marketSnapshot = await fetchMarkets();
        setMarkets(marketSnapshot);

        if (address?.startsWith("0x")) {
          const [
            loadedBalances,
            loadedPositions,
            loadedOpenOrders,
            loadedTrades,
            loadedFundings,
            loadedHistoricalOrders,
          ] = await Promise.all([
            getAllBalances({ publicKey: address as `0x${string}` }),
            getUserPositions({ publicKey: address as `0x${string}` }),
            getUserOpenOrders({ publicKey: address as `0x${string}` }),
            getUserTradeHistory({ publicKey: address as `0x${string}` }),
            getUserFundings({ publicKey: address as `0x${string}` }),
            getHistoricalOrders({ publicKey: address as `0x${string}` }),
          ]);
          setBalances(loadedBalances as Balance[]);
          setUserPositions(loadedPositions as Position[]);
          setOpenOrders(loadedOpenOrders as OpenOrder[]);
          setTradeHistory(loadedTrades as TradeHistory[]);
          setUserFundings(loadedFundings as FundingHistory[]);
          setHistoricalOrders(loadedHistoricalOrders as HistoricalOrder[]);
        }
      } finally {
        setIsBootstrapping(false);
        if (withRefreshLoader) setIsRefreshing(false);
      }
    },
    [
      address,
      fetchMarkets,
      getAllBalances,
      getHistoricalOrders,
      getUserFundings,
      getUserOpenOrders,
      getUserPositions,
      getUserTradeHistory,
      setBalances,
      setHistoricalOrders,
      setMarkets,
      setOpenOrders,
      setTradeHistory,
      setUserFundings,
      setUserPositions,
    ],
  );

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    let active = true;
    void (async () => {
      marketSubRef.current?.unsubscribe();
      const sub = await getLiveMarketUpdates(setMarkets);
      if (!active) {
        sub?.unsubscribe();
        return;
      }
      marketSubRef.current = sub;
    })();

    return () => {
      active = false;
      marketSubRef.current?.unsubscribe();
      marketSubRef.current = null;
    };
  }, [getLiveMarketUpdates, setMarkets]);

  useEffect(() => {
    if (!address || !address.startsWith("0x")) return;
    let active = true;
    void (async () => {
      balancesSubRef.current?.unsubscribe();
      positionsSubRef.current?.unsubscribe();
      openOrdersSubRef.current?.unsubscribe();
      tradesSubRef.current?.unsubscribe();
      fundingsSubRef.current?.unsubscribe();
      orderHistorySubRef.current?.unsubscribe();

      const [
        balanceSub,
        positionSub,
        openOrdersSub,
        tradeSub,
        fundingSub,
        orderHistorySub,
      ] = await Promise.all([
        getLiveBalances(address as `0x${string}`, setBalances),
        getLiveUserPositions(address as `0x${string}`, setUserPositions),
        getLiveUserOpenOrders(address as `0x${string}`, setOpenOrders),
        getLiveUserTradeHistory(address as `0x${string}`, setTradeHistory),
        getLiveUserFundings(address as `0x${string}`, setUserFundings),
        getLiveHistoricalOrders(address as `0x${string}`, setHistoricalOrders),
      ]);
      if (!active) {
        balanceSub?.unsubscribe();
        positionSub?.unsubscribe();
        openOrdersSub?.unsubscribe();
        tradeSub?.unsubscribe();
        fundingSub?.unsubscribe();
        orderHistorySub?.unsubscribe();
        return;
      }
      balancesSubRef.current = balanceSub;
      positionsSubRef.current = positionSub;
      openOrdersSubRef.current = openOrdersSub;
      tradesSubRef.current = tradeSub;
      fundingsSubRef.current = fundingSub;
      orderHistorySubRef.current = orderHistorySub;
    })();

    return () => {
      active = false;
      balancesSubRef.current?.unsubscribe();
      positionsSubRef.current?.unsubscribe();
      openOrdersSubRef.current?.unsubscribe();
      tradesSubRef.current?.unsubscribe();
      fundingsSubRef.current?.unsubscribe();
      orderHistorySubRef.current?.unsubscribe();
      balancesSubRef.current = null;
      positionsSubRef.current = null;
      openOrdersSubRef.current = null;
      tradesSubRef.current = null;
      fundingsSubRef.current = null;
      orderHistorySubRef.current = null;
    };
  }, [
    address,
    getLiveBalances,
    getLiveHistoricalOrders,
    getLiveUserFundings,
    getLiveUserOpenOrders,
    getLiveUserPositions,
    getLiveUserTradeHistory,
    setBalances,
    setHistoricalOrders,
    setOpenOrders,
    setTradeHistory,
    setUserFundings,
    setUserPositions,
  ]);

  const portfolio = useMemo(
    () => buildPortfolioMetrics(balances, userPositions, tradeHistory, selectedTimeframe),
    [balances, selectedTimeframe, tradeHistory, userPositions],
  );
  const { gainers, losers } = useMemo(() => buildMovers(markets), [markets]);
  const watchlistItems = useMemo(
    () => buildWatchlist(markets, favoriteSymbols),
    [favoriteSymbols, markets],
  );
  const allocation = useMemo(
    () => buildAllocation(balances, userPositions),
    [balances, userPositions],
  );
  const riskSnapshot = useMemo(
    () => buildRiskSnapshot(userPositions, markets),
    [markets, userPositions],
  );
  const executionQuality = useMemo(
    () => buildExecutionQuality(userOpenOrders, historicalOrders, tradeHistory),
    [historicalOrders, tradeHistory, userOpenOrders],
  );
  const fundingCarry = useMemo(
    () => buildFundingCarry(userPositions, userFundings, markets),
    [markets, userFundings, userPositions],
  );
  const marketStructure = useMemo(
    () => buildMarketStructure(markets),
    [markets],
  );
  const intelligenceItems = useMemo(
    () => buildIntelligenceFeed(tradeHistory, userFundings, historicalOrders, markets),
    [historicalOrders, markets, tradeHistory, userFundings],
  );

  const statCards: HomeStatCard[] = useMemo(
    () => [
      {
        id: "capital",
        label: "LIQUID CAPITAL",
        value: formatUsd(portfolio.totalBalanceUsd, 2),
        tone: portfolio.totalBalanceUsd > 0 ? "positive" : "neutral",
      },
      {
        id: "sessionPnl",
        label: "SESSION PNL",
        value: formatSignedUsd(portfolio.sessionPnl),
        changeLabel: `${selectedTimeframe} frame`,
        tone:
          portfolio.sessionPnl > 0
            ? "positive"
            : portfolio.sessionPnl < 0
              ? "negative"
              : "neutral",
      },
    ],
    [portfolio.sessionPnl, portfolio.totalBalanceUsd, selectedTimeframe],
  );

  const handleNavigateToMarket = useCallback(
    (symbol: string) => {
      const market = Array.from(markets.values()).find((item) => item.coin === symbol);
      if (market) {
        setSelectedMarket(mapMarketToItem(market));
      }
      router.push("/(tabs)/markets");
    },
    [markets, router, setSelectedMarket],
  );

  const isDashboardEmpty = markets.size === 0 && !isBootstrapping;

  return (
    <View className="flex-1 bg-bg-primary-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadDashboardData(true)}
            tintColor={HOME_V2_COLORS.accent}
          />
        }
        contentContainerClassName="pb-10"
      >
        <HeroBanner
          compact={compact}
          onPressNotifications={() => router.push("/(tabs)/profile")}
        />

        {isBootstrapping ? <HomeLoadingState /> : null}

        {!isBootstrapping ? (
          <>
            <PerformanceCard
              compact={compact}
              selectedTimeframe={selectedTimeframe}
              onChangeTimeframe={setSelectedTimeframe}
              performanceValue={formatSignedPercent(portfolio.performancePercent, 1)}
              performanceLabel={`${selectedTimeframe} PNL ${formatSignedUsd(
                portfolio.sessionPnl,
              )}`}
            />

            <StatCardsRow compact={compact} cards={statCards} />

            {gainers.length > 0 ? (
              <MoversCarousel
                compact={compact}
                title="Top Gainers"
                items={gainers}
                onPressItem={handleNavigateToMarket}
                onPressSeeAll={() => router.push("/(tabs)/markets")}
              />
            ) : null}

            {allocation.length > 0 ? (
              <AllocationCard compact={compact} slices={allocation} />
            ) : null}

            <RiskSnapshotCard compact={compact} risk={riskSnapshot} />
            <ExecutionQualityCard compact={compact} execution={executionQuality} />
            <FundingCarryCard compact={compact} carry={fundingCarry} />
            <MarketStructureCard compact={compact} structure={marketStructure} />

            {losers.length > 0 ? (
              <MoversCarousel
                compact={compact}
                title="Top Movers"
                items={losers}
                onPressItem={handleNavigateToMarket}
                onPressSeeAll={() => router.push("/(tabs)/markets")}
              />
            ) : null}

            <WatchlistCard
              compact={compact}
              items={watchlistItems}
              onPressSeeAll={() => router.push("/(tabs)/markets")}
              onPressItem={handleNavigateToMarket}
            />

            {intelligenceItems.length > 0 ? (
              <IntelligenceFeed
                compact={compact}
                items={intelligenceItems}
                onPressSeeMore={() => router.push("/(tabs)/markets")}
                onPressItem={() => router.push("/(tabs)/markets")}
              />
            ) : null}
          </>
        ) : null}

        {isDashboardEmpty ? (
          <View className="mx-4 mt-3">
            <AppCard
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="rounded-[28px] border border-border-primary-dark bg-bg-tertiary-dark p-5"
            >
              <AppText variant={VARIANT_TYPES.QUATERNARY} className="text-text-primary-dark">
                Waiting for live market feed
              </AppText>
              <AppText variant={VARIANT_TYPES.SENARY} className="mt-2 text-text-senary-dark">
                Pull to refresh or check network/wallet connectivity.
              </AppText>
              {!isConnected ? (
                <AppText variant={VARIANT_TYPES.SENARY} className="mt-1 text-text-quaternary-dark">
                  Wallet disconnected: showing safe fallback values.
                </AppText>
              ) : null}
            </AppCard>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default HomeV2Container;
