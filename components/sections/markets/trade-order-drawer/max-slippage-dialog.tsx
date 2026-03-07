import { AppButton } from "@/components/ui/app-button";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Slider } from "@miblanchard/react-native-slider";
import React, { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";

type MaxSlippageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedMaxSlippage: number;
  onConfirm: (maxSlippage: number) => void;
};

const MIN_SLIPPAGE = 0.01;
const MAX_SLIPPAGE = 100;

const normalizeSlippage = (value: number) => {
  const rounded = Math.round(value * 100) / 100;
  return Math.min(MAX_SLIPPAGE, Math.max(MIN_SLIPPAGE, rounded));
};

const MaxSlippageDialog: React.FC<MaxSlippageDialogProps> = ({
  isOpen,
  onClose,
  selectedMaxSlippage,
  onConfirm,
}) => {
  const initialValue = useMemo(
    () =>
      normalizeSlippage(
        Number.isFinite(selectedMaxSlippage) ? selectedMaxSlippage : MIN_SLIPPAGE,
      ),
    [selectedMaxSlippage],
  );
  const [tempMaxSlippage, setTempMaxSlippage] = useState(initialValue);
  const [inputValue, setInputValue] = useState(initialValue.toFixed(2));

  useEffect(() => {
    if (!isOpen) return;
    setTempMaxSlippage(initialValue);
    setInputValue(initialValue.toFixed(2));
  }, [initialValue, isOpen]);

  const handleSlippageChange = (next: number) => {
    const normalized = normalizeSlippage(next);
    setTempMaxSlippage(normalized);
    setInputValue(normalized.toFixed(2));
  };

  const handleConfirm = () => {
    onConfirm(normalizeSlippage(tempMaxSlippage));
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Max Slippage"
      className="max-w-md"
      contentClassName="space-y-6"
    >
      <View className="items-center py-2">
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-[34px] leading-[40px] font-extrabold text-text-primary-dark"
        >
          {tempMaxSlippage.toFixed(2)}
          <AppText
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="text-[22px] leading-[28px] text-accent-green"
          >
            %
          </AppText>
        </AppText>
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="mt-1 text-[11px] text-text-octonary-dark"
        >
          Max Slippage
        </AppText>
      </View>

      <AppText
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="text-[11px] leading-[16px] text-text-octonary-dark"
      >
        Max slippage only affects market orders. Closing positions uses 8.00% and
        market TP/SL orders use 10.00%.
      </AppText>

      <View className="gap-4">
        <View className="flex-row items-center gap-2.5">
          <View className="flex-1 px-1">
            <Slider
              value={tempMaxSlippage}
              minimumValue={MIN_SLIPPAGE}
              maximumValue={MAX_SLIPPAGE}
              step={0.01}
              trackClickable
              containerStyle={{ marginHorizontal: 0 }}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value;
                if (typeof next === "number") {
                  handleSlippageChange(next);
                }
              }}
              minimumTrackTintColor="#4ade80"
              maximumTrackTintColor="#1c1c26"
              thumbTintColor="#4ade80"
              thumbStyle={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 3,
                borderColor: "#0a0a0f",
              }}
              trackStyle={{ height: 7, borderRadius: 999 }}
            />
          </View>

          <View className="h-9 w-[82px] rounded-lg border border-border-primary-dark/20 bg-bg-quaternary-dark items-center justify-center px-2">
            <TextInput
              value={inputValue}
              onChangeText={(value) => {
                if (value === "") {
                  setInputValue("");
                  return;
                }
                if (!/^\d{0,3}(\.\d{0,2})?$/.test(value)) return;
                const parsed = Number.parseFloat(value);
                if (Number.isFinite(parsed) && parsed > MAX_SLIPPAGE) return;
                setInputValue(value);
                if (Number.isFinite(parsed)) {
                  setTempMaxSlippage(normalizeSlippage(parsed));
                }
              }}
              onBlur={() => {
                const parsed = Number.parseFloat(inputValue);
                if (!Number.isFinite(parsed)) {
                  setInputValue(tempMaxSlippage.toFixed(2));
                  return;
                }
                handleSlippageChange(parsed);
              }}
              keyboardType="decimal-pad"
              className="w-full text-center text-[13px] font-semibold text-text-primary-dark pt-0 pb-0"
            />
          </View>
        </View>

        <View className="flex-row gap-2">
          {[1, 3, 5, 10, 25].map((value) => (
            <AppButton
              key={value}
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() => handleSlippageChange(value)}
              className={cn(
                "h-8 flex-1 rounded-lg border items-center justify-center",
                tempMaxSlippage === value
                  ? "bg-accent-green border-accent-green/30"
                  : "bg-bg-quaternary-dark/50 border-border-primary-dark/20",
              )}
            >
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-[11px] font-semibold",
                  tempMaxSlippage === value
                    ? "text-[#064617]"
                    : "text-text-tertiary-dark",
                )}
              >
                {value.toFixed(2)}%
              </AppText>
            </AppButton>
          ))}
        </View>
      </View>

      <AppButton
        variant={VARIANT_TYPES.NOT_SELECTED}
        onPress={handleConfirm}
        className="mt-4 h-11 rounded-xl bg-accent-green items-center justify-center"
      >
        <AppText
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="text-[14px] font-bold text-white"
        >
          Confirm
        </AppText>
      </AppButton>
    </AppModal>
  );
};

export default MaxSlippageDialog;
