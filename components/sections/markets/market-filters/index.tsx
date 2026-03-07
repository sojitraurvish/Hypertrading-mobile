import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View, ScrollView } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mt-3 mx-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type FilterItem = {
  label: string;
  value: string;
};

type Props = {
  variant?: VariantKeys;
  filters?: FilterItem[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  className?: string;
};

const DEFAULT_FILTERS: FilterItem[] = [
  { label: "All", value: "all" },
  { label: "Favorites", value: "favorites" },
  { label: "Top Gainers", value: "gainers" },
  { label: "Top Losers", value: "losers" },
];

export const MarketFilters: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  filters = DEFAULT_FILTERS,
  activeFilter = "all",
  onFilterChange,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 12 }}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <AppButton
              key={filter.value}
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={cn(
                "px-4 py-2.5 rounded-full border",
                isActive
                  ? "bg-accent-green border-accent-green"
                  : "bg-bg-tertiary-dark border-border-primary-dark/20",
              )}
              onPress={() => onFilterChange?.(filter.value)}
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[1.5px]",
                  isActive ? "text-black" : "text-text-septenary-dark",
                )}
              >
                {filter.label}
              </AppText>
            </AppButton>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default MarketFilters;
