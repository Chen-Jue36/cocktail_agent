import { z } from "zod"

export const MemoryTypeSchema = z.enum(["preference", "project", "tool", "reflection"])
export type MemoryType = z.infer<typeof MemoryTypeSchema>

export const MemorySourceSchema = z.enum(["user", "agent", "tool"])
export type MemorySource = z.infer<typeof MemorySourceSchema>

export const MemoryRecordSchema = z.object({
  id: z.string().min(1),
  type: MemoryTypeSchema,
  content: z.string().min(1),
  source: MemorySourceSchema,
  confidence: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
})

export type MemoryRecord = z.infer<typeof MemoryRecordSchema>
