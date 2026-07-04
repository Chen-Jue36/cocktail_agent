# 调酒名片 Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个中文优先的调酒名片 Agent Web App，用户输入酒名或文案后，自动生成鸡尾酒配方、文案、图片提示词、音乐推荐，并由 Agent 自主选择名片模板渲染可导出的竖版名片。

**Architecture:** 使用 Next.js App Router 做前后端一体应用。核心 Agent 逻辑放在 `src/lib/cocktail-agent/`，前端只负责输入、状态、预览、局部重生成和导出。OpenAI 调用集中封装在服务层，并提供确定性的 mock fallback，保证无 API key 时也能本地验证 UI 和测试。

**Tech Stack:** Next.js、React、TypeScript、Tailwind CSS、Vitest、React Testing Library、Zod、OpenAI JavaScript SDK、html-to-image、lucide-react。

---

## 文件结构

- Create: `package.json`，定义 Next.js、测试、lint、类型检查和开发命令。
- Create: `next.config.mjs`，Next.js 配置。
- Create: `tsconfig.json`，TypeScript 配置。
- Create: `postcss.config.mjs`，Tailwind/PostCSS 配置。
- Create: `tailwind.config.ts`，Tailwind 内容扫描和主题配置。
- Create: `vitest.config.ts`，Vitest + jsdom 测试配置。
- Create: `src/app/layout.tsx`，应用根布局。
- Create: `src/app/page.tsx`，主生成界面。
- Create: `src/app/globals.css`，全局样式和基础视觉变量。
- Create: `src/app/api/generate-card/route.ts`，完整生成 API。
- Create: `src/app/api/regenerate-section/route.ts`，局部重生成 API。
- Create: `src/components/create-panel.tsx`，输入、生成状态和操作区。
- Create: `src/components/card-preview.tsx`，根据 Agent 选择的模板渲染名片。
- Create: `src/components/result-editor.tsx`，结构化结果查看与局部重生成按钮。
- Create: `src/components/export-button.tsx`，PNG 导出按钮。
- Create: `src/components/templates/album-cover-card.tsx`，Album Cover 模板。
- Create: `src/components/templates/bar-menu-card.tsx`，Bar Menu 模板。
- Create: `src/components/templates/personal-card.tsx`，Personal Card 模板。
- Create: `src/lib/cocktail-agent/schema.ts`，`CocktailCard` 类型和 Zod schema。
- Create: `src/lib/cocktail-agent/mock-card.ts`，本地 mock 生成数据。
- Create: `src/lib/cocktail-agent/template-selector.ts`，模板选择规则。
- Create: `src/lib/cocktail-agent/recipe-sanity.ts`，配方字段和基础合理性检查。
- Create: `src/lib/cocktail-agent/prompts.ts`，结构化生成和局部重生成 prompt。
- Create: `src/lib/cocktail-agent/openai-client.ts`，OpenAI SDK 客户端封装。
- Create: `src/lib/cocktail-agent/generate-card.ts`，完整生成编排。
- Create: `src/lib/cocktail-agent/regenerate-section.ts`，局部重生成编排。
- Create: `src/lib/utils.ts`，通用 className 合并工具。
- Create: `src/test/setup.ts`，测试环境设置。
- Create: `src/lib/cocktail-agent/schema.test.ts`，schema 测试。
- Create: `src/lib/cocktail-agent/template-selector.test.ts`，模板选择测试。
- Create: `src/lib/cocktail-agent/recipe-sanity.test.ts`，配方合理性测试。
- Create: `src/components/card-preview.test.tsx`，模板渲染烟测。
- Create: `.env.example`，环境变量示例。

---

### Task 1: 初始化 Next.js 项目骨架

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `.env.example`

- [ ] **Step 1: 写入项目配置文件**

Create `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@tailwindcss/forms": "^0.5.10",
    "clsx": "^2.1.1",
    "html-to-image": "^1.11.13",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "openai": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.16.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

Create `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  }
}

export default nextConfig
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}

export default config
```

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Georgia", "ui-serif", "serif"]
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
}

export default config
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
})
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest"
```

Create `.env.example`:

```bash
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

- [ ] **Step 2: 安装依赖**

Run:

```bash
npm install
```

Expected: `node_modules` 和 `package-lock.json` 生成，命令以 exit code 0 结束。

- [ ] **Step 3: 运行基础检查**

Run:

```bash
npm run typecheck
```

Expected: 如果 Next.js 类型文件尚未生成，可能提示缺少 `next-env.d.ts`。执行一次 `npm run dev` 或 `npm run build` 后再运行应通过。若 TypeScript 提示源文件缺失，先继续 Task 2 创建基础应用文件。

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json next.config.mjs tsconfig.json postcss.config.mjs tailwind.config.ts vitest.config.ts src/test/setup.ts .env.example
git commit -m "chore: initialize cocktail card app"
```

Expected: 如果当前目录不是有效 git 仓库，跳过提交并在最终说明中记录。

---

### Task 2: 建立核心类型与 schema

**Files:**
- Create: `src/lib/cocktail-agent/schema.ts`
- Create: `src/lib/cocktail-agent/schema.test.ts`

- [ ] **Step 1: 写 schema 失败测试**

