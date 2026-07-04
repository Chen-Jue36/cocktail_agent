import type { CocktailCard } from "@/backend/schema/card"
import { AlbumCoverCard } from "./templates/album-cover"
import { BarMenuCard } from "./templates/bar-menu"
import { PersonalCard } from "./templates/personal-card"

export function CardPreview({ card }: { card: CocktailCard }) {
  if (card.template.id === "bar-menu") return <BarMenuCard card={card} />
  if (card.template.id === "personal-card") return <PersonalCard card={card} />
  return <AlbumCoverCard card={card} />
}
