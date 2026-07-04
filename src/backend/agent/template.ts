import type { TemplateId } from "../schema/card"

type TemplateInput = {
  theme: string
  mood: string[]
  intendedContext: string
}

type TemplateSelection = {
  id: TemplateId
  reason: string
}

const PERSONA_KEYWORDS = ["调酒师", "bartender", "名片", "联系方式", "contact", "host", "主持", "生日", "派对", "活动"]
const MENU_KEYWORDS = ["酒单", "菜单", "menu", "restaurant", "餐厅", "酒吧", "venue", "商用", "commercial", "专业"]

function includesAny(text: string, keywords: string[]) {
  return keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))
}

export function selectTemplate(input: TemplateInput): TemplateSelection {
  const text = [input.theme, input.intendedContext, ...input.mood].join(" ")

  if (includesAny(text, PERSONA_KEYWORDS)) {
    return { id: "personal-card", reason: "输入包含个人、活动或联系方式语境。" }
  }

  if (includesAny(text, MENU_KEYWORDS)) {
    return { id: "bar-menu", reason: "输入偏向酒单、场馆或专业菜单使用。" }
  }

  return { id: "album-cover", reason: "输入以情绪、故事或视觉氛围为主。" }
}
