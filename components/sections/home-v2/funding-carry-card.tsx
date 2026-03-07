import { formatSignedPercent, formatSignedUsd } from "@/lib/home/formatters";
import type { HomeFundingCarry } from "@/types/home";
import React from "react";
import { View } from "react-native";
import { InsightCard, type InsightRow } from "./insight-card";
import { SectionHeader } from "./section-header";

type FundingCarryCardProps = {
  carry: HomeFundingCarry;
  compact?: boolean;
};

export function FundingCarryCard({ carry, compact = false }: FundingCarryCardProps) {
  const rows: InsightRow[] = [
    {
      label: "Net Funding (Recent)",
      value: formatSignedUsd(carry.netFundingPaidUsd),
      tone: carry.netFundingPaidUsd >= 0 ? "positive" : "negative",
    },
    {
      label: "Weighted 8h Rate",
      value: formatSignedPercent(carry.weightedFundingRate8hPercent, 4),
      tone: carry.weightedFundingRate8hPercent >= 0 ? "positive" : "negative",
    },
    {
      label: "Next Funding Estimate",
      value: formatSignedUsd(carry.projectedNextFundingUsd),
      tone: carry.projectedNextFundingUsd >= 0 ? "positive" : "negative",
    },
    {
      label: "Dominant Funding Asset",
      value:
        carry.dominantFundingSymbol == null ||
        carry.dominantFundingRate8hPercent == null
          ? "—"
          : `${carry.dominantFundingSymbol} (${formatSignedPercent(
              carry.dominantFundingRate8hPercent,
              4,
            )})`,
    },
  ];

  return (
    <View className="mx-4 mb-6">
      <SectionHeader title="Funding Carry" />
      <InsightCard
        title="FUNDING IMPACT"
        subtitle="Carry contribution from open exposure"
        rows={rows}
        compact={compact}
      />
    </View>
  );
}
