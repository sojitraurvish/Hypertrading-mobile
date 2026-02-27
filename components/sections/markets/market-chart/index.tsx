import {
  VaultChart,
  type VaultChartCandle,
  type VaultChartVolume,
  type VaultTradeMarker,
} from "@/components/sections/vault/vault-chart";
import { useChartStore } from "@/store/chart";
import { useOrderBookStore } from "@/store/order-book";
import { CandleInterval } from "@/types/chart";
import { errorHandler } from "@/lib/utils/error-handler";
import type { ISubscription } from "@nktkas/hyperliquid";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  currency: string;
};

type ChartRange = "1d" | "5d" | "1m" | "3m" | "6m" | "1y";
type CandleApiData = {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
};

const CHART_RANGES: readonly ChartRange[] = [
  "1d",
  "5d",
  "1m",
  "3m",
  "6m",
  "1y",
];
const RANGE_CONFIG: Record<
  ChartRange,
  { interval: CandleInterval; timePeriod: number }
> = {
  "1d": { interval: "5m", timePeriod: 24 * 60 * 60 * 1000 },
  "5d": { interval: "1h", timePeriod: 5 * 24 * 60 * 60 * 1000 },
  "1m": { interval: "4h", timePeriod: 30 * 24 * 60 * 60 * 1000 },
  "3m": { interval: "1d", timePeriod: 90 * 24 * 60 * 60 * 1000 },
  "6m": { interval: "1d", timePeriod: 180 * 24 * 60 * 60 * 1000 },
  "1y": { interval: "1d", timePeriod: 365 * 24 * 60 * 60 * 1000 },
};

export const MarketChart: React.FC<Props> = ({ currency }) => {
  const { getCandleData } = useChartStore();
  const { getLiveCandleData } = useOrderBookStore();
  const [activeRange, setActiveRange] = useState<ChartRange>("1d");
  const [selectedInterval, setSelectedInterval] = useState<CandleInterval>(
    RANGE_CONFIG["1d"].interval,
  );
  const [candleData, setCandleData] = useState<CandleApiData[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const candleSubscriptionRef = useRef<ISubscription | null>(null);
  const selectedTimePeriodObj = RANGE_CONFIG[activeRange];
  const selectedTimePeriod = selectedTimePeriodObj.timePeriod;

  const isCandleInterval = (value: string): value is CandleInterval => {
    return [
      "1m",
      "3m",
      "5m",
      "15m",
      "30m",
      "1h",
      "2h",
      "4h",
      "8h",
      "12h",
      "1d",
      "3d",
      "1w",
      "1M",
    ].includes(value);
  };

  const chartCandles = useMemo(
    () =>
      candleData
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
        .filter((item): item is VaultChartCandle => item !== null),
    [candleData],
  );

  const chartVolumes = useMemo(
    () =>
      candleData
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
        .filter((item): item is VaultChartVolume => item !== null),
    [candleData],
  );

  const chartMarkers: VaultTradeMarker[] =
    chartCandles.length > 6
      ? [
          {
            time: chartCandles[chartCandles.length - 3].time,
            side: "sell",
            label: "S",
          },
          {
            time: chartCandles[chartCandles.length - 2].time,
            side: "buy",
            label: "B",
          },
        ]
      : [];

  const loadChartData = useCallback(async () => {
    const requestId = ++requestRef.current;
    setIsChartLoading(true);
    setChartError(null);
    try {
      const startTime = Date.now() - selectedTimePeriod;
      const data = await getCandleData({
        coin: currency,
        interval: selectedInterval,
        startTime,
      });

      if (requestRef.current !== requestId) {
        return;
      }

      setCandleData(data);
    } catch (error) {
      if (requestRef.current !== requestId) {
        return;
      }
      setCandleData([]);
      setChartError(errorHandler(error, "Chart Data Error"));
    } finally {
      if (requestRef.current === requestId) {
        setIsChartLoading(false);
      }
    }
  }, [currency, getCandleData, selectedInterval, selectedTimePeriod]);

  useEffect(() => {
    void loadChartData();
  }, [loadChartData]);

  useEffect(() => {
    let isActive = true;
    candleSubscriptionRef.current?.unsubscribe();
    candleSubscriptionRef.current = null;

    const subscribe = async () => {
      const subscription = await getLiveCandleData(
        currency,
        selectedInterval,
        (nextCandleData) => {
          if (!isActive) return;
          setCandleData(nextCandleData);
        },
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      candleSubscriptionRef.current = subscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      candleSubscriptionRef.current?.unsubscribe();
      candleSubscriptionRef.current = null;
    };
  }, [currency, getLiveCandleData, selectedInterval]);

  return (
    <VaultChart
      pairLabel={`${currency} · Hyperliquid`}
      intervalLabel={selectedInterval}
      rangeOptions={CHART_RANGES}
      activeRange={activeRange}
      onIntervalChange={(interval) => {
        if (!isCandleInterval(interval)) return;
        setIsChartLoading(true);
        setSelectedInterval(interval);
      }}
      onRangeChange={(range) => {
        setIsChartLoading(true);
        setActiveRange(range as ChartRange);
      }}
      onInteractionChange={() => undefined}
      candles={chartCandles}
      volumes={chartVolumes}
      markers={chartMarkers}
      isLoading={isChartLoading}
      error={chartError}
      onRetry={() => {
        void loadChartData();
      }}
    />
  );
};
