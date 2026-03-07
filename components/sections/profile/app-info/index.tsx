import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-8 mb-6",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  appVersion?: string;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  className?: string;
};

export const AppInfo: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  appVersion = "1.0.0",
  onTermsPress,
  onPrivacyPress,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className, "items-center")}>
      <View className="w-12 h-12 bg-accent-green rounded-2xl items-center justify-center mb-3">
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-black font-bold text-lg"
        >
          H
        </AppText>
      </View>

      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="text-text-primary-dark font-bold text-sm"
      >
        Hypertrading
      </AppText>

      <AppText variant={VARIANT_TYPES.DENARY} className="text-[10px] mt-1">
        Version {appVersion}
      </AppText>

      <View className="flex-row items-center gap-4 mt-4">
        <AppButton variant={VARIANT_TYPES.NOT_SELECTED} onPress={onTermsPress}>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-accent-green text-[11px] underline"
          >
            Terms of Service
          </AppText>
        </AppButton>

        <AppText variant={VARIANT_TYPES.DENARY} className="text-[10px]">
          •
        </AppText>

        <AppButton variant={VARIANT_TYPES.NOT_SELECTED} onPress={onPrivacyPress}>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-accent-green text-[11px] underline"
          >
            Privacy Policy
          </AppText>
        </AppButton>
      </View>
    </View>
  );
};

export default AppInfo;
