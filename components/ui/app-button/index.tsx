import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React, { ReactNode } from "react";
import {
    ActivityIndicator,
    TouchableOpacity,
    TouchableOpacityProps,
} from "react-native";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]:
    "px-4 py-3 flex-row items-center justify-center bg-[#111A2E] border border-[#273552] rounded-xl",
  [VARIANT_TYPES.SECONDARY]:
    "w-full flex-row items-center gap-4 p-4 bg-[#0E172A] border border-[#25324A] rounded-xl",
  [VARIANT_TYPES.TERTIARY]:
    "px-3 py-2 flex-row items-center justify-center bg-[#111827] border border-[#1F293D] rounded-lg",
  [VARIANT_TYPES.QUATERNARY]:
    "w-10 h-10 items-center justify-center bg-[#111827] border border-[#1F293D] rounded-xl",
  [VARIANT_TYPES.QUINARY]:
    "px-4 py-2 flex-row items-center justify-center bg-[#0C1526] rounded-full border border-[#2A374D]",
  [VARIANT_TYPES.SENARY]:
    "px-3 py-1.5 flex-row items-center justify-center rounded-md bg-[#0C1526]",
  [VARIANT_TYPES.OCTONARY]:
    "w-12 h-12 items-center justify-center bg-[#111827] border border-[#1F293D] rounded-2xl",
  [VARIANT_TYPES.NONARY]: "flex-row items-center gap-2",
  [VARIANT_TYPES.DENARY]:
    "px-5 py-3 flex-row items-center justify-center bg-[#121D33] border border-[#2C3B57] rounded-xl",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  children?: ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
} & Omit<TouchableOpacityProps, "disabled">;

export const AppButton: React.FC<Props> = ({
  children,
  isLoading = false,
  variant = VARIANT_TYPES.PRIMARY,
  isDisabled = false,
  className = "",
  ...props
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <TouchableOpacity
      disabled={isDisabled || isLoading}
      className={cn(
        baseClassName,
        (isDisabled || isLoading) && "opacity-60",
        className,
      )}
      activeOpacity={0.82}
      {...props}
    >
      {isLoading && (
        <ActivityIndicator
          size="small"
          color="#FFFFFF"
          className="pr-1.5"
        />
      )}
      {children}
    </TouchableOpacity>
  );
};

export default AppButton;
