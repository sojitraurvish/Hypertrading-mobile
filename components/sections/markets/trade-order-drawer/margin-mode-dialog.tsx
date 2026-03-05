import { AppButton } from "@/components/ui/app-button";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

export type MarginMode = "cross" | "isolated";

type MarginModeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: MarginMode;
  onConfirm: (mode: MarginMode) => Promise<void> | void;
  symbol: string;
  isSubmitting?: boolean;
};

const MarginModeDialog: React.FC<MarginModeDialogProps> = ({
  isOpen,
  onClose,
  selectedMode,
  onConfirm,
  symbol,
  isSubmitting = false,
}) => {
  const [tempMode, setTempMode] = useState<MarginMode>(selectedMode);

  useEffect(() => {
    if (isOpen) {
      setTempMode(selectedMode);
    }
  }, [isOpen, selectedMode]);

  const handleConfirm = async () => {
    await onConfirm(tempMode);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${symbol} Margin Mode`}
      className="max-w-md"
      contentClassName="space-y-5"
    >
      <View className="gap-4.5">
        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={() => setTempMode("cross")}
          className={cn(
            "w-full rounded-xl border p-3.5",
            tempMode === "cross"
              ? "bg-[#0f251b] border-[#2d815f]"
              : "bg-bg-secondary-dark/50 border-border-primary-dark/60",
          )}
        >
          <View className="flex-row items-start gap-2.5">
            <View
              className={cn(
                "mt-0.5 h-4 w-4 rounded-full border-2 items-center justify-center",
                tempMode === "cross"
                  ? "border-[#52f2a8] bg-[#52f2a8]"
                  : "border-border-primary-dark",
              )}
            >
              {tempMode === "cross" ? (
                <Feather name="check" size={10} color="#052e16" />
              ) : null}
            </View>
            <View className="flex-1">
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-[13px] font-semibold",
                  tempMode === "cross"
                    ? "text-text-primary-dark"
                    : "text-text-tertiary-dark",
                )}
              >
                Cross
              </AppText>
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="mt-1.5 text-[11px] leading-[15px] text-text-octonary-dark"
              >
                All cross positions share the same cross margin as collateral.
                Liquidation can consume cross margin and affect other positions.
              </AppText>
            </View>
          </View>
        </AppButton>

        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={() => setTempMode("isolated")}
          className={cn(
            "w-full rounded-xl border p-3.5 ",
            tempMode === "isolated"
              ? "bg-[#0f251b] border-[#2d815f]"
              : "bg-bg-secondary-dark/50 border-border-primary-dark/60",
          )}
        >
          <View className="flex-row items-start gap-2.5">
            <View
              className={cn(
                "mt-0.5 h-4 w-4 rounded-full border-2 items-center justify-center",
                tempMode === "isolated"
                  ? "border-[#52f2a8] bg-[#52f2a8]"
                  : "border-border-primary-dark",
              )}
            >
              {tempMode === "isolated" ? (
                <Feather name="check" size={10} color="#052e16" />
              ) : null}
            </View>
            <View className="flex-1">
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className={cn(
                  "text-[13px] font-semibold",
                  tempMode === "isolated"
                    ? "text-text-primary-dark"
                    : "text-text-tertiary-dark",
                )}
              >
                Isolated
              </AppText>
              <AppText
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="mt-1.5 text-[11px] leading-[15px] text-text-octonary-dark"
              >
                Margin is isolated per position. If an isolated position reaches
                a 100% margin ratio, only that position is liquidated.
              </AppText>
            </View>
          </View>
        </AppButton>
      </View>

      <AppButton
        variant={VARIANT_TYPES.NOT_SELECTED}
        onPress={handleConfirm}
        isLoading={isSubmitting}
        isDisabled={isSubmitting}
        className="mt-4 h-11 rounded-xl bg-[#2fb67c] flex-row items-center justify-center"
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

export default MarginModeDialog;
