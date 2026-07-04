export type SkillCategory = "generate" | "flavor" | "context"

export type Skill = {
  id: string
  name: string
  category: SkillCategory
  description: string
  prompt: string
}

export type SkillSelection = {
  generate: string
  flavors: string[]
  contexts: string[]
}
