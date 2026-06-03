"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function ProductDescription({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-12 w-full border-t pt-8">
      <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-4">
        Опис
      </h2>
      <div className="relative">
        <div
          className={`product-description text-sm text-muted-foreground leading-relaxed w-full max-w-full whitespace-pre-wrap break-normal block overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-[2000px]" : "max-h-[300px] md:max-h-[200px]"
          }`}
          dangerouslySetInnerHTML={{
            __html: html
              ? html.replace(/\u00a0/g, " ").replace(/&nbsp;/g, " ")
              : "",
          }}
        />
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <>
            Згорнути <ChevronUp size={14} />
          </>
        ) : (
          <>
            Читати більше <ChevronDown size={14} />
          </>
        )}
      </button>
    </div>
  )
}
