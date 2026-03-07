import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-5",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type WatchlistItem = {
  symbol: string;
  iconLabel: string;
  iconBgColor: string;
  changePercent: string;
  isPositive: boolean;
  price: string;
};

type Props = {
  variant?: VariantKeys;
  items?: WatchlistItem[];
  onSeeAll?: () => void;
  onItemPress?: (item: WatchlistItem) => void;
  className?: string;
};

const DEFAULT_ITEMS: WatchlistItem[] = [
  {
    symbol: "BTC",
    iconLabel: "B",
    iconBgColor: "bg-bg-octonary-dark",
    changePercent: "-1.74%",
    isPositive: false,
    price: "$70,165.42",
  },
];

/** Mini sparkline placeholder using small views */
const MiniChart: React.FC<{ isPositive: boolean }> = ({ isPositive }) => {
  const color = isPositive ? "bg-accent-green" : "bg-accent-red";
  // Simple visual representation of a mini chart
  const heights = [10, 14, 8, 16, 12, 7, 15, 11, 5, 13];

  return (
    <View className="flex-row items-end gap-[2px] h-8">
      {heights.map((h, i) => (
        <View
          key={i}
          className={cn("w-[2.5px] rounded-full opacity-60", color)}
          style={{ height: h }}
        />
      ))}
    </View>
  );
};

export const Watchlist: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  items = DEFAULT_ITEMS,
  onSeeAll,
  onItemPress,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-4">
        <AppText
          variant={VARIANT_TYPES.TERTIARY}
          className="text-[10px] tracking-[2.5px]"
        >
          WATCHLIST
        </AppText>
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={onSeeAll}
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] font-bold text-accent-green tracking-[1.5px]"
          >
            SEE ALL
          </AppText>
        </AppButton>
      </View>

      {/* Watchlist Items */}
      {items.map((item, index) => (
        <AppButton
          key={index}
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={() => onItemPress?.(item)}
        >
          <AppCard
            variant={VARIANT_TYPES.QUINARY}
            className="flex-row items-center py-3.5 px-4"
          >
            {/* Coin Icon */}
            <View
              className={cn(
                "w-11 h-11 rounded-2xl items-center justify-center mr-3",
                item.iconBgColor
              )}
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-black font-bold text-[15px]"
              >
                {item.iconLabel}
              </AppText>
            </View>

            {/* Coin Info */}
            <View className="flex-1">
              <AppText
                variant={VARIANT_TYPES.PRIMARY}
                className="font-semibold text-sm"
              >
                {item.symbol}
              </AppText>
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-xs font-medium mt-0.5",
                  item.isPositive
                    ? "text-text-quaternary-dark"
                    : "text-text-senary-dark"
                )}
              >
                {item.changePercent}
              </AppText>
            </View>

            {/* Mini Chart */}
            <View className="mx-4">
              <MiniChart isPositive={item.isPositive} />
            </View>

            {/* Price */}
            <AppText
              variant={VARIANT_TYPES.PRIMARY}
              className="font-semibold text-sm"
            >
              {item.price}
            </AppText>
          </AppCard>
        </AppButton>
      ))}
    </View>
  );
};

export default Watchlist;
