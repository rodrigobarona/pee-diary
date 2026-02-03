import { z } from 'zod';

// Zod Schemas for validation
export const baseEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  notes: z.string().optional(),
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

// Helper types for creating entries
export type CreateUrinationEntry = Omit<UrinationEntry, 'id' | 'timestamp' | 'type'>;
export type CreateFluidEntry = Omit<FluidEntry, 'id' | 'timestamp' | 'type'>;
export type CreateLeakEntry = Omit<LeakEntry, 'id' | 'timestamp' | 'type'>;
