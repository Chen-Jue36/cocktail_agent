import type { CocktailCard } from "@/backend/schema/card"

export function BarMenuCard({ card }: { card: CocktailCard }) {
  return (
    <article className="flex w-full flex-col rounded-lg bg-[#f5f0e8] p-5 text-[#181510] shadow-2xl">
      <p className="text-xs uppercase tracking-[0.24em] text-[#77684f]">House Cocktail</p>
      <h2 className="mt-2 text-2xl font-semibold">{card.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#5f5444]">{card.copy.menuText}</p>

      <div className="mt-4 border-y border-[#cbbf9f] py-4">
        <h3 className="text-sm font-semibold">配方</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {card.recipe.ingredients.map((ing) => (
            <li key={ing}>{ing}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-[#77684f]">杯型</p>
          <p>{card.recipe.glass}</p>
        </div>
        <div>
          <p className="text-xs text-[#77684f]">装饰</p>
          <p>{card.recipe.garnish}</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[#5f5444]">{card.recipe.method}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {card.visual.palette.map((color) => (
          <span
            key={color}
            className="inline-block h-4 w-4 rounded-full border border-black/10"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </article>
  )
}