Create `src/lib/cocktail-agent/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { CocktailCardSchema } from "./schema"

const validCard = {
  id: "card_001",
  input: "午夜海边失恋，酒名 Blue Afterglow",
  name: "Blue Afterglow",
  concept: "一杯带有海风和余晖感的清冷金酒酸",
  intent: {
    theme: "午夜海边失恋",
    mood: ["清冷", "忧郁", "浪漫"],
    flavorDirection: ["柑橘", "花香", "清爽"],
    visualStyle: "月光下的蓝色鸡尾酒",
    intendedContext: "社交分享",
    musicVibe: ["dream pop", "slow jazz"]
  },
  recipe: {
    ingredients: ["金酒 45ml", "蓝柑橘力娇酒 15ml", "青柠汁 20ml", "接骨木花糖浆 10ml"],
    method: "加冰摇和后滤入冰镇 coupe 杯。",
    glass: "coupe",
    garnish: "脱水柠檬片",
    flavorProfile: "清爽、微酸、花香，收尾有轻微海盐感。",
    abvLevel: "medium",
    substitution: "没有接骨木花糖浆时，可用简单糖浆加少量橙花水替代。"
  },
  copy: {
    tagline: "给已经走远的人，也给仍然发亮的夜晚。",
    menuText: "蓝色柑橘和花香托起一杯冷调金酒酸。",
    socialCaption: "今晚的海风有一点蓝。"
  },
  visual: {
    imagePrompt: "A cinematic blue gin cocktail in a coupe glass...",
    imageUrl: "https://example.com/image.png",
    palette: ["#0E4D64", "#E7D7B8", "#101820"]
  },
  music: {
    playlistTitle: "Blue Afterglow: Midnight Tide",
    tracks: [
      { title: "No Ordinary Love", artist: "Sade", reason: "低速、丝滑、适合午夜情绪。" },
      { title: "Show Me How", artist: "Men I Trust", reason: "轻盈而带一点失落。" },
      { title: "Apocalypse", artist: "Cigarettes After Sex", reason: "雾面、浪漫、缓慢。" }
    ]
  },
  template: {
    id: "album-cover",
    reason: "情绪和画面感强，适合图片主导的社交分享。"
  }
}

describe("CocktailCardSchema", () => {
  it("接受完整的调酒名片数据", () => {
    expect(CocktailCardSchema.parse(validCard)).toEqual(validCard)
  })

  it("拒绝未知模板 id", () => {
    const badCard = {
      ...validCard,
      template: { id: "poster", reason: "bad" }
    }

    expect(() => CocktailCardSchema.parse(badCard)).toThrow()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm test -- src/lib/cocktail-agent/schema.test.ts
```

Expected: FAIL，错误包含 `Cannot find module './schema'`。

- [ ] **Step 3: 实现 schema 和类型**

Create `src/lib/cocktail-agent/schema.ts`:

```ts
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
    musicVibe: z.array(z.string().min(1)).min(1)
  }),
  recipe: z.object({
    ingredients: z.array(z.string().min(1)).min(3),
    method: z.string().min(1),
    glass: z.string().min(1),
    garnish: z.string().min(1),
    flavorProfile: z.string().min(1),
    abvLevel: z.enum(["low", "medium", "high"]),
    substitution: z.string().min(1).optional()
  }),
  copy: z.object({
    tagline: z.string().min(1),
    menuText: z.string().min(1),
    socialCaption: z.string().min(1)
  }),
  visual: z.object({
    imagePrompt: z.string().min(1),
    imageUrl: z.string().url().optional(),
    palette: z.array(z.string().min(1)).min(2)
  }),
  music: z.object({
    playlistTitle: z.string().min(1),
    tracks: z.array(z.object({
      title: z.string().min(1),
      artist: z.string().min(1),
      reason: z.string().min(1),
      url: z.string().url().optional()
    })).min(3).max(5)
  }),
  template: z.object({
    id: TemplateIdSchema,
    reason: z.string().min(1)
  })
})

export type CocktailCard = z.infer<typeof CocktailCardSchema>
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
npm test -- src/lib/cocktail-agent/schema.test.ts
```

Expected: PASS，2 tests passed。

- [ ] **Step 5: 提交**

```bash
git add src/lib/cocktail-agent/schema.ts src/lib/cocktail-agent/schema.test.ts
git commit -m "feat: add cocktail card schema"
```

---

### Task 3: 实现模板选择规则

**Files:**
- Create: `src/lib/cocktail-agent/template-selector.ts`
- Create: `src/lib/cocktail-agent/template-selector.test.ts`

- [ ] **Step 1: 写模板选择失败测试**

Create `src/lib/cocktail-agent/template-selector.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { selectTemplate } from "./template-selector"

describe("selectTemplate", () => {
  it("情绪和故事驱动时选择 Album Cover", () => {
    const result = selectTemplate({
      theme: "午夜海边失恋",
      mood: ["忧郁", "浪漫"],
      intendedContext: "社交分享",
      visualStyle: "电影感照片",
      flavorDirection: ["柑橘", "花香"],
      musicVibe: ["dream pop"]
    })

    expect(result.id).toBe("album-cover")
  })

  it("专业酒单或场馆场景选择 Bar Menu", () => {
    const result = selectTemplate({
      theme: "餐厅夏季酒单",
      mood: ["清爽"],
      intendedContext: "酒吧菜单",
      visualStyle: "干净商业摄影",
      flavorDirection: ["低甜", "酸爽"],
      musicVibe: ["lounge"]
    })

    expect(result.id).toBe("bar-menu")
  })

  it("个人、调酒师或活动名片选择 Personal Card", () => {
    const result = selectTemplate({
      theme: "调酒师 Alex 的生日派对名片",
      mood: ["热烈"],
      intendedContext: "私人活动与联系方式",
      visualStyle: "派对肖像感",
      flavorDirection: ["热带水果"],
      musicVibe: ["funk"]
    })

    expect(result.id).toBe("personal-card")
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm test -- src/lib/cocktail-agent/template-selector.test.ts
```

