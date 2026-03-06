import {
  VaultChart,
  type VaultChartCandle,
  type VaultLiquidationOverlay,
  type VaultPnlOverlay,
  type VaultChartVolume,
  type VaultTradeMarker,
} from "@/components/sections/vault/vault-chart";
import { infoClient, subscriptionClient } from "@/lib/clients/hyperliquid";
import { useChartStore } from "@/store/chart";
import { useOrderBookStore } from "@/store/order-book";
import type { Position, TradeHistory } from "@/types/bottom-pannel";
import { CandleInterval } from "@/types/chart";
import { errorHandler } from "@/lib/utils/error-handler";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useAccount } from "@reown/appkit-react-native";
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
type FillData = Pick<TradeHistory, "coin" | "side" | "time" | "hash" | "oid" | "tid">;
type PositionData = Position["position"];
const LIVE_FILL_BACKFILL_WINDOW_MS = 90_000;

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
const INTERVAL_TO_MILLISECONDS: Record<CandleInterval, number> = {
  "1m": 60_000,
  "3m": 3 * 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "30m": 30 * 60_000,
  "1h": 60 * 60_000,
  "2h": 2 * 60 * 60_000,
  "4h": 4 * 60 * 60_000,
  "8h": 8 * 60 * 60_000,
  "12h": 12 * 60 * 60_000,
  "1d": 24 * 60 * 60_000,
  "3d": 3 * 24 * 60 * 60_000,
  "1w": 7 * 24 * 60 * 60_000,
  "1M": 30 * 24 * 60 * 60_000,
};

const getIntervalMilliseconds = (interval: CandleInterval): number =>
  INTERVAL_TO_MILLISECONDS[interval];

const getCandleTime = (timeMs: number, interval: CandleInterval): number => {
  const intervalMs = getIntervalMilliseconds(interval);
  return Math.floor(Math.floor(timeMs / intervalMs) * intervalMs / 1000);
};

const normalizeFillTimeMs = (time: number): number => {
  if (!Number.isFinite(time)) return Number.NaN;
  return time > 1_000_000_000_000 ? time : time * 1000;
};

const fillUniqueKey = (fill: FillData): string => {
  const tid = Number(fill.tid);
  if (Number.isFinite(tid) && tid > 0) return `tid:${tid}`;
  const hash = String(fill.hash ?? "").trim();
  if (hash && hash !== "undefined" && hash !== "null") return `hash:${hash}`;
  const oid = Number(fill.oid);
  if (Number.isFinite(oid) && oid > 0) {
    return `oid:${oid}:${fill.side}:${Math.floor(fill.time / 1000)}`;
  }
  return `fallback:${fill.side}:${Math.floor(fill.time / 1000)}`;
};

const fillReplayKey = (fill: FillData): string => {
  const oid = Number(fill.oid);
  const tid = Number(fill.tid);
  if (Number.isFinite(tid) && tid > 0) return `tid:${tid}`;
  if (Number.isFinite(oid) && oid > 0) {
    return `oid:${oid}:${fill.side}:${Math.floor(fill.time / 1000)}`;
  }
  return `${fill.side}:${Math.floor(fill.time / 1000)}`;
};

const normalizePosition = (positions: Position[] | undefined, coin: string) => {
  if (!positions?.length) return null;
  const matched = positions.find((item) => item?.position?.coin === coin);
  if (!matched?.position) return null;
  const size = Number.parseFloat(matched.position.szi);
  if (!Number.isFinite(size) || size === 0) return null;
  return matched.position;
};

const mergeUniqueFills = (
  current: FillData[],
  incoming: FillData[],
  minTimeMs: number,
): FillData[] => {
  const byKey = new Map<string, FillData>();
  const replayKeys = new Set<string>();
  let latestCurrentFillTime = minTimeMs;

  current.forEach((fill) => {
    if (fill.time >= minTimeMs) {
      latestCurrentFillTime = Math.max(latestCurrentFillTime, fill.time);
      byKey.set(fillUniqueKey(fill), fill);
      replayKeys.add(fillReplayKey(fill));
    }
  });

  const liveFloor = Math.max(
    minTimeMs,
    latestCurrentFillTime - LIVE_FILL_BACKFILL_WINDOW_MS,
  );

  incoming.forEach((fill) => {
    if (fill.time < liveFloor) return;
    const replayKey = fillReplayKey(fill);
    if (replayKeys.has(replayKey)) return;
    byKey.set(fillUniqueKey(fill), fill);
    replayKeys.add(replayKey);
  });
  return Array.from(byKey.values()).sort((a, b) => a.time - b.time);
};

