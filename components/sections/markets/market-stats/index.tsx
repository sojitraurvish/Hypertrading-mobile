import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "flex-row gap-3 mx-4 mt-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type StatItem = {
  label: string;
  value: string;
  changePercent?: string;
  isPositive?: boolean;
};

type Props = {
  variant?: VariantKeys;
  stats?: StatItem[];
  className?: string;
};

const DEFAULT_STATS: StatItem[] = [
  {
    label: "24H VOLUME",
    value: "$48.2B",
    changePercent: "+12.4%",
    isPositive: true,
  },
  {
    label: "OPEN INTEREST",
    value: "$18.7B",
    changePercent: "-2.1%",
    isPositive: false,
  },
  {
    label: "MARKETS",
    value: "148",
  },
];

export const MarketStats: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  stats = DEFAULT_STATS,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      {stats.map((stat, index) => (
        <AppCard
          key={index}
          variant={VARIANT_TYPES.SENARY}
          className="bg-bg-quaternary-dark rounded-2xl p-4"
        >
          <AppText
            variant={VARIANT_TYPES.TERTIARY}
            className="text-[9px] mb-2"
          >
            {stat.label}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-text-primary-dark text-lg font-bold"
          >
            {stat.value}
          </AppText>
          {stat.changePercent && (
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "text-[10px] font-medium mt-1",
                stat.isPositive
                  ? "text-text-quaternary-dark"
                  : "text-text-senary-dark"
              )}
            >
              {stat.changePercent}
            </AppText>
          )}
        </AppCard>
      ))}
    </View>
  );
};

export default MarketStats;
