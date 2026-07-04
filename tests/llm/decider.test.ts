import { describe, expect, it, vi } from "vitest"

const mockCreate = vi.fn()

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

describe("decideNextAction", () => {
  it("parses a tool decision from the LLM", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              toolId: "asset.search",
              input: { query: "rain black cherry" },
              completedCriteria: ["asset-selected"],
              reflection: "先搜索符合雨夜黑樱桃气质的非酒类插画素材。",
            }),
          },
        },
      ],
    })

    const { decideNextAction } = await import("../../llm/decider")
    const { createAgentRun, createRuntime, registerTool } = await import("../../runtime/runtime")
    const { createAssetSearchTool } = await import("../../tools/assets")

    const runtime = createRuntime({ maxSteps: 8 })
    registerTool(
      runtime,
      createAssetSearchTool({
        indexPath: "../.claude/skills/cocktail-card-assets/references/asset-index.md",
      }),
    )

    const run = createAgentRun("为雨夜黑樱桃爵士酒会制作调酒名片", {
      doneCriteria: ["asset-selected", "card-generated"],
      maxSteps: 8,
    })

    const decision = await decideNextAction({
      run,
      runtime,
      step: 0,
    })

    expect(decision).toEqual({
      toolId: "asset.search",
      input: { query: "rain black cherry" },
      completedCriteria: ["asset-selected"],
      reflection: "先搜索符合雨夜黑樱桃气质的非酒类插画素材。",
    })

    const request = mockCreate.mock.calls[0][0]
    expect(request.response_format).toEqual({ type: "json_object" })
    expect(request.messages[1].content).toContain("asset.search")
    expect(request.messages[1].content).toContain("card-generated")
  })

  it("parses a final decision from the LLM", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              final: true,
              reflection: "素材和名片均已完成，可以结束。",
            }),
          },
        },
      ],
    })

    const { decideNextAction } = await import("../../llm/decider")
    const { createAgentRun, createRuntime } = await import("../../runtime/runtime")

    const runtime = createRuntime({ maxSteps: 8 })
    const run = createAgentRun("为雨夜黑樱桃爵士酒会制作调酒名片", {
      doneCriteria: ["asset-selected", "card-generated"],
      maxSteps: 8,
    })
    run.completedCriteria.push("asset-selected", "card-generated")

    await expect(decideNextAction({ run, runtime, step: 2 })).resolves.toEqual({
      final: true,
      reflection: "素材和名片均已完成，可以结束。",
    })
  })
})