const createMarkersFromFills = (
  fills: FillData[],
  interval: CandleInterval,
  selectedTimePeriod: number,
  themeUpColor = "#10b981",
  themeDownColor = "#ef4444",
): VaultTradeMarker[] => {
  if (!interval || !selectedTimePeriod || fills.length === 0) return [];

  const now = Date.now();
  const startTime = now - selectedTimePeriod;
  const endTime = now;
  const intervalMs = getIntervalMilliseconds(interval);

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return [];

  const startCandleTime = Math.floor(
    Math.floor(startTime / intervalMs) * intervalMs / 1000,
  );
  const endCandleTime = Math.floor(
    Math.floor(endTime / intervalMs) * intervalMs / 1000,
  );

  const filteredFills = fills
    .filter((fill) => fill.time >= startTime && fill.time <= endTime)
    .sort((a, b) => a.time - b.time);

  const fillsByCandleTime = new Map<number, FillData[]>();
  filteredFills.forEach((fill) => {
    const candleTime = getCandleTime(fill.time, interval);
    if (candleTime < startCandleTime || candleTime > endCandleTime) return;
    if (!fillsByCandleTime.has(candleTime)) {
      fillsByCandleTime.set(candleTime, []);
    }
    fillsByCandleTime.get(candleTime)?.push(fill);
  });

  const markers: VaultTradeMarker[] = [];
  let markerId = 0;
  fillsByCandleTime.forEach((candleFills, candleTime) => {
    candleFills.forEach((fill) => {
      const isBuy = fill.side === "B";
      markers.push({
        time: candleTime,
        side: isBuy ? "buy" : "sell",
        label: isBuy ? "B" : "S",
        position: "aboveBar",
        color: isBuy ? themeUpColor : themeDownColor,
        size: 1.5,
        id: `${isBuy ? "buy" : "sell"}-${candleTime}-${markerId++}`,
      });
    });
  });

  return markers;
};

