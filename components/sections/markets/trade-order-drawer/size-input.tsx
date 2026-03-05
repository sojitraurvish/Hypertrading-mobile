import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { TextInput, View } from "react-native";

type SizeInputProps = {
  size: string;
  currency: string;
  onCurrencyChange: () => void;
  onChange?: (value: string) => void;
  maxSize?: number;
  onMaxPress?: () => void;
  hasError?: boolean;
};

const SizeInput: React.FC<SizeInputProps> = ({
  size,
  currency,
  onCurrencyChange,
  onChange,
  maxSize = 0,
  onMaxPress,
  hasError = false,
}) => {
  const handleChange = (value: string) => {
    if (value === "") {
      onChange?.(value);
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) return;

    const parts = value.split(".");
    const integerPart = parts[0] || "";
    const decimalPart = parts[1];
    const hasDecimal = value.includes(".");

    if (hasDecimal) {
      if (integerPart.length > 9) return;
      if ((decimalPart?.length ?? 0) > 2) return;
      if (integerPart.length + (decimalPart?.length ?? 0) > 11) return;
    } else if (integerPart.length > 12) {
      return;
    }

    onChange?.(value);
  };

  const formattedMaxSize =
    Number.isFinite(maxSize) && maxSize > 0 ? maxSize.toFixed(2) : "0.00";

  return (
    <View className="gap-1">
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="text-[13px] leading-[16px] text-text-octonary-dark uppercase tracking-[0.8px]"
      >
        Size
      </AppText>
      <View
        className={cn(
          "h-14 rounded-2xl border bg-bg-secondary-dark/95 px-3 flex-row items-center justify-between",
          hasError ? "border-[#ef4444]/60" : "border-border-primary-dark/70",
        )}
      >
        <TextInput
          value={size}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#64748b"
          className="flex-1 text-[22px] leading-[26px] font-semibold text-text-primary-dark pt-0 pb-0"
        />
        {/* <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={onMaxPress}
          className="h-8 px-2 rounded-lg border border-[#78f39a]/40 bg-[#1b3f33] items-center justify-center mr-1"
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[10px] font-semibold text-[#86efac]"
          >
            Max {formattedMaxSize}
          </AppText>
        </AppButton> */}
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={onCurrencyChange}
          className="h-9 px-2 rounded-lg border border-transparent bg-transparent flex-row items-center gap-1"
        >
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] text-text-tertiary-dark font-medium"
          >
            {currency}
          </AppText>
          <Feather name="chevron-down" size={12} color="#94a3b8" />
        </AppButton>
      </View>
      {hasError ? (
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-[11px] leading-[14px] text-[#ef4444] font-medium"
        >
          Size exceeds maximum available
        </AppText>
      ) : null}
    </View>
  );
};

export default SizeInput;
