import type { CocktailCard } from "../schema/card"

type Music = CocktailCard["music"]

export function recommendMusic(intent: CocktailCard["intent"]): Music {
  // TODO: call LLM to generate playlist and track recommendations
  return {
    playlistTitle: "",
    tracks: [],
  }
}
