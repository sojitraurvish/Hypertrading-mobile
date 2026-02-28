import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAccount, useAppKit } from "@reown/appkit-react-native";
import React from "react";
import { Text, View } from "react-native";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]:
    "flex-row items-center justify-between px-4 py-3 bg-bg-primary-dark",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  portfolioValue?: string;
  currency?: string;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  className?: string;
};

export const HomeHeader: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  portfolioValue = "$12,450.80",
  currency = "USDC",
  onDeposit,
  onWithdraw,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  return (
    <View className={cn(baseClassName, className)}>
      {/* Left: Portfolio Value */}
      <View style={{ flex: 1 }} className="overflow-hidden mr-3">
        <AppText
          variant={VARIANT_TYPES.TERTIARY}
          className="text-text-tertiary-dark text-[10px] mb-1"
        >
          PORTFOLIO VALUE
        </AppText>
        <AppText
          variant={VARIANT_TYPES.QUINARY}
          className="text-text-primary-dark"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {portfolioValue}
          <Text className="text-text-tertiary-dark text-sm font-normal">
            {"  "}
            {currency}
          </Text>
        </AppText>
      </View>

      {/* Right: Action Buttons */}
      <View style={{ flexShrink: 0 }} className="flex-row items-center gap-2">
        {/* Deposit Button */}
        <AppButton
          variant={VARIANT_TYPES.QUATERNARY}
          className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-xl"
          onPress={onDeposit}
        >
          <MaterialCommunityIcons
            name="call-received"
            size={18}
            color="#50fa7b"
          />
        </AppButton>

        {/* Withdraw Button */}
        <AppButton
          variant={VARIANT_TYPES.QUATERNARY}
          className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-xl"
          onPress={onWithdraw}
        >
          <MaterialCommunityIcons name="call-made" size={18} color="red" />
        </AppButton>

        {/* Connect Wallet Button */}
        <AppButton
          variant={VARIANT_TYPES.TERTIARY}
          className="h-10 rounded-xl bg-bg-senary-dark px-3"
          onPress={() => open()}
        >
          <Ionicons
            name={isConnected ? "wallet" : "wallet-outline"}
            size={16}
            color="#000000"
          />
          <AppText
            variant={VARIANT_TYPES.QUATERNARY}
            className="ml-1.5 text-xs font-semibold text-black"
          >
            {isConnected && address ? truncateAddress(address) : "CONNECT"}
          </AppText>
        </AppButton>
      </View>
    </View>
  );
};

export default HomeHeader;
