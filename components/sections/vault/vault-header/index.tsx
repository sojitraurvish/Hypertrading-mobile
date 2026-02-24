import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  title?: string;
  subtitle?: string;
  onInfoPress?: () => void;
  className?: string;
};

export const VaultHeader: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  title = "Vaults",
  subtitle = "SECURE YIELD STRATEGIES",
  onInfoPress,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      <View className="flex-row items-start justify-between">
        <View>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-text-primary-dark text-3xl font-black"
          >
            {title}
          </AppText>
          <AppText
            variant={VARIANT_TYPES.NONARY}
            className="text-[10px] mt-1"
          >
            {subtitle}
          </AppText>
        </View>

        <AppButton
          variant={VARIANT_TYPES.QUATERNARY}
          className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-xl"
          onPress={onInfoPress}
        >
          <MaterialCommunityIcons name="information-outline" size={20} color="#9ca3af" />
        </AppButton>
      </View>
    </View>
  );
};

export default VaultHeader;
