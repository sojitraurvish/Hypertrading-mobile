import type {
  Balance,
  FundingHistory,
  HistoricalOrder,
  OpenOrder,
  Position,
  TradeHistory,
} from "@/types/bottom-pannel";
import type { PerpetualMarket } from "@/types/markets";
import type {
  HomeAllocationSlice,
  HomeExecutionQuality,
  HomeFundingCarry,
  HomeIntelItem,
  HomeMarketStructure,
  HomeMoverItem,
  HomeRiskSnapshot,
  HomeSentiment,
  HomeWatchlistItem,
} from "@/types/home";
import { formatAgeLabel, parseNumberLoose } from "./formatters";

const ALLOCATION_COLORS = ["#bfff1f", "#f8fafc", "#a855f7", "#3b82f6", "#f97316"];

function getStartTimeForFrame(timeframe: "1D" | "1W" | "1M" | "ALL"): number {
  const now = Date.now();
  if (timeframe === "1D") return now - 24 * 60 * 60 * 1000;
  if (timeframe === "1W") return now - 7 * 24 * 60 * 60 * 1000;
  if (timeframe === "1M") return now - 30 * 24 * 60 * 60 * 1000;
  return 0;
}

export function buildPortfolioMetrics(
  balances: Balance[],
  positions: Position[],
  trades: TradeHistory[],
  timeframe: "1D" | "1W" | "1M" | "ALL",
) {
  const totalBalanceUsd = balances.reduce(
    (acc, current) => acc + (Number(current.usdc_value) || 0),
    0,
  );

  const unrealizedPnl = positions.reduce(
    (acc, current) => acc + parseNumberLoose(current.position.unrealizedPnl),
    0,
  );

  const startTime = getStartTimeForFrame(timeframe);
  const closedPnl = trades
    .filter((item) => Number(item.time) >= startTime)
    .reduce((acc, item) => acc + parseNumberLoose(item.closedPnl), 0);

  const sessionPnl = unrealizedPnl + closedPnl;
  const performancePercent =
    totalBalanceUsd > 0 ? (sessionPnl / totalBalanceUsd) * 100 : 0;

  return {
    totalBalanceUsd,
    sessionPnl,
    performancePercent,
  };
}

export function buildMovers(marketsMap: Map<string, PerpetualMarket>, limit = 8) {
  const all = Array.from(marketsMap.values()).filter(
    (market) =>
      market.lastPrice != null &&
      market.change24hPer != null &&
      market.volume24h != null,
  );

  const gainers: HomeMoverItem[] = [...all]
    .sort((a, b) => (b.change24hPer ?? 0) - (a.change24hPer ?? 0))
    .slice(0, limit)
    .map((item) => ({
      symbol: item.coin,
      lastPrice: item.lastPrice ?? 0,
      changePercent: item.change24hPer ?? 0,
      volume24h: item.volume24h ?? 0,
    }));

  const losers: HomeMoverItem[] = [...all]
    .sort((a, b) => (a.change24hPer ?? 0) - (b.change24hPer ?? 0))
    .slice(0, limit)
    .map((item) => ({
      symbol: item.coin,
      lastPrice: item.lastPrice ?? 0,
      changePercent: item.change24hPer ?? 0,
      volume24h: item.volume24h ?? 0,
    }));

  return { gainers, losers };
}

export function buildWatchlist(
  marketsMap: Map<string, PerpetualMarket>,
  favoriteSymbols: string[],
  limit = 6,
): HomeWatchlistItem[] {
  const byVolume = Array.from(marketsMap.values())
    .filter((item) => item.lastPrice != null && item.change24hPer != null)
    .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));

  const preferred = favoriteSymbols
    .map((symbol) => marketsMap.get(symbol))
    .filter((item): item is PerpetualMarket => Boolean(item));

  const source = preferred.length > 0 ? preferred : byVolume.slice(0, limit);

  return source.slice(0, limit).map((item) => ({
    symbol: item.coin,
    lastPrice: item.lastPrice ?? 0,
    changePercent: item.change24hPer ?? 0,
    funding8hPercent: item.funding8hour,
    openInterest: item.openInterest,
    volume24h: item.volume24h,
  }));
}

