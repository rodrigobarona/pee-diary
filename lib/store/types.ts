import { z } from "zod";

// Edit history record schema. "from" or "to" is missing from stored and
// backup JSON when the field was empty before or after the edit (for example
// a note added later), because JSON drops undefined values.
export const editRecordSchema = z.object({
  editedAt: z.string().datetime(),
  changes: z.record(
    z.string(),
    z.object({
      from: z.unknown().optional(),
      to: z.unknown().optional(),
    })
  ),
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
  type: z.literal("urination"),
  volume: z.enum(["small", "medium", "large"]),
  volumeMl: z.number().positive().optional(), // Optional precise measurement
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
  type: z.literal("fluid"),
  drinkType: z.enum(["water", "coffee", "tea", "juice", "alcohol", "other"]),
  amount: z.number().positive(),
});

export const leakActivitySchema = z.enum([
  "coughing",
  "sneezing",
  "laughing",
  "exercise",
  "lifting",
  "standing",
  "walking",
  "sleeping",
  "other",
]);

export const leakEntrySchema = baseEntrySchema.extend({
  type: z.literal("leak"),
  severity: z.enum(["drops", "moderate", "full"]),
  urgency: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  activity: leakActivitySchema.optional(),
});

export const diaryEntrySchema = z.discriminatedUnion("type", [
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

export type EntryType = DiaryEntry["type"];
export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;
export type VolumeSize = "small" | "medium" | "large";
export type DrinkType = FluidEntry["drinkType"];
export type LeakSeverity = LeakEntry["severity"];
export type LeakActivity = z.infer<typeof leakActivitySchema>;

// Helper types for creating entries (timestamp is optional - defaults to now)
export type CreateUrinationEntry = Omit<
  UrinationEntry,
  "id" | "timestamp" | "type" | "createdAt" | "editHistory"
> & {
  timestamp?: string;
};
export type CreateFluidEntry = Omit<
  FluidEntry,
  "id" | "timestamp" | "type" | "createdAt" | "editHistory"
> & {
  timestamp?: string;
};
export type CreateLeakEntry = Omit<
  LeakEntry,
  "id" | "timestamp" | "type" | "createdAt" | "editHistory"
> & {
  timestamp?: string;
};

// Helper types for updating entries
export type UpdateUrinationEntry = Partial<
  Omit<UrinationEntry, "id" | "type" | "createdAt" | "editHistory">
>;
export type UpdateFluidEntry = Partial<
  Omit<FluidEntry, "id" | "type" | "createdAt" | "editHistory">
>;
export type UpdateLeakEntry = Partial<
  Omit<LeakEntry, "id" | "type" | "createdAt" | "editHistory">
>;

// Daily Goals
// Only a fluid target: a daily bathroom-visit target was removed because more
// visits are not better for many bladder conditions.
export interface DailyGoals {
  // The user's own daily fluid target in ml; null until they set one (the
  // app suggests no amount)
  fluidTarget: number | null;
}

// Goal History - tracks when goals were changed
export interface GoalHistoryRecord {
  changedAt: string; // ISO datetime when the change was made
  goals: DailyGoals; // The new goals after the change
  changes: {
    fluidTarget?: { from: number | null; to: number | null };
  };
}

// Streak tracking
export interface StreakInfo {
  currentStreak: number;
  lastActiveDate: string | null; // ISO date string (YYYY-MM-DD)
}

// Reminder settings
export interface ReminderSettings {
  enabled: boolean;
  intervalHours: number; // How often to remind (e.g., 2, 3, 4 hours)
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00" format
  quietHoursEnd: string; // "07:00" format
}

// ============================================
// Schemas for stored data and backup files
// ============================================

export const languageSchema = z.enum(["en", "es", "pt"]);

// Goals as this version stores them, or as earlier versions did, with a visit
// target (voidTarget) that is no longer used and is dropped when read.
export const storedGoalsSchema = z.object({
  fluidTarget: z.number().positive().nullable(),
  voidTarget: z.number().optional(),
});

const goalChangeSchema = z.object({
  from: z.number().nullable(),
  to: z.number().nullable(),
});

// A goal history record, including records of earlier versions that only
// changed the visit target (dropped when read).
export const storedGoalHistoryRecordSchema = z.object({
  changedAt: z.string().datetime(),
  goals: storedGoalsSchema,
  changes: z.object({
    fluidTarget: goalChangeSchema.optional(),
    voidTarget: goalChangeSchema.optional(),
  }),
});

export const streakInfoSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  lastActiveDate: z.string().nullable(),
});
