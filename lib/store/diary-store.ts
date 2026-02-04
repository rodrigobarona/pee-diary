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
  DailyGoals,
  StreakInfo,
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

// Default daily goals based on medical standards
const DEFAULT_GOALS: DailyGoals = {
  fluidTarget: 2000, // ml
  voidTarget: 7,     // 6-8 voids per day is normal
};

// Helper to get today's date as YYYY-MM-DD
const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Helper to calculate streak from entries
const calculateStreak = (entries: DiaryEntry[], lastActiveDate: string | null): StreakInfo => {
  if (entries.length === 0) {
    return { currentStreak: 0, lastActiveDate: null };
  }

  const today = getTodayDateString();
  
  // Get unique dates that have entries
  const datesWithEntries = new Set<string>();
  entries.forEach((entry) => {
    const date = entry.timestamp.split('T')[0];
    datesWithEntries.add(date);
  });

  // Sort dates descending
  const sortedDates = Array.from(datesWithEntries).sort((a, b) => b.localeCompare(a));
  
  // Check if today or yesterday has entries
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  const hasEntryToday = datesWithEntries.has(today);
  const hasEntryYesterday = datesWithEntries.has(yesterdayStr);
  
  // If no entry today or yesterday, streak is broken
  if (!hasEntryToday && !hasEntryYesterday) {
    return { currentStreak: 0, lastActiveDate: sortedDates[0] ?? null };
  }

  // Count consecutive days
  let streak = 0;
  let checkDate = new Date(hasEntryToday ? today : yesterdayStr);
  
  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (datesWithEntries.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { 
    currentStreak: streak, 
    lastActiveDate: hasEntryToday ? today : yesterdayStr 
  };
};

interface DiaryState {
  entries: DiaryEntry[];
  language: 'en' | 'es' | 'pt';
  goals: DailyGoals;
  streak: StreakInfo;

  // Actions
  addUrinationEntry: (entry: CreateUrinationEntry) => void;
  addFluidEntry: (entry: CreateFluidEntry) => void;
  addLeakEntry: (entry: CreateLeakEntry) => void;
  updateEntry: (id: string, updates: UpdateUrinationEntry | UpdateFluidEntry | UpdateLeakEntry) => void;
  deleteEntry: (id: string) => void;
  clearAllEntries: () => void;
  setLanguage: (language: 'en' | 'es' | 'pt') => void;
  getEntryById: (id: string) => DiaryEntry | undefined;
  updateGoals: (goals: Partial<DailyGoals>) => void;
  refreshStreak: () => void;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      language: getInitialLanguage(),
      goals: DEFAULT_GOALS,
      streak: { currentStreak: 0, lastActiveDate: null },

      addUrinationEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntries = [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: 'urination' as const,
            },
          ];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries, state.streak.lastActiveDate),
          };
        });
      },

      addFluidEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntries = [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: 'fluid' as const,
            },
          ];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries, state.streak.lastActiveDate),
          };
        });
      },

      addLeakEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntries = [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: 'leak' as const,
            },
          ];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries, state.streak.lastActiveDate),
          };
        });
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

      updateGoals: (goals) =>
        set((state) => ({
          goals: { ...state.goals, ...goals },
        })),

      refreshStreak: () => {
        const state = get();
        const newStreak = calculateStreak(state.entries, state.streak.lastActiveDate);
        set({ streak: newStreak });
      },
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
