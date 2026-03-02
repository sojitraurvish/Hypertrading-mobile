import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import Portal from "@/components/ui/portal";
import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

const MODAL_VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]:
    "bg-bg-secondary-dark border border-border-primary-dark/60 shadow-2xl w-full max-w-[520px]",
  [VARIANT_TYPES.SECONDARY]:
    "bg-bg-secondary-dark border border-border-primary-dark/60 shadow-2xl w-full max-w-[520px]",
  [VARIANT_TYPES.TERTIARY]:
    "bg-bg-secondary-dark border border-border-primary-dark/60 shadow-2xl w-full max-w-[520px]",
} as const;

type VariantKeys = keyof typeof MODAL_VARIANTS;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  variant?: VariantKeys;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export const AppModal: React.FC<Props> = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnOutsideClick = true,
  variant = VARIANT_TYPES.PRIMARY,
  className = "",
  headerClassName = "",
  contentClassName = "",
}) => {
  const modalClassName =
    MODAL_VARIANTS[variant] || MODAL_VARIANTS[VARIANT_TYPES.PRIMARY];

  if (!isOpen) return null;

  return (
    <Portal
      visible={isOpen}
      closeOnOutsideClick={closeOnOutsideClick}
      onClose={onClose}
      overlay
      overlayClassName="bg-black/70"
    >
      <View className="flex-1 items-center justify-center px-4">
        <View
          className={cn(
            "relative w-full rounded-2xl overflow-hidden",
            modalClassName,
            className,
          )}
        >
          <View className="h-[2px] w-full bg-bg-senary-dark" />

          {(title || showCloseButton) && (
            <View
              className={cn(
                "flex-row items-center justify-between px-5 py-4 bg-bg-secondary-dark",
                headerClassName,
              )}
            >
              {title ? (
                <AppText
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="text-[24px] font-bold text-text-primary-dark tracking-tight"
                >
                  {title}
                </AppText>
              ) : (
                <View />
              )}

              {showCloseButton ? (
                <AppButton
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-bg-quaternary-dark items-center justify-center"
                  accessibilityLabel="Close modal"
                >
                  <Feather name="x" size={14} color="#94a3b8" />
                </AppButton>
              ) : null}
            </View>
          )}

          {(title || showCloseButton) && (
            <View className="mx-5 h-px bg-border-primary-dark/70" />
          )}

          <View className={cn("px-5 py-4", contentClassName)}>{children}</View>
        </View>
      </View>
    </Portal>
  );
};

export default AppModal;
