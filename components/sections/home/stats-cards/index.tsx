import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "flex-row gap-3 mx-4 mt-3",
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
          className="bg-bg-quaternary-dark rounded-2xl p-4"
        >
          {/* Icon */}
          <View className="w-11 h-11 items-center justify-center bg-bg-septenary-dark rounded-xl mb-4">
            <Feather name={stat.iconName} size={20} color="#50fa7b" />
          </View>

          {/* Label */}
          <AppText
            variant={VARIANT_TYPES.TERTIARY}
            className="text-[10px] mb-2"
          >
            {stat.label}
          </AppText>

          {/* Value */}
          <AppText
            variant={VARIANT_TYPES.OCTONARY}
            className={cn(
              "text-xl",
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
