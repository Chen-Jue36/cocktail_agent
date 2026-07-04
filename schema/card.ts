import { z } from "zod"

export const TemplateIdSchema = z.enum(["album-cover", "bar-menu", "personal-card"])
export type TemplateId = z.infer<typeof TemplateIdSchema>

export const CocktailCardSchema = z.object({
  id: z.string().min(1),
  input: z.string().min(1),
  name: z.string().min(1),
  concept: z.string().min(1),
  intent: z.object({
    theme: z.string().min(1),
    mood: z.array(z.string().min(1)).min(1),
    flavorDirection: z.array(z.string().min(1)).min(1),
    visualStyle: z.string().min(1),
    intendedContext: z.string().min(1),
    musicVibe: z.array(z.string().min(1)).min(1),
  }),
  recipe: z.object({
    ingredients: z.array(z.string().min(1)).min(3),
    method: z.string().min(1),
    glass: z.string().min(1),
    garnish: z.string().min(1),
    flavorProfile: z.string().min(1),
    abvLevel: z.enum(["low", "medium", "high"]),
    substitution: z.string().min(1).optional(),
  }),
  copy: z.object({
    tagline: z.string().min(1),
    menuText: z.string().min(1),
    socialCaption: z.string().min(1),
  }),
  visual: z.object({
    imagePrompt: z.string().min(1),
    imageUrl: z.string().url().optional(),
    palette: z.array(z.string().min(1)).min(2),
  }),
  music: z.object({
    playlistTitle: z.string().min(1),
    tracks: z.array(
      z.object({
        title: z.string().min(1),
        artist: z.string().min(1),
        reason: z.string().min(1),
        url: z.string().url().optional(),
      })
    ).min(3).max(5),
  }),
  template: z.object({
    id: TemplateIdSchema,
    reason: z.string().min(1),
  }),
})

export type CocktailCard = z.infer<typeof CocktailCardSchema>
