import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "flex-row gap-3.5 mx-4 mt-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type StatItem = {
  label: string;
  value: string;
  iconName: "arrow-down-left" | "arrow-up-right";
  valueColor?: string;
};

type Props = {
  variant?: VariantKeys;
  stats?: StatItem[];
  className?: string;
};

const DEFAULT_STATS: StatItem[] = [
  {
    label: "LIQUID CAPITAL",
    value: "$0.00",
    iconName: "arrow-down-left",
  },
  {
    label: "SESSION PNL",
    value: "$0.00",
    iconName: "arrow-up-right",
    valueColor: "text-text-quaternary-dark",
  },
];

export const StatsCards: React.FC<Props> = ({
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
          className="bg-bg-tertiary-dark rounded-3xl p-4 border border-border-primary-dark/18"
        >
          {/* Icon */}
          <View className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-2xl mb-4">
            <Feather name={stat.iconName} size={20} color="#4ade80" />
          </View>

          {/* Label */}
          <AppText
            variant={VARIANT_TYPES.TERTIARY}
            className="text-[10px] tracking-[2.5px] mb-2"
          >
            {stat.label}
          </AppText>

          {/* Value */}
          <AppText
            variant={VARIANT_TYPES.OCTONARY}
            className={cn(
              "text-[20px] leading-[26px]",
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

export default StatsCards;
