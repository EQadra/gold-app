import * as SecureStore from 'expo-secure-store';
import type { Printer } from './types';

const KEY = 'printer_default';

export const printerStorage = {
  async save(printer: Printer): Promise<void> {
    await SecureStore.setItemAsync(KEY, JSON.stringify(printer));
  },

  async get(): Promise<Printer | null> {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      return raw ? (JSON.parse(raw) as Printer) : null;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY);
  },
};