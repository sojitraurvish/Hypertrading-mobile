import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-6",
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
  const color = isPositive ? "bg-[#50fa7b]" : "bg-[#ef4444]";
  // Simple visual representation of a mini chart
  const heights = [12, 16, 10, 18, 14, 8, 16, 12, 6, 14];

  return (
    <View className="flex-row items-end gap-[2px] h-8">
      {heights.map((h, i) => (
        <View
          key={i}
          className={cn("w-[3px] rounded-full opacity-70", color)}
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
      <View className="flex-row items-center justify-between mb-3">
        <AppText
          variant={VARIANT_TYPES.TERTIARY}
          className="text-[11px]"
        >
          WATCHLIST
        </AppText>
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={onSeeAll}
        >
          <AppText
            variant={VARIANT_TYPES.QUATERNARY}
            className="text-xs font-bold"
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
            className="flex-row items-center py-3 px-4"
          >
            {/* Coin Icon */}
            <View
              className={cn(
                "w-10 h-10 rounded-full items-center justify-center mr-3",
                item.iconBgColor
              )}
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-black font-bold text-base"
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
