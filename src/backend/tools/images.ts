import type { AgentTool } from "../runtime/runtime"

export function createImageGenerateTool(): AgentTool {
  return {
    id: "image.generate",
    name: "Generate cocktail image",
    description: "Generate or fetch a cocktail card image from a text prompt.",
    category: "generation",
    riskLevel: "L2",
    requiresConfirmation: false,
    timeoutMs: 30000,
    execute: async (_input) => {
      // TODO: call OpenAI image generation API
      return { imageUrl: "" }
    },
  }
}
