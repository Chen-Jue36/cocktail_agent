import { config } from "../config"
import { getClient } from "./client"
import type { AgentRun, Runtime, RuntimeDecision } from "../runtime/runtime"

type DecideNextActionInput = {
  run: AgentRun
  runtime: Runtime
  step: number
}

type ToolSummary = {
  id: string
  desc: string
  category: string
  riskLevel: string
}

const DECIDER_SYSTEM_PROMPT = `你是调酒名片 Agent 的 ReAct 决策器。
你每次只决定下一步动作，不直接执行工具。

你必须返回严格 JSON，不要 Markdown。

可返回三种形态之一：
1. 调用工具：
{
  "toolId": "asset.search",
  "input": { "query": "rain black cherry" },
  "completedCriteria": ["asset-selected"],
  "reflection": "一句中文反思"
}

2. 结束：
{
  "final": true,
  "reflection": "一句中文总结"
}

3. 暂不行动：
{
  "reflection": "一句中文反思",
  "noProgress": true
}

规则：
- 每一步只选择一个工具或 final。
- 如果 doneCriteria 已全部满足，返回 final。
- 优先补齐未完成的 doneCriteria。
- 不要调用不存在的工具。
- Runtime 负责执行、权限检查和终止判断。`

export async function decideNextAction(input: DecideNextActionInput): Promise<RuntimeDecision> {
  const client = getClient()
  const context = buildDecisionContext(input)

  const response = await client.chat.completions.create({
    model: config.llm.textModel,
    messages: [
      { role: "system", content: DECIDER_SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(context, null, 2) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) {
    throw new Error("LLM decider returned empty content")
  }

  return parseRuntimeDecision(raw)
}

export function buildDecisionContext(input: DecideNextActionInput) {
  const tools: ToolSummary[] = Array.from(input.runtime.tools.values()).map((tool) => ({
    id: tool.id,
    desc: tool.description,
    category: tool.category,
    riskLevel: tool.riskLevel,
  }))

  return {
    goal: input.run.goal,
    doneCriteria: input.run.doneCriteria,
    completed: input.run.completedCriteria,
    remaining: input.run.doneCriteria.filter(
      (criterion) => !input.run.completedCriteria.includes(criterion),
    ),
    tools,
    events: input.run.events,
    step: input.step,
    maxSteps: Math.min(input.run.maxSteps, input.runtime.maxSteps),
  }
}

function parseRuntimeDecision(raw: string): RuntimeDecision {
  const parsed = JSON.parse(extractJson(raw)) as Record<string, unknown>

  if (parsed.final === true) {
    return {
      final: true,
      reflection: optionalString(parsed.reflection),
      noProgress: optionalBoolean(parsed.noProgress),
    }
  }

  if (typeof parsed.toolId === "string" && parsed.toolId.trim()) {
    return {
      toolId: parsed.toolId,
      input: parsed.input,
      completedCriteria: Array.isArray(parsed.completedCriteria)
        ? parsed.completedCriteria.filter((item): item is string => typeof item === "string")
        : undefined,
      reflection: optionalString(parsed.reflection),
      noProgress: optionalBoolean(parsed.noProgress),
    }
  }

  return {
    reflection: optionalString(parsed.reflection) ?? "LLM did not choose a tool or final.",
    noProgress: optionalBoolean(parsed.noProgress) ?? true,
  }
}

function extractJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (block) return block[1].trim()
  return text.trim()
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}
