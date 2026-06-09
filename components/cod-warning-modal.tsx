"use client"

import { AlertTriangle, X } from "lucide-react"

interface CodWarningModalProps {
  open: boolean
  title: string
  message: string
  okLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function CodWarningModal({
  open,
  title,
  message,
  okLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: CodWarningModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-black/5 max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 opacity-30 hover:opacity-100 transition-opacity"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-6">
          <div className="inline-flex p-4 bg-amber-100 text-amber-700 rounded-full">
            <AlertTriangle size={28} />
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-serif italic text-black">{title}</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed px-2">{message}</p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onConfirm}
              className="w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-4 rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-widest hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-95 transition-all"
            >
              {okLabel}
            </button>
            <button
              onClick={onCancel}
              className="w-full text-[11px] sm:text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity py-3"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
