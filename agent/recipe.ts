import type { CocktailCard } from "../schema/card"

type Recipe = CocktailCard["recipe"]

export function generateRecipe(intent: CocktailCard["intent"]): Recipe {
  // TODO: call LLM to generate a realistic cocktail recipe
  return {
    ingredients: [],
    method: "",
    glass: "",
    garnish: "",
    flavorProfile: "",
    abvLevel: "medium",
  }
}

export function checkRecipeSanity(recipe: Recipe) {
  const issues: string[] = []

  if (recipe.ingredients.length < 3) issues.push("配方至少需要 3 个原料。")
  if (!recipe.method.trim()) issues.push("需要提供调制方法。")
  if (!recipe.glass.trim()) issues.push("需要提供杯型。")
  if (!recipe.garnish.trim()) issues.push("需要提供装饰。")
  if (!recipe.flavorProfile.trim()) issues.push("需要提供风味描述。")

  return { ok: issues.length === 0, issues }
}
