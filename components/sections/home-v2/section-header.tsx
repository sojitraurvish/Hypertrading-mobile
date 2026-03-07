import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { HOME_V2_COLORS } from "./theme";

type SectionHeaderProps = {
  title: string;
  onPressAction?: () => void;
  actionLabel?: string;
  className?: string;
  titleClassName?: string;
  actionClassName?: string;
  actionColor?: string;
};

export function SectionHeader({
  title,
  onPressAction,
  actionLabel = "See all",
  className = "",
  titleClassName = "",
  actionClassName = "",
  actionColor = HOME_V2_COLORS.accent,
}: SectionHeaderProps) {
  return (
    <View className={`mb-3.5 flex-row items-center justify-between ${className}`}>
      <AppText
        variant={VARIANT_TYPES.NONARY}
        className={`text-[10px] tracking-[2.8px] text-text-tertiary-dark ${titleClassName}`}
      >
        {title}
      </AppText>
      {onPressAction ? (
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={onPressAction}
          className="flex-row items-center"
        >
          <AppText
            variant={VARIANT_TYPES.NONARY}
            className={`mr-1 text-[10px] text-text-quaternary-dark ${actionClassName}`}
          >
            {actionLabel.toUpperCase()}
          </AppText>
          <Feather name="arrow-right" size={13} color={actionColor} />
        </AppButton>
      ) : null}
    </View>
  );
}
