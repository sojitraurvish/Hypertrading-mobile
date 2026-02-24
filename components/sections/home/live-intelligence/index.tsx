import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-6 mb-6",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type IntelligenceItem = {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
};

type Props = {
  variant?: VariantKeys;
  items?: IntelligenceItem[];
  onSeeMore?: () => void;
  onItemPress?: (item: IntelligenceItem) => void;
  className?: string;
};

const DEFAULT_ITEMS: IntelligenceItem[] = [
  {
    id: "1",
    title: "LENDING RATE UPDATE",
    subtitle: "BTC-USDC APR: 4.82%",
    timeAgo: "2m",
    iconName: "flash",
    iconColor: "#000000",
    iconBgColor: "bg-bg-octonary-dark",
  },
  {
    id: "2",
    title: "LENDING RATE UPDATE",
    subtitle: "BTC-USDC APR: 4.82%",
    timeAgo: "7m",
    iconName: "flash",
    iconColor: "#000000",
    iconBgColor: "bg-bg-octonary-dark",
  },
];

export const LiveIntelligence: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  items = DEFAULT_ITEMS,
  onSeeMore,
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
          className="text-[11px]"
        >
          LIVE INTELLIGENCE
        </AppText>
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={onSeeMore}
        >
          <Ionicons name="arrow-forward" size={16} color="#6b7280" />
        </AppButton>
      </View>

      {/* Intelligence Items */}
      <View className="gap-3">
        {items.map((item) => (
          <AppButton
            key={item.id}
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={() => onItemPress?.(item)}
          >
            <AppCard
              variant={VARIANT_TYPES.QUINARY}
              className="flex-row items-center py-4 px-4"
            >
              {/* Icon */}
              <View
                className={cn(
                  "w-11 h-11 rounded-full items-center justify-center mr-3",
                  item.iconBgColor || "bg-bg-octonary-dark"
                )}
              >
                <Ionicons
                  name={item.iconName || "flash"}
                  size={20}
                  color={item.iconColor || "#000000"}
                />
              </View>

              {/* Content */}
              <View className="flex-1">
                <AppText
                  variant={VARIANT_TYPES.PRIMARY}
                  className="font-bold text-sm"
                >
                  {item.title}
                </AppText>
                <AppText
                  variant={VARIANT_TYPES.SECONDARY}
                  className="text-xs mt-0.5"
                >
                  {item.subtitle}
                </AppText>
              </View>

              {/* Time */}
              <AppText
                variant={VARIANT_TYPES.DENARY}
                className="text-text-octonary-dark text-xs"
              >
                {item.timeAgo}
              </AppText>
            </AppCard>
          </AppButton>
        ))}
      </View>
    </View>
  );
};

export default LiveIntelligence;
