import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-6",
} as const;

type VariantKeys = keyof typeof VARIANTS;

export type StrategyItem = {
  id: string;
  name: string;
  description: string;
  apy: string;
  tvl: string;
  risk: "Low" | "Medium" | "High";
  iconName: keyof typeof Feather.glyphMap;
};

type Props = {
  variant?: VariantKeys;
  strategies?: StrategyItem[];
  onStrategyPress?: (strategy: StrategyItem) => void;
  className?: string;
};

const RISK_COLORS = {
  Low: "text-text-quaternary-dark",
  Medium: "text-text-septenary-dark",
  High: "text-text-senary-dark",
};

const RISK_BG_COLORS = {
  Low: "bg-accent-green",
  Medium: "bg-accent-amber",
  High: "bg-accent-red",
};

const DEFAULT_STRATEGIES: StrategyItem[] = [
  {
    id: "1",
    name: "USDC Lending",
    description: "Earn yield by lending USDC to traders",
    apy: "8.42%",
    tvl: "$12.4M",
    risk: "Low",
    iconName: "dollar-sign",
  },
  {
    id: "2",
    name: "BTC Delta Neutral",
    description: "Market-neutral strategy on BTC perpetuals",
    apy: "15.8%",
    tvl: "$5.2M",
    risk: "Medium",
    iconName: "shield",
  },
  {
    id: "3",
    name: "ETH Momentum",
    description: "Algorithmic trend-following on ETH",
    apy: "24.6%",
    tvl: "$3.1M",
    risk: "High",
    iconName: "zap",
  },
  {
    id: "4",
    name: "Multi-Asset Yield",
    description: "Diversified yield across top assets",
    apy: "11.2%",
    tvl: "$8.7M",
    risk: "Low",
    iconName: "pie-chart",
  },
];

export const VaultStrategies: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  strategies = DEFAULT_STRATEGIES,
  onStrategyPress,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-4">
        <AppText variant={VARIANT_TYPES.TERTIARY} className="text-[10px] tracking-[2.5px]">
          AVAILABLE STRATEGIES
        </AppText>
        <AppText
          variant={VARIANT_TYPES.DENARY}
          className="text-[10px]"
        >
          {strategies.length} vaults
        </AppText>
      </View>

      {/* Strategies List */}
      <View className="gap-3.5">
        {strategies.map((strategy) => (
          <AppButton
            key={strategy.id}
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={() => onStrategyPress?.(strategy)}
          >
            <AppCard variant={VARIANT_TYPES.OCTONARY} className="p-4">
              <View className="flex-row items-center">
                {/* Icon */}
                <View className="w-12 h-12 rounded-2xl items-center justify-center bg-bg-quaternary-dark mr-3">
                  <Feather name={strategy.iconName} size={20} color="#4ade80" />
                </View>

                {/* Info */}
                <View className="flex-1">
                  <AppText
                    variant={VARIANT_TYPES.PRIMARY}
                    className="font-bold text-sm"
                  >
                    {strategy.name}
                  </AppText>
                  <AppText
                    variant={VARIANT_TYPES.DENARY}
                    className="text-[11px] mt-0.5"
                  >
                    {strategy.description}
                  </AppText>
                </View>

                {/* APY */}
                <View className="items-end">
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-text-quaternary-dark text-base font-bold"
                  >
                    {strategy.apy}
                  </AppText>
                  <AppText
                    variant={VARIANT_TYPES.TERTIARY}
                    className="text-[9px] mt-0.5"
                  >
                    APY
                  </AppText>
                </View>
              </View>

              {/* Bottom Row: TVL + Risk */}
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border-primary-dark/15">
                <View className="flex-row items-center gap-1">
                  <AppText variant={VARIANT_TYPES.TERTIARY} className="text-[10px]">
                    TVL:
                  </AppText>
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-text-primary-dark text-[10px] font-semibold"
                  >
                    {strategy.tvl}
                  </AppText>
                </View>

                <View
                  className={cn(
                    "px-2.5 py-0.5 rounded-full",
                    RISK_BG_COLORS[strategy.risk]
                  )}
                >
                  <AppText
                    variant={VARIANT_TYPES.NOT_SELECTED}
                    className="text-black text-[9px] font-bold uppercase"
                  >
                    {strategy.risk} Risk
                  </AppText>
                </View>
              </View>
            </AppCard>
          </AppButton>
        ))}
      </View>
    </View>
  );
};

export default VaultStrategies;
