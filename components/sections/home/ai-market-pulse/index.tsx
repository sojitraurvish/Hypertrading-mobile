import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]: "mx-4 mt-6",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  content?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
};

const DEFAULT_CONTENT =
  'The crypto market is currently mired in "Extreme Fear" with the sentiment index bottoming at a historical low of 5, as Bitcoin\'s failure to hold the $70,000 level has triggered a massive leverage flush and a 45% correction from its $126,000 peak. Institutional support is wavering under the weight of multi-billion dollar ETF outflows and a hawkish Fed outlook fueled by sticky inflation data, turning every minor relief rally into a "bull trap" for over-leveraged longs. Aggressive traders should eye the $60,000 support floor as the final capitulation zone; while the technical trend remains broken, this "crypto reset" is engineering a massive asymmetric entry for a predicted run to $150,000 once current retail exhaustion peaks and liquidity returns.';

export const AiMarketPulse: React.FC<Props> = ({
  variant = VARIANT_TYPES.PRIMARY,
  content = DEFAULT_CONTENT,
  onRefresh,
  isLoading = false,
  className = "",
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)}>
      <AppCard variant={VARIANT_TYPES.TERTIARY}>
        {/* Header Row */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            {/* Green Dot */}
            <View className="w-2 h-2 rounded-full bg-[#50fa7b]" />
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-text-primary-dark text-xs font-bold uppercase tracking-wider"
            >
              AI Market Pulse
            </AppText>
          </View>

          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            onPress={onRefresh}
            isLoading={isLoading}
          >
            <AppText
              variant={VARIANT_TYPES.QUATERNARY}
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              Refresh
            </AppText>
          </AppButton>
        </View>

        {/* Content */}
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-text-quinary-dark text-[13px] leading-5"
          style={{ fontStyle: "italic" }}
        >
          {content}
        </AppText>
      </AppCard>
    </View>
  );
};

export default AiMarketPulse;
