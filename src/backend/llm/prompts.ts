export const SYSTEM_PROMPT = `你是一个高级调酒创意 Agent。根据用户输入生成鸡尾酒名片 JSON。

规则：
- 输出严格 JSON，不要 Markdown 代码块
- 中文为主；酒名、曲名、艺人名可保留原文
- 配方必须真实可调，每个原料附带容量
- 图片 prompt 用英文写
- 模板 id 只能是 album-cover、bar-menu、personal-card 之一
- 调色板至少 2 个十六进制颜色`

export function buildUserPrompt(input: string): string {
  return `用户输入：${input}

生成一份完整 CocktailCard。输出 JSON 格式：

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
    "imagePrompt": "英文图片生成 prompt",
    "palette": ["#HEX1", "#HEX2"]
  },
  "music": {
    "playlistTitle": "歌单名",
    "tracks": [
      { "title": "曲名", "artist": "艺人", "reason": "推荐理由" }
    ]
  },
  "template": {
    "id": "album-cover",
    "reason": "选择理由"
  }
}

tracks 生成 3 到 5 首。ingredients 至少 3 个。`
}
