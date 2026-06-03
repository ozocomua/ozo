"use client"

import { useState, useEffect } from "react"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface CodWarning {
  enabled: boolean
  title: string
  message: string
  okLabel: string
  cancelLabel: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cod, setCod] = useState<CodWarning>({
    enabled: true,
    title: "",
    message: "",
    okLabel: "",
    cancelLabel: "",
  })

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.codWarning) setCod(data.codWarning)
      })
      .catch(() => toast.error("Не вдалося завантажити налаштування"))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codWarning: cod }),
      })
      if (!res.ok) throw new Error()
      toast.success("Налаштування збережено")
    } catch {
      toast.error("Помилка збереження")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin opacity-20" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight">Налаштування</h1>
          <p className="text-muted-foreground mt-1 text-sm">Змінюй параметри сайту без редагування коду</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Збереження…" : "Зберегти"}
        </Button>
      </div>

      <div className="rounded-2xl border bg-white p-6 space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Оплата</h2>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Попередження про накладений платіж</div>
            <div className="text-xs text-muted-foreground">
              Показувати модальне вікно з інформацією про комісію при виборі накладеного платежу в кошику
            </div>
          </div>
          <Switch
            checked={cod.enabled}
            onCheckedChange={(v) => setCod({ ...cod, enabled: v })}
          />
        </div>

        {cod.enabled && (
          <div className="space-y-4 pl-1">
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Заголовок модального вікна</div>
              <Input
                value={cod.title}
                onChange={(e) => setCod({ ...cod, title: e.target.value })}
                placeholder="Накладений платіж"
              />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Текст попередження</div>
              <Textarea
                value={cod.message}
                onChange={(e) => setCod({ ...cod, message: e.target.value })}
                placeholder="При оплаті накладеним платежем..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Текст кнопки «ОК»</div>
                <Input
                  value={cod.okLabel}
                  onChange={(e) => setCod({ ...cod, okLabel: e.target.value })}
                  placeholder="ОК, зрозуміло"
                />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Текст кнопки «Скасувати»</div>
                <Input
                  value={cod.cancelLabel}
                  onChange={(e) => setCod({ ...cod, cancelLabel: e.target.value })}
                  placeholder="Скасувати"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