export function buildAllocation(
  balances: Balance[],
  positions: Position[],
): HomeAllocationSlice[] {
  const assetValueMap = new Map<string, number>();
  positions.forEach((pos) => {
    const symbol = pos.position.coin;
    const value = Math.abs(parseNumberLoose(pos.position.positionValue));
    assetValueMap.set(symbol, (assetValueMap.get(symbol) ?? 0) + value);
  });

  const usdcValue = balances.reduce(
    (acc, item) => acc + (item.coin.includes("USDC") ? Number(item.usdc_value) : 0),
    0,
  );
  if (usdcValue > 0) {
    assetValueMap.set("USDC", (assetValueMap.get("USDC") ?? 0) + usdcValue);
  }

  const total = Array.from(assetValueMap.values()).reduce((a, b) => a + b, 0);
  if (total <= 0) {
    return [];
  }

  return Array.from(assetValueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symbol, value], index) => ({
      symbol,
      weight: value / total,
      value,
      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
    }));
}

export function buildSentiment(
  marketsMap: Map<string, PerpetualMarket>,
  _sessionPnl: number,
): HomeSentiment {
  const markets = Array.from(marketsMap.values()).filter(
    (m) => m.change24hPer != null && m.volume24h != null,
  );
  if (markets.length === 0) {
    return {
      score: 50,
      label: "NEUTRAL",
      volatility: "MEDIUM",
      volume: "MEDIUM",
      momentum: "NEUTRAL",
    };
  }

  const upCount = markets.filter((m) => (m.change24hPer ?? 0) > 0).length;
  const breadth = upCount / markets.length;
  const avgChange =
    markets.reduce((acc, item) => acc + (item.change24hPer ?? 0), 0) /
    markets.length;
  const avgAbsChange =
    markets.reduce((acc, item) => acc + Math.abs(item.change24hPer ?? 0), 0) /
    markets.length;
  const avgVolume =
    markets.reduce((acc, item) => acc + (item.volume24h ?? 0), 0) / markets.length;

  const breadthSignal = (breadth - 0.5) * 50;
  const momentumSignal = Math.max(-20, Math.min(20, avgChange * 2.5));
  const volatilityPenalty = Math.max(0, avgAbsChange - 4) * 2;
  const volumeSignal = Math.min(12, Math.log10(Math.max(1, avgVolume)) * 2.2 - 8);

  const rawScore =
    50 + breadthSignal + momentumSignal + volumeSignal - volatilityPenalty;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const label =
    score < 20
      ? "EXTREME_FEAR"
      : score < 40
        ? "FEAR"
        : score < 60
          ? "NEUTRAL"
          : score < 80
            ? "GREED"
            : "EXTREME_GREED";

  return {
    score,
    label,
    volatility: avgAbsChange < 1.8 ? "LOW" : avgAbsChange < 4 ? "MEDIUM" : "HIGH",
    volume: avgVolume < 5_000_000 ? "LOW" : avgVolume < 40_000_000 ? "MEDIUM" : "HIGH",
    momentum: avgChange > 0.4 ? "BULLISH" : avgChange < -0.4 ? "BEARISH" : "NEUTRAL",
  };
}

export function buildIntelligenceFeed(
  trades: TradeHistory[],
  fundings: FundingHistory[],
  orders: HistoricalOrder[],
  marketsMap: Map<string, PerpetualMarket>,
  limit = 5,
): HomeIntelItem[] {
  const tradeSignals: HomeIntelItem[] = trades.slice(0, 3).map((trade, index) => {
    const closedPnl = parseNumberLoose(trade.closedPnl);
    const tone = closedPnl > 0 ? "positive" : closedPnl < 0 ? "negative" : "neutral";
    return {
      id: `trade-${trade.tid}-${index}`,
      title: `${trade.coin} ${trade.side === "B" ? "LONG" : "SHORT"} FILL`,
      subtitle: `Closed PnL ${closedPnl >= 0 ? "+" : ""}${closedPnl.toFixed(2)} USDC`,
      ageLabel: formatAgeLabel(Number(trade.time)),
      tone,
    };
  });

  const fundingSignals: HomeIntelItem[] = fundings.slice(0, 2).map((item, index) => {
    const payment = parseNumberLoose(item.delta?.usdc);
    const tone = payment >= 0 ? "positive" : "negative";
    const rate = parseNumberLoose(item.delta?.fundingRate) * 100;
    return {
      id: `funding-${item.hash}-${index}`,
      title: `${item.delta.coin} FUNDING ${payment >= 0 ? "CREDIT" : "DEBIT"}`,
      subtitle: `${payment >= 0 ? "+" : ""}${payment.toFixed(2)} USDC @ ${rate.toFixed(4)}%`,
      ageLabel: formatAgeLabel(Number(item.time)),
      tone,
    };
  });

  const filledCount = orders
    .slice(0, 25)
    .filter((item) => String(item.status).toLowerCase() === "filled").length;
  const cancelCount = orders
    .slice(0, 25)
    .filter((item) => String(item.status).toLowerCase().includes("cancel")).length;
  const executionSignal: HomeIntelItem | null =
    filledCount + cancelCount > 0
      ? {
          id: "execution-quality",
          title: "EXECUTION QUALITY",
          subtitle: `Filled ${filledCount} / Cancelled ${cancelCount} recent orders`,
          ageLabel: "live",
          tone: filledCount >= cancelCount ? "positive" : "negative",
        }
      : null;

  const topMove = Array.from(marketsMap.values())
    .filter((market) => market.change24hPer != null)
    .sort(
      (a, b) =>
        Math.abs(b.change24hPer ?? 0) - Math.abs(a.change24hPer ?? 0),
    )[0];
  const marketSignal: HomeIntelItem | null = topMove
    ? {
        id: `market-${topMove.symbol}`,
        title: `${topMove.coin} VOLATILITY ALERT`,
        subtitle: `24h move ${(topMove.change24hPer ?? 0).toFixed(2)}%`,
        ageLabel: "live",
        tone: (topMove.change24hPer ?? 0) >= 0 ? "positive" : "negative",
      }
    : null;

  const merged = [
    ...tradeSignals,
    ...fundingSignals,
    ...(executionSignal ? [executionSignal] : []),
    ...(marketSignal ? [marketSignal] : []),
  ];

  return merged.slice(0, limit);
}

