import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React, { ReactNode } from "react";
import { Text, TextProps } from "react-native";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]:
    "text-text-primary-dark text-base",
  [VARIANT_TYPES.SECONDARY]:
    "text-text-secondary-dark text-sm",
  [VARIANT_TYPES.TERTIARY]:
    "text-text-tertiary-dark text-xs uppercase tracking-widest",
  [VARIANT_TYPES.QUATERNARY]:
    "text-text-quaternary-dark text-sm font-semibold",
  [VARIANT_TYPES.QUINARY]:
    "text-text-primary-dark text-3xl font-bold",
  [VARIANT_TYPES.SENARY]:
    "text-text-senary-dark text-xs font-medium",
  [VARIANT_TYPES.OCTONARY]:
    "text-text-primary-dark text-2xl font-bold",
  [VARIANT_TYPES.NONARY]:
    "text-text-quaternary-dark text-xs uppercase tracking-widest font-semibold",
  [VARIANT_TYPES.DENARY]:
    "text-text-octonary-dark text-xs",
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
    <Text className={cn(baseClassName, className)} {...props}>
      {children}
    </Text>
  );
};

export default AppText;
