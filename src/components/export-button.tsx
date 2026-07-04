"use client"

import { Download } from "lucide-react"
import { toPng } from "html-to-image"
import type { RefObject } from "react"

type ExportButtonProps = {
  targetRef: RefObject<HTMLDivElement | null>
  filename: string
}

export function ExportButton({ targetRef, filename }: ExportButtonProps) {
  async function exportImage() {
    if (!targetRef.current) return

    const dataUrl = await toPng(targetRef.current, {
      pixelRatio: 2,
      cacheBust: true,
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
      className="inline-flex h-10 items-center gap-2 rounded border border-white/15 px-3 text-sm text-[#fff7eb] transition hover:bg-white/10 active:scale-95"
    >
      <Download className="h-4 w-4" />
      导出 PNG
    </button>
  )
}
