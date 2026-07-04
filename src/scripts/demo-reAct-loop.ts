import { createAgentRun, createRuntime, registerTool } from "@/backend/runtime/runtime"
import { decideNextAction } from "@/backend/llm/decider"
import { createAssetSearchTool } from "@/backend/tools/assets"
import { createCardGenerateTool } from "@/backend/tools/generate"
import { createMemoryWriteTool } from "@/backend/tools/memory"
import { createSkillLookupTool } from "@/backend/tools/skills"
import { pathToFileURL } from "node:url"

const defaultGoal = "雨夜黑樱桃爵士酒会"
const assetIndexPath = "../.claude/skills/cocktail-card-assets/references/asset-index.md"

export async function runAutonomousCocktailDemo(goalInput = defaultGoal) {
  const goal = `为${goalInput}制作调酒名片`
  const runtime = createRuntime({ maxSteps: 8 })

  registerTool(runtime, createAssetSearchTool({ indexPath: assetIndexPath }))
  registerTool(runtime, createCardGenerateTool())
  registerTool(runtime, createMemoryWriteTool())
  registerTool(runtime, createSkillLookupTool())

  const run = createAgentRun(goal, {
    doneCriteria: ["asset-selected", "card-generated"],
    maxSteps: 8,
  })

  return runtime.run(run, ({ run, step }) => decideNextAction({ run, runtime, step }))
}

async function main() {
  const input = process.argv[2] || defaultGoal
  const result = await runAutonomousCocktailDemo(input)
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
