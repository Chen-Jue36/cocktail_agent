import { z } from "zod"

export const ToolRiskLevelSchema = z.enum(["L0", "L1", "L2", "L3"])
export type ToolRiskLevel = z.infer<typeof ToolRiskLevelSchema>

export const ToolCategorySchema = z.enum([
  "data",
  "asset",
  "generation",
  "render",
  "device",
  "memory",
  "skill",
])
export type ToolCategory = z.infer<typeof ToolCategorySchema>

export const AgentToolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: ToolCategorySchema,
  riskLevel: ToolRiskLevelSchema,
  requiresConfirmation: z.boolean(),
  timeoutMs: z.number().positive(),
})

export type AgentToolMeta = z.infer<typeof AgentToolSchema>
