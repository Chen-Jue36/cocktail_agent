import { describe, expect, it } from "vitest"
import {
  createAgentRun,
  createRuntime,
  registerTool,
  shouldAllowTool,
  type AgentTool
} from "@/backend/runtime/runtime"

const safeTool: AgentTool = {
  id: "asset.search",
  name: "Search assets",
  description: "Search local asset index",
  category: "asset",
  riskLevel: "L1",
  requiresConfirmation: false,
  timeoutMs: 1000,
  execute: async () => ({ matches: ["rain-black-cherry-abstract"] })
}

const printTool: AgentTool = {
  id: "printer.print",
  name: "Print card",
  description: "Send card to printer",
  category: "device",
  riskLevel: "L3",
  requiresConfirmation: false,
  timeoutMs: 1000,
  execute: async () => ({ printed: true })
}

const musicPlayTool: AgentTool = {
  id: "music.play",
  name: "Play music",
  description: "Play selected soundtrack",
  category: "device",
  riskLevel: "L3",
  requiresConfirmation: true,
  timeoutMs: 1000,
  execute: async () => ({ playing: true })
}

describe("ReAct runtime permissions", () => {
  it("自动允许 L0-L3 工具", () => {
    expect(shouldAllowTool(safeTool).allowed).toBe(true)
    expect(shouldAllowTool(printTool).allowed).toBe(true)
  })

  it("播放音乐必须进入确认等待", () => {
    const decision = shouldAllowTool(musicPlayTool)
    expect(decision.allowed).toBe(false)
    expect(decision.reason).toBe("music_play_requires_confirmation")
  })
})

describe("tool registry", () => {
  it("拒绝注册 L4 工具", () => {
    const runtime = createRuntime()
    expect(() =>
      registerTool(runtime, {
        ...safeTool,
        id: "purchase.buy",
        riskLevel: "L4" as never
      })
    ).toThrow("L4 tools are not supported")
  })
})

describe("ReAct runtime termination", () => {
  it("目标完成时终止", async () => {
    const runtime = createRuntime({ maxSteps: 4 })
    registerTool(runtime, safeTool)

    const run = createAgentRun("制作雨夜黑樱桃调酒名片", {
      doneCriteria: ["asset-selected"]
    })

    const result = await runtime.run(run, async ({ step }) => {
      if (step === 0) {
        return {
          toolId: "asset.search",
          input: { query: "rain black cherry" },
          completedCriteria: ["asset-selected"],
          reflection: "找到了符合雨夜黑樱桃情绪的非酒类抽象素材。"
        }
      }

      return { final: true, reflection: "目标已完成。" }
    })

    expect(result.status).toBe("completed")
    expect(result.termination?.reason).toBe("done")
  })

  it("达到最大步数时终止", async () => {
    const runtime = createRuntime({ maxSteps: 2 })
    const run = createAgentRun("无法完成的任务", {
      doneCriteria: ["card-rendered"]
    })

    const result = await runtime.run(run, async () => ({
      reflection: "还没有足够信息。"
    }))

    expect(result.status).toBe("failed")
    expect(result.termination?.reason).toBe("max_steps")
  })

  it("连续无进展 3 次时终止", async () => {
    const runtime = createRuntime({ maxSteps: 8, maxNoProgressSteps: 3 })
    const run = createAgentRun("卡住的任务", {
      doneCriteria: ["card-rendered"]
    })

    const result = await runtime.run(run, async () => ({
      reflection: "没有新增有用信息。",
      noProgress: true
    }))

    expect(result.status).toBe("failed")
    expect(result.termination?.reason).toBe("no_progress")
  })
})
