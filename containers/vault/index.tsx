import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { VaultHeader } from "@/components/sections/vault/vault-header";
import { VaultSummary } from "@/components/sections/vault/vault-summary";
import { VaultStrategies } from "@/components/sections/vault/vault-strategies";
import { VaultActivity } from "@/components/sections/vault/vault-activity";
import type { StrategyItem } from "@/components/sections/vault/vault-strategies";
import {
  VaultChart,
  type VaultChartCandle,
  type VaultTradeMarker,
  type VaultChartVolume,
} from "@/components/sections/vault/vault-chart";
import { infoClient } from "@/lib/clients/hyperliquid";
import { errorHandler } from "@/lib/utils/error-handler";

const CHART_RANGES = ["1d", "5d", "1m", "3m", "6m", "1y"] as const;
type ChartRange = (typeof CHART_RANGES)[number];
type ChartInterval = "5m" | "1h" | "4h" | "1d";

const INTERVAL_MS: Record<ChartInterval, number> = {
  "5m": 5 * 60_000,
  "1h": 60 * 60_000,
  "4h": 4 * 60 * 60_000,
  "1d": 24 * 60 * 60_000,
};

const RANGE_CONFIG: Record<ChartRange, { interval: ChartInterval; bars: number }> = {
  "1d": { interval: "5m", bars: 432 },
  "5d": { interval: "1h", bars: 240 },
  "1m": { interval: "4h", bars: 240 },
  "3m": { interval: "1d", bars: 120 },
  "6m": { interval: "1d", bars: 240 },
  "1y": { interval: "1d", bars: 500 },
};

// ============================================================
// All API calls and data fetching should happen in this container.
// Section components receive data as props — they are pure UI.
// ============================================================

export const VaultContainer: React.FC = () => {
  const [activeRange, setActiveRange] = useState<ChartRange>("1d");
  const [isChartInteracting, setIsChartInteracting] = useState(false);
  const [chartCandles, setChartCandles] = useState<VaultChartCandle[]>([]);
  const [chartVolumes, setChartVolumes] = useState<VaultChartVolume[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const chartMarkers: VaultTradeMarker[] =
    chartCandles.length > 4
      ? [
          {
            time: chartCandles[chartCandles.length - 3]?.time ?? 0,
            side: "sell",
            price: chartCandles[chartCandles.length - 3]?.high,
            label: "S",
          },
          {
            time: chartCandles[chartCandles.length - 2]?.time ?? 0,
            side: "buy",
            price: chartCandles[chartCandles.length - 2]?.low,
            label: "B",
          },
        ]
      : [];

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleInfoPress = useCallback(() => {
    // TODO: Open vault info/docs
  }, []);

  const handleStrategyPress = useCallback((strategy: StrategyItem) => {
    // TODO: Navigate to vault detail / deposit flow
  }, []);

  const loadChartData = useCallback(async () => {
    setIsChartLoading(true);
    setChartError(null);
    try {
      const config = RANGE_CONFIG[activeRange];
      const endTime = Date.now();
      const startTime = endTime - INTERVAL_MS[config.interval] * config.bars;

      const response = await infoClient.candleSnapshot({
        coin: "BTC",
        interval: config.interval,
        startTime,
        endTime,
      });

      const nextCandles = response
        .map((item) => {
          const time = Math.floor(Number(item.t) / 1000);
          const open = Number(item.o);
          const high = Number(item.h);
          const low = Number(item.l);
          const close = Number(item.c);
          if (
            !Number.isFinite(time) ||
            !Number.isFinite(open) ||
            !Number.isFinite(high) ||
            !Number.isFinite(low) ||
            !Number.isFinite(close)
          ) {
            return null;
          }
          return { time, open, high, low, close };
        })
        .filter((item): item is VaultChartCandle => item !== null);

      const nextVolumes = response
        .map((item) => {
          const time = Math.floor(Number(item.t) / 1000);
          const open = Number(item.o);
          const close = Number(item.c);
          const value = Number(item.v);
          if (
            !Number.isFinite(time) ||
            !Number.isFinite(open) ||
            !Number.isFinite(close) ||
            !Number.isFinite(value)
          ) {
            return null;
          }
          return {
            time,
            value,
            color: close >= open ? "#22c55e88" : "#ef444488",
          };
        })
        .filter((item): item is VaultChartVolume => item !== null);

      setChartCandles(nextCandles);
      setChartVolumes(nextVolumes);
    } catch (error) {
      setChartCandles([]);
      setChartVolumes([]);
      setChartError(errorHandler(error, "Vault Chart Error"));
    } finally {
      setIsChartLoading(false);
    }
  }, [activeRange]);

  useEffect(() => {
    void loadChartData();
  }, [loadChartData]);

  // ----------------------------------------------------------
  // Mock Data (replace with API data)
  // ----------------------------------------------------------
  const summaryData = {
    totalDeposited: "$0.00",
    totalEarned: "$0.00",
    activeVaults: 0,
  };

  const strategies: StrategyItem[] = [
    {
      id: "1",
      name: "USDC Lending",
      description: "Earn yield by lending USDC to traders",
      apy: "8.42%",
      tvl: "$12.4M",
      risk: "Low",
      iconName: "dollar-sign",
    },
    {
      id: "2",
      name: "BTC Delta Neutral",
      description: "Market-neutral strategy on BTC perpetuals",
      apy: "15.8%",
      tvl: "$5.2M",
      risk: "Medium",
      iconName: "shield",
    },
    {
      id: "3",
      name: "ETH Momentum",
      description: "Algorithmic trend-following on ETH",
      apy: "24.6%",
      tvl: "$3.1M",
      risk: "High",
      iconName: "zap",
    },
    {
      id: "4",
      name: "Multi-Asset Yield",
      description: "Diversified yield across top assets",
      apy: "11.2%",
      tvl: "$8.7M",
      risk: "Low",
      iconName: "pie-chart",
    },
  ];

  const recentActivity = [
    {
      id: "1",
      type: "deposit" as const,
      vault: "USDC Lending",
      amount: "+$500.00",
      timeAgo: "2h ago",
    },
    {
      id: "2",
      type: "earn" as const,
      vault: "BTC Delta Neutral",
      amount: "+$12.40",
      timeAgo: "6h ago",
    },
    {
      id: "3",
      type: "withdraw" as const,
      vault: "ETH Momentum",
      amount: "-$200.00",
      timeAgo: "1d ago",
    },
  ];

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <View className="flex-1 bg-bg-primary-dark">
      <ScrollView
        className="flex-1"
        nestedScrollEnabled
        scrollEnabled={!isChartInteracting}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <VaultHeader onInfoPress={handleInfoPress} />

        <VaultSummary
          totalDeposited={summaryData.totalDeposited}
          totalEarned={summaryData.totalEarned}
          activeVaults={summaryData.activeVaults}
        />

        <VaultChart
          pairLabel="BTC · Hyperliquid"
          intervalLabel={RANGE_CONFIG[activeRange].interval}
          rangeOptions={CHART_RANGES}
          activeRange={activeRange}
          onRangeChange={(range) => setActiveRange(range as ChartRange)}
          onInteractionChange={(interacting) => setIsChartInteracting(interacting)}
          candles={chartCandles}
          volumes={chartVolumes}
          markers={chartMarkers}
          isLoading={isChartLoading}
          error={chartError}
          onRetry={() => void loadChartData()}
        />

        <VaultStrategies
          strategies={strategies}
          onStrategyPress={handleStrategyPress}
        />

        <VaultActivity activities={recentActivity} />
      </ScrollView>
    </View>
  );
};

export default VaultContainer;
