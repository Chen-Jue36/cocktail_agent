import { describe, expect, it, vi } from "vitest"

const mockCreate = vi.fn()

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

describe("autonomous ReAct loop", () => {
  it("lets the LLM choose asset search, card generation, then final", async () => {
    mockCreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                toolId: "asset.search",
                input: { query: "rain black cherry" },
                completedCriteria: ["asset-selected"],
                reflection: "先选择非酒类插画素材。",
              }),
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                toolId: "card.generate",
                input: { prompt: "雨夜黑樱桃爵士酒会" },
                completedCriteria: ["card-generated"],
                reflection: "素材已选定，现在生成完整名片。",
              }),
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                final: true,
                reflection: "素材和名片都已完成。",
              }),
            },
          },
        ],
      })

    vi.doMock("../../agent/generate", () => ({
      generateCocktailCard: vi.fn().mockResolvedValue({
        card: { name: "雨夜黑樱桃" },
        skillsUsed: { generate: "generate-forward", flavors: [], contexts: [] },
        skillReason: "mocked",
      }),
    }))

    const { runAutonomousCocktailDemo } = await import("../../scripts/demo-reAct-loop")

    const run = await runAutonomousCocktailDemo("雨夜黑樱桃爵士酒会")

    expect(run.status).toBe("completed")
    expect(run.termination?.reason).toBe("done")
    expect(run.completedCriteria).toEqual(["asset-selected", "card-generated"])
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })
})
