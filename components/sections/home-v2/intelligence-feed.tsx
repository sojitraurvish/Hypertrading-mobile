import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import type { HomeIntelItem } from "@/types/home";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { SectionHeader } from "./section-header";
import { HOME_V2_COLORS } from "./theme";

type IntelligenceFeedProps = {
  items: HomeIntelItem[];
  onPressSeeMore?: () => void;
  onPressItem?: (item: HomeIntelItem) => void;
  compact?: boolean;
};

export function IntelligenceFeed({
  items,
  onPressSeeMore,
  onPressItem,
  compact = false,
}: IntelligenceFeedProps) {
  return (
    <View className="mx-4 mb-8">
      <SectionHeader
        title="Live Intelligence"
        onPressAction={onPressSeeMore}
        actionLabel="More"
      />
      <View className="gap-3">
        {items.map((item) => {
          const iconColor =
            item.tone === "positive"
              ? HOME_V2_COLORS.positive
              : item.tone === "negative"
                ? HOME_V2_COLORS.negative
                : HOME_V2_COLORS.iconMuted;
          return (
            <AppButton
              key={item.id}
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() => onPressItem?.(item)}
            >
              <AppCard
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={`rounded-[24px] border border-border-primary-dark bg-bg-tertiary-dark ${
                  compact ? "p-3" : "p-3.5"
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`mr-3 items-center justify-center rounded-2xl bg-bg-quaternary-dark ${
                      compact ? "h-10 w-10" : "h-12 w-12"
                    }`}
                  >
                    <Feather name="zap" size={compact ? 16 : 18} color={iconColor} />
                  </View>
                  <View className="flex-1">
                    <AppText
                      variant={VARIANT_TYPES.QUATERNARY}
                      className={`${compact ? "text-[13px]" : "text-[14px]"} text-text-primary-dark`}
                      numberOfLines={1}
                    >
                      {item.title}
                    </AppText>
                    <AppText variant={VARIANT_TYPES.SENARY} className="mt-1 text-text-senary-dark">
                      {item.subtitle}
                    </AppText>
                  </View>
                  <AppText variant={VARIANT_TYPES.SENARY} className="text-text-tertiary-dark">
                    {item.ageLabel}
                  </AppText>
                </View>
              </AppCard>
            </AppButton>
          );
        })}
      </View>
    </View>
  );
}
