import { AppButton } from "@/components/ui/app-button";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Feather } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import React, { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";

type LeverageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedLeverage: number;
  onConfirm: (leverage: number) => Promise<void> | void;
  symbol: string;
  maxLeverage?: number;
  isSubmitting?: boolean;
};

const LeverageDialog: React.FC<LeverageDialogProps> = ({
  isOpen,
  onClose,
  selectedLeverage,
  onConfirm,
  symbol,
  maxLeverage = 40,
  isSubmitting = false,
}) => {
  const normalizedMaxLeverage = useMemo(
    () => (maxLeverage > 0 ? Math.round(maxLeverage) : 1),
    [maxLeverage],
  );
  const [tempLeverage, setTempLeverage] = useState(selectedLeverage);
  const [inputValue, setInputValue] = useState(String(selectedLeverage));

  useEffect(() => {
    if (!isOpen) return;
    const clamped = Math.max(
      1,
      Math.min(normalizedMaxLeverage, Math.round(selectedLeverage || 1)),
    );
    setTempLeverage(clamped);
    setInputValue(String(clamped));
  }, [isOpen, normalizedMaxLeverage, selectedLeverage]);

  const handleLeverageChange = (next: number) => {
    const clamped = Math.max(1, Math.min(normalizedMaxLeverage, Math.round(next)));
    setTempLeverage(clamped);
    setInputValue(String(clamped));
  };

  const handleConfirm = async () => {
    await onConfirm(tempLeverage);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${symbol} Leverage`}
      className="max-w-md"
      contentClassName="space-y-6"
    >
      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="text-[12px] leading-[16px] text-text-octonary-dark"
      >
        Set leverage for {symbol}. Max allowed leverage is {normalizedMaxLeverage}x.
      </AppText>

      <View className="items-center py-2">
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-[35px] leading-[40px] font-extrabold text-text-primary-dark"
        >
          {tempLeverage}
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[25px] leading-[30px] text-[#52f2a8]"
          >
            x
          </AppText>
        </AppText>
      </View>

      <View className="gap-4.5">
        <View className="flex-row items-center gap-2.5">
          <View className="flex-1 px-1">
            <Slider
              value={tempLeverage}
              minimumValue={1}
              maximumValue={normalizedMaxLeverage}
              step={1}
              trackClickable
              containerStyle={{ marginHorizontal: 0 }}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value;
                if (typeof next === "number") {
                  handleLeverageChange(next);
                }
              }}
              minimumTrackTintColor="#66ef7a"
              maximumTrackTintColor="#2a3347"
              thumbTintColor="#66ef7a"
              thumbStyle={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 3,
                borderColor: "#0d1117",
              }}
              trackStyle={{ height: 7, borderRadius: 999 }}
            />
          </View>

          <View className="h-9 w-[64px] rounded-lg border border-border-primary-dark/70 bg-bg-quaternary-dark items-center justify-center px-2">
            <TextInput
              value={inputValue}
              onChangeText={(value) => {
                if (value === "") {
                  setInputValue("");
                  return;
                }
                if (!/^\d{0,3}$/.test(value)) return;
                setInputValue(value);
                const parsed = Number.parseInt(value, 10);
                if (Number.isFinite(parsed)) {
                  handleLeverageChange(parsed);
                }
              }}
              onBlur={() => {
                const parsed = Number.parseInt(inputValue, 10);
                if (!Number.isFinite(parsed)) {
                  handleLeverageChange(tempLeverage);
                  return;
                }
                handleLeverageChange(parsed);
              }}
              keyboardType="number-pad"
              className="w-full text-center text-[13px] font-semibold text-text-primary-dark pt-0 pb-0"
            />
          </View>
        </View>

        <View className="mt-3 flex-row gap-2">
          {[1, 5, 10, 25, normalizedMaxLeverage]
            .filter((value, index, list) => value <= normalizedMaxLeverage && list.indexOf(value) === index)
            .map((value) => (
              <AppButton
                key={value}
                variant={VARIANT_TYPES.NOT_SELECTED}
                onPress={() => handleLeverageChange(value)}
                className={cn(
                  "h-8 flex-1 rounded-lg border items-center justify-center",
                  tempLeverage === value
                    ? "bg-bg-senary-dark border-[#78f39a]/50"
                    : "bg-bg-quaternary-dark/50 border-border-primary-dark/60",
                )}
              >
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className={cn(
                    "text-[11px] font-semibold",
                    tempLeverage === value ? "text-[#064617]" : "text-text-tertiary-dark",
                  )}
                >
                  {value}x
                </AppText>
              </AppButton>
            ))}
        </View>
      </View>

      <AppButton
        variant={VARIANT_TYPES.NOT_SELECTED}
        onPress={handleConfirm}
        isLoading={isSubmitting}
        isDisabled={isSubmitting}
        className="mt-5 h-11 rounded-xl bg-[#2fb67c] flex-row items-center justify-center"
      >
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-[14px] font-bold text-white"
        >
          Confirm
        </AppText>
      </AppButton>

      <View className="mt-4 flex-row items-start gap-2.5 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/8 p-3">
        <Feather name="alert-triangle" size={15} color="#fbbf24" />
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="flex-1 text-[11px] leading-[15px] text-[#fde68a]"
        >
          Higher leverage increases liquidation risk.
        </AppText>
      </View>
    </AppModal>
  );
};

export default LeverageDialog;
