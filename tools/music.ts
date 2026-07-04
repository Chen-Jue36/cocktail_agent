import type { AgentTool } from "../runtime/runtime"

export function createMusicRecommendTool(): AgentTool {
  return {
    id: "music.recommend",
    name: "Recommend music",
    description: "Recommend background music matching the cocktail's mood and context.",
    category: "generation",
    riskLevel: "L1",
    requiresConfirmation: false,
    timeoutMs: 5000,
    execute: async (_input) => {
      // TODO: call LLM or music API for track recommendations
      return { tracks: [] }
    },
  }
}

export function createMusicPlayTool(): AgentTool {
  return {
    id: "music.play",
    name: "Play music",
    description: "Play the selected soundtrack. Requires user confirmation.",
    category: "device",
    riskLevel: "L3",
    requiresConfirmation: true,
    timeoutMs: 10000,
    execute: async (_input) => {
      // TODO: connect to music player or streaming API
      return { playing: true }
    },
  }
}
