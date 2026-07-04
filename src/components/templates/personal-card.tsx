import type { CocktailCard } from "@/backend/schema/card"

export function PersonalCard({ card }: { card: CocktailCard }) {
  return (
    <article className="flex w-full flex-col rounded-lg bg-[#1f241f] p-5 text-[#fff7eb] shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#d8c6a7]">Signature Cocktail</p>
          <h2 className="mt-2 text-2xl font-semibold">{card.name}</h2>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#d8c6a7] text-[10px] text-[#d8c6a7]">
          QR
        </div>
      </div>

      <p className="mt-4 text-base leading-relaxed text-[#f0e3ce]">{card.copy.tagline}</p>
      <p className="mt-3 text-sm leading-relaxed text-[#cfc2ad]">{card.concept}</p>

      <div className="mt-4 rounded border border-white/15 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[#d8c6a7]">Flavor</p>
        <p className="mt-1 text-sm">{card.recipe.flavorProfile}</p>
      </div>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[#d8c6a7]">Soundtrack</p>
        <p className="mt-1 text-sm text-[#cfc2ad]">{card.music.playlistTitle}</p>
      </div>
    </article>
  )
}
