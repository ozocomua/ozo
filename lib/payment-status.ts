export type PaymentStatus = "UNPAID" | "PAID"

export const PAYMENT_STATUSES: Array<{ value: PaymentStatus; label: string }> = [
  { value: "UNPAID", label: "Не оплачено" },
  { value: "PAID", label: "Оплачено" },
]

export function normalizePaymentStatus(raw: string | null | undefined): PaymentStatus | null {
  if (!raw) return null
  if (raw === "Оплачено") return "PAID"
  if (raw === "Не оплачено") return "UNPAID"
  if (raw === "UNPAID" || raw === "PAID") return raw
  return null
}

