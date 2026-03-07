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
    "px-4 py-3.5 flex-row items-center justify-center bg-bg-quaternary-dark border border-border-primary-dark/40 rounded-2xl",
  [VARIANT_TYPES.SECONDARY]:
    "w-full flex-row items-center gap-4 p-4 bg-bg-tertiary-dark border border-border-primary-dark/30 rounded-2xl",
  [VARIANT_TYPES.TERTIARY]:
    "px-3.5 py-2.5 flex-row items-center justify-center bg-bg-quaternary-dark border border-border-primary-dark/30 rounded-xl",
  [VARIANT_TYPES.QUATERNARY]:
    "w-10 h-10 items-center justify-center bg-bg-quaternary-dark border border-border-primary-dark/25 rounded-xl",
  [VARIANT_TYPES.QUINARY]:
    "px-4 py-2.5 flex-row items-center justify-center bg-bg-tertiary-dark rounded-full border border-border-primary-dark/30",
  [VARIANT_TYPES.SENARY]:
    "px-3.5 py-2 flex-row items-center justify-center rounded-xl bg-bg-tertiary-dark",
  [VARIANT_TYPES.OCTONARY]:
    "w-12 h-12 items-center justify-center bg-bg-quaternary-dark border border-border-primary-dark/25 rounded-2xl",
  [VARIANT_TYPES.NONARY]: "flex-row items-center gap-2.5",
  [VARIANT_TYPES.DENARY]:
    "px-5 py-3.5 flex-row items-center justify-center bg-bg-senary-dark rounded-2xl",
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
      activeOpacity={0.65}
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
