// lib/constants/index.ts

export const ENVIRONMENT_TYPES = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const;

export type EnvironmentTypes =
  (typeof ENVIRONMENT_TYPES)[keyof typeof ENVIRONMENT_TYPES];

// Defaults to "production" when not set
export const ENVIRONMENT: EnvironmentTypes =
  (process.env.EXPO_PUBLIC_ENVIRONMENT as EnvironmentTypes) ??
  ENVIRONMENT_TYPES.PRODUCTION;

export const VARIANT_TYPES = {
  NOT_SELECTED: "none",
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
  QUATERNARY: "quaternary",
  QUINARY: "quinary",
  SENARY: "senary",
  OCTONARY: "octonary",
  NONARY: "nonary",
  DENARY: "denary",
} as const;

export type VariantTypes = (typeof VARIANT_TYPES)[keyof typeof VARIANT_TYPES];

export const PRICE_DECIMAL_PLACES = 2;
export const PRICE_MULTIPLIER = 100;
