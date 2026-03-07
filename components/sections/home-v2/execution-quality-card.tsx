import { formatSignedPercent, formatUsd } from "@/lib/home/formatters";
import type { HomeExecutionQuality } from "@/types/home";
import React from "react";
import { View } from "react-native";
import { InsightCard, type InsightRow } from "./insight-card";
import { SectionHeader } from "./section-header";

type ExecutionQualityCardProps = {
  execution: HomeExecutionQuality;
  compact?: boolean;
};

export function ExecutionQualityCard({
  execution,
  compact = false,
}: ExecutionQualityCardProps) {
  const rows: InsightRow[] = [
    { label: "Open Orders", value: `${execution.openOrderCount}` },
    { label: "Working Notional", value: formatUsd(execution.workingNotionalUsd, 0) },
    {
      label: "Reduce-Only Ratio",
      value: formatSignedPercent(execution.reduceOnlyRatioPercent, 1),
    },
    { label: "Stale Orders (4h+)", value: `${execution.staleOrdersCount}` },
    {
      label: "Fill / Cancel",
      value: `${execution.fillRatePercent.toFixed(1)}% / ${execution.cancelRatePercent.toFixed(1)}%`,
      tone:
        execution.fillRatePercent >= execution.cancelRatePercent
          ? "positive"
          : "negative",
    },
    { label: "Recent Trades", value: `${execution.recentTradesCount}` },
  ];

  return (
    <View className="mx-4 mb-6">
      <SectionHeader title="Execution Quality" />
      <InsightCard
        title="ORDER FLOW QUALITY"
        subtitle="Order efficiency and workflow health"
        rows={rows}
        compact={compact}
      />
    </View>
  );
}
