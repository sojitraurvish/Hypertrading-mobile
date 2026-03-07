import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-3",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  className?: string;
};

export const WalletStatus: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      <AppCard variant={VARIANT_TYPES.TERTIARY}>
        <View className="items-center py-2">
          <View className="w-14 h-14 rounded-3xl bg-bg-quaternary-dark items-center justify-center mb-4">
            <Feather name="link" size={22} color="#4ade80" />
          </View>
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-text-primary-dark text-base font-semibold mb-1"
          >
            Connect Wallet
          </AppText>
          <AppText
            variant={VARIANT_TYPES.SECONDARY}
            className="text-center mb-4"
          >
            Link your wallet to start trading
          </AppText>
          <AppButton
            variant={VARIANT_TYPES.DENARY}
            className="w-full bg-bg-senary-dark rounded-2xl"
            onPress={() => {
              // TODO: implement wallet connection
            }}
          >
            <Feather
              name="zap"
              size={16}
              color="#000000"
              style={{ marginRight: 8 }}
            />
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-black font-bold text-sm"
            >
              Connect Wallet
            </AppText>
          </AppButton>
        </View>
      </AppCard>
    </View>
  );
};

export default WalletStatus;
