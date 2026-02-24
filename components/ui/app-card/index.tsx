import { VARIANT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils/tailwind-configs";
import React, { ReactNode } from "react";
import { View, ViewProps } from "react-native";

const VARIANTS = {
  [VARIANT_TYPES.NOT_SELECTED]: "",
  [VARIANT_TYPES.PRIMARY]:
    "bg-bg-tertiary-dark rounded-2xl p-4 border border-border-primary-dark",
  [VARIANT_TYPES.SECONDARY]:
    "bg-bg-quaternary-dark rounded-xl p-4",
  [VARIANT_TYPES.TERTIARY]:
    "bg-bg-tertiary-dark rounded-2xl p-5 border border-border-primary-dark",
  [VARIANT_TYPES.QUATERNARY]:
    "bg-bg-secondary-dark rounded-xl p-3",
  [VARIANT_TYPES.QUINARY]:
    "bg-bg-tertiary-dark rounded-xl p-4 flex-row items-center",
  [VARIANT_TYPES.SENARY]:
    "bg-bg-quaternary-dark rounded-2xl p-4 flex-1",
  [VARIANT_TYPES.OCTONARY]:
    "bg-bg-tertiary-dark rounded-2xl p-4",
  [VARIANT_TYPES.NONARY]:
    "bg-bg-secondary-dark rounded-2xl p-4 border border-border-primary-dark",
  [VARIANT_TYPES.DENARY]:
    "bg-bg-quaternary-dark rounded-lg p-3",
} as const;

type VariantKeys = keyof typeof VARIANTS;

type Props = {
  variant?: VariantKeys;
  children?: ReactNode;
  className?: string;
} & ViewProps;

export const AppCard: React.FC<Props> = ({
  children,
  variant = VARIANT_TYPES.PRIMARY,
  className = "",
  ...props
}) => {
  const baseClassName = VARIANTS[variant] || "";

  return (
    <View className={cn(baseClassName, className)} {...props}>
      {children}
    </View>
  );
};

export default AppCard;
