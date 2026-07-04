# Cocktail Card Agent Design

## Goal

Build a cocktail card agent that takes a short text prompt, cocktail name, mood, or copy concept and generates a complete shareable cocktail identity card.

The card should include a credible cocktail recipe, polished copy, generated cocktail imagery, paired background music, and a finished visual card suitable for sharing.

## Product Positioning

The product is a lightweight creative agent for bartenders, cocktail hobbyists, event hosts, and brand creators. It turns a name or mood into a complete cocktail concept.

Core promise:

> Input a name, get a cocktail. Input a mood, get a shareable cocktail card.

The first version should be a web app. A chat interface or social bot can be added later, but the web app gives the clearest path to previewing and exporting cards.

## User Flow

1. User enters a cocktail name, short copy, mood, event theme, or brand/personality description.
2. Agent extracts structured intent: theme, mood, flavor direction, visual direction, audience, and likely use case.
3. Agent generates a realistic cocktail recipe.
4. Agent writes polished copy for the card and optional social captions.
5. Agent generates an image prompt and image.
6. Agent recommends matching background music.
7. Agent autonomously selects the most suitable card template.
8. App renders a finished card.
9. User can regenerate the whole card or selectively regenerate recipe, copy, image, music, or template choice.
10. User exports the card as PNG and optionally copies a share text.

## Agent Responsibilities

### Intent Parser

Turns free text into structured fields:

- cocktail name
- theme
- mood
- flavor direction
- visual style
- intended context
- audience
- music vibe
- constraints, if provided

Example:

```json
{
  "drinkName": "Blue Afterglow",
  "theme": "midnight seaside heartbreak",
  "mood": ["cool", "melancholic", "romantic"],
  "flavorDirection": ["citrus", "floral", "refreshing"],
  "visualStyle": "moonlit blue cocktail, cinematic low light",
  "intendedContext": "social sharing",
  "musicVibe": ["dream pop", "slow jazz", "trip-hop"]
}
```

### Recipe Generator

Creates a recipe that is attractive and actually mixable.

Recipe requirements:

- includes base spirit, modifiers, sweetener, acid, garnish, glassware, and method when appropriate
- keeps total volume and alcohol level reasonable
- explains the flavor profile
- offers one practical substitution when an ingredient may be uncommon
- avoids unsafe or unrealistic ingredients

### Copy Generator

Creates copy in three forms:

- card tagline
- short menu description
- social caption

The tone should follow the user input. The default style is elegant, sensory, and concise rather than jokey or over-written.

### Image Generator

Creates a generation prompt for a cocktail image and stores the resulting image URL or local asset reference.

The prompt should describe:

- glassware
- drink color and opacity
- garnish
- background setting
- lighting
- camera style
- mood

### Music Matcher

Recommends background music that matches the cocktail's mood and context.

MVP behavior:

- generate 3 to 5 track recommendations from the model
- include artist, title, and a short reason
- include a playlist title

Future behavior:

- search Spotify or another music provider
- provide playable links where licensing and platform constraints allow

### Template Selector

The agent chooses the card template automatically. Users should not need to choose a template in the normal flow.

Selection inputs:

- mood
- intended context
- image style
- copy density
- music prominence
- cocktail category

Initial template set:

- Album Cover: image-forward, best for emotional and social sharing concepts
- Bar Menu: information-forward, best for serious recipes, venues, and commercial use
- Personal Card: identity-forward, best for bartender profiles, events, and contact/QR use cases

Default rule:

- choose Album Cover for mood-led or story-led prompts
- choose Bar Menu for ingredient-led, venue-led, or professional menu prompts
- choose Personal Card for prompts involving a named person, event host, bartender, brand ambassador, or contact details

The template choice should be returned with a reason. Manual override can be added later, but is not part of the primary MVP flow.

## Output Data Model

```ts
type CocktailCard = {
  id: string
  input: string
  name: string
  concept: string
  intent: {
    theme: string
    mood: string[]
    flavorDirection: string[]
    visualStyle: string
    intendedContext: string
    musicVibe: string[]
  }
  recipe: {
    ingredients: string[]
    method: string
    glass: string
    garnish: string
    flavorProfile: string
    abvLevel: "low" | "medium" | "high"
    substitution?: string
  }
  copy: {
    tagline: string
    menuText: string
    socialCaption: string
  }
  visual: {
    imagePrompt: string
    imageUrl?: string
    palette: string[]
  }
  music: {
    playlistTitle: string
    tracks: {
      title: string
      artist: string
      reason: string
      url?: string
    }[]
  }
  template: {
    id: "album-cover" | "bar-menu" | "personal-card"
    reason: string
  }
}
```

## MVP Scope

Included:

- free text input
- structured agent generation
- realistic cocktail recipe
- card copy
- image prompt and generated image
- music recommendations
- autonomous template selection
- rendered card preview
- PNG export
- partial regeneration controls

Excluded from MVP:

- user accounts
- saved card library
- live music playback
- alcohol inventory management
- nutrition or legal labeling
- complex commercial licensing flows
- multi-language UI beyond Chinese-first copy

## Interface Design

The first screen should be the actual creation tool, not a marketing landing page.

Primary areas:

- compact input panel
- generation status
- live card preview
- structured result editor
- export actions

The card preview should dominate the interface. Editing controls should be quiet and work-focused.

The app should support a vertical social-card export first. A horizontal business-card format can be added later.

## Technical Architecture

Recommended stack:

- Next.js or React for the web app
- server route for agent orchestration
- OpenAI text model for structured generation
- OpenAI image model for cocktail imagery
- HTML/CSS card renderer
- `html-to-image` or equivalent for PNG export

Generation pipeline:

1. text input enters `/api/generate-card`
2. server asks model for structured card JSON without image URL
3. server validates JSON shape
4. server requests image generation from the image prompt
5. server adds image URL to card JSON
6. front end renders the chosen template
7. user can export PNG or regenerate selected sections

## Error Handling

The app should handle:

- invalid or empty user input
- malformed model JSON
- image generation failure
- unavailable music links
- export failure

Fallbacks:

- if image generation fails, render a styled placeholder using the generated palette and drink name
- if music matching is weak, return genre and playlist mood without track links
- if template selection is ambiguous, choose Album Cover and explain the reason

## Testing Strategy

MVP tests:

- schema validation for generated card JSON
- template selection rules
- recipe sanity checks for required fields
- rendering smoke tests for all templates
- export smoke test

Manual QA:

- short drink name
- long emotional prompt
- professional venue prompt
- person/event prompt
- Chinese prompt
- English prompt
- image generation failure fallback

## Open Decisions

None for MVP. The current agreed decision is that the agent chooses the card template autonomously.

Future decisions:

- whether to support Spotify or another music API
- whether to add user accounts and saved cards
- whether to support physical print formats
- whether to support full bilingual cards
