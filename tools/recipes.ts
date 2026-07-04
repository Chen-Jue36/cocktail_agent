import type { AgentTool } from "../runtime/runtime"

export function createRecipeSearchTool(): AgentTool {
  return {
    id: "recipe.search",
    name: "Search cocktail recipes",
    description: "Search cocktail recipes, flavor profiles, glassware, and garnish suggestions.",
    category: "data",
    riskLevel: "L1",
    requiresConfirmation: false,
    timeoutMs: 2000,
    execute: async (_input) => {
      // TODO: search recipe database or knowledge base
      return { recipes: [] }
    },
  }
}
