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
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  title?: string;
  subtitle?: string;
  onNotificationPress?: () => void;
  className?: string;
};

export const FleetCommander: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  title = "Terminal",
  subtitle = "FLEET COMMANDER",
  onNotificationPress,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      <AppCard variant={VARIANT_TYPES.TERTIARY} className="relative">
        {/* Top Row: Label + Bell */}
        <View className="flex-row items-start justify-between mb-1">
          <View>
            <AppText
              variant={VARIANT_TYPES.NONARY}
              className="text-[10px] mb-1"
            >
              {subtitle}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-primary-dark text-4xl font-bold"
            >
              {title}
            </AppText>
          </View>

          {/* Notification Bell */}
          <AppButton
            variant={VARIANT_TYPES.QUATERNARY}
            className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-xl"
            onPress={onNotificationPress}
          >
            <Ionicons name="notifications-outline" size={20} color="#9ca3af" />
          </AppButton>
        </View>
      </AppCard>
    </View>
  );
};

export default FleetCommander;
