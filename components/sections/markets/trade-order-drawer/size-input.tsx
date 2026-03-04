import { AppDropdown } from "@/components/ui/app-dropdown";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React from "react";
import { TextInput, View } from "react-native";

type SizeInputProps = {
  size: string;
  currency: string;
  onCurrencyChange: (nextCurrency: string) => void;
  onChange: (value: string) => void;
  hasError?: boolean;
  maxDecimals?: number;
  currencyOptions: Array<{ label: string; value: string }>;
};

const SizeInput: React.FC<SizeInputProps> = ({
  size,
  currency,
  onCurrencyChange,
  onChange,
  hasError = false,
  maxDecimals = 2,
  currencyOptions,
}) => {
  const handleChange = (value: string) => {
    if (value === "") {
      onChange(value);
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) return;

    const [integerPart = "", decimalPart] = value.split(".");
    const safeMaxDecimals = Number.isFinite(maxDecimals)
      ? Math.max(0, maxDecimals)
      : 2;

    if (decimalPart !== undefined && decimalPart.length > safeMaxDecimals) return;

    const totalDigits = integerPart.length + (decimalPart?.length ?? 0);
    if (totalDigits > 12) return;

    onChange(value);
  };

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
        <View className="w-[84px]">
          <AppDropdown
            value={currency}
            onChange={onCurrencyChange}
            options={currencyOptions}
            className="w-full"
          />
        </View>
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
