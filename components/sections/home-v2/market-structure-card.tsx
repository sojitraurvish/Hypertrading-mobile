import { formatSignedPercent } from "@/lib/home/formatters";
import type { HomeMarketStructure } from "@/types/home";
import React from "react";
import { View } from "react-native";
import { InsightCard, type InsightRow } from "./insight-card";
import { SectionHeader } from "./section-header";

type MarketStructureCardProps = {
  structure: HomeMarketStructure;
  compact?: boolean;
};

export function MarketStructureCard({
  structure,
  compact = false,
}: MarketStructureCardProps) {
  const rows: InsightRow[] = [
    {
      label: "Market Breadth",
      value: `${structure.breadthPercent.toFixed(1)}% green`,
      tone: structure.breadthPercent >= 50 ? "positive" : "negative",
    },
    {
      label: "Median Move 24h",
      value: formatSignedPercent(structure.medianChangePercent, 2),
      tone: structure.medianChangePercent >= 0 ? "positive" : "negative",
    },
    {
      label: "Average Funding 8h",
      value: formatSignedPercent(structure.averageFunding8hPercent, 4),
      tone: structure.averageFunding8hPercent >= 0 ? "positive" : "negative",
    },
    { label: "Top Volume", value: structure.topVolumeSymbol ?? "—" },
    { label: "Top Open Interest", value: structure.topOpenInterestSymbol ?? "—" },
    {
      label: "Regime / Downside",
      value: `${structure.volatilityRegime} / ${structure.downsidePressure}`,
      tone:
        structure.downsidePressure === "HIGH"
          ? "negative"
          : structure.downsidePressure === "LOW"
            ? "positive"
            : "default",
    },
  ];

  return (
    <View className="mx-4 mb-6">
      <SectionHeader title="Market Structure" />
      <InsightCard
        title="BREADTH & LIQUIDITY"
        subtitle="Regime, momentum dispersion, and risk pressure"
        rows={rows}
        compact={compact}
      />
    </View>
  );
}
