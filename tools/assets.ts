import { readFileSync } from "node:fs"
import type { AgentTool } from "../runtime/runtime"

type AssetSearchInput = {
  query: string
}

type IndexedAsset = {
  id: string
  path: string
  text: string
}

export function loadAssetIndex(indexPath: string) {
  return readFileSync(indexPath, "utf8")
}

export function createAssetSearchTool(options: { indexPath: string }): AgentTool {
  return {
    id: "asset.search",
    name: "Search cocktail card illustration assets",
    description: "Search local non-alcohol illustration asset index for cocktail card art direction.",
    category: "asset",
    riskLevel: "L1",
    requiresConfirmation: false,
    timeoutMs: 1000,
    execute: async (input) => {
      const parsed = parseAssetSearchInput(input)
      const index = loadAssetIndex(options.indexPath)
      const assets = parseIndexedAssets(index)
      const terms = tokenize(parsed.query)

      const matches = assets
        .map((asset) => ({
          asset,
          score: terms.filter((term) => asset.text.toLowerCase().includes(term)).length
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => ({
          id: item.asset.id,
          path: item.asset.path
        }))

      return { matches }
    }
  }
}

function parseAssetSearchInput(input: unknown): AssetSearchInput {
  if (
    typeof input === "object" &&
    input !== null &&
    "query" in input &&
    typeof (input as { query: unknown }).query === "string"
  ) {
    return { query: (input as { query: string }).query }
  }

  throw new Error("asset.search requires { query: string }")
}

function parseIndexedAssets(index: string): IndexedAsset[] {
  const lines = index.split(/\r?\n/)
  const assets: IndexedAsset[] = []
  let current: IndexedAsset | null = null

  for (const line of lines) {
    const assetMatch = line.match(/^([a-z0-9-]+):\s*$/)
    if (assetMatch) {
      if (current) assets.push(current)
      current = {
        id: assetMatch[1],
        path: "",
        text: assetMatch[1]
      }
      continue
    }

    if (!current) continue

    current.text += ` ${line}`
    const pathMatch = line.match(/path:\s*`([^`]+)`/)
    if (pathMatch) {
      current.path = pathMatch[1]
    }
  }

  if (current) assets.push(current)

  return assets.filter((asset) => asset.path)
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/[\s,，。:：/]+/)
    .map((term) => term.trim())
    .filter(Boolean)
}