export const MarketChart: React.FC<Props> = ({ currency }) => {
  const { address: userAddress } = useAccount();
  const { getCandleData } = useChartStore();
  const { getLiveCandleData } = useOrderBookStore();
  const [activeRange, setActiveRange] = useState<ChartRange>("1d");
  const [selectedInterval, setSelectedInterval] = useState<CandleInterval>(
    RANGE_CONFIG["1d"].interval,
  );
  const [candleData, setCandleData] = useState<CandleApiData[]>([]);
  const [fillsData, setFillsData] = useState<FillData[]>([]);
  const [livePosition, setLivePosition] = useState<PositionData | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const candleSubscriptionRef = useRef<ISubscription | null>(null);
  const fillsSubscriptionRef = useRef<ISubscription | null>(null);
  const positionSubscriptionRef = useRef<ISubscription | null>(null);
  const fillsRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const fillsRefreshInFlightRef = useRef(false);
  const fillsRefreshQueuedRef = useRef(false);
  const selectedTimePeriodObj = RANGE_CONFIG[activeRange];
  const selectedTimePeriod = selectedTimePeriodObj.timePeriod;
  const maxFillLookbackMs = RANGE_CONFIG["1y"].timePeriod;

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

  const chartMarkers = useMemo(
    () => createMarkersFromFills(fillsData, selectedInterval, selectedTimePeriod),
    [fillsData, selectedInterval, selectedTimePeriod],
  );
  const pnlOverlay = useMemo<VaultPnlOverlay | null>(() => {
    if (!livePosition) return null;
    const entryPrice = Number.parseFloat(livePosition.entryPx);
    const unrealizedPnl = Number.parseFloat(livePosition.unrealizedPnl);
    const signedSize = Number.parseFloat(livePosition.szi);
    if (
      !Number.isFinite(entryPrice) ||
      entryPrice <= 0 ||
      !Number.isFinite(signedSize) ||
      signedSize === 0
    ) {
      return null;
    }
    const absSize = Math.abs(signedSize);
    const sideColor = signedSize > 0 ? "#10b981" : "#ef4444";
    const pnlText = Number.isFinite(unrealizedPnl)
      ? `${unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)}`
      : "0.00";
    const sizeText = absSize >= 1000 ? absSize.toFixed(0) : absSize.toFixed(2);
    return {
      price: entryPrice,
      label: `PNL ${pnlText} | ${sizeText}`,
      color: sideColor,
    };
  }, [livePosition]);
  const liquidationOverlay = useMemo<VaultLiquidationOverlay | null>(() => {
    if (!livePosition) return null;
    const liquidationPrice = Number.parseFloat(livePosition.liquidationPx ?? "");
    if (!Number.isFinite(liquidationPrice) || liquidationPrice <= 0) {
      return null;
    }
    return {
      price: liquidationPrice,
      label: `Liq. Price ${liquidationPrice.toFixed(2)}`,
      color: "#ec4899",
    };
  }, [livePosition]);

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

  useEffect(() => {
    let isActive = true;
    fillsSubscriptionRef.current?.unsubscribe();
    fillsSubscriptionRef.current = null;
    if (fillsRefreshTimerRef.current) {
      clearTimeout(fillsRefreshTimerRef.current);
      fillsRefreshTimerRef.current = null;
    }
    fillsRefreshInFlightRef.current = false;
    fillsRefreshQueuedRef.current = false;

    if (!userAddress?.startsWith("0x")) {
      setFillsData([]);
      return () => undefined;
    }

    const minTimeMs = Date.now() - maxFillLookbackMs;
    const normalizeAndFilterFills = (fills: TradeHistory[]): FillData[] =>
      fills
        .filter((fill) => fill.coin === currency && !fill.coin.startsWith("@"))
        .map((fill) => ({
          coin: fill.coin,
          side: fill.side,
          time: normalizeFillTimeMs(Number(fill.time)),
          hash: fill.hash,
          oid: fill.oid,
          tid: fill.tid,
        }))
        .filter(
          (fill) => Number.isFinite(fill.time) && fill.time >= minTimeMs,
        );

    const refreshFillsFromApi = async () => {
      if (!isActive) return;
      if (fillsRefreshInFlightRef.current) {
        fillsRefreshQueuedRef.current = true;
        return;
      }
      fillsRefreshInFlightRef.current = true;
      try {
        const resp = await infoClient.userFillsByTime({
          user: userAddress as string,
          startTime: minTimeMs,
        });
        if (!isActive) return;
        const initialFills = normalizeAndFilterFills(
          (resp ?? []) as TradeHistory[],
        );
        setFillsData((previous) =>
          mergeUniqueFills(
            previous,
            initialFills.sort((a, b) => a.time - b.time),
            minTimeMs,
          ),
        );
      } catch {
        if (!isActive) return;
      } finally {
        fillsRefreshInFlightRef.current = false;
        if (fillsRefreshQueuedRef.current) {
          fillsRefreshQueuedRef.current = false;
          void refreshFillsFromApi();
        }
      }
    };

    const scheduleRefreshFills = (delayMs = 220) => {
      if (fillsRefreshTimerRef.current) {
        clearTimeout(fillsRefreshTimerRef.current);
      }
      fillsRefreshTimerRef.current = setTimeout(() => {
        fillsRefreshTimerRef.current = null;
        void refreshFillsFromApi();
      }, delayMs);
    };

    const subscribeFills = async () => {
      const subscription = await subscriptionClient.userFills(
        { user: userAddress as `0x${string}` },
        (tradeUpdates) => {
          if (!isActive) return;
          const nextFills = normalizeAndFilterFills(
            ((tradeUpdates?.fills ?? []) as TradeHistory[]) ?? [],
          );
          if (nextFills.length === 0) return;
          setFillsData((previous) =>
            mergeUniqueFills(previous, nextFills, minTimeMs),
          );
          // Stream packets can be partial or replayed; confirm with API shortly after.
          scheduleRefreshFills();
        },
      );
      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }
      fillsSubscriptionRef.current = subscription;
    };

    setFillsData([]);
    void refreshFillsFromApi();
    void subscribeFills();

    return () => {
      isActive = false;
      if (fillsRefreshTimerRef.current) {
        clearTimeout(fillsRefreshTimerRef.current);
        fillsRefreshTimerRef.current = null;
      }
      fillsSubscriptionRef.current?.unsubscribe();
      fillsSubscriptionRef.current = null;
    };
  }, [currency, maxFillLookbackMs, userAddress]);

  useEffect(() => {
    let isActive = true;
    positionSubscriptionRef.current?.unsubscribe();
    positionSubscriptionRef.current = null;

    if (!userAddress?.startsWith("0x")) {
      setLivePosition(null);
      return () => undefined;
    }

    const loadPosition = async () => {
      try {
        const resp = await infoClient.clearinghouseState({
          user: userAddress as string,
        });
        if (!isActive) return;
        const positions = (resp?.assetPositions ?? []) as Position[];
        setLivePosition(normalizePosition(positions, currency));
      } catch {
        if (!isActive) return;
        setLivePosition(null);
      }
    };

    const subscribePosition = async () => {
      const subscription = await subscriptionClient.clearinghouseState(
        { user: userAddress as `0x${string}` },
        (payload) => {
          if (!isActive) return;
          const positions = (payload?.clearinghouseState?.assetPositions ??
            []) as Position[];
          setLivePosition(normalizePosition(positions, currency));
        },
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      positionSubscriptionRef.current = subscription;
    };

    void loadPosition();
    void subscribePosition();

    return () => {
      isActive = false;
      positionSubscriptionRef.current?.unsubscribe();
      positionSubscriptionRef.current = null;
    };
  }, [currency, userAddress]);

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
      pnlOverlay={pnlOverlay}
      liquidationOverlay={liquidationOverlay}
      isLoading={isChartLoading}
      error={chartError}
      onRetry={() => {
        void loadChartData();
      }}
    />
  );
};
