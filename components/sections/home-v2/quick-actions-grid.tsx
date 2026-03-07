import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import type { HomeQuickAction } from "@/types/home";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { SectionHeader } from "./section-header";
import { HOME_V2_COLORS } from "./theme";

type QuickActionsGridProps = {
  actions: HomeQuickAction[];
  onPressSeeAll?: () => void;
  compact?: boolean;
  columns?: 2 | 3;
};

export function QuickActionsGrid({
  actions,
  onPressSeeAll,
  compact = false,
  columns = 2,
}: QuickActionsGridProps) {
  const twoCol = columns === 2;
  return (
    <View className="mx-4 mb-6">
      <SectionHeader
        title="Quick Actions"
        onPressAction={onPressSeeAll}
        actionLabel="More"
      />
      <View className="flex-row flex-wrap justify-between">
        {actions.map((action) => (
          <AppButton
            key={action.id}
            variant={VARIANT_TYPES.NOT_SELECTED}
            className={`mb-3.5 ${twoCol ? "w-[48.5%]" : "w-[32%]"}`}
            onPress={action.onPress}
          >
            <AppCard
              variant={VARIANT_TYPES.NOT_SELECTED}
              className={`rounded-[24px] border border-border-primary-dark/20 bg-bg-tertiary-dark ${
                compact ? "px-3 py-3.5" : "px-4 py-4"
              }`}
            >
              <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-bg-quaternary-dark">
                <Feather name={action.icon} size={17} color={HOME_V2_COLORS.accent} />
              </View>
              <AppText
                variant={VARIANT_TYPES.QUATERNARY}
                className={`${compact ? "text-[14px]" : "text-[16px]"} tracking-[0.4px] text-text-primary-dark`}
                numberOfLines={1}
              >
                {action.label}
              </AppText>
            </AppCard>
          </AppButton>
        ))}
      </View>
    </View>
  );
}
