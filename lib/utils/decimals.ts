import { PRICE_DECIMAL_PLACES, PRICE_MULTIPLIER } from "@/lib/constants";

/**
 * Converts a price from frontend (with decimals) to integer cents for storage.
 * Example: 234.3264354 -> 234.33 -> 23433
 */
export const removeDecimal = (price: number): number => {
  if (Number.isNaN(price)) return 0;

  // Round to configured decimal places first, then multiply.
  const rounded = Number.parseFloat(price.toFixed(PRICE_DECIMAL_PLACES));
  return Math.round(rounded * PRICE_MULTIPLIER);
};

/**
 * Formats a number to a specified number of decimal places.
 * Used for calculations and display purposes.
 */
export const addDecimals= (
  value: number,
  decimals: number = PRICE_DECIMAL_PLACES,
): number => {
  if (Number.isNaN(value)) return Number.NaN;
  return Number.parseFloat(value.toFixed(decimals));
};
