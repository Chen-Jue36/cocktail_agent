import { readFileSync, readdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import type { Skill, SkillCategory } from "./types"

const __dirname = dirname(fileURLToPath(import.meta.url))
const defsDir = resolve(__dirname, "defs")

function parseFrontmatter(markdown: string): { fields: Record<string, string>; body: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { fields: {}, body: markdown }

  const fields: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.+)$/)
    if (kv) fields[kv[1]] = kv[2].trim()
  }

  return { fields, body: match[2].trim() }
}

let cache: Skill[] | null = null

export function listSkills(category?: SkillCategory): Skill[] {
  if (!cache) {
    const files = readdirSync(defsDir).filter((f) => f.endsWith(".md"))
    cache = files.map((file) => {
      const raw = readFileSync(resolve(defsDir, file), "utf8")
      const { fields, body } = parseFrontmatter(raw)
      return {
        id: file.replace(/\.md$/, ""),
        name: fields.name ?? file,
        category: (fields.category ?? "flavor") as SkillCategory,
        description: fields.description ?? "",
        prompt: body,
      }
    })
  }
  if (category) return cache.filter((s) => s.category === category)
  return cache
}

export function getSkill(id: string): Skill | undefined {
  return listSkills().find((s) => s.id === id)
}
