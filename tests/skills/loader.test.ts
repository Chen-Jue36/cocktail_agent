import { describe, expect, it } from "vitest"
import { listSkills, getSkill, buildSystemPrompt } from "../../skills"

describe("skill loader", () => {
  it("加载所有 generate 类 skill", () => {
    const skills = listSkills("generate")
    expect(skills.length).toBeGreaterThanOrEqual(2)
    expect(skills.map((s) => s.id)).toContain("generate-forward")
    expect(skills.map((s) => s.id)).toContain("generate-reverse")
  })

  it("加载所有 flavor 类 skill", () => {
    const skills = listSkills("flavor")
    expect(skills.length).toBeGreaterThanOrEqual(7)
    expect(skills.map((s) => s.id)).toContain("flavor-sour")
    expect(skills.map((s) => s.id)).toContain("flavor-sweet")
  })

  it("加载所有 context 类 skill", () => {
    const skills = listSkills("context")
    expect(skills.map((s) => s.id)).toContain("context-party")
    expect(skills.map((s) => s.id)).toContain("context-menu")
  })

  it("按 id 获取 skill", () => {
    const skill = getSkill("flavor-bitter")
    expect(skill).toBeDefined()
    expect(skill!.name).toBe("苦系")
    expect(skill!.category).toBe("flavor")
    expect(skill!.prompt).toContain("金巴利")
  })
})

describe("buildSystemPrompt", () => {
  it("组合 generate + flavor + context", () => {
    const prompt = buildSystemPrompt({
      generate: "generate-forward",
      flavors: ["flavor-sour"],
      contexts: ["context-party"],
    })

    expect(prompt).toContain("特调鸡尾酒")
    expect(prompt).toContain("酸味来源")
    expect(prompt).toContain("批量预制")
    expect(prompt).toContain("严格 JSON")
  })

  it("只含 generate 时仍能工作", () => {
    const prompt = buildSystemPrompt({
      generate: "generate-reverse",
      flavors: [],
      contexts: [],
    })

    expect(prompt).toContain("反推")
    expect(prompt).toContain("严格 JSON")
  })
})
