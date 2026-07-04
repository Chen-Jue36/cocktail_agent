import { describe, expect, it } from "vitest"
import { createAssetSearchTool, loadAssetIndex } from "@/backend/tools/assets"

const indexPath = "../.claude/skills/cocktail-card-assets/references/asset-index.md"

describe("cocktail-card-assets skill index", () => {
  it("loads the non-alcohol illustration asset index", () => {
    const index = loadAssetIndex(indexPath)

    expect(index).toContain("Hard Constraint")
    expect(index).toContain("Do not use or download images containing alcohol-related objects")
    expect(index).toContain("rain-black-cherry-abstract")
  })

  it("searches the local asset index by keywords", async () => {
    const tool = createAssetSearchTool({ indexPath })

    const result = await tool.execute({ query: "rain black cherry jazz" })

    expect(result).toEqual({
      matches: expect.arrayContaining([
        expect.objectContaining({
          id: "rain-black-cherry-abstract",
          path: "assets/illustrations/rain-black-cherry-abstract.svg"
        })
      ])
    })
  })
})
