import type { AgentTool } from "../runtime/runtime"

export function createPrinterPrepareTool(): AgentTool {
  return {
    id: "printer.prepare",
    name: "Prepare print file",
    description: "Generate a print-ready file for the cocktail card.",
    category: "device",
    riskLevel: "L3",
    requiresConfirmation: false,
    timeoutMs: 5000,
    execute: async (_input) => {
      // TODO: generate print-ready PDF or image
      return { filePath: "" }
    },
  }
}

export function createPrinterPrintTool(): AgentTool {
  return {
    id: "printer.print",
    name: "Print card",
    description: "Send the prepared print file to a printer.",
    category: "device",
    riskLevel: "L3",
    requiresConfirmation: false,
    timeoutMs: 30000,
    execute: async (_input) => {
      // TODO: send to local or network printer
      return { printed: true }
    },
  }
}