Expected: FAIL，错误包含 `Cannot find module './template-selector'`。

- [ ] **Step 3: 实现模板选择器**

Create `src/lib/cocktail-agent/template-selector.ts`:

```ts
import type { TemplateId } from "./schema"

type TemplateInput = {
  theme: string
  mood: string[]
  intendedContext: string
  visualStyle: string
  flavorDirection: string[]
  musicVibe: string[]
}

type TemplateSelection = {
  id: TemplateId
  reason: string
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))
}

export function selectTemplate(input: TemplateInput): TemplateSelection {
  const text = [
    input.theme,
    input.intendedContext,
    input.visualStyle,
    ...input.mood,
    ...input.flavorDirection,
    ...input.musicVibe
  ].join(" ")

  if (includesAny(text, ["调酒师", "bartender", "名片", "联系方式", "contact", "host", "主持", "生日", "派对", "活动"])) {
    return {
      id: "personal-card",
      reason: "输入包含个人、活动或联系方式语境，适合以身份和场景为中心的 Personal Card。"
    }
  }

  if (includesAny(text, ["酒单", "菜单", "menu", "restaurant", "餐厅", "酒吧", "venue", "商用", "commercial", "专业"])) {
    return {
      id: "bar-menu",
      reason: "输入偏向酒单、场馆或专业菜单使用，适合信息清晰的 Bar Menu。"
    }
  }

  return {
    id: "album-cover",
    reason: "输入以情绪、故事或视觉氛围为主，适合图片主导的 Album Cover。"
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
npm test -- src/lib/cocktail-agent/template-selector.test.ts
```

Expected: PASS，3 tests passed。

- [ ] **Step 5: 提交**

```bash
git add src/lib/cocktail-agent/template-selector.ts src/lib/cocktail-agent/template-selector.test.ts
git commit -m "feat: add autonomous template selection"
```

---

### Task 4: 实现配方基础合理性检查

**Files:**
- Create: `src/lib/cocktail-agent/recipe-sanity.ts`
- Create: `src/lib/cocktail-agent/recipe-sanity.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/lib/cocktail-agent/recipe-sanity.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { checkRecipeSanity } from "./recipe-sanity"

describe("checkRecipeSanity", () => {
  it("接受包含基础结构的配方", () => {
    const result = checkRecipeSanity({
      ingredients: ["金酒 45ml", "青柠汁 20ml", "糖浆 10ml", "蓝柑橘力娇酒 15ml"],
      method: "加冰摇和后滤入杯中。",
      glass: "coupe",
      garnish: "柠檬片",
      flavorProfile: "清爽、酸甜平衡。",
      abvLevel: "medium"
    })

    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it("拒绝缺少必要字段的配方", () => {
    const result = checkRecipeSanity({
      ingredients: ["金酒 45ml"],
      method: "",
      glass: "",
      garnish: "",
      flavorProfile: "",
      abvLevel: "medium"
    })

    expect(result.ok).toBe(false)
    expect(result.issues).toContain("配方至少需要 3 个原料。")
    expect(result.issues).toContain("需要提供调制方法。")
    expect(result.issues).toContain("需要提供杯型。")
    expect(result.issues).toContain("需要提供装饰。")
    expect(result.issues).toContain("需要提供风味描述。")
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm test -- src/lib/cocktail-agent/recipe-sanity.test.ts
```

Expected: FAIL，错误包含 `Cannot find module './recipe-sanity'`。

- [ ] **Step 3: 实现检查函数**

Create `src/lib/cocktail-agent/recipe-sanity.ts`:

```ts
import type { CocktailCard } from "./schema"

type Recipe = CocktailCard["recipe"]

export function checkRecipeSanity(recipe: Recipe) {
  const issues: string[] = []

  if (recipe.ingredients.length < 3) {
    issues.push("配方至少需要 3 个原料。")
  }

  if (!recipe.method.trim()) {
    issues.push("需要提供调制方法。")
  }

  if (!recipe.glass.trim()) {
    issues.push("需要提供杯型。")
  }

  if (!recipe.garnish.trim()) {
    issues.push("需要提供装饰。")
  }

  if (!recipe.flavorProfile.trim()) {
    issues.push("需要提供风味描述。")
  }

  return {
    ok: issues.length === 0,
    issues
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
npm test -- src/lib/cocktail-agent/recipe-sanity.test.ts
```

Expected: PASS，2 tests passed。

- [ ] **Step 5: 提交**

```bash
git add src/lib/cocktail-agent/recipe-sanity.ts src/lib/cocktail-agent/recipe-sanity.test.ts
git commit -m "feat: add recipe sanity checks"
```

---

### Task 5: 添加 mock 数据与 OpenAI prompt

**Files:**
- Create: `src/lib/cocktail-agent/mock-card.ts`
- Create: `src/lib/cocktail-agent/prompts.ts`

- [ ] **Step 1: 创建 mock 数据**

Create `src/lib/cocktail-agent/mock-card.ts`:

