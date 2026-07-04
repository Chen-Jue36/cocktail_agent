import { getClient } from "../llm/client"
import { buildSystemPrompt, buildUserPrompt, selectSkills } from "../skills"
import type { SkillSelection } from "../skills"
import { CocktailCardSchema, type CocktailCard } from "../schema/card"
import { config } from "../config"
import { checkRecipeSanity } from "./recipe"
import { selectTemplate } from "./template"
import { sanitizeVisualPrompt } from "./visual"

export type GenerateOptions = {
  skills?: "auto" | Partial<SkillSelection>
}

const defaults: SkillSelection = {
  generate: "generate-forward",
  flavors: [],
  contexts: [],
}

function extractJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (block) return block[1].trim()
  return text.trim()
}

export type GenerateResult = {
  card: CocktailCard
  skillsUsed: SkillSelection
  skillReason: string
}

export async function generateCocktailCard(
  input: string,
  options?: GenerateOptions,
): Promise<GenerateResult> {
  if (!input.trim()) {
    throw new Error("请输入酒名、文案或情绪描述。")
  }

  let skills: SkillSelection
  let skillReason = ""

  if (options?.skills === "auto") {
    const selection = await selectSkills(input)
    skills = { generate: selection.generate, flavors: selection.flavors, contexts: selection.contexts }
    skillReason = selection.reason
  } else {
    skills = { ...defaults, ...options?.skills }
    skillReason = "手动指定。"
  }

  const client = getClient()

  const response = await client.chat.completions.create({
    model: config.llm.textModel,
    messages: [
      { role: "system", content: buildSystemPrompt(skills) },
      { role: "user", content: buildUserPrompt(input) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) {
    throw new Error("模型没有返回内容。")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(extractJson(raw))
  } catch {
    throw new Error(`模型返回的不是有效 JSON：${raw.slice(0, 200)}`)
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("模型返回的 JSON 不是对象。")
  }

  const merged = {
    ...(parsed as Record<string, unknown>),
    id: `card_${Date.now()}`,
    input,
  }

  const rawCard = CocktailCardSchema.parse(merged)
  const card = {
    ...rawCard,
    visual: sanitizeVisualPrompt(rawCard.visual, rawCard.intent),
  }

  const sanity = checkRecipeSanity(card.recipe)
  if (!sanity.ok) {
    throw new Error(`配方不完整：${sanity.issues.join(" ")}`)
  }

  const template = selectTemplate({
    theme: card.intent.theme,
    mood: card.intent.mood,
    intendedContext: card.intent.intendedContext,
  })

  return {
    card: { ...card, template },
    skillsUsed: skills,
    skillReason,
  }
}
