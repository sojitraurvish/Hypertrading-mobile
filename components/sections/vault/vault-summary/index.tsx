import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-4",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  totalDeposited?: string;
  totalEarned?: string;
  activeVaults?: number;
  className?: string;
};

export const VaultSummary: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  totalDeposited = "$0.00",
  totalEarned = "$0.00",
  activeVaults = 0,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      <AppCard variant={VARIANT_TYPES.TERTIARY}>
        <View className="flex-row items-center justify-between">
          {/* Total Deposited */}
          <View className="flex-1 items-center">
            <View className="w-10 h-10 items-center justify-center bg-bg-septenary-dark rounded-xl mb-3">
              <Feather name="lock" size={18} color="#50fa7b" />
            </View>
            <AppText variant={VARIANT_TYPES.TERTIARY} className="text-[9px] mb-1">
              DEPOSITED
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-primary-dark text-lg font-bold"
            >
              {totalDeposited}
            </AppText>
          </View>

          {/* Divider */}
          <View className="w-px h-16 bg-border-primary-dark" />

          {/* Total Earned */}
          <View className="flex-1 items-center">
            <View className="w-10 h-10 items-center justify-center bg-bg-septenary-dark rounded-xl mb-3">
              <Feather name="trending-up" size={18} color="#50fa7b" />
            </View>
            <AppText variant={VARIANT_TYPES.TERTIARY} className="text-[9px] mb-1">
              EARNED
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-quaternary-dark text-lg font-bold"
            >
              {totalEarned}
            </AppText>
          </View>

          {/* Divider */}
          <View className="w-px h-16 bg-border-primary-dark" />

          {/* Active Vaults */}
          <View className="flex-1 items-center">
            <View className="w-10 h-10 items-center justify-center bg-bg-septenary-dark rounded-xl mb-3">
              <Feather name="layers" size={18} color="#50fa7b" />
            </View>
            <AppText variant={VARIANT_TYPES.TERTIARY} className="text-[9px] mb-1">
              ACTIVE
            </AppText>
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-primary-dark text-lg font-bold"
            >
              {activeVaults}
            </AppText>
          </View>
        </View>
      </AppCard>
    </View>
  );
};

export default VaultSummary;
