import type { AgentTool } from "../runtime/runtime"

export function createCardRenderTool(): AgentTool {
  return {
    id: "card.render",
    name: "Render cocktail card",
    description: "Render a cocktail card preview as HTML or image.",
    category: "render",
    riskLevel: "L2",
    requiresConfirmation: false,
    timeoutMs: 5000,
    execute: async (_input) => {
      // TODO: render card using chosen template and data
      return { html: "" }
    },
  }
}
