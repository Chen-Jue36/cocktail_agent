import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const textExtensions = new Set([
  ".ts",
  ".md",
  ".json",
  ".svg",
  ".example",
])

const mojibakePatterns = [
  0xfffd,
  0x951b,
  0x9286,
  0x9422,
  0x748b,
  0x95b0,
  0x7d31,
  0x59af,
].map((codePoint) => String.fromCodePoint(codePoint))

function listTextFiles(dir: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue

    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listTextFiles(fullPath))
      continue
    }

    const dotIndex = entry.name.lastIndexOf(".")
    const extension = dotIndex >= 0 ? entry.name.slice(dotIndex) : entry.name
    if (textExtensions.has(extension)) files.push(fullPath)
  }

  return files
}

describe("UTF-8 source files", () => {
  it("do not contain replacement characters or common mojibake fragments", () => {
    const offenders = listTextFiles(".").flatMap((file) => {
      const content = readFileSync(file, "utf8")
      return mojibakePatterns
        .filter((pattern) => content.includes(pattern))
        .map((pattern) => `${file}: ${pattern}`)
    })

    expect(offenders).toEqual([])
  })
})
