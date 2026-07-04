import type { AgentTool } from "../runtime/runtime"

export function createSkillLookupTool(): AgentTool {
  return {
    id: "skill.lookup",
    name: "Look up skill reference",
    description: "Read skill index and usage guides from the local skill library.",
    category: "skill",
    riskLevel: "L1",
    requiresConfirmation: false,
    timeoutMs: 1000,
    execute: async (_input) => {
      // TODO: read and parse skill markdown files
      return { content: "" }
    },
  }
}
