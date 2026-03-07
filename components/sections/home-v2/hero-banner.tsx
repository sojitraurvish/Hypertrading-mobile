import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { HOME_V2_COLORS } from "./theme";

type HeroBannerProps = {
  onPressNotifications: () => void;
  compact?: boolean;
};

export function HeroBanner({
  onPressNotifications,
  compact = false,
}: HeroBannerProps) {
  return (
    <View className="mb-4 px-4 pt-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <AppText
            variant={VARIANT_TYPES.NONARY}
            className="text-[10px] tracking-[2.8px] text-text-quaternary-dark"
          >
            FLEET COMMANDER
          </AppText>
          <AppText
            variant={VARIANT_TYPES.QUINARY}
            className={compact ? "mt-1 text-[48px] leading-[50px]" : "mt-1 text-[52px] leading-[54px]"}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            Terminal
          </AppText>
        </View>
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="h-14 w-14 items-center justify-center rounded-2xl border border-border-primary-dark bg-bg-quaternary-dark"
          onPress={onPressNotifications}
          accessibilityLabel="Open notifications"
        >
          <Feather name="bell" size={19} color={HOME_V2_COLORS.accent} />
        </AppButton>
      </View>
    </View>
  );
}
