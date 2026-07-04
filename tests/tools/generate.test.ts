import { describe, expect, it, vi } from "vitest"

describe("createCardGenerateTool", () => {
  it("wraps generateCocktailCard as a ReAct tool", async () => {
    vi.doMock("../../agent/generate", () => ({
      generateCocktailCard: vi.fn().mockResolvedValue({
        card: { name: "雨夜黑樱桃" },
        skillsUsed: { generate: "generate-forward", flavors: [], contexts: [] },
        skillReason: "mocked",
      }),
    }))

    const { createCardGenerateTool } = await import("../../tools/generate")

    const tool = createCardGenerateTool()
    const result = await tool.execute({ prompt: "雨夜黑樱桃爵士酒会" })

    expect(tool.id).toBe("card.generate")
    expect(tool.category).toBe("generation")
    expect(tool.riskLevel).toBe("L2")
    expect(result).toEqual({
      card: { name: "雨夜黑樱桃" },
      skillsUsed: { generate: "generate-forward", flavors: [], contexts: [] },
      skillReason: "mocked",
    })
  })

  it("requires a prompt string", async () => {
    const { createCardGenerateTool } = await import("../../tools/generate")
    const tool = createCardGenerateTool()

    await expect(tool.execute({})).rejects.toThrow("card.generate requires { prompt: string }")
  })
})
