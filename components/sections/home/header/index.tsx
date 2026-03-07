import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import { cn } from "@/lib/utils/tailwind-configs";
import { useBottomPannelStore } from "@/store/bottom-pannel";
import { Feather, Ionicons } from "@expo/vector-icons";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useAccount, useAppKit } from "@reown/appkit-react-native";
import React, { useEffect, useRef } from "react";
import { Text, View } from "react-native";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]:
    "flex-row items-center justify-between px-5 py-3.5 bg-bg-primary-dark",
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
  portfolioValue = "$0.00",
  currency = "USDC",
  onDeposit,
  onWithdraw,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const balances = useBottomPannelStore((state) => state.balances);

  const setBalances = useBottomPannelStore((state) => state.setBalances);
  const getLiveBalances = useBottomPannelStore(
    (state) => state.getLiveBalances,
  );
  const balancesSubscriptionRef = useRef<ISubscription | null>(null);

  useEffect(() => {
    if (!address) return;
    if (!address.startsWith("0x")) return;

    let isActive = true;
    balancesSubscriptionRef.current?.unsubscribe();
    balancesSubscriptionRef.current = null;

    const subscribe = async () => {
      const subscription = await getLiveBalances(
        address as `0x${string}`,
        setBalances,
      );

      if (!isActive) {
        subscription?.unsubscribe();
        return;
      }

      balancesSubscriptionRef.current = subscription;
    };

    void subscribe();

    return () => {
      isActive = false;
      balancesSubscriptionRef.current?.unsubscribe();
      balancesSubscriptionRef.current = null;
    };
  }, [address, getLiveBalances, setBalances]);

  return (
    <View className={cn(baseClassName, className)}>
      {/* Left: Portfolio Value */}
      <View style={{ flex: 1 }} className="overflow-hidden mr-3">
        <AppText
          variant={VARIANT_TYPES.TERTIARY}
          className="text-text-tertiary-dark text-[9px] tracking-[2px] mb-1.5"
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
          {addDecimals(
            Number(balances[0]?.available_balance.replace(/\s+[A-Za-z]+$/, "")), 2,
          ).toFixed(2)}
          <Text className="text-text-tertiary-dark text-xs font-normal">
            {"  "}
            {currency}
          </Text>
        </AppText>
      </View>

      {/* Right: Action Buttons */}
      <View style={{ flexShrink: 0 }} className="flex-row items-center gap-2.5">
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-2xl border border-border-primary-dark/20"
          onPress={onDeposit}
          accessibilityLabel="Open deposit modal"
        >
          <Feather name="arrow-down-left" size={16} color="#4ade80" />
        </AppButton>

        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="w-10 h-10 items-center justify-center bg-bg-quaternary-dark rounded-2xl border border-border-primary-dark/20"
          onPress={onWithdraw}
          accessibilityLabel="Open withdraw modal"
        >
          <Feather name="arrow-up-right" size={16} color="#f87171" />
        </AppButton>

        <AppButton
          variant={VARIANT_TYPES.TERTIARY}
          className="h-10 rounded-2xl bg-bg-senary-dark border border-transparent px-3.5"
          onPress={() => open()}
        >
          <Ionicons
            name={isConnected ? "wallet" : "wallet-outline"}
            size={15}
            color="#000000"
          />
          <AppText
            variant={VARIANT_TYPES.QUATERNARY}
            className="ml-2 text-[11px] font-bold text-black tracking-wide"
          >
            {isConnected && address ? truncateAddress(address) : "CONNECT"}
          </AppText>
        </AppButton>
      </View>
    </View>
  );
};

export default HomeHeader;
