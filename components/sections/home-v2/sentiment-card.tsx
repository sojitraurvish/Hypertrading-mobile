import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import type { HomeSentiment } from "@/types/home";
import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { SectionHeader } from "./section-header";
import { HOME_V2_COLORS } from "./theme";

type SentimentCardProps = {
  sentiment: HomeSentiment;
  compact?: boolean;
};

export function SentimentCard({ sentiment, compact = false }: SentimentCardProps) {
  const score = Math.max(0, Math.min(100, sentiment.score));
  const circumference = 2 * Math.PI * 38;
  const progress = (score / 100) * circumference;

  return (
    <View className="mx-4 mb-6">
      <SectionHeader title="Market Sentiment" />
      <AppCard
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="rounded-[28px] border border-border-primary-dark bg-bg-tertiary-dark p-4"
      >
        <View className={compact ? "items-center" : "flex-row items-center"}>
          <View className={compact ? "mb-3 items-center justify-center" : "mr-5 items-center justify-center"}>
            <Svg width={compact ? 92 : 100} height={compact ? 92 : 100} viewBox="0 0 100 100">
              <Circle
                cx={50}
                cy={50}
                r={38}
                stroke={HOME_V2_COLORS.ringTrack}
                strokeWidth={9}
                fill="transparent"
              />
              <Circle
                cx={50}
                cy={50}
                r={38}
                stroke={HOME_V2_COLORS.positive}
                strokeWidth={9}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${progress} ${circumference - progress}`}
                rotation={-90}
                origin="50, 50"
              />
            </Svg>
            <View className="absolute items-center">
              <AppText
                variant={VARIANT_TYPES.QUINARY}
                className="text-[28px] leading-[32px] text-text-primary-dark"
              >
                {score}
              </AppText>
              <AppText
                variant={VARIANT_TYPES.NONARY}
                className="text-[10px] tracking-[1.8px] text-text-quaternary-dark"
              >
                {sentiment.label.replace("_", " ")}
              </AppText>
            </View>
          </View>

          <View className="flex-1 gap-2">
            <View className="flex-row items-center justify-between">
              <AppText
                variant={VARIANT_TYPES.NONARY}
                className={`${compact ? "text-[9px]" : ""} text-text-tertiary-dark`}
              >
                VOLATILITY
              </AppText>
              <AppText
                variant={VARIANT_TYPES.QUATERNARY}
                className={`${compact ? "text-[13px]" : ""} text-text-primary-dark`}
              >
                {sentiment.volatility}
              </AppText>
            </View>
            <View className="flex-row items-center justify-between">
              <AppText
                variant={VARIANT_TYPES.NONARY}
                className={`${compact ? "text-[9px]" : ""} text-text-tertiary-dark`}
              >
                VOLUME
              </AppText>
              <AppText
                variant={VARIANT_TYPES.QUATERNARY}
                className={`${compact ? "text-[13px]" : ""} text-text-primary-dark`}
              >
                {sentiment.volume}
              </AppText>
            </View>
            <View className="flex-row items-center justify-between">
              <AppText
                variant={VARIANT_TYPES.NONARY}
                className={`${compact ? "text-[9px]" : ""} text-text-tertiary-dark`}
              >
                MOMENTUM
              </AppText>
              <AppText
                variant={VARIANT_TYPES.QUATERNARY}
                className={`${compact ? "text-[13px]" : ""} text-text-quaternary-dark`}
              >
                {sentiment.momentum}
              </AppText>
            </View>
          </View>
        </View>
      </AppCard>
    </View>
  );
}
