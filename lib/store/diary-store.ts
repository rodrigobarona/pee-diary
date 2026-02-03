import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns';
import type {
  DiaryEntry,
  CreateUrinationEntry,
  CreateFluidEntry,
  CreateLeakEntry,
} from './types';

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
      language: 'en',

      addUrinationEntry: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: uuidv4(),
              timestamp: new Date().toISOString(),
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
              id: uuidv4(),
              timestamp: new Date().toISOString(),
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
              id: uuidv4(),
              timestamp: new Date().toISOString(),
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

// Selector functions for use in components
// These enable granular subscriptions - components only re-render when their specific data changes

export const selectEntriesForDate = (date: Date) => (state: DiaryState) =>
  state.entries.filter((entry) =>
    isWithinInterval(parseISO(entry.timestamp), {
      start: startOfDay(date),
      end: endOfDay(date),
    })
  );

export const selectTodayEntries = (state: DiaryState) =>
  state.entries.filter((entry) =>
    isWithinInterval(parseISO(entry.timestamp), {
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
    })
  );

export const selectTodaySummary = (state: DiaryState) => {
  const today = new Date();
  const todayEntries = state.entries.filter((entry) =>
    isWithinInterval(parseISO(entry.timestamp), {
      start: startOfDay(today),
      end: endOfDay(today),
    })
  );

  const voids = todayEntries.filter((e) => e.type === 'urination').length;
  const fluids = todayEntries
    .filter((e) => e.type === 'fluid')
    .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
  const leaks = todayEntries.filter((e) => e.type === 'leak').length;

  return { voids, fluids, leaks };
};

export const selectEntriesByDateRange = (startDate: Date, endDate: Date) => (state: DiaryState) =>
  state.entries.filter((entry) =>
    isWithinInterval(parseISO(entry.timestamp), {
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    })
  );

export const selectDatesWithEntries = (state: DiaryState) => {
  const dates = new Set<string>();
  state.entries.forEach((entry) => {
    dates.add(format(parseISO(entry.timestamp), 'yyyy-MM-dd'));
  });
  return dates;
};
