import { formatSignedPercent, formatUsd } from "@/lib/home/formatters";
import type { HomeRiskSnapshot } from "@/types/home";
import React from "react";
import { View } from "react-native";
import { InsightCard, type InsightRow } from "./insight-card";
import { SectionHeader } from "./section-header";

type RiskSnapshotCardProps = {
  risk: HomeRiskSnapshot;
  compact?: boolean;
};

export function RiskSnapshotCard({ risk, compact = false }: RiskSnapshotCardProps) {
  const rows: InsightRow[] = [
    {
      label: "Net Exposure",
      value: formatUsd(risk.netExposureUsd, 0),
      tone: risk.netExposureUsd >= 0 ? "positive" : "negative",
    },
    { label: "Gross Exposure", value: formatUsd(risk.grossExposureUsd, 0) },
    { label: "Long / Short", value: `${formatUsd(risk.longExposureUsd, 0)} / ${formatUsd(risk.shortExposureUsd, 0)}` },
    {
      label: "Largest Position",
      value:
        risk.largestPositionSymbol == null
          ? "—"
          : `${risk.largestPositionSymbol} (${formatSignedPercent(
              risk.largestPositionSharePercent,
              1,
            )})`,
    },
    {
      label: "Nearest Liquidation",
      value:
        risk.nearestLiquidationSymbol == null ||
        risk.nearestLiquidationDistancePercent == null
          ? "—"
          : `${risk.nearestLiquidationSymbol} ${risk.nearestLiquidationDistancePercent.toFixed(
              2,
            )}%`,
      tone:
        risk.nearestLiquidationDistancePercent != null &&
        risk.nearestLiquidationDistancePercent < 8
          ? "negative"
          : "default",
    },
  ];

  return (
    <View className="mx-4 mb-6">
      <SectionHeader title="Risk Snapshot" />
      <InsightCard
        title="PORTFOLIO RISK"
        subtitle="Exposure and liquidation proximity"
        rows={rows}
        compact={compact}
      />
    </View>
  );
}
