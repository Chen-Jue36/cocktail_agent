export type ToolRiskLevel = "L0" | "L1" | "L2" | "L3"

export type ToolCategory =
  | "data"
  | "asset"
  | "generation"
  | "render"
  | "device"
  | "memory"
  | "skill"

export type AgentTool = {
  id: string
  name: string
  description: string
  category: ToolCategory
  riskLevel: ToolRiskLevel
  requiresConfirmation: boolean
  timeoutMs: number
  execute: (input: unknown) => Promise<unknown>
}

export type AgentEvent =
  | { type: "tool.completed"; toolId: string; output: unknown }
  | { type: "tool.failed"; toolId: string; error: string }
  | { type: "reflection.created"; summary: string }
  | { type: "confirmation.requested"; toolId: string; reason: string }
  | { type: "run.completed"; reason: TerminationReason; summary: string }
  | { type: "run.failed"; reason: TerminationReason; summary: string }

export type TerminationReason =
  | "done"
  | "max_steps"
  | "no_progress"
  | "tool_failure"
  | "confirmation_required"
  | "missing_tool"
  | "safety"

export type AgentRun = {
  id: string
  goal: string
  status: "running" | "waiting_confirmation" | "completed" | "failed"
  stepCount: number
  maxSteps: number
  doneCriteria: string[]
  completedCriteria: string[]
  events: AgentEvent[]
  termination?: {
    reason: TerminationReason
    summary: string
  }
}

export type RuntimeDecision =
  | {
      toolId: string
      input?: unknown
      completedCriteria?: string[]
      reflection?: string
      noProgress?: boolean
    }
  | {
      final: true
      reflection?: string
      noProgress?: boolean
    }
  | {
      reflection?: string
      noProgress?: boolean
    }

export type Runtime = {
  tools: Map<string, AgentTool>
  maxSteps: number
  maxNoProgressSteps: number
  run: (
    run: AgentRun,
    decide: (context: { run: AgentRun; step: number }) => Promise<RuntimeDecision>
  ) => Promise<AgentRun>
}

export function shouldAllowTool(tool: AgentTool) {
  if (tool.id === "music.play") {
    return {
      allowed: false,
      reason: "music_play_requires_confirmation"
    }
  }

  if (tool.requiresConfirmation) {
    return {
      allowed: false,
      reason: "tool_requires_confirmation"
    }
  }

  return {
    allowed: true,
    reason: "auto_allowed"
  }
}

export function createAgentRun(goal: string, options?: { doneCriteria?: string[]; maxSteps?: number }): AgentRun {
  return {
    id: `run_${Date.now()}`,
    goal,
    status: "running",
    stepCount: 0,
    maxSteps: options?.maxSteps ?? 12,
    doneCriteria: options?.doneCriteria ?? [],
    completedCriteria: [],
    events: []
  }
}

export function createRuntime(options?: { maxSteps?: number; maxNoProgressSteps?: number }): Runtime {
  const runtime: Runtime = {
    tools: new Map(),
    maxSteps: options?.maxSteps ?? 12,
    maxNoProgressSteps: options?.maxNoProgressSteps ?? 3,
    run: async (run, decide) => executeRun(runtime, run, decide)
  }

  return runtime
}

export function registerTool(runtime: Runtime, tool: AgentTool) {
  if (!["L0", "L1", "L2", "L3"].includes(tool.riskLevel)) {
    throw new Error("L4 tools are not supported")
  }

  runtime.tools.set(tool.id, tool)
}

async function executeRun(
  runtime: Runtime,
  run: AgentRun,
  decide: (context: { run: AgentRun; step: number }) => Promise<RuntimeDecision>
) {
  let noProgressCount = 0
  const maxSteps = Math.min(run.maxSteps, runtime.maxSteps)

  for (let step = 0; step < maxSteps; step += 1) {
    run.stepCount = step + 1
    const decision = await decide({ run, step })

    if ("reflection" in decision && decision.reflection) {
      run.events.push({ type: "reflection.created", summary: decision.reflection })
    }

    if ("noProgress" in decision && decision.noProgress) {
      noProgressCount += 1
    } else {
      noProgressCount = 0
    }

    if (noProgressCount >= runtime.maxNoProgressSteps) {
      return failRun(run, "no_progress", "连续多次没有产生新的有效信息或产物。")
    }

    if ("final" in decision && decision.final) {
      return completeRun(run, "done", "Agent 判定目标已完成。")
    }

    if ("toolId" in decision) {
      const tool = runtime.tools.get(decision.toolId)
      if (!tool) {
        return failRun(run, "missing_tool", `缺少工具：${decision.toolId}`)
      }

      const permission = shouldAllowTool(tool)
      if (!permission.allowed) {
        run.status = "waiting_confirmation"
        run.termination = {
          reason: "confirmation_required",
          summary: permission.reason
        }
        run.events.push({ type: "confirmation.requested", toolId: tool.id, reason: permission.reason })
        return run
      }

      try {
        const output = await tool.execute(decision.input)
        run.events.push({ type: "tool.completed", toolId: tool.id, output })
        run.completedCriteria.push(...(decision.completedCriteria ?? []))
      } catch (error) {
        run.events.push({
          type: "tool.failed",
          toolId: tool.id,
          error: error instanceof Error ? error.message : "unknown error"
        })
        return failRun(run, "tool_failure", `工具执行失败：${tool.id}`)
      }
    }

    if (isDone(run)) {
      return completeRun(run, "done", "所有完成条件均已满足。")
    }
  }

  return failRun(run, "max_steps", "达到最大 ReAct 步数。")
}

function isDone(run: AgentRun) {
  return run.doneCriteria.length > 0 && run.doneCriteria.every((criterion) => run.completedCriteria.includes(criterion))
}

function completeRun(run: AgentRun, reason: TerminationReason, summary: string) {
  run.status = "completed"
  run.termination = { reason, summary }
  run.events.push({ type: "run.completed", reason, summary })
  return run
}

function failRun(run: AgentRun, reason: TerminationReason, summary: string) {
  run.status = "failed"
  run.termination = { reason, summary }
  run.events.push({ type: "run.failed", reason, summary })
  return run
}
