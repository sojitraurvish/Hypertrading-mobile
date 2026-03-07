import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import type { HomeTimeframe } from "@/types/home";
import React from "react";
import { View } from "react-native";

type PerformanceCardProps = {
  selectedTimeframe: HomeTimeframe;
  onChangeTimeframe: (next: HomeTimeframe) => void;
  performanceLabel: string;
  performanceValue: string;
  compact?: boolean;
  timeframes?: HomeTimeframe[];
};

const DEFAULT_TIMEFRAMES: HomeTimeframe[] = ["1D", "1W", "1M", "ALL"];

export function PerformanceCard({
  selectedTimeframe,
  onChangeTimeframe,
  performanceLabel,
  performanceValue,
  compact = false,
  timeframes = DEFAULT_TIMEFRAMES,
}: PerformanceCardProps) {
  return (
    <AppCard
      variant={VARIANT_TYPES.NOT_SELECTED}
      className="mx-4 mb-6 rounded-[28px] border border-border-primary-dark bg-bg-tertiary-dark px-4 py-4"
    >
      <View className="mb-1 flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <AppText
            variant={VARIANT_TYPES.NONARY}
            className="text-[10px] tracking-[2.5px] text-text-tertiary-dark"
          >
            PORTFOLIO PERFORMANCE
          </AppText>
          <AppText
            variant={VARIANT_TYPES.QUINARY}
            className={
              compact
                ? "mt-1.5 text-[36px] leading-[40px] text-text-quaternary-dark"
                : "mt-1.5 text-[40px] leading-[44px] text-text-quaternary-dark"
            }
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {performanceValue}
          </AppText>
          <AppText variant={VARIANT_TYPES.SENARY} className="mt-0.5 text-text-senary-dark">
            {performanceLabel}
          </AppText>
        </View>
        <View className="flex-row flex-wrap justify-end gap-1">
          {timeframes.map((frame) => {
            const active = frame === selectedTimeframe;
            return (
              <AppButton
                key={frame}
                variant={VARIANT_TYPES.NOT_SELECTED}
                onPress={() => onChangeTimeframe(frame)}
                className={`rounded-full px-2.5 py-1.5 ${
                  active ? "bg-bg-octonary-dark" : "bg-bg-quaternary-dark"
                }`}
              >
                <AppText
                  variant={VARIANT_TYPES.NONARY}
                  className={`text-[10px] tracking-[0.8px] ${
                    active ? "text-black" : "text-text-tertiary-dark"
                  }`}
                >
                  {frame}
                </AppText>
              </AppButton>
            );
          })}
        </View>
      </View>
    </AppCard>
  );
}
