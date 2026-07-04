"use client"

import { useRef, useState } from "react"
import { WandSparkles, RefreshCw, ChevronDown, ChevronUp, Terminal, Brain, Wrench, CheckCircle2, XCircle } from "lucide-react"
import { CardPreview } from "@/components/card-preview"
import { ExportButton } from "@/components/export-button"
import type { CocktailCard } from "@/backend/schema/card"

type Step = {
  thought: string
  action: string
  status: "ok" | "fail"
  summary: string
}

type DebugInfo = {
  steps: Step[]
  status: string
  termination?: { reason: string; summary: string }
}

export default function HomePage() {
  const [input, setInput] = useState("")
  const [card, setCard] = useState<CocktailCard | null>(null)
  const [debug, setDebug] = useState<DebugInfo | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showDebug, setShowDebug] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  async function generateCard() {
    if (!input.trim()) return
    setIsGenerating(true)
    setError(null)
    setCard(null)
    setDebug(null)
    setShowDetails(false)
    setShowDebug(true)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })
      const data = await response.json()

      if (!response.ok) {
        setDebug(data.steps ? { steps: data.steps, status: data.status || "failed", termination: data.termination } : null)
        throw new Error(data.error || "生成失败。")
      }

      setCard(data.card)
      setDebug({ steps: data.steps, status: data.status, termination: data.termination })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成失败。")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-[#fff7eb]">调酒名片</h1>
        <p className="text-sm text-[#c8b99f]">输入灵感，生成专属鸡尾酒名片</p>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              generateCard()
            }
          }}
          className="min-h-20 w-full resize-none rounded border border-white/15 bg-black/25 p-3 text-base text-[#fff7eb] outline-none transition focus:border-[#d8c6a7] placeholder:text-[#6b6050]"
          placeholder="雨夜、黑樱桃、爵士酒会…"
        />

        {error && (
          <p className="rounded bg-[#ffb4a8]/10 px-3 py-2 text-sm text-[#ffb4a8]">{error}</p>
        )}

        <button
          type="button"
          onClick={generateCard}
          disabled={isGenerating || !input.trim()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded bg-[#d8c6a7] text-sm font-medium text-[#17130f] transition hover:bg-[#ead8b8] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
        >
          <WandSparkles className="h-4 w-4" />
          {isGenerating ? "生成中…" : "生成名片"}
        </button>
      </div>

      {/* ReAct 步骤 */}
      {debug && debug.steps.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="flex w-full items-center justify-between rounded border border-white/10 px-3 py-2 text-sm text-[#a0c4a0] transition hover:bg-white/5"
          >
            <span className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" />
              Agent 思考过程 · {debug.steps.length} 步 · {debug.termination?.reason || debug.status}
            </span>
            {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showDebug && (
            <div className="mt-2 space-y-2 rounded border border-white/10 bg-black/30 p-3">
              {debug.steps.map((step, i) => (
                <div key={i} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  {/* 反思 */}
                  {step.thought && (
                    <div className="flex items-start gap-2 text-xs text-[#c8a87c]">
                      <Brain className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{step.thought}</span>
                    </div>
                  )}
                  {/* 行动 */}
                  <div className="mt-1 flex items-start gap-2 text-xs">
                    {step.status === "ok" ? (
                      <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-[#a0c4a0]" />
                    ) : (
                      <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-[#ffb4a8]" />
                    )}
                    <span className="text-[#a0c4a0]">{step.action}</span>
                  </div>
                  {/* 结果 */}
                  {step.summary && (
                    <div className="mt-1 flex items-start gap-2 text-xs text-[#8a9a8a]">
                      {step.status === "ok" ? (
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
                      ) : (
                        <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-[#ffb4a8]" />
                      )}
                      <span>{step.summary}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 text-xs text-[#6b8e6b]">
                完整原始日志见终端（next dev 窗口）
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card Preview */}
      {card ? (
        <div className="mt-5 space-y-4">
          <div ref={cardRef}>
            <CardPreview card={card} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ExportButton targetRef={cardRef} filename={card.name} />
            <button
              type="button"
              onClick={generateCard}
              disabled={isGenerating}
              className="inline-flex h-10 items-center gap-1 rounded border border-white/15 px-3 text-sm text-[#fff7eb] transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              重生成
            </button>
          </div>

          {/* Details */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex w-full items-center justify-between rounded border border-white/10 px-3 py-2 text-sm text-[#d8c6a7] transition hover:bg-white/5"
            >
              <span>配方 & 详情</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDetails && (
              <div className="mt-2 space-y-3 rounded border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-[#d7cbb8]">
                <div>
                  <p className="text-xs text-[#d8c6a7]">风味</p>
                  <p>{card.recipe.flavorProfile}</p>
                </div>
                <div>
                  <p className="text-xs text-[#d8c6a7]">做法</p>
                  <p>{card.recipe.method}</p>
                </div>
                <div>
                  <p className="text-xs text-[#d8c6a7]">杯型 · 装饰</p>
                  <p>{card.recipe.glass} · {card.recipe.garnish}</p>
                </div>
                {card.recipe.substitution && (
                  <div>
                    <p className="text-xs text-[#d8c6a7]">替代</p>
                    <p>{card.recipe.substitution}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#d8c6a7]">音乐</p>
                  {card.music.tracks.map((t) => (
                    <p key={t.title}>{t.artist} — {t.title}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        !debug && (
          <div className="mt-8 flex flex-1 items-center justify-center">
            <p className="text-center text-sm text-[#6b6050]">
              {isGenerating ? "AI 正在为你调酒…" : "输入灵感，生成一张专属名片"}
            </p>
          </div>
        )
      )}

      {/* Bottom spacer */}
      <div className="h-8" />
    </main>
  )
}
