import { MarketFilters } from "@/components/sections/markets/market-filters";
import { MarketHeader } from "@/components/sections/markets/market-header";
import { Feather } from "@expo/vector-icons";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, BackHandler, Keyboard, View } from "react-native";

import { MarketList } from "@/components/sections/markets/market-list";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { errorHandler } from "@/lib/utils/error-handler";
import { useMarketStore } from "@/store/markets";
import type { MarketItem } from "@/types/markets";
import { MarketDetailContainer } from "./market-detail";

// ============================================================
// All API calls and data fetching should happen in this container.
// Section components receive data as props — they are pure UI.
// ============================================================

type MarketsContainerProps = {
  openMarketDetailsOnSelect?: boolean;
  onMarketSelect?: (symbol: string) => void;
};

export const MarketsContainer: React.FC<MarketsContainerProps> = ({
  openMarketDetailsOnSelect = true,
  onMarketSelect,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandAll, setExpandAll] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const markets = useMarketStore((state) => state.markets);
  const favoriteSymbols = useMarketStore((state) => state.favoriteSymbols);
  const isLoading = useMarketStore((state) => state.isLoading);
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const setSelectedMarket = useMarketStore((state) => state.setSelectedMarket);
  const fetchMarkets = useMarketStore((state) => state.fetchMarkets);
  const setMarkets = useMarketStore((state) => state.setMarkets);
  const getLiveMarketUpdates = useMarketStore(
    (state) => state.getLiveMarketUpdates,
  );
  const addToFavorite = useMarketStore((state) => state.addToFavorite);
  const removeFromFavorite = useMarketStore(
    (state) => state.removeFromFavorite,
  );
  const favoriteSymbolSet = useMemo(
    () => new Set(favoriteSymbols),
    [favoriteSymbols],
  );

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleSearchToggle = useCallback(() => {
    setIsSearching((prev) => {
      if (prev) {
        setSearchQuery("");
        Keyboard.dismiss();
      }
      return !prev;
    });
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setActiveFilter(value);
  }, []);

  const handleItemPress = useCallback(
    (item: MarketItem) => {
      setSelectedMarket(item);
      onMarketSelect?.(item.symbol);
    },
    [onMarketSelect, setSelectedMarket],
  );

  const handleFavoriteToggle = useCallback(
    (pair: string, nextIsFavorite: boolean) => {
      if (nextIsFavorite) {
        addToFavorite(pair);
        return;
      }
      removeFromFavorite(pair);
    },
    [addToFavorite, removeFromFavorite],
  );

  const loadMarkets = useCallback(
    async (showRefreshLoader = false) => {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      }

      try {
        const fetchedMarkets = await fetchMarkets();
        setMarkets(fetchedMarkets);
      } catch (error) {
        errorHandler(error, "Markets Load Error");
      } finally {
        setHasLoadedOnce(true);
        if (showRefreshLoader) {
          setIsRefreshing(false);
        }
      }
    },
    [fetchMarkets, setMarkets],
  );

  const handleRefresh = useCallback(() => {
    loadMarkets(true);
  }, [loadMarkets]);
  const hasMarkets = markets.size > 0;
  const isInitialLoading = isLoading && !hasLoadedOnce && !hasMarkets;

  const filteredMarkets = useMemo(() => {
    let items = Array.from(markets.values());

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(
        (m) =>
          m.coin.toLowerCase().includes(q) ||
          m.symbol.toLowerCase().includes(q),
      );
    }

    if (activeFilter === "favorites") {
      items = items.filter((m) => favoriteSymbolSet.has(m.symbol));
    } else if (activeFilter === "gainers") {
      items = items.filter((m) => (m.change24hPer ?? 0) >= 0);
    } else if (activeFilter === "losers") {
      items = items.filter((m) => (m.change24hPer ?? 0) < 0);
    }

    return items;
  }, [markets, searchQuery, activeFilter, favoriteSymbolSet]);

  const filteredItems = useMemo<MarketItem[]>(() => {
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

    const formatSignedPercent = (value: number | null, digits = 2): string => {
      if (value == null || Number.isNaN(value)) return "—";
      return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
    };

    return filteredMarkets.map((market) => ({
      symbol: market.coin,
      pair: market.symbol,
      iconLabel: market.coin[0] ?? "?",
      iconBgColor: "bg-bg-octonary-dark",
      price: formatUsdValue(market.lastPrice),
      priceChange: formatSigned(market.change24h, 2),
      changePercent: formatSignedPercent(market.change24hPer, 2),
      isPositive: (market.change24hPer ?? 0) >= 0,
      leverage: market.leverage ?? "—",
      mark: formatUsdValue(market.mark),
      oracle: formatUsdValue(market.oracle),
      fundingPer: market.fundingPer,
      fundingDisplay: market.fundingDisplay ?? "—",
      funding8hour: market.funding8hour,
      funding8hourDisplay: formatSignedPercent(market.funding8hour, 4),
      fundingCountdown: market.countdown ?? "—",
      volume: formatUsdValue(market.volume),
      volume24h: formatUsdValue(market.volume24h),
      openInterest: formatUsdValue(market.openInterest),
      isFavorite: favoriteSymbolSet.has(market.symbol),
    }));
  }, [filteredMarkets, favoriteSymbolSet]);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  useEffect(() => {
    if (hasMarkets && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [hasMarkets, hasLoadedOnce]);

  useEffect(() => {
    let subscription: ISubscription | null = null;

    const startLiveUpdates = async () => {
      subscription = await getLiveMarketUpdates(setMarkets);
    };

    startLiveUpdates();

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (error) {
        errorHandler(error, "Subscription Cleanup Error");
      }
    };
  }, [getLiveMarketUpdates, setMarkets]);

  useEffect(() => {
    if (!openMarketDetailsOnSelect) return;
    if (!selectedMarket) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setSelectedMarket(null);
        return true;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [openMarketDetailsOnSelect, selectedMarket, setSelectedMarket]);

  useFocusEffect(
    useCallback(() => {
      if (!openMarketDetailsOnSelect) return;
      return () => {
        setSelectedMarket(null);
      };
    }, [openMarketDetailsOnSelect, setSelectedMarket]),
  );

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  if (openMarketDetailsOnSelect && selectedMarket) {
    return (
      <MarketDetailContainer
        coin={selectedMarket.symbol}
        pair={selectedMarket.pair}
        onBack={() => setSelectedMarket(null)}
      />
    );
  } 

  return (
    <View className="flex-1 bg-bg-primary-dark">
      <MarketHeader
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchToggle={handleSearchToggle}
        onSearchChange={handleSearchChange}
      />

      <MarketFilters
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <View className="flex-row items-center justify-end mx-4 mt-2 mb-2.5">
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-quaternary-dark border border-border-primary-dark"
          onPress={() =>
            React.startTransition(() => {
              setExpandAll((prev) => !prev);
            })
          }
        >
          <Feather
            name={expandAll ? "minimize-2" : "maximize-2"}
            size={12}
            color={expandAll ? "#50fa7b" : "#9ca3af"}
          />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className={`text-[11px] font-semibold tracking-wide ${expandAll ? "text-text-quaternary-dark" : "text-text-tertiary-dark"}`}
          >
            {expandAll ? "COLLAPSE ALL" : "EXPAND ALL"}
          </AppText>
        </AppButton>
      </View>

      {isInitialLoading ? (
        <View className="flex-1 items-center justify-center px-4">
          <ActivityIndicator size="small" color="#50fa7b" />
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-text-tertiary-dark text-center mt-3"
          >
            Loading market data...
          </AppText>
        </View>
      ) : (
        <MarketList
          className="mt-1 pb-2"
          items={filteredItems}
          expandAll={expandAll}
          onItemPress={handleItemPress}
          onFavoriteToggle={handleFavoriteToggle}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
};

export default MarketsContainer;
