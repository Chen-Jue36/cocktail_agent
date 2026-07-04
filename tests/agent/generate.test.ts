import { describe, expect, it, vi } from "vitest"

const mockCreate = vi.fn()

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

const validResponse = {
  name: "雨夜黑樱桃",
  concept: "雨夜低调奢华的爵士酒会鸡尾酒。",
  intent: {
    theme: "雨夜爵士",
    mood: ["优雅", "神秘"],
    flavorDirection: ["果香", "微甜"],
    visualStyle: "深色背景，金色光线",
    intendedContext: "高端私人酒会",
    musicVibe: ["冷爵士"],
  },
  recipe: {
    ingredients: ["波本威士忌 45ml", "黑樱桃利口酒 15ml", "柠檬汁 15ml"],
    method: "加冰摇匀，双重过滤。",
    glass: "鸡尾酒杯",
    garnish: "黑樱桃串",
    flavorProfile: "饱满波本，黑樱桃甜酸。",
    abvLevel: "medium",
    substitution: "波本可用黑麦替代",
  },
  copy: {
    tagline: "雨夜低语。",
    menuText: "波本为基底，黑樱桃深邃。",
    socialCaption: "雨夜一杯黑樱桃。",
  },
  visual: {
    imagePrompt: "A dark cocktail in a coupe glass, cinematic lighting.",
    palette: ["#2C1A1A", "#D4AF37"],
  },
  music: {
    playlistTitle: "雨夜爵士",
    tracks: [
      { title: "Take Five", artist: "Dave Brubeck", reason: "经典。" },
      { title: "Misty", artist: "Erroll Garner", reason: "钢琴如雾。" },
      { title: "My Funny Valentine", artist: "Chet Baker", reason: "柔美。" },
    ],
  },
  template: {
    id: "bar-menu" as const,
    reason: "menu test",
  },
}

describe("generateCocktailCard", () => {
  it("解析模型返回的完整 JSON 并生成名片", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(validResponse) } }],
    })

    const { generateCocktailCard } = await import("../../agent/generate")

    const { card } = await generateCocktailCard("雨夜黑樱桃")

    expect(card.name).toBe("雨夜黑樱桃")
    expect(card.recipe.ingredients).toHaveLength(3)
    expect(card.recipe.abvLevel).toBe("medium")
    expect(card.music.tracks.length).toBeGreaterThanOrEqual(3)
    expect(card.id).toMatch(/^card_\d+/)
    expect(card.template.id).toBe("album-cover")
    expect(card.visual.imagePrompt).toContain("editorial illustration")
    expect(card.visual.imagePrompt).toContain("no glasses")
    expect(card.visual.imagePrompt).not.toMatch(/\bcocktail\b|\bcoupe\b|\bphotorealistic\b/i)
  })

  it("从 markdown 代码块中提取 JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "```json\n" + JSON.stringify(validResponse) + "\n```" } }],
    })

    const { generateCocktailCard } = await import("../../agent/generate")

    const { card } = await generateCocktailCard("test")
    expect(card.name).toBe("雨夜黑樱桃")
  })

  it("拒绝空输入", async () => {
    const { generateCocktailCard } = await import("../../agent/generate")
    await expect(generateCocktailCard("   ")).rejects.toThrow("请输入")
  })

  it("传入 flavor skill 时仍正常生成", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(validResponse) } }],
    })

    const { generateCocktailCard } = await import("../../agent/generate")

    const { card } = await generateCocktailCard("酸酸的夏日酒", {
      skills: { flavors: ["flavor-sour"] },
    })

    expect(card.name).toBe("雨夜黑樱桃")
  })
})