```ts
import type { CocktailCard } from "./schema"

export function createMockCard(input: string): CocktailCard {
  return {
    id: `mock_${Date.now()}`,
    input,
    name: "Blue Afterglow",
    concept: "一杯把午夜海风、蓝色柑橘和失恋余温揉在一起的金酒酸。",
    intent: {
      theme: input || "午夜海边失恋",
      mood: ["清冷", "忧郁", "浪漫"],
      flavorDirection: ["柑橘", "花香", "清爽"],
      visualStyle: "月光下的蓝色鸡尾酒，低光电影感",
      intendedContext: "社交分享",
      musicVibe: ["dream pop", "slow jazz", "trip-hop"]
    },
    recipe: {
      ingredients: ["金酒 45ml", "蓝柑橘力娇酒 15ml", "青柠汁 20ml", "接骨木花糖浆 10ml"],
      method: "所有材料加冰充分摇和，双重过滤入冰镇 coupe 杯。",
      glass: "冰镇 coupe 杯",
      garnish: "脱水柠檬片和一小撮海盐",
      flavorProfile: "入口是清亮柑橘酸感，中段有花香，尾段带轻微海盐感。",
      abvLevel: "medium",
      substitution: "没有接骨木花糖浆时，可用简单糖浆加一滴橙花水替代。"
    },
    copy: {
      tagline: "给已经走远的人，也给仍然发亮的夜晚。",
      menuText: "蓝柑橘、青柠与接骨木花托起一杯冷调金酒酸，像午夜海面上最后一层余光。",
      socialCaption: "今晚的海风有一点蓝。"
    },
    visual: {
      imagePrompt: "A cinematic translucent blue gin cocktail in a chilled coupe glass, dried lemon garnish, subtle sea salt rim, dark seaside bar background, moonlight reflections, editorial photography, shallow depth of field.",
      imageUrl: undefined,
      palette: ["#0E4D64", "#E7D7B8", "#101820"]
    },
    music: {
      playlistTitle: "Blue Afterglow: Midnight Tide",
      tracks: [
        { title: "No Ordinary Love", artist: "Sade", reason: "低速、丝滑，有夜色里的亲密感。" },
        { title: "Show Me How", artist: "Men I Trust", reason: "轻盈而带一点失落，贴近蓝色余晖。" },
        { title: "Apocalypse", artist: "Cigarettes After Sex", reason: "雾面、浪漫、缓慢，适合作为背景。" }
      ]
    },
    template: {
      id: "album-cover",
      reason: "这是情绪和画面感驱动的社交分享概念，适合 Album Cover。"
    }
  }
}
```

- [ ] **Step 2: 创建 prompts**

Create `src/lib/cocktail-agent/prompts.ts`:

```ts
export const COCKTAIL_CARD_SYSTEM_PROMPT = `
你是一个高级调酒创意 Agent。你的任务是根据用户输入生成可分享的鸡尾酒名片数据。
必须输出严格 JSON，不要输出 Markdown。
语言默认使用中文；酒名、音乐曲名和艺人名可以保留原文。
配方必须真实可调，避免危险、不可食用或明显不现实的材料。
名片模板由你自主选择，用户不需要手动选择模板。
`

export function buildCocktailCardUserPrompt(input: string) {
  return `
用户输入：
${input}

请生成完整 CocktailCard JSON。要求：
1. recipe.ingredients 至少 3 项，包含容量。
2. music.tracks 生成 3 到 5 首歌，每首包含 title、artist、reason。
3. visual.imagePrompt 用英文写，适合图片生成模型。
4. template.id 只能是 album-cover、bar-menu、personal-card。
5. template.reason 用中文解释选择理由。
`
}

export type RegeneratableSection = "recipe" | "copy" | "visual" | "music" | "template"

export function buildRegenerateSectionPrompt(section: RegeneratableSection, input: string) {
  return `
基于以下 CocktailCard JSON，只重生成 ${section} 字段，保持其它字段语义一致。
返回完整 CocktailCard JSON，不要只返回局部字段。

${input}
`
}
```

- [ ] **Step 3: 运行类型检查**

Run:

```bash
npm run typecheck
```

Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/lib/cocktail-agent/mock-card.ts src/lib/cocktail-agent/prompts.ts
git commit -m "feat: add cocktail card prompts and mock data"
```

---

### Task 6: 实现 Agent 生成编排

**Files:**
- Create: `src/lib/cocktail-agent/openai-client.ts`
- Create: `src/lib/cocktail-agent/generate-card.ts`
- Create: `src/lib/cocktail-agent/regenerate-section.ts`

- [ ] **Step 1: 创建 OpenAI 客户端封装**

Create `src/lib/cocktail-agent/openai-client.ts`:

```ts
import OpenAI from "openai"

export function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY)
}

export function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured")
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

export const textModel = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini"
export const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
```

- [ ] **Step 2: 实现完整生成编排**

Create `src/lib/cocktail-agent/generate-card.ts`:

```ts
import { zodResponseFormat } from "openai/helpers/zod"
import { COCKTAIL_CARD_SYSTEM_PROMPT, buildCocktailCardUserPrompt } from "./prompts"
import { CocktailCardSchema, type CocktailCard } from "./schema"
import { checkRecipeSanity } from "./recipe-sanity"
import { selectTemplate } from "./template-selector"
import { createMockCard } from "./mock-card"
import { createOpenAIClient, hasOpenAIKey, imageModel, textModel } from "./openai-client"

