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



export const DATE_TIME_FORMAT = {
  DD_MMM: 'DD MMM',
  HH_mm_ss: 'HH:mm:ss',
  MMMM_D_YYYY: 'MMMM D, YYYY',
  DD_MMM_YYYY: 'DD MMM YYYY',
  DD_MMM_YYYY_HH_MM_A: 'DD MMM YYYY, hh:mm A',
  DD_MM_YYYY: 'DD-MM-YYYY',
  ddd_MM_DD_YYYY: 'ddd, MM/DD/YYYY',
  DD_MM_YYYY_HH_MM_SS: 'DD/MM/YYYY - HH:mm:ss',
};
export type DateTimeFormat = typeof DATE_TIME_FORMAT[keyof typeof DATE_TIME_FORMAT];