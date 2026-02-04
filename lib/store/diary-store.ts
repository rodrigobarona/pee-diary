import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';
import type {
  DiaryEntry,
  CreateUrinationEntry,
  CreateFluidEntry,
  CreateLeakEntry,
} from './types';

// Detect system language on first launch
const getInitialLanguage = (): 'en' | 'es' | 'pt' => {
  const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
  
  // Check if device locale is one of our supported languages
  if (deviceLocale === 'en' || deviceLocale === 'es' || deviceLocale === 'pt') {
    return deviceLocale;
  }
  
  // Handle pt-BR, pt-PT, etc. -> pt
  if (deviceLocale.startsWith('pt')) {
    return 'pt';
  }
  
  // Handle es-MX, es-AR, etc. -> es
  if (deviceLocale.startsWith('es')) {
    return 'es';
  }
  
  // Default to English
  return 'en';
};

const createId = (): string => {
  const cryptoObj = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

interface DiaryState {
  entries: DiaryEntry[];
  language: 'en' | 'es' | 'pt';

  // Actions
  addUrinationEntry: (entry: CreateUrinationEntry) => void;
  addFluidEntry: (entry: CreateFluidEntry) => void;
  addLeakEntry: (entry: CreateLeakEntry) => void;
  deleteEntry: (id: string) => void;
  clearAllEntries: () => void;
  setLanguage: (language: 'en' | 'es' | 'pt') => void;

  // Selectors - granular subscriptions for list items
  // Using functions instead of getters for Zustand selector pattern
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      language: getInitialLanguage(),

      addUrinationEntry: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? new Date().toISOString(),
              type: 'urination' as const,
            },
          ],
        })),

      addFluidEntry: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? new Date().toISOString(),
              type: 'fluid' as const,
            },
          ],
        })),

      addLeakEntry: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? new Date().toISOString(),
              type: 'leak' as const,
            },
          ],
        })),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearAllEntries: () => set({ entries: [] }),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'pee-diary-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Note: Complex selectors that return new objects/arrays on each call
// should NOT be used directly with useDiaryStore() as they cause infinite loops.
// Instead, use useShallow() or compute derived data in useMemo() within components.
// Example: const entries = useDiaryStore(useShallow((state) => state.entries));