export async function generateCocktailCard(input: string): Promise<CocktailCard> {
  if (!input.trim()) {
    throw new Error("请输入酒名、文案或情绪描述。")
  }

  if (!hasOpenAIKey()) {
    return createMockCard(input)
  }

  const client = createOpenAIClient()

  const response = await client.responses.parse({
    model: textModel,
    input: [
      { role: "system", content: COCKTAIL_CARD_SYSTEM_PROMPT },
      { role: "user", content: buildCocktailCardUserPrompt(input) }
    ],
    text: {
      format: zodResponseFormat(CocktailCardSchema, "cocktail_card")
    }
  })

  const parsed = response.output_parsed
  if (!parsed) {
    throw new Error("模型没有返回有效的名片数据。")
  }

  const sanity = checkRecipeSanity(parsed.recipe)
  if (!sanity.ok) {
    throw new Error(`配方不完整：${sanity.issues.join(" ")}`)
  }

  const template = selectTemplate(parsed.intent)
  const card = CocktailCardSchema.parse({
    ...parsed,
    input,
    template
  })

  try {
    const image = await client.images.generate({
      model: imageModel,
      prompt: card.visual.imagePrompt,
      size: "1024x1536"
    })

    const imageItem = image.data?.[0] as { url?: string; b64_json?: string } | undefined
    const imageUrl = imageItem?.url ?? (imageItem?.b64_json ? `data:image/png;base64,${imageItem.b64_json}` : undefined)
    if (imageUrl) {
      return CocktailCardSchema.parse({
        ...card,
        visual: {
          ...card.visual,
          imageUrl
        }
      })
    }
  } catch {
    return card
  }

  return card
}
```

- [ ] **Step 3: 实现局部重生成编排**

Create `src/lib/cocktail-agent/regenerate-section.ts`:

```ts
import { zodResponseFormat } from "openai/helpers/zod"
import { createMockCard } from "./mock-card"
import { buildRegenerateSectionPrompt, COCKTAIL_CARD_SYSTEM_PROMPT, type RegeneratableSection } from "./prompts"
import { CocktailCardSchema, type CocktailCard } from "./schema"
import { selectTemplate } from "./template-selector"
import { createOpenAIClient, hasOpenAIKey, textModel } from "./openai-client"

export async function regenerateSection(card: CocktailCard, section: RegeneratableSection): Promise<CocktailCard> {
  if (!hasOpenAIKey()) {
    const mock = createMockCard(card.input)
    return CocktailCardSchema.parse({
      ...card,
      [section]: mock[section]
    })
  }

  const client = createOpenAIClient()
  const response = await client.responses.parse({
    model: textModel,
    input: [
      { role: "system", content: COCKTAIL_CARD_SYSTEM_PROMPT },
      { role: "user", content: buildRegenerateSectionPrompt(section, JSON.stringify(card, null, 2)) }
    ],
    text: {
      format: zodResponseFormat(CocktailCardSchema, "cocktail_card")
    }
  })

  const parsed = response.output_parsed
  if (!parsed) {
    throw new Error("模型没有返回有效的名片数据。")
  }

  if (section === "template") {
    return CocktailCardSchema.parse({
      ...card,
      template: selectTemplate(parsed.intent)
    })
  }

  return CocktailCardSchema.parse({
    ...card,
    [section]: parsed[section]
  })
}
```

- [ ] **Step 4: 运行类型检查**

Run:

```bash
npm run typecheck
```

Expected: PASS。如果 OpenAI SDK 的结构化输出 helper 类型与当前版本不同，按已安装 SDK 的类型签名调整 `responses.parse` 调用，并保持 `CocktailCardSchema.parse` 作为最终校验。

- [ ] **Step 5: 提交**

```bash
git add src/lib/cocktail-agent/openai-client.ts src/lib/cocktail-agent/generate-card.ts src/lib/cocktail-agent/regenerate-section.ts
git commit -m "feat: orchestrate cocktail card generation"
```

---

### Task 7: 添加 API routes

**Files:**
- Create: `src/app/api/generate-card/route.ts`
- Create: `src/app/api/regenerate-section/route.ts`

- [ ] **Step 1: 创建完整生成 API**

Create `src/app/api/generate-card/route.ts`:

```ts
import { NextResponse } from "next/server"
import { generateCocktailCard } from "@/lib/cocktail-agent/generate-card"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = typeof body.input === "string" ? body.input : ""
    const card = await generateCocktailCard(input)

    return NextResponse.json({ card })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败，请稍后重试。" },
      { status: 400 }
    )
  }
}
```

- [ ] **Step 2: 创建局部重生成 API**

Create `src/app/api/regenerate-section/route.ts`:

```ts
import { NextResponse } from "next/server"
import { regenerateSection } from "@/lib/cocktail-agent/regenerate-section"
import { CocktailCardSchema } from "@/lib/cocktail-agent/schema"
import type { RegeneratableSection } from "@/lib/cocktail-agent/prompts"

const sections: RegeneratableSection[] = ["recipe", "copy", "visual", "music", "template"]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const card = CocktailCardSchema.parse(body.card)
    const section = body.section as RegeneratableSection

    if (!sections.includes(section)) {
      return NextResponse.json({ error: "不支持的重生成区域。" }, { status: 400 })
    }

    const nextCard = await regenerateSection(card, section)
    return NextResponse.json({ card: nextCard })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "重生成失败，请稍后重试。" },
      { status: 400 }
    )
  }
}
```

- [ ] **Step 3: 运行类型检查**

Run:

```bash
npm run typecheck
```

Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/app/api/generate-card/route.ts src/app/api/regenerate-section/route.ts
git commit -m "feat: add cocktail card api routes"
```

---

### Task 8: 实现基础 UI 与全局样式

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/lib/utils.ts`
- Create: `src/components/create-panel.tsx`

- [ ] **Step 1: 创建工具函数**

Create `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: 创建全局样式**

Create `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  background: #111311;
  color: #f5f0e8;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at 10% 0%, rgba(40, 95, 91, 0.24), transparent 32rem),
    linear-gradient(135deg, #111311 0%, #1c1d18 46%, #2b2521 100%);
  color: #f5f0e8;
}

button,
textarea {
  font: inherit;
}
```

- [ ] **Step 3: 创建 layout**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "调酒名片 Agent",
  description: "输入酒名或情绪，生成鸡尾酒配方、文案、图片和音乐名片。"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: 创建输入组件**