export function buildRiskSnapshot(
  positions: Position[],
  marketsMap: Map<string, PerpetualMarket>,
): HomeRiskSnapshot {
  if (positions.length === 0) {
    return {
      netExposureUsd: 0,
      grossExposureUsd: 0,
      longExposureUsd: 0,
      shortExposureUsd: 0,
      largestPositionSymbol: null,
      largestPositionSharePercent: 0,
      nearestLiquidationSymbol: null,
      nearestLiquidationDistancePercent: null,
    };
  }

  let netExposureUsd = 0;
  let longExposureUsd = 0;
  let shortExposureUsd = 0;
  let largestPositionSymbol: string | null = null;
  let largestPositionValue = 0;
  let nearestLiquidationSymbol: string | null = null;
  let nearestLiquidationDistancePercent: number | null = null;

  positions.forEach((item) => {
    const size = parseNumberLoose(item.position.szi);
    const absValue = Math.abs(parseNumberLoose(item.position.positionValue));
    const mark =
      marketsMap.get(`${item.position.coin}-USDC`)?.mark ??
      marketsMap.get(`${item.position.coin}-USDC`)?.lastPrice ??
      null;
    const liquidation = parseNumberLoose(item.position.liquidationPx);

    if (size >= 0) {
      longExposureUsd += absValue;
      netExposureUsd += absValue;
    } else {
      shortExposureUsd += absValue;
      netExposureUsd -= absValue;
    }

    if (absValue > largestPositionValue) {
      largestPositionValue = absValue;
      largestPositionSymbol = item.position.coin;
    }

    if (mark != null && liquidation > 0) {
      const distancePct = Math.abs((mark - liquidation) / mark) * 100;
      if (
        nearestLiquidationDistancePercent == null ||
        distancePct < nearestLiquidationDistancePercent
      ) {
        nearestLiquidationDistancePercent = distancePct;
        nearestLiquidationSymbol = item.position.coin;
      }
    }
  });

  const grossExposureUsd = longExposureUsd + shortExposureUsd;
  const largestPositionSharePercent =
    grossExposureUsd > 0 ? (largestPositionValue / grossExposureUsd) * 100 : 0;

  return {
    netExposureUsd,
    grossExposureUsd,
    longExposureUsd,
    shortExposureUsd,
    largestPositionSymbol,
    largestPositionSharePercent,
    nearestLiquidationSymbol,
    nearestLiquidationDistancePercent,
  };
}

export function buildExecutionQuality(
  openOrders: OpenOrder[],
  historicalOrders: HistoricalOrder[],
  trades: TradeHistory[],
): HomeExecutionQuality {
  const now = Date.now();
  let workingNotionalUsd = 0;
  let reduceOnlyCount = 0;
  let staleOrdersCount = 0;

  openOrders.forEach((order) => {
    const row = order as Record<string, unknown>;
    const size = Math.abs(parseNumberLoose(row.sz));
    const limitPx = parseNumberLoose(row.limitPx);
    if (size > 0 && limitPx > 0) {
      workingNotionalUsd += size * limitPx;
    }
    if (Boolean(row.reduceOnly)) reduceOnlyCount += 1;
    const ts = parseNumberLoose(row.timestamp);
    if (ts > 0 && now - ts > 4 * 60 * 60 * 1000) staleOrdersCount += 1;
  });

  const recentHistory = historicalOrders.slice(0, 120);
  const filledCount = recentHistory.filter(
    (item) => String(item.status).toLowerCase() === "filled",
  ).length;
  const cancelCount = recentHistory.filter((item) =>
    String(item.status).toLowerCase().includes("cancel"),
  ).length;
  const decidedCount = filledCount + cancelCount;

  return {
    openOrderCount: openOrders.length,
    workingNotionalUsd,
    reduceOnlyRatioPercent:
      openOrders.length > 0 ? (reduceOnlyCount / openOrders.length) * 100 : 0,
    staleOrdersCount,
    recentTradesCount: trades.slice(0, 100).length,
    fillRatePercent: decidedCount > 0 ? (filledCount / decidedCount) * 100 : 0,
    cancelRatePercent:
      decidedCount > 0 ? (cancelCount / decidedCount) * 100 : 0,
  };
}

