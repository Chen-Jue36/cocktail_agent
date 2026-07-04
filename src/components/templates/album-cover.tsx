import type { CocktailCard } from "@/backend/schema/card"

export function AlbumCoverCard({ card }: { card: CocktailCard }) {
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-lg bg-[#101820] text-[#fff7eb] shadow-2xl">
      <div className="relative aspect-[4/3] bg-[#0e4d64]">
        {card.visual.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.visual.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full items-center justify-center p-6 text-center text-sm text-[#e7d7b8]"
            style={{
              background: `linear-gradient(135deg, ${card.visual.palette[0] || "#0e4d64"}, ${card.visual.palette[1] || "#264653"}, #101820)`,
            }}
          >
            {card.intent.visualStyle}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#101820] to-transparent" />
      </div>

      <div className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[#d8c6a7]">Cocktail Card</p>
        <h2 className="text-2xl font-semibold">{card.name}</h2>
        <p className="text-sm leading-relaxed text-[#e9dcc8]">{card.copy.tagline}</p>

        <div className="border-t border-white/15 pt-3">
          <p className="text-xs text-[#d8c6a7]">{card.music.playlistTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#c7bba8]">
            {card.music.tracks.map((t) => `${t.artist} - ${t.title}`).join("  /  ")}
          </p>
        </div>
      </div>
    </article>
  )
}
