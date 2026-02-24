import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Storage } from "@reown/appkit-react-native";

export const walletStorage: Storage = {
  async getKeys() {
    return AsyncStorage.getAllKeys() as Promise<string[]>;
  },

  async getEntries<T = unknown>() {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys as string[]);
    return pairs.map(([key, value]) => [
      key,
      value ? (JSON.parse(value) as T) : undefined,
    ]) as [string, T][];
  },

  async getItem<T = unknown>(key: string) {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return undefined;
    return JSON.parse(value) as T;
  },

  async setItem<T = unknown>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};
