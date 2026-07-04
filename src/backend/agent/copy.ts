import type { CocktailCard } from "../schema/card"

type Copy = CocktailCard["copy"]

export function generateCopy(intent: CocktailCard["intent"], name: string): Copy {
  // TODO: call LLM to generate tagline, menu text, and social caption
  return {
    tagline: "",
    menuText: "",
    socialCaption: "",
  }
}
