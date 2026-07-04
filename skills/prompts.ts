import { listSkills, getSkill } from "./loader"
import type { SkillSelection } from "./types"

const JSON_FORMAT = `输出格式（严格 JSON，不要 Markdown 代码块）：
{
  "name": "酒名",
  "concept": "一句话概念",
  "intent": {
    "theme": "主题",
    "mood": ["情绪词"],
    "flavorDirection": ["风味方向"],
    "visualStyle": "视觉风格描述",
    "intendedContext": "使用场景",
    "musicVibe": ["音乐风格"]
  },
  "recipe": {
    "ingredients": ["原料 45ml", ...],
    "method": "调制步骤",
    "glass": "杯型",
    "garnish": "装饰",
    "flavorProfile": "风味描述",
    "abvLevel": "medium",
    "substitution": "替代建议（可选）"
  },
  "copy": {
    "tagline": "标语",
    "menuText": "菜单描述",
    "socialCaption": "社交分享文案"
  },
  "visual": {
    "imagePrompt": "英文图片生成 prompt。必须是非酒类抽象/插画/纹理/场景图，不得出现酒杯、酒瓶、吧台、调酒师、可见酒饮、倒酒动作或写实酒类摄影。",
    "palette": ["#HEX1", "#HEX2"]
  },
  "music": {
    "playlistTitle": "歌单名",
    "tracks": [{ "title": "曲名", "artist": "艺人", "reason": "推荐理由" }]
  },
  "template": {
    "id": "album-cover",
    "reason": "选择理由"
  }
}
tracks 3-5 首，ingredients 至少 3 个，每个带容量。中文为主，酒名/曲名/艺人名可保留原文。`

export function buildSystemPrompt(selection: SkillSelection): string {
  const parts: string[] = []

  const generate = getSkill(selection.generate)
  if (generate) parts.push(generate.prompt)

  for (const id of selection.flavors) {
    const flavor = getSkill(id)
    if (flavor) parts.push(flavor.prompt)
  }

  for (const id of selection.contexts) {
    const context = getSkill(id)
    if (context) parts.push(context.prompt)
  }

  // If no generate skill found, fall back to all generate skills
  if (!generate) {
    for (const g of listSkills("generate")) {
      parts.unshift(g.prompt)
    }
  }

  parts.push(JSON_FORMAT)
  return parts.join("\n\n")
}

export function buildUserPrompt(input: string): string {
  return `用户输入：${input}`
}
