import type { CocktailCard } from "../schema/card"

type Intent = CocktailCard["intent"]

export function parseIntent(input: string): Intent {
  // TODO: call LLM to extract structured intent from free text
  return {
    theme: input,
    mood: [],
    flavorDirection: [],
    visualStyle: "",
    intendedContext: "",
    musicVibe: [],
  }
}
