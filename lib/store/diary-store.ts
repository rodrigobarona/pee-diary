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
  UpdateUrinationEntry,
  UpdateFluidEntry,
  UpdateLeakEntry,
  EditRecord,
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
  updateEntry: (id: string, updates: UpdateUrinationEntry | UpdateFluidEntry | UpdateLeakEntry) => void;
  deleteEntry: (id: string) => void;
  clearAllEntries: () => void;
  setLanguage: (language: 'en' | 'es' | 'pt') => void;
  getEntryById: (id: string) => DiaryEntry | undefined;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      language: getInitialLanguage(),

      addUrinationEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: 'urination' as const,
            },
          ],
        }));
      },

      addFluidEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: 'fluid' as const,
            },
          ],
        }));
      },

      addLeakEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: 'leak' as const,
            },
          ],
        }));
      },

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id !== id) return entry;

            // Track changes for edit history
            const changes: Record<string, { from: unknown; to: unknown }> = {};
            for (const [key, newValue] of Object.entries(updates)) {
              const oldValue = (entry as Record<string, unknown>)[key];
              if (oldValue !== newValue) {
                changes[key] = { from: oldValue, to: newValue };
              }
            }

            // Only add edit record if there were actual changes
            if (Object.keys(changes).length === 0) return entry;

            const editRecord: EditRecord = {
              editedAt: new Date().toISOString(),
              changes,
            };

            return {
              ...entry,
              ...updates,
              editHistory: [...(entry.editHistory ?? []), editRecord],
            };
          }),
        })),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearAllEntries: () => set({ entries: [] }),

      setLanguage: (language) => set({ language }),

      getEntryById: (id) => get().entries.find((e) => e.id === id),
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
