import { z } from 'zod';

// Edit history record schema
export const editRecordSchema = z.object({
  editedAt: z.string().datetime(),
  changes: z.record(z.string(), z.object({
    from: z.unknown(),
    to: z.unknown(),
  })),
});

// Zod Schemas for validation
export const baseEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  createdAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  editHistory: z.array(editRecordSchema).optional(),
});

export const urinationEntrySchema = baseEntrySchema.extend({
  type: z.literal('urination'),
  volume: z.enum(['small', 'medium', 'large']),
  urgency: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  hadLeak: z.boolean(),
  hadPain: z.boolean(),
});

export const fluidEntrySchema = baseEntrySchema.extend({
  type: z.literal('fluid'),
  drinkType: z.enum(['water', 'coffee', 'tea', 'juice', 'alcohol', 'other']),
  amount: z.number().positive(),
});

export const leakEntrySchema = baseEntrySchema.extend({
  type: z.literal('leak'),
  severity: z.enum(['drops', 'moderate', 'full']),
  urgency: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

export const diaryEntrySchema = z.discriminatedUnion('type', [
  urinationEntrySchema,
  fluidEntrySchema,
  leakEntrySchema,
]);

// TypeScript Types
export type EditRecord = z.infer<typeof editRecordSchema>;
export type BaseEntry = z.infer<typeof baseEntrySchema>;
export type UrinationEntry = z.infer<typeof urinationEntrySchema>;
export type FluidEntry = z.infer<typeof fluidEntrySchema>;
export type LeakEntry = z.infer<typeof leakEntrySchema>;
export type DiaryEntry = z.infer<typeof diaryEntrySchema>;

export type EntryType = DiaryEntry['type'];
export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;
export type VolumeSize = 'small' | 'medium' | 'large';
export type DrinkType = FluidEntry['drinkType'];
export type LeakSeverity = LeakEntry['severity'];

// Helper types for creating entries (timestamp is optional - defaults to now)
export type CreateUrinationEntry = Omit<UrinationEntry, 'id' | 'timestamp' | 'type' | 'createdAt' | 'editHistory'> & {
  timestamp?: string;
};
export type CreateFluidEntry = Omit<FluidEntry, 'id' | 'timestamp' | 'type' | 'createdAt' | 'editHistory'> & {
  timestamp?: string;
};
export type CreateLeakEntry = Omit<LeakEntry, 'id' | 'timestamp' | 'type' | 'createdAt' | 'editHistory'> & {
  timestamp?: string;
};

// Helper types for updating entries
export type UpdateUrinationEntry = Partial<Omit<UrinationEntry, 'id' | 'type' | 'createdAt' | 'editHistory'>>;
export type UpdateFluidEntry = Partial<Omit<FluidEntry, 'id' | 'type' | 'createdAt' | 'editHistory'>>;
export type UpdateLeakEntry = Partial<Omit<LeakEntry, 'id' | 'type' | 'createdAt' | 'editHistory'>>;

// Daily Goals
export interface DailyGoals {
  fluidTarget: number;  // Default: 2000ml
  voidTarget: number;   // Default: 7 (6-8 range)
}

// Goal History - tracks when goals were changed
export interface GoalHistoryRecord {
  changedAt: string;  // ISO datetime when the change was made
  goals: DailyGoals;  // The new goals after the change
  changes: {
    fluidTarget?: { from: number; to: number };
    voidTarget?: { from: number; to: number };
  };
}

// Streak tracking
export interface StreakInfo {
  currentStreak: number;
  lastActiveDate: string | null;  // ISO date string (YYYY-MM-DD)
}
