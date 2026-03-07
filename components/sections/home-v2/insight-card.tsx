import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import React from "react";
import { View } from "react-native";

export type InsightRow = {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
};

type InsightCardProps = {
  title: string;
  subtitle?: string;
  rows: InsightRow[];
  compact?: boolean;
};

function toneClassName(tone: InsightRow["tone"]) {
  if (tone === "positive") return "text-text-quaternary-dark";
  if (tone === "negative") return "text-text-senary-dark";
  return "text-text-primary-dark";
}

export function InsightCard({
  title,
  subtitle,
  rows,
  compact = false,
}: InsightCardProps) {
  return (
    <AppCard
      variant={VARIANT_TYPES.NOT_SELECTED}
      className={`rounded-[24px] border border-border-primary-dark bg-bg-tertiary-dark ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <AppText
        variant={VARIANT_TYPES.NONARY}
        className="text-[10px] tracking-[2.4px] text-text-tertiary-dark"
      >
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant={VARIANT_TYPES.SENARY} className="mt-1 text-text-senary-dark">
          {subtitle}
        </AppText>
      ) : null}
      <View className="mt-3 gap-2.5">
        {rows.map((row) => (
          <View key={`${title}-${row.label}`} className="flex-row items-center justify-between">
            <AppText
              variant={VARIANT_TYPES.SENARY}
              className={`${compact ? "text-[11px]" : "text-[12px]"} text-text-tertiary-dark`}
            >
              {row.label}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.QUATERNARY}
              className={`${compact ? "text-[12px]" : "text-[13px]"} ${toneClassName(row.tone)}`}
            >
              {row.value}
            </AppText>
          </View>
        ))}
      </View>
    </AppCard>
  );
}
