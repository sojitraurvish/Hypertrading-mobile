export type HomeTimeframe = "1D" | "1W" | "1M" | "ALL";

export type HomeStatCard = {
  id: string;
  label: string;
  value: string;
  changeLabel?: string;
  tone: "positive" | "negative" | "neutral";
};

export type HomeMoverItem = {
  symbol: string;
  lastPrice: number;
  changePercent: number;
  volume24h: number;
};

export type HomeAllocationSlice = {
  symbol: string;
  weight: number;
  color: string;
  value: number;
};

export type HomeWatchlistItem = {
  symbol: string;
  lastPrice: number;
  changePercent: number;
  funding8hPercent: number | null;
  openInterest: number | null;
  volume24h: number | null;
};

export type HomeQuickAction = {
  id: string;
  label: string;
  icon: "bar-chart-2" | "shield" | "award" | "gift";
  onPress: () => void;
};

export type HomeIntelItem = {
  id: string;
  title: string;
  subtitle: string;
  ageLabel: string;
  tone: "positive" | "negative" | "neutral";
};

export type HomeSentiment = {
  score: number;
  label: "EXTREME_FEAR" | "FEAR" | "NEUTRAL" | "GREED" | "EXTREME_GREED";
  volatility: "LOW" | "MEDIUM" | "HIGH";
  volume: "LOW" | "MEDIUM" | "HIGH";
  momentum: "BEARISH" | "NEUTRAL" | "BULLISH";
};

export type HomeRiskSnapshot = {
  netExposureUsd: number;
  grossExposureUsd: number;
  longExposureUsd: number;
  shortExposureUsd: number;
  largestPositionSymbol: string | null;
  largestPositionSharePercent: number;
  nearestLiquidationSymbol: string | null;
  nearestLiquidationDistancePercent: number | null;
};

export type HomeExecutionQuality = {
  openOrderCount: number;
  workingNotionalUsd: number;
  reduceOnlyRatioPercent: number;
  staleOrdersCount: number;
  recentTradesCount: number;
  fillRatePercent: number;
  cancelRatePercent: number;
};

export type HomeFundingCarry = {
  netFundingPaidUsd: number;
  weightedFundingRate8hPercent: number;
  projectedNextFundingUsd: number;
  dominantFundingSymbol: string | null;
  dominantFundingRate8hPercent: number | null;
};

export type HomeMarketStructure = {
  breadthPercent: number;
  medianChangePercent: number;
  averageFunding8hPercent: number;
  topVolumeSymbol: string | null;
  topOpenInterestSymbol: string | null;
  volatilityRegime: "LOW" | "MEDIUM" | "HIGH";
  downsidePressure: "LOW" | "MEDIUM" | "HIGH";
};
