# 调酒名片 ReAct Agent Runtime 设计

## 目标

将调酒名片 Agent 从一次性生成器升级为可自主规划、调用工具、观察结果、反思修正、使用记忆、连接现实设备的 ReAct Runtime。

它仍然服务于同一个产品目标：输入一段文案、酒名、情绪或活动需求，自动完成鸡尾酒配方、文案、视觉、音乐、名片渲染和打印准备。但 v2 的核心不再是单次生成，而是可审计的多步行动循环。

## 技术选择

选择 **自建 ReAct Runtime**，OpenAI / Agents SDK 作为可选模型与工具适配层。

选择理由：

- 需要统一管理 MCP、skill、native tool、device tool 和 memory tool。
- 需要自定义权限模型：L0-L3 默认自动允许，只有播放音乐需要确认，L4 不做。
- 需要明确终止循环标准，避免无限规划或无意义重试。
- 需要支持用户自己持续暴露新工具，而不绑定某个 SDK 的内置抽象。
- 需要完整记录 plan、action、observation、reflection 和 final artifact，便于调试和复盘。

OpenAI / Agents SDK 可用于模型调用、结构化输出和 MCP 适配，但不作为核心状态机。

## Runtime 循环

每次任务运行一个 `AgentRun`。

```text
Goal
  -> Retrieve Memory
  -> Plan
  -> Select Action
  -> Permission Check
  -> Execute Tool
  -> Observe
  -> Reflect
  -> Revise Plan
  -> Stop or Continue
  -> Finalize
```

Agent 不向用户展示完整隐藏推理，只展示可审计摘要：

- 当前目标
- 简短计划
- 已调用工具
- 工具结果摘要
- 修正原因
- 终止原因
- 最终名片与可执行动作

## 终止循环标准

ReAct Runtime 必须满足任一条件即终止：

1. **目标完成**：最终产物满足 `doneCriteria` 中所有必需项。
2. **达到最大步数**：默认 `maxSteps = 12`。
3. **连续无进展**：连续 3 次 reflection 判定没有新增有用信息或产物质量无提升。
4. **重复工具失败**：同一个工具对同一个输入连续失败 2 次。
5. **等待用户确认**：遇到需要确认的音乐播放动作。
6. **缺少必需工具**：目标需要某工具，但 registry 中不存在可用工具。
7. **安全终止**：工具输出违反 schema、风险等级不被允许或执行结果不可恢复。

默认 `doneCriteria`：

- 已生成结构化鸡尾酒名片数据。
- 配方通过基础合理性检查。
- 已选定名片模板，且给出选择理由。
- 已有图片素材或可用占位视觉。
- 已有音乐推荐。
- 已生成可渲染名片。
- 如果用户要求打印，已生成打印预览或打印文件。
- 如果用户要求播放音乐，已进入用户确认等待状态或用户已确认并执行。

## 权限模型

用户确认的权限规则：

- L0 自动允许：规划、文本生成、配方生成、模板选择、自评。
- L1 自动允许：读取本地素材库、读取索引、读取酒谱库、搜索已配置数据源。
- L2 自动允许：调用外部数据或生成 API、写入短期/长期记忆、生成图片、渲染文件。
- L3 自动允许：打印准备、发送打印任务、访问本地设备工具。
- 音乐播放例外：`music.play` 必须请求用户确认。
- L4 不做：付费购买、公开发布、批量打印、不可逆商业操作不进入本系统范围。

工具仍需标注风险等级，但 Runtime 根据上述规则自动放行或阻塞。

## 工具网关

所有能力通过 Tool Gateway 暴露给 Runtime。

```ts
type AgentTool = {
  id: string
  name: string
  description: string
  inputSchema: object
  outputSchema: object
  category: "data" | "asset" | "generation" | "render" | "device" | "memory" | "skill"
  riskLevel: "L0" | "L1" | "L2" | "L3"
  requiresConfirmation: boolean
  timeoutMs: number
}
```

内置工具类别：

- `memory.retrieve`：读取偏好、项目、工具和反思记忆。
- `memory.write`：写入用户偏好、项目事实、工具经验和反思。
- `asset.search`：搜索本地调酒素材库索引。
- `recipe.search`：搜索酒谱、风味、杯型、装饰建议。
- `image.generate`：生成或获取鸡尾酒图片。
- `music.recommend`：推荐音乐。
- `music.play`：播放音乐，必须确认。
- `card.render`：渲染名片预览。
- `printer.prepare`：准备打印文件。
- `printer.print`：发送打印任务，自动允许，但必须有打印预览记录。
- `skill.lookup`：读取 skill 中的索引和使用指引。
- `mcp.call`：调用用户暴露的 MCP 工具。

