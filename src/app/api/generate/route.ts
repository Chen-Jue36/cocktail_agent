import { NextResponse } from "next/server"
import { createAgentRun, createRuntime, registerTool } from "@/backend/runtime/runtime"
import { decideNextAction } from "@/backend/llm/decider"
import { createAssetSearchTool } from "@/backend/tools/assets"
import { createCardGenerateTool } from "@/backend/tools/generate"
import { createMemoryWriteTool } from "@/backend/tools/memory"
import { createSkillLookupTool } from "@/backend/tools/skills"
import type { AgentEvent } from "@/backend/runtime/runtime"
import type { CocktailCard } from "@/backend/schema/card"

const assetIndexPath = "skills/defs" // fallback, asset.search uses the indexPath passed at tool creation

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = typeof body.input === "string" ? body.input : ""

    if (!input.trim()) {
      return NextResponse.json({ error: "请输入内容。" }, { status: 400 })
    }

    const runtime = createRuntime({ maxSteps: 6 })

    registerTool(
      runtime,
      createAssetSearchTool({ indexPath: "../.claude/skills/cocktail-card-assets/references/asset-index.md" }),
    )
    registerTool(runtime, createCardGenerateTool())
    registerTool(runtime, createMemoryWriteTool())
    registerTool(runtime, createSkillLookupTool())

    const run = createAgentRun(`为用户制作调酒名片。用户输入：${input}`, {
      doneCriteria: ["card-generated"],
      maxSteps: 6,
    })

    const result = await runtime.run(run, ({ run, step }) =>
      decideNextAction({ run, runtime, step }),
    )

    // Extract card from generation event
    let card: CocktailCard | null = null
    for (const event of result.events) {
      if (event.type === "tool.completed" && event.toolId === "card.generate") {
        const output = event.output as { card: CocktailCard }
        if (output?.card) card = output.card
      }
    }

    const steps = extractSteps(result.events)

    if (!card) {
      return NextResponse.json({
        error: "Agent 未能生成名片。",
        status: result.status,
        steps,
      }, { status: 500 })
    }

    return NextResponse.json({
      card,
      status: result.status,
      termination: result.termination,
      steps,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败。" },
      { status: 400 },
    )
  }
}

type Step = {
  thought: string
  action: string
  status: "ok" | "fail"
  summary: string
}

function extractSteps(events: AgentEvent[]): Step[] {
  let currentReflection = ""
  const steps: Step[] = []

  for (const event of events) {
    if (event.type === "reflection.created") {
      currentReflection = event.summary
    }

    if (event.type === "tool.completed") {
      steps.push({
        thought: currentReflection,
        action: `调用 ${event.toolId}`,
        status: "ok",
        summary: summarizeOutput(event.toolId, event.output),
      })
      currentReflection = ""
    }

    if (event.type === "tool.failed") {
      steps.push({
        thought: currentReflection,
        action: `调用 ${event.toolId}`,
        status: "fail",
        summary: event.error,
      })
      currentReflection = ""
    }
  }

  if (currentReflection) {
    steps.push({
      thought: currentReflection,
      action: "结束",
      status: "ok",
      summary: "",
    })
  }

  return steps
}

function summarizeOutput(toolId: string, output: unknown): string {
  if (toolId === "asset.search") {
    const matches = (output as { matches?: Array<{ id: string }> })?.matches
    if (matches) return `找到 ${matches.length} 个匹配素材：${matches.map((m) => m.id).join("、")}`
    return "素材搜索完成"
  }
  if (toolId === "card.generate") {
    const card = (output as { card?: { name: string } })?.card
    if (card) return `生成名片「${card.name}」`
    return "名片生成完成"
  }
  if (toolId === "memory.write") return "记忆已保存"
  if (toolId === "skill.lookup") return "已查询 skill 索引"
  return String(output).slice(0, 100)
}
