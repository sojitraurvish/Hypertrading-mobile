import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import {
  formatNumber,
  parseNumberOrUndefined,
  processUserInput,
  sanitizeDecimalInput,
} from "@/lib/services/tpsl-utils";
import { cn } from "@/lib/utils/tailwind-configs";
import type { AnchorField, PnlKind, TpslVariant } from "@/types/tpsl";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";

type PnlInputProps = {
  kind: PnlKind;
  tpslVariant: TpslVariant;
  setTpslVariant: (value: TpslVariant) => void;
  entry: number | undefined;
  szDecimals: number;
  price: number | undefined;
  pnlValue: string;
  setPnLValue: (value: string) => void;
  anchorRef: RefObject<AnchorField>;
  onPriceChange: (value: number | undefined) => void;
  error?: boolean;
  disabled?: boolean;
};

export function PnlInput({
  kind,
  tpslVariant,
  setTpslVariant,
  entry,
  szDecimals,
  price,
  pnlValue,
  setPnLValue,
  anchorRef,
  onPriceChange,
  error,
  disabled,
}: PnlInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [draftPrice, setDraftPrice] = useState(() =>
    price !== undefined ? formatNumber(price, szDecimals) : "",
  );

  useEffect(() => {
    setDraftPrice(
      typeof price === "number" && Number.isFinite(price)
        ? formatNumber(price, szDecimals)
        : "",
    );
  }, [price, szDecimals]);

  const handlePriceChange = (value: string) => {
    anchorRef.current = "price";
    const { display, value: normalizedValue } = processUserInput(
      value,
      value.length,
    );
    setDraftPrice(display);

    if (normalizedValue === "") {
      onPriceChange(undefined);
      return;
    }

    const priceNum = parseNumberOrUndefined(normalizedValue);
    if (priceNum === undefined || entry === undefined) {
      onPriceChange(undefined);
      return;
    }

    onPriceChange(priceNum);
  };

  const handlePnLChange = (value: string) => {
    anchorRef.current = "pnl";
    const sanitized = sanitizeDecimalInput(value);
    setPnLValue(sanitized);
  };

  const toggleVariant = () => {
    setTpslVariant(tpslVariant === "percent" ? "dollar" : "percent");
  };

  const label = kind === "takeProfit" ? "TP Price" : "SL Price";
  const pnlLabel = kind === "takeProfit" ? "Gain" : "Loss";

  return (
    <View className="gap-1.5">
      <View className="flex-row gap-2.5">
        <View className="flex-1 gap-1">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] leading-[16px] text-text-octonary-dark uppercase tracking-[0.8px]"
          >
            {label}
          </AppText>
          <View
            className={cn(
              "h-12 rounded-xl border bg-bg-secondary-dark/95 px-3 flex-row items-center",
              error ? "border-[#ef4444]/60" : "border-border-primary-dark/70",
            )}
          >
            <TextInput
              ref={inputRef}
              editable={!disabled}
              keyboardType="decimal-pad"
              value={draftPrice}
              onChangeText={handlePriceChange}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              className="flex-1 text-[16px] leading-[20px] font-semibold text-text-primary-dark pt-0 pb-0"
            />
            <AppText
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="text-[12px] text-text-octonary-dark font-semibold"
            >
              $
            </AppText>
          </View>
        </View>

        <View className="flex-1 gap-1">
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[12px] leading-[16px] text-text-octonary-dark uppercase tracking-[0.8px]"
          >
            {pnlLabel}
          </AppText>
          <View
            className={cn(
              "h-12 rounded-xl border bg-bg-secondary-dark/95 px-2.5 flex-row items-center",
              error ? "border-[#ef4444]/60" : "border-border-primary-dark/70",
            )}
          >
            <TextInput
              editable={!disabled}
              keyboardType="decimal-pad"
              value={pnlValue}
              onChangeText={handlePnLChange}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              className="flex-1 text-[16px] leading-[20px] font-semibold text-text-primary-dark pt-0 pb-0"
            />
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={toggleVariant}
              isDisabled={disabled}
              className="h-7 min-w-[34px] px-2 rounded-lg border border-border-primary-dark/70 bg-bg-quaternary-dark/80 items-center justify-center"
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="text-[11px] font-semibold text-text-tertiary-dark"
              >
                {tpslVariant === "percent" ? "%" : "$"}
              </AppText>
            </AppButton>
          </View>
        </View>
      </View>
    </View>
  );
}
