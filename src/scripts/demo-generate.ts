import { generateCocktailCard } from "@/backend/agent/generate"

const input = process.argv[2] || "雨夜、黑樱桃、爵士酒会，低调奢华"
const mode = process.argv[3] || "auto"

async function main() {
  console.log(`输入：${input}`)
  console.log(`模式：${mode}\n`)

  const skillsOpt = mode === "auto" ? "auto" : {}
  console.log("选择 skill + 生成中...\n")

  const { card, skillsUsed, skillReason } = await generateCocktailCard(input, {
    skills: skillsOpt,
  })

  console.log("======== Skill ========")
  console.log(`选择理由：${skillReason}`)
  console.log(`Generate: ${skillsUsed.generate} | Flavors: [${skillsUsed.flavors.join(", ") || "无"}] | Contexts: [${skillsUsed.contexts.join(", ") || "无"}]`)

  console.log("\n======== 酒名 ========")
  console.log(card.name)
  console.log(card.concept)

  console.log("\n======== 意图 ========")
  console.log(JSON.stringify(card.intent, null, 2))

  console.log("\n======== 配方 ========")
  for (const ing of card.recipe.ingredients) console.log(`  ${ing}`)
  console.log(`\n杯型：${card.recipe.glass}`)
  console.log(`装饰：${card.recipe.garnish}`)
  console.log(`做法：${card.recipe.method}`)
  console.log(`风味：${card.recipe.flavorProfile}`)
  console.log(`酒精度：${card.recipe.abvLevel}`)
  if (card.recipe.substitution) console.log(`替代：${card.recipe.substitution}`)

  console.log("\n======== 文案 ========")
  console.log(`标语：${card.copy.tagline}`)
  console.log(`菜单：${card.copy.menuText}`)
  console.log(`分享：${card.copy.socialCaption}`)

  console.log("\n======== 视觉 ========")
  console.log(`Prompt：${card.visual.imagePrompt}`)
  console.log(`调色板：${card.visual.palette.join(", ")}`)

  console.log("\n======== 音乐 ========")
  console.log(`歌单：${card.music.playlistTitle}`)
  for (const t of card.music.tracks) {
    console.log(`  ${t.artist} - ${t.title}（${t.reason}）`)
  }

  console.log("\n======== 模板 ========")
  console.log(`${card.template.id} — ${card.template.reason}`)
}

main().catch((error) => {
  console.error("\n生成失败：", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
