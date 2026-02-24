import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
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
  iconName: keyof typeof Feather.glyphMap;
  valueColor?: string;
};

type Props = {
  variant?: VariantKeys;
  stats?: StatItem[];
  className?: string;
};

const DEFAULT_STATS: StatItem[] = [
  {
    label: "TOTAL TRADES",
    value: "0",
    iconName: "activity",
  },
  {
    label: "WIN RATE",
    value: "0%",
    iconName: "target",
    valueColor: "text-text-quaternary-dark",
  },
  {
    label: "TOTAL PNL",
    value: "$0.00",
    iconName: "trending-up",
  },
];

export const AccountStats: React.FC<Props> = ({
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
          <View className="w-10 h-10 items-center justify-center bg-bg-septenary-dark rounded-xl mb-3">
            <Feather name={stat.iconName} size={18} color="#50fa7b" />
          </View>
          <AppText variant={VARIANT_TYPES.TERTIARY} className="text-[9px] mb-1">
            {stat.label}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className={cn(
              "text-lg font-bold",
              stat.valueColor || "text-text-primary-dark"
            )}
          >
            {stat.value}
          </AppText>
        </AppCard>
      ))}
    </View>
  );
};

export default AccountStats;
