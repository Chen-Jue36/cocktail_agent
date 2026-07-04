import type { CocktailCard } from "../schema/card"

type Visual = CocktailCard["visual"]

const FORBIDDEN_IMAGE_TERMS = [
  /\bcocktail\b/gi,
  /\bglass(?:es)?\b/gi,
  /\bcoupe\b/gi,
  /\bcollins\b/gi,
  /\bhighball\b/gi,
  /\bbottle(?:s)?\b/gi,
  /\bbar\b/gi,
  /\bbartender\b/gi,
  /\balcohol\b/gi,
  /\bdrink(?:s)?\b/gi,
  /\bphotorealistic\b/gi,
  /\b8k\b/gi,
]

export function generateVisual(intent: CocktailCard["intent"], name: string): Visual {
  // TODO: call LLM to create image prompt and palette
  return {
    imagePrompt: "",
    palette: [],
  }
}

export function sanitizeVisualPrompt(visual: Visual, intent: CocktailCard["intent"]): Visual {
  const source = [
    visual.imagePrompt,
    intent.visualStyle,
    intent.theme,
    ...intent.mood,
    ...intent.flavorDirection,
  ]
    .filter(Boolean)
    .join(", ")

  const cleaned = FORBIDDEN_IMAGE_TERMS.reduce(
    (text, term) => text.replace(term, ""),
    source,
  ).replace(/\s{2,}/g, " ").trim()

  return {
    ...visual,
    imagePrompt: [
      "editorial illustration",
      cleaned,
      "abstract mood artwork",
      "texture, color fields, botanical or weather motifs",
      "no glasses",
      "no bottles",
      "no bar",
      "no visible alcoholic drinks",
    ]
      .filter(Boolean)
      .join(", "),
  }
}
