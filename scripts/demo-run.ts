import { createAssetSearchTool } from "../tools/assets"
import { createAgentRun, createRuntime, registerTool } from "../runtime/runtime"

async function main() {
  const runtime = createRuntime({ maxSteps: 6 })
  registerTool(
    runtime,
    createAssetSearchTool({
      indexPath: "../.claude/skills/cocktail-card-assets/references/asset-index.md"
    })
  )

  const run = createAgentRun("为雨夜黑樱桃爵士酒会制作调酒名片", {
    doneCriteria: ["asset-selected"]
  })

  const result = await runtime.run(run, async ({ step }) => {
    if (step === 0) {
      return {
        toolId: "asset.search",
        input: { query: "rain black cherry jazz luxury" },
        completedCriteria: ["asset-selected"],
        reflection: "先从非酒类插画素材库选择雨夜黑樱桃方向的视觉。"
      }
    }

    return {
      final: true,
      reflection: "素材已选定，可以进入配方、文案、模板和打印准备。"
    }
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
