import { getClient } from "../llm/client"
import { config } from "../config"
import { listSkills } from "./loader"
import type { SkillSelection } from "./types"

const SELECTOR_PROMPT = `你是一个调酒 Agent 的 skill 选择器。根据用户输入，选择最合适的 skill 组合。

规则：
- generate：如果用户在描述风味/原料 → 选 generate-reverse，否则选 generate-forward
- flavors：只选与用户明确提到的风味方向相关的，最多 2 个。用户没提就不选
- contexts：只选与场景明确相关的，最多 1 个。用户没提就不选
- 宁缺毋滥，不确定就不选

返回 JSON：
{
  "generate": "generate-forward",
  "flavors": [],
  "contexts": [],
  "reason": "一句中文理由"
}`

const defaults: SkillSelection = {
  generate: "generate-forward",
  flavors: [],
  contexts: [],
}

export async function selectSkills(input: string): Promise<SkillSelection & { reason: string }> {
  const all = listSkills()
  const meta = all.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    desc: s.description,
  }))

  const client = getClient()
  const response = await client.chat.completions.create({
    model: config.llm.textModel,
    messages: [
      { role: "system", content: SELECTOR_PROMPT },
      { role: "user", content: `可用 skill：${JSON.stringify(meta)}\n\n用户输入：${input}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) {
    console.log("[selectSkills] LLM empty response, using defaults")
    return { ...defaults, reason: "模型无响应，使用默认。" }
  }

  console.log("[selectSkills] LLM raw:", raw)

  try {
    const parsed = JSON.parse(raw)
    const validIds = new Set(all.map((s) => s.id))

    const result = {
      generate: validIds.has(parsed.generate) ? parsed.generate : defaults.generate,
      flavors: (Array.isArray(parsed.flavors) ? parsed.flavors : []).filter((id: string) =>
        validIds.has(id),
      ),
      contexts: (Array.isArray(parsed.contexts) ? parsed.contexts : []).filter((id: string) =>
        validIds.has(id),
      ),
      reason: typeof parsed.reason === "string" ? parsed.reason : "自动选择。",
    }

    console.log("[selectSkills] selected:", JSON.stringify(result))
    return result
  } catch {
    console.log("[selectSkills] parse failed, using defaults")
    return { ...defaults, reason: "解析失败，使用默认。" }
  }
}