export function buildFundingCarry(
  positions: Position[],
  fundings: FundingHistory[],
  marketsMap: Map<string, PerpetualMarket>,
): HomeFundingCarry {
  const recentFundings = fundings.slice(0, 100);
  const netFundingPaidUsd = recentFundings.reduce(
    (acc, item) => acc + parseNumberLoose(item.delta.usdc),
    0,
  );

  let weightedFundingRate8hPercent = 0;
  let projectedNextFundingUsd = 0;
  let dominantFundingSymbol: string | null = null;
  let dominantFundingRate8hPercent: number | null = null;
  let dominantMagnitude = 0;
  let weightTotal = 0;

  positions.forEach((position) => {
    const symbol = `${position.position.coin}-USDC`;
    const market = marketsMap.get(symbol);
    const funding8h = market?.funding8hour ?? 0;
    const notional = Math.abs(parseNumberLoose(position.position.positionValue));
    if (notional <= 0) return;

    projectedNextFundingUsd += (notional * funding8h) / 100;
    weightedFundingRate8hPercent += funding8h * notional;
    weightTotal += notional;

    const magnitude = Math.abs(funding8h * notional);
    if (magnitude > dominantMagnitude) {
      dominantMagnitude = magnitude;
      dominantFundingSymbol = position.position.coin;
      dominantFundingRate8hPercent = funding8h;
    }
  });

  return {
    netFundingPaidUsd,
    weightedFundingRate8hPercent:
      weightTotal > 0 ? weightedFundingRate8hPercent / weightTotal : 0,
    projectedNextFundingUsd,
    dominantFundingSymbol,
    dominantFundingRate8hPercent,
  };
}

export function buildMarketStructure(
  marketsMap: Map<string, PerpetualMarket>,
): HomeMarketStructure {
  const rows = Array.from(marketsMap.values()).filter(
    (item) =>
      item.change24hPer != null &&
      item.volume24h != null &&
      item.openInterest != null,
  );

  if (rows.length === 0) {
    return {
      breadthPercent: 0,
      medianChangePercent: 0,
      averageFunding8hPercent: 0,
      topVolumeSymbol: null,
      topOpenInterestSymbol: null,
      volatilityRegime: "LOW",
      downsidePressure: "LOW",
    };
  }

  const gainers = rows.filter((item) => (item.change24hPer ?? 0) > 0).length;
  const breadthPercent = (gainers / rows.length) * 100;
  const sortedChanges = rows
    .map((item) => item.change24hPer ?? 0)
    .sort((a, b) => a - b);
  const middle = Math.floor(sortedChanges.length / 2);
  const medianChangePercent =
    sortedChanges.length % 2 === 0
      ? (sortedChanges[middle - 1] + sortedChanges[middle]) / 2
      : sortedChanges[middle];
  const averageFunding8hPercent =
    rows.reduce((acc, item) => acc + (item.funding8hour ?? 0), 0) / rows.length;
  const topVolume = [...rows].sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0))[0];
  const topOpenInterest = [...rows].sort(
    (a, b) => (b.openInterest ?? 0) - (a.openInterest ?? 0),
  )[0];

  const avgAbsMove =
    rows.reduce((acc, item) => acc + Math.abs(item.change24hPer ?? 0), 0) /
    rows.length;
  const downsideShare =
    rows.filter((item) => (item.change24hPer ?? 0) < -2).length / rows.length;

  return {
    breadthPercent,
    medianChangePercent,
    averageFunding8hPercent,
    topVolumeSymbol: topVolume?.coin ?? null,
    topOpenInterestSymbol: topOpenInterest?.coin ?? null,
    volatilityRegime:
      avgAbsMove < 1.5 ? "LOW" : avgAbsMove < 4 ? "MEDIUM" : "HIGH",
    downsidePressure:
      downsideShare < 0.2 ? "LOW" : downsideShare < 0.45 ? "MEDIUM" : "HIGH",
  };
}
