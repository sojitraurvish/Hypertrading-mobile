import AsyncStorage from "@react-native-async-storage/async-storage";

// LocalStorage names
export const LOCAL_STORAGE_KEYS = {
  WALLET_ADDRESS: "walletAddress",
  WALLET_CHAIN_ID: "walletChainId",
  HYPERLIQUID_AGENT: "hyperliquid_agent_" as `${"hyperliquid_agent_"}${string}`,
  SELECTED_MARKET: "selectedMarket",
  FAVORITE_MARKETS: "favoriteMarkets",
  SELECTED_INTERVAL: "selectedInterval",
  FAVORITE_INTERVALS: "favoriteIntervals",
} as const;

/**
 * Type map for localStorage keys
 * Define the type for each key here - TypeScript will automatically infer it!
 */
export type LocalStorageSchema = {
  [LOCAL_STORAGE_KEYS.WALLET_ADDRESS]: {
    address?: string | null;
    chainId?: number;
  } | null;
  [LOCAL_STORAGE_KEYS.WALLET_CHAIN_ID]: {
    chainId?: number;
  } | null;
  [LOCAL_STORAGE_KEYS.SELECTED_MARKET]: string | null;
  [LOCAL_STORAGE_KEYS.FAVORITE_MARKETS]: {
    symbols?: string[] | null;
  } | null;
  [LOCAL_STORAGE_KEYS.SELECTED_INTERVAL]: string | null;
  [LOCAL_STORAGE_KEYS.FAVORITE_INTERVALS]: string[] | null;
} & {
  // Support dynamic HYPERLIQUID_AGENT keys with user addresses
  // by defautl you can not create stiatic and diymanic key object together so firt extranally created and then merged
  [K in `${typeof LOCAL_STORAGE_KEYS.HYPERLIQUID_AGENT}`]?: {
    agentPrivateKey?: string;
    userPublicKey?: string;
  } | null;
};

/**
 * Get a key from the localStorage schema
 */
type LocalStorageKey =
  (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];

/**
 * Template literal type for dynamic HYPERLIQUID_AGENT keys
 * Creates a type like: "hyperliquid_agent_${userAddress}"
 */

/**
 * LocalStorage wrapper functions
 * Type-safe utility functions that automatically infer types from keys
 */

/**
 * Get value from localStorage
 * Type is automatically inferred from the key - no need to specify it!
 */
export async function getLocalStorage<K extends LocalStorageKey>(
  key: K,
): Promise<LocalStorageSchema[K] | null> {
  try {
    const item = await AsyncStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as LocalStorageSchema[K];
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Set value in localStorage
 * Type is automatically inferred from the key - no need to specify it!
 */
export async function setLocalStorage<K extends LocalStorageKey>(
  key: K,
  value: LocalStorageSchema[K],
): Promise<void> {
  try {
    const serializedValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

/**
 * Remove value from localStorage
 */
export const removeLocalStorage = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

/**
 * Clear all localStorage
 */
export const clearLocalStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};
