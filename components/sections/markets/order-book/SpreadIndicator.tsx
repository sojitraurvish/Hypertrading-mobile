import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import React from "react";
import { View } from "react-native";

type SpreadIndicatorProps = {
  spread: number | null;
  spreadPercent: number | null;
};

export const SpreadIndicator: React.FC<SpreadIndicatorProps> = ({
  spread,
  spreadPercent,
}) => {
  const formatTwoDecimals = (value: number) => addDecimals(value, 2).toFixed(2);

  return (
    <View className="flex-row items-center px-2 py-2 border-y border-border-primary-dark/35 bg-[#0c0c0c] mt-1">
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="flex-1 text-[10px] text-text-octonary-dark uppercase"
      >
        Spread
      </AppText>
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="flex-1 text-center text-[11px] text-text-primary-dark font-semibold"
      >
        {spread == null ? "—" : formatTwoDecimals(spread)}
      </AppText>
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="flex-1 text-right text-[11px] text-text-octonary-dark"
      >
        {spreadPercent == null ? "—" : `${formatTwoDecimals(spreadPercent)}%`}
      </AppText>
    </View>
  );
};
