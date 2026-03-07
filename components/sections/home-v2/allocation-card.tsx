import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { formatUsdCompact } from "@/lib/home/formatters";
import type { HomeAllocationSlice } from "@/types/home";
import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { SectionHeader } from "./section-header";
import { HOME_V2_COLORS } from "./theme";

type AllocationCardProps = {
  slices: HomeAllocationSlice[];
  compact?: boolean;
};

const RADIUS = 52;
const STROKE_WIDTH = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AllocationCard({ slices, compact = false }: AllocationCardProps) {
  let offsetAccumulator = 0;

  return (
    <View className="mx-4 mb-6">
      <SectionHeader title="Allocation" />
      <AppCard
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="rounded-[30px] border border-border-primary-dark/20 bg-bg-tertiary-dark p-5"
      >
        <View className={compact ? "items-center" : "flex-row items-center"}>
          <View
            className={
              compact ? "mb-3 items-center justify-center" : "mr-4 items-center justify-center"
            }
          >
            <Svg
              width={compact ? 126 : 140}
              height={compact ? 126 : 140}
              viewBox="0 0 140 140"
            >
              <Circle
                cx={70}
                cy={70}
                r={RADIUS}
                stroke={HOME_V2_COLORS.ringTrack}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              {slices.map((slice) => {
                const length = CIRCUMFERENCE * Math.max(0, Math.min(1, slice.weight));
                const segmentOffset = CIRCUMFERENCE - offsetAccumulator;
                offsetAccumulator += length;
                return (
                  <Circle
                    key={slice.symbol}
                    cx={70}
                    cy={70}
                    r={RADIUS}
                    stroke={slice.color}
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                    strokeLinecap="butt"
                    strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                    strokeDashoffset={segmentOffset}
                    rotation={-90}
                    origin="70, 70"
                  />
                );
              })}
              <Circle cx={70} cy={70} r={33} fill={HOME_V2_COLORS.surfaceInner} />
            </Svg>
          </View>
          <View className="flex-1 gap-2">
            {slices.map((slice) => (
              <View
                key={`legend-${slice.symbol}`}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View
                    className="mr-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <AppText
                    variant={VARIANT_TYPES.QUATERNARY}
                    className={`${compact ? "text-[13px]" : ""} text-text-primary-dark`}
                    numberOfLines={1}
                  >
                    {slice.symbol}
                  </AppText>
                </View>
                <AppText
                  variant={VARIANT_TYPES.SENARY}
                  className={`${compact ? "text-[11px]" : ""} text-text-senary-dark`}
                  numberOfLines={1}
                >
                  {Math.round(slice.weight * 100)}% · {formatUsdCompact(slice.value)}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </AppCard>
    </View>
  );
}
