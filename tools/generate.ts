import type { AgentTool } from "../runtime/runtime"
import { generateCocktailCard } from "../agent/generate"

type CardGenerateInput = {
  prompt: string
}

export function createCardGenerateTool(): AgentTool {
  return {
    id: "card.generate",
    name: "Generate cocktail card",
    description: "Generate a complete cocktail card from the user prompt.",
    category: "generation",
    riskLevel: "L2",
    requiresConfirmation: false,
    timeoutMs: 30000,
    execute: async (input) => {
      const parsed = parseCardGenerateInput(input)
      return generateCocktailCard(parsed.prompt, { skills: "auto" })
    },
  }
}

function parseCardGenerateInput(input: unknown): CardGenerateInput {
  if (
    typeof input === "object" &&
    input !== null &&
    "prompt" in input &&
    typeof (input as { prompt: unknown }).prompt === "string" &&
    (input as { prompt: string }).prompt.trim()
  ) {
    return { prompt: (input as { prompt: string }).prompt }
  }

  throw new Error("card.generate requires { prompt: string }")
}