## MCP 与 Skill 策略

MCP 用于动态能力，例如：

- 外部素材库
- 个人音乐库
- 打印机服务
- 本地库存或酒柜数据库
- 活动数据

Skill 用于稳定知识与素材索引，例如：

- 非酒类插画素材索引
- 图片风格与模板选择指南
- 酒谱和风味搭配参考
- 打印规格与纸张建议
- 音乐情绪映射参考

首个 skill 为 `cocktail-card-assets`，放在项目内 `.codex/skills/cocktail-card-assets`，包含：

- `SKILL.md`：触发说明和使用流程。
- `references/asset-index.md`：素材索引。
- `references/style-guide.md`：视觉风格与模板选择建议。
- `references/music-mood-map.md`：音乐情绪映射。
- `assets/`：下载或生成的非酒类插画素材文件。

素材硬约束：

- 禁止下载或使用含酒杯、酒瓶、易拉罐、吧台、调酒师、可见酒饮、倒酒动作、酒类标签的图片。
- 允许使用抽象插画、纹理、几何图案、水果/植物形状、雨夜、月光、海面、城市、纸张、织物等非酒类视觉。
- 如果用户要求“鸡尾酒图片”，Agent 应把它解释为名片氛围图，而不是酒精饮品实物图。

Runtime 可以通过 `skill.lookup` 使用索引，让模型自行挑选合适素材，而不是硬编码图片。

## 记忆系统

记忆分四类：

```ts
type MemoryRecord = {
  id: string
  type: "preference" | "project" | "tool" | "reflection"
  content: string
  source: "user" | "agent" | "tool"
  confidence: number
  createdAt: string
  expiresAt?: string
}
```

写入规则：

- 用户明确表达的偏好可以直接写入。
- Agent 推断的偏好必须低置信度写入。
- 工具失败、打印机配置、素材命中率可以写入 tool memory。
- 每次任务结束可以写入一条 reflection memory。
- 用户可在后续 UI 中查看和删除记忆。

## 状态模型

```ts
type AgentRun = {
  id: string
  goal: string
  status: "running" | "waiting_confirmation" | "completed" | "failed"
  stepCount: number
  maxSteps: number
  doneCriteria: string[]
  plan: AgentPlanItem[]
  events: AgentEvent[]
  artifacts: AgentArtifact[]
  termination?: {
    reason: "done" | "max_steps" | "no_progress" | "tool_failure" | "confirmation_required" | "missing_tool" | "safety"
    summary: string
  }
}
```

`AgentEvent` 记录：

- `plan.created`
- `tool.selected`
- `tool.started`
- `tool.completed`
- `tool.failed`
- `reflection.created`
- `artifact.created`
- `confirmation.requested`
- `run.completed`
- `run.failed`

## 最小执行场景

输入：

> 给今晚的爵士酒会做一张名片，主题是雨夜、黑樱桃、低调奢华，可以打印，也要能播放配套音乐。

Agent 应该：

1. 从 memory 读取风格偏好。
2. 从 skill 素材索引查找雨夜、黑樱桃、低调奢华相关素材。
3. 生成鸡尾酒概念、配方、文案。
4. 选择模板。
5. 推荐音乐。
6. 渲染名片。
7. 准备打印文件并自动打印，前提是打印工具存在。
8. 请求用户确认是否播放音乐。
9. 写入 reflection memory。
10. 根据 doneCriteria 终止。

## 测试策略

- Runtime 终止条件测试。
- 权限模型测试，确保 L0-L3 自动允许、`music.play` 需要确认、L4 不注册。
- Tool Gateway schema 测试。
- skill 索引读取测试。
- memory 读写测试。
- mock 工具下的完整 run 测试。
- 工具失败重试和终止测试。

## 与 v1 的关系

v1 的名片生成、模板渲染、PNG 导出仍然保留，但由 Runtime 调用：

- 原 `generateCocktailCard` 变为 `generation.generateCocktailCard` 工具。
- 原模板选择变为 `card.selectTemplate` 或内嵌在 `card.render` 前。
- 原局部重生成变为 Runtime 的修正动作。
- 原 API route 可保留，但新的主入口应是 `/api/agent-runs`。
