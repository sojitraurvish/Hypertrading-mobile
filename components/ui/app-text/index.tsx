import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React, { ReactNode } from "react";
import { Text, TextProps } from "react-native";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]:
    "text-text-primary-dark text-[15px] leading-[20px]",
  [VARIANT_TYPES.SECONDARY]:
    "text-text-secondary-dark text-[13px] leading-[18px]",
  [VARIANT_TYPES.TERTIARY]:
    "text-text-tertiary-dark text-[10px] uppercase tracking-[2.5px] leading-[14px]",
  [VARIANT_TYPES.QUATERNARY]:
    "text-text-quaternary-dark text-[14px] font-semibold leading-[18px]",
  [VARIANT_TYPES.QUINARY]:
    "text-text-primary-dark text-[28px] font-bold leading-[34px]",
  [VARIANT_TYPES.SENARY]:
    "text-text-senary-dark text-[12px] font-medium leading-[16px]",
  [VARIANT_TYPES.OCTONARY]:
    "text-text-primary-dark text-[22px] font-bold leading-[28px]",
  [VARIANT_TYPES.NONARY]:
    "text-text-quaternary-dark text-[10px] uppercase tracking-[2.5px] font-semibold leading-[14px]",
  [VARIANT_TYPES.DENARY]:
    "text-text-octonary-dark text-[11px] leading-[16px]",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  children?: ReactNode;
  className?: string;
} & TextProps;

export const AppText: React.FC<Props> = ({
  children,
  variant = VARIANT_TYPES.PRIMARY,
  className = "",
  ...props
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <Text className={cn("font-medium", baseClassName, className)} {...props}>
      {children}
    </Text>
  );
};

export default AppText;
