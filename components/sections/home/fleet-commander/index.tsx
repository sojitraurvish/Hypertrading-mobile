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
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-5",
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
        <View className="flex-row items-start justify-between mb-1.5">
          <View>
            <AppText
              variant={VARIANT_TYPES.NONARY}
              className="text-[10px] tracking-[2.8px] mb-1.5"
            >
              {subtitle}
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-primary-dark text-[28px] leading-[34px] font-bold"
            >
              {title}
            </AppText>
          </View>

          <AppButton
            variant={VARIANT_TYPES.QUATERNARY}
            className="w-11 h-11 items-center justify-center bg-bg-quaternary-dark rounded-2xl border border-border-primary-dark/20"
            onPress={onNotificationPress}
          >
            <Ionicons name="notifications-outline" size={20} color="#4b5563" />
          </AppButton>
        </View>
      </AppCard>
    </View>
  );
};

export default FleetCommander;
