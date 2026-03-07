import { AppButton } from "@/components/ui/app-button";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { VARIANT_TYPES } from "@/lib/constants";
import { addDecimals } from "@/lib/utils/decimals";
import React, { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";

type TransferDirection = "toPerp" | "toSpot";

type TransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  direction: TransferDirection;
  perpsAvailable: string;
  spotAvailable: string;
  isSubmitting?: boolean;
  onConfirm: (amount: string, toPerp: boolean) => Promise<void>;
};

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  direction: initialDirection,
  perpsAvailable,
  spotAvailable,
  isSubmitting = false,
  onConfirm,
}) => {
  const [direction, setDirection] = useState<TransferDirection>(initialDirection);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setDirection(initialDirection);
    setAmount("");
  }, [initialDirection, isOpen]);

  const toPerp = direction === "toPerp";
  const fromLabel = toPerp ? "Spot" : "Perps";
  const toLabel = toPerp ? "Perps" : "Spot";
  const maxAmount = toPerp ? spotAvailable : perpsAvailable;
  const fromAvailable = toPerp ? spotAvailable : perpsAvailable;
  const toAvailable = toPerp ? perpsAvailable : spotAvailable;

  const isValidAmount = useMemo(() => {
    const parsedAmount = Number.parseFloat(amount);
    const parsedMax = Number.parseFloat(maxAmount);
    return (
      Number.isFinite(parsedAmount) &&
      parsedAmount > 0 &&
      Number.isFinite(parsedMax) &&
      parsedAmount <= parsedMax
    );
  }, [amount, maxAmount]);

  const handleAmountChange = (value: string) => {
    if (value === "") {
      setAmount("");
      return;
    }
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value)) {
      setAmount(value);
    }
  };

  const handleConfirm = async () => {
    if (!isValidAmount || isSubmitting) return;
    await onConfirm(amount, toPerp);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer USDC"
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick
      showCloseButton
      contentClassName="gap-5"
    >
      <View className="gap-5">
        <View className="gap-3 rounded-2xl border border-border-primary-dark/20 bg-bg-quaternary-dark/80 px-4 py-3.5">
          <AppText className="text-[10px] uppercase tracking-[1px] text-text-octonary-dark text-center font-semibold">
            Move USDC Between Accounts
          </AppText>
          <View className="flex-row items-center justify-center gap-2">
            <View className="items-center min-w-[94px] rounded-xl border border-border-primary-dark/20 bg-bg-secondary-dark/75 px-3 py-2.5">
              <AppText className="text-[9px] uppercase tracking-[0.9px] text-text-octonary-dark font-semibold">
                From
              </AppText>
              <AppText className="text-[16px] font-extrabold text-text-primary-dark">
                {fromLabel}
              </AppText>
              <AppText className="mt-0.5 text-[10px] text-text-octonary-dark font-medium">
                Avail: {addDecimals(Number(fromAvailable), 2).toFixed(2)}
              </AppText>
            </View>

            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() =>
                setDirection((prev) => (prev === "toPerp" ? "toSpot" : "toPerp"))
              }
              className="h-11 w-11 rounded-xl border border-[#4ade80]/30 bg-[#164b3a] items-center justify-center"
            >
              <AppText className="text-[15px] text-[#86efac]">⇅</AppText>
            </AppButton>

            <View className="items-center min-w-[94px] rounded-xl border border-[#4ade80]/30 bg-[#113327] px-3 py-2.5">
              <AppText className="text-[9px] uppercase tracking-[0.9px] text-text-octonary-dark font-semibold">
                To
              </AppText>
              <AppText className="text-[16px] font-extrabold text-[#86efac]">
                {toLabel}
              </AppText>
              <AppText className="mt-0.5 text-[10px] text-[#7ee9ac] font-medium">
                Avail: {addDecimals(Number(toAvailable), 2).toFixed(2)}
              </AppText>
            </View>
          </View>
          <AppText className="text-[10px] text-text-octonary-dark text-center font-medium">
            Tap arrows to switch transfer direction
          </AppText>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
              Amount (USDC)
            </AppText>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={() => setAmount(addDecimals(Number(maxAmount), 2).toFixed(2))}
              className="px-0 py-0"
              isDisabled={isSubmitting}
            >
              <AppText className="text-[12px] font-semibold text-text-quaternary-dark">
                Max: {addDecimals(Number(maxAmount), 2).toFixed(2)}
              </AppText>
            </AppButton>
          </View>

          <View className="h-12 px-3 rounded-xl border border-border-primary-dark/20 bg-bg-quaternary-dark/80 flex-row items-center">
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#4b5563"
              className="flex-1 text-text-primary-dark font-mono"
              editable={!isSubmitting}
            />
            <AppText className="text-[12px] text-text-octonary-dark font-semibold">
              USDC
            </AppText>
          </View>
        </View>

        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          onPress={handleConfirm}
          isDisabled={!isValidAmount || isSubmitting}
          isLoading={isSubmitting}
          className={
            !isValidAmount || isSubmitting
              ? "h-11 flex-row gap-2 rounded-xl bg-bg-quaternary-dark border border-border-primary-dark/20 items-center justify-center"
              : "h-11 flex-row gap-2 rounded-xl bg-bg-senary-dark border border-[#4ade80]/30 items-center justify-center"
          }
        >
          <AppText
            className={
              !isValidAmount || isSubmitting
                ? "text-[14px] font-semibold text-text-octonary-dark"
                : "text-[14px] font-semibold text-black"
            }
          >
            {isSubmitting ? "Transferring..." : "Confirm Transfer"}
          </AppText>
        </AppButton>
      </View>
    </AppModal>
  );
};

export default TransferModal;