Create `src/components/create-panel.tsx`:

```tsx
"use client"

import { WandSparkles } from "lucide-react"

type CreatePanelProps = {
  input: string
  isGenerating: boolean
  error: string | null
  onInputChange: (value: string) => void
  onGenerate: () => void
}

export function CreatePanel({ input, isGenerating, error, onInputChange, onGenerate }: CreatePanelProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-[#d8c6a7]">Cocktail Card Agent</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-[#fff7eb]">调酒名片 Agent</h1>
      </div>

      <textarea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        className="min-h-36 w-full resize-none rounded border border-white/15 bg-black/25 p-4 text-base text-[#fff7eb] outline-none transition focus:border-[#d8c6a7]"
        placeholder="输入酒名、文案或情绪。例如：一个适合午夜海边、带一点失恋感的鸡尾酒，名字叫 Blue Afterglow。"
      />

      {error ? <p className="text-sm text-[#ffb4a8]">{error}</p> : null}

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="inline-flex h-11 items-center gap-2 rounded bg-[#d8c6a7] px-4 text-sm font-medium text-[#17130f] transition hover:bg-[#ead8b8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <WandSparkles className="h-4 w-4" aria-hidden="true" />
        {isGenerating ? "生成中" : "生成名片"}
      </button>
    </section>
  )
}
```

- [ ] **Step 5: 创建页面状态骨架**

Create `src/app/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { CreatePanel } from "@/components/create-panel"
import type { CocktailCard } from "@/lib/cocktail-agent/schema"

export default function HomePage() {
  const [input, setInput] = useState("一个适合午夜海边、带一点失恋感的鸡尾酒，名字叫 Blue Afterglow。")
  const [card, setCard] = useState<CocktailCard | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateCard() {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "生成失败。")
      }

      setCard(data.card)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成失败。")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <CreatePanel
          input={input}
          isGenerating={isGenerating}
          error={error}
          onInputChange={setInput}
          onGenerate={generateCard}
        />
      </div>
      <section className="flex min-h-[70vh] items-center justify-center rounded border border-white/10 bg-black/20 p-4">
        {card ? (
          <pre className="max-w-full overflow-auto text-xs text-[#f5f0e8]">{JSON.stringify(card, null, 2)}</pre>
        ) : (
          <p className="text-center text-sm text-[#c8b99f]">生成后这里会出现调酒名片预览。</p>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 6: 运行类型检查**

Run:

```bash
npm run typecheck
```

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css src/lib/utils.ts src/components/create-panel.tsx
git commit -m "feat: add cocktail card creation shell"
```

---

### Task 9: 实现三套名片模板和预览

**Files:**
- Create: `src/components/templates/album-cover-card.tsx`
- Create: `src/components/templates/bar-menu-card.tsx`
- Create: `src/components/templates/personal-card.tsx`
- Create: `src/components/card-preview.tsx`
- Create: `src/components/card-preview.test.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 写模板渲染烟测**

Create `src/components/card-preview.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CardPreview } from "./card-preview"
import { createMockCard } from "@/lib/cocktail-agent/mock-card"

