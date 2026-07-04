import type { AgentTool } from "../runtime/runtime"

export function createMemoryRetrieveTool(): AgentTool {
  return {
    id: "memory.retrieve",
    name: "Retrieve memories",
    description: "Retrieve user preferences, project facts, tool experiences, and reflections.",
    category: "memory",
    riskLevel: "L1",
    requiresConfirmation: false,
    timeoutMs: 1000,
    execute: async (_input) => {
      // TODO: query memory store
      return { records: [] }
    },
  }
}

export function createMemoryWriteTool(): AgentTool {
  return {
    id: "memory.write",
    name: "Write memory",
    description: "Write a new memory record.",
    category: "memory",
    riskLevel: "L2",
    requiresConfirmation: false,
    timeoutMs: 1000,
    execute: async (_input) => {
      // TODO: persist to memory store
      return { written: true }
    },
  }
}