describe("CardPreview", () => {
  it("渲染 Album Cover 模板", () => {
    render(<CardPreview card={createMockCard("午夜海边")} />)
    expect(screen.getByText("Blue Afterglow")).toBeInTheDocument()
    expect(screen.getByText(/Midnight Tide/)).toBeInTheDocument()
  })

  it("渲染 Bar Menu 模板", () => {
    const card = createMockCard("酒吧菜单")
    render(<CardPreview card={{ ...card, template: { id: "bar-menu", reason: "菜单场景" } }} />)
    expect(screen.getByText("配方")).toBeInTheDocument()
  })

  it("渲染 Personal Card 模板", () => {
    const card = createMockCard("调酒师名片")
    render(<CardPreview card={{ ...card, template: { id: "personal-card", reason: "个人场景" } }} />)
    expect(screen.getByText("Signature Cocktail")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm test -- src/components/card-preview.test.tsx
```

Expected: FAIL，错误包含 `Cannot find module './card-preview'`。

- [ ] **Step 3: 创建 Album Cover 模板**

Create `src/components/templates/album-cover-card.tsx`:

```tsx
import type { CocktailCard } from "@/lib/cocktail-agent/schema"

export function AlbumCoverCard({ card }: { card: CocktailCard }) {
  return (
    <article className="aspect-[4/5] w-full max-w-[430px] overflow-hidden rounded bg-[#101820] text-[#fff7eb] shadow-2xl">
      <div className="relative h-[58%] bg-[#0e4d64]">
        {card.visual.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.visual.imageUrl} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0e4d64] via-[#264653] to-[#101820] p-8 text-center text-sm text-[#e7d7b8]">
            {card.intent.visualStyle || card.visual.imagePrompt}
          </div>
        )}
      </div>
      <div className="space-y-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#d8c6a7]">Cocktail Card</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal">{card.name}</h2>
          <p className="mt-2 text-sm leading-6 text-[#e9dcc8]">{card.copy.tagline}</p>
        </div>
        <div className="border-t border-white/15 pt-4">
          <p className="text-sm text-[#d8c6a7]">{card.music.playlistTitle}</p>
          <p className="mt-1 text-xs leading-5 text-[#c7bba8]">
            {card.music.tracks.map((track) => `${track.artist} - ${track.title}`).join(" / ")}
          </p>
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 4: 创建 Bar Menu 模板**

Create `src/components/templates/bar-menu-card.tsx`:

```tsx
import type { CocktailCard } from "@/lib/cocktail-agent/schema"

export function BarMenuCard({ card }: { card: CocktailCard }) {
  return (
    <article className="aspect-[4/5] w-full max-w-[430px] rounded bg-[#f5f0e8] p-7 text-[#181510] shadow-2xl">
      <p className="text-xs uppercase tracking-[0.24em] text-[#77684f]">House Cocktail</p>
      <h2 className="mt-3 text-4xl font-semibold tracking-normal">{card.name}</h2>
      <p className="mt-3 text-sm leading-6 text-[#5f5444]">{card.copy.menuText}</p>

      <div className="mt-6 border-y border-[#cbbf9f] py-5">
        <h3 className="text-sm font-semibold">配方</h3>
        <ul className="mt-3 space-y-1 text-sm leading-6">
          {card.recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-[#77684f]">杯型</p>
          <p>{card.recipe.glass}</p>
        </div>
        <div>
          <p className="text-xs text-[#77684f]">装饰</p>
          <p>{card.recipe.garnish}</p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-[#5f5444]">{card.recipe.method}</p>
    </article>
  )
}
```

- [ ] **Step 5: 创建 Personal Card 模板**

Create `src/components/templates/personal-card.tsx`:

```tsx
import type { CocktailCard } from "@/lib/cocktail-agent/schema"

export function PersonalCard({ card }: { card: CocktailCard }) {
  return (
    <article className="aspect-[4/5] w-full max-w-[430px] rounded bg-[#1f241f] p-7 text-[#fff7eb] shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#d8c6a7]">Signature Cocktail</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-normal">{card.name}</h2>
        </div>
        <div className="h-16 w-16 border border-[#d8c6a7] bg-white/5" aria-label="QR placeholder" />
      </div>

      <p className="mt-6 text-lg leading-7 text-[#f0e3ce]">{card.copy.tagline}</p>
      <p className="mt-4 text-sm leading-6 text-[#cfc2ad]">{card.concept}</p>

      <div className="mt-6 rounded border border-white/15 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#d8c6a7]">Flavor</p>
        <p className="mt-2 text-sm">{card.recipe.flavorProfile}</p>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#d8c6a7]">Soundtrack</p>
        <p className="mt-2 text-sm text-[#cfc2ad]">{card.music.playlistTitle}</p>
      </div>
    </article>
  )
}
```

- [ ] **Step 6: 创建 CardPreview 分发组件**

Create `src/components/card-preview.tsx`:

```tsx
import type { CocktailCard } from "@/lib/cocktail-agent/schema"
import { AlbumCoverCard } from "./templates/album-cover-card"
import { BarMenuCard } from "./templates/bar-menu-card"
import { PersonalCard } from "./templates/personal-card"

export function CardPreview({ card }: { card: CocktailCard }) {
  if (card.template.id === "bar-menu") {
    return <BarMenuCard card={card} />
  }

  if (card.template.id === "personal-card") {
    return <PersonalCard card={card} />
  }

  return <AlbumCoverCard card={card} />
}
```

- [ ] **Step 7: 更新页面使用预览组件**

Modify `src/app/page.tsx` so the preview area becomes:

```tsx
import { CardPreview } from "@/components/card-preview"
```

and replace the `pre` rendering block with:

```tsx
{card ? (
  <CardPreview card={card} />
) : (
  <p className="text-center text-sm text-[#c8b99f]">生成后这里会出现调酒名片预览。</p>
)}
```

- [ ] **Step 8: 运行测试**

Run:

```bash
npm test -- src/components/card-preview.test.tsx
```

Expected: PASS，3 tests passed。

- [ ] **Step 9: 运行类型检查**

Run:

```bash
npm run typecheck
```

Expected: PASS。

- [ ] **Step 10: 提交**

```bash
git add src/components/templates/album-cover-card.tsx src/components/templates/bar-menu-card.tsx src/components/templates/personal-card.tsx src/components/card-preview.tsx src/components/card-preview.test.tsx src/app/page.tsx
git commit -m "feat: render autonomous cocktail card templates"
```

---

### Task 10: 添加结果编辑、局部重生成与导出

**Files:**
- Create: `src/components/result-editor.tsx`
- Create: `src/components/export-button.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 创建导出按钮**

Create `src/components/export-button.tsx`:

```tsx
"use client"

import { Download } from "lucide-react"
import { toPng } from "html-to-image"
import type { RefObject } from "react"

type ExportButtonProps = {
  targetRef: RefObject<HTMLElement>
  filename: string
}

export function ExportButton({ targetRef, filename }: ExportButtonProps) {
  async function exportImage() {
    if (!targetRef.current) return

    const dataUrl = await toPng(targetRef.current, {
      pixelRatio: 2,
      cacheBust: true
    })

    const link = document.createElement("a")
    link.download = `${filename || "cocktail-card"}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <button
      type="button"
      onClick={exportImage}
      className="inline-flex h-10 items-center gap-2 rounded border border-white/15 px-3 text-sm text-[#fff7eb] transition hover:bg-white/10"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      导出 PNG
    </button>
  )
}
```

- [ ] **Step 2: 创建结果编辑组件**

Create `src/components/result-editor.tsx`:

```tsx
"use client"

import { RefreshCw } from "lucide-react"
import type { CocktailCard } from "@/lib/cocktail-agent/schema"
import type { RegeneratableSection } from "@/lib/cocktail-agent/prompts"

type ResultEditorProps = {
  card: CocktailCard
  isRegenerating: boolean
  onRegenerate: (section: RegeneratableSection) => void
}

const sections: { id: RegeneratableSection; label: string }[] = [
  { id: "recipe", label: "换配方" },
  { id: "copy", label: "换文案" },
  { id: "visual", label: "换图片方向" },
  { id: "music", label: "换音乐" },
  { id: "template", label: "重选模板" }
]

export function ResultEditor({ card, isRegenerating, onRegenerate }: ResultEditorProps) {
  return (
    <aside className="space-y-4 rounded border border-white/10 bg-black/20 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#d8c6a7]">Agent Decision</p>
        <p className="mt-2 text-sm text-[#f5f0e8]">{card.template.reason}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            disabled={isRegenerating}
            onClick={() => onRegenerate(section.id)}
            className="inline-flex h-9 items-center gap-2 rounded border border-white/15 px-3 text-xs text-[#fff7eb] transition hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {section.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 text-sm leading-6 text-[#d7cbb8]">
        <p><span className="text-[#d8c6a7]">风味：</span>{card.recipe.flavorProfile}</p>
        <p><span className="text-[#d8c6a7]">做法：</span>{card.recipe.method}</p>
        <p><span className="text-[#d8c6a7]">社媒文案：</span>{card.copy.socialCaption}</p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: 更新页面接入编辑和导出**

Modify `src/app/page.tsx`:

```tsx
"use client"

import { useRef, useState } from "react"
import { CardPreview } from "@/components/card-preview"
import { CreatePanel } from "@/components/create-panel"
import { ExportButton } from "@/components/export-button"
import { ResultEditor } from "@/components/result-editor"
import type { RegeneratableSection } from "@/lib/cocktail-agent/prompts"
import type { CocktailCard } from "@/lib/cocktail-agent/schema"

export default function HomePage() {
  const [input, setInput] = useState("一个适合午夜海边、带一点失恋感的鸡尾酒，名字叫 Blue Afterglow。")
  const [card, setCard] = useState<CocktailCard | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<HTMLElement>(null)

  async function generateCard() {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "生成失败。")
      }

      setCard(data.card)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成失败。")
    } finally {
      setIsGenerating(false)
    }
  }

  async function regenerate(section: RegeneratableSection) {
    if (!card) return
    setIsRegenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card, section })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "重生成失败。")
      }

      setCard(data.card)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "重生成失败。")
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
      <div className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
        <CreatePanel
          input={input}
          isGenerating={isGenerating}
          error={error}
          onInputChange={setInput}
          onGenerate={generateCard}
        />
        {card ? (
          <>
            <ResultEditor card={card} isRegenerating={isRegenerating} onRegenerate={regenerate} />
            <ExportButton targetRef={cardRef} filename={card.name} />
          </>
        ) : null}
      </div>
      <section className="flex min-h-[70vh] items-center justify-center rounded border border-white/10 bg-black/20 p-4">
        {card ? (
          <div ref={cardRef}>
            <CardPreview card={card} />
          </div>
        ) : (
          <p className="text-center text-sm text-[#c8b99f]">生成后这里会出现调酒名片预览。</p>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 4: 运行类型检查**

Run:

```bash
npm run typecheck
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/result-editor.tsx src/components/export-button.tsx src/app/page.tsx
git commit -m "feat: add regeneration controls and png export"
```

---

### Task 11: 端到端本地验证

**Files:**
- Modify only files needed to fix verification failures.

- [ ] **Step 1: 运行全部测试**

Run:

```bash
npm test
```

Expected: PASS，schema、模板选择、配方检查、模板渲染测试全部通过。

- [ ] **Step 2: 运行类型检查**

Run:

```bash
npm run typecheck
```

Expected: PASS。

- [ ] **Step 3: 构建生产包**

Run:

```bash
npm run build
```

Expected: PASS，Next.js build 完成。

- [ ] **Step 4: 启动开发服务器**

Run:

```bash
npm run dev
```

Expected: 输出本地访问地址，通常是 `http://localhost:3000`。

- [ ] **Step 5: 手动 QA**

在浏览器访问本地地址并验证：

- 默认输入可以生成 mock 名片。
- 没有 `OPENAI_API_KEY` 时也能生成可预览名片。
- 名片模板由 Agent 数据中的 `template.id` 决定。
- 点击“换配方”“换文案”“换图片方向”“换音乐”“重选模板”不会导致页面崩溃。
- 点击“导出 PNG”会下载图片。
- 移动宽度下输入区、预览区和按钮文字不重叠。

- [ ] **Step 6: 提交验证修复**

```bash
git add .
git commit -m "test: verify cocktail card agent mvp"
```

Expected: 如果没有修复文件或当前目录不是有效 git 仓库，跳过提交并记录。

---

## 实施注意事项

- 不要让用户在主流程里选择模板；模板选择必须由 Agent 或规则完成。
- 没有 API key 时必须保持可演示，使用 `createMockCard`。
- 生成接口必须返回结构化 `CocktailCard`，前端不解析自然语言。
- 图片生成失败不能阻塞名片生成；使用渐变占位即可。
- UI 第一屏就是工具本身，不做营销 landing page。
- 颜色避免单一深蓝或单一米色主题；三套模板要有明显用途差异。
- 所有用户可见中文保持简洁，不写功能说明长文。

## 自检记录

- 设计文档中的输入解析、配方、文案、图片、音乐、模板自主选择、预览、局部重生成和 PNG 导出均有对应任务。
- MVP 排除项没有进入计划。
- 当前计划假设从空目录创建 Next.js 应用；若执行时目录中已有前端项目，应先对照现有结构调整文件路径。
- 当前目录的 `.git` 状态可能异常；执行时如不能提交，应继续完成代码并在最终说明中记录提交被跳过。
