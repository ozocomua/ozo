export type OrderStatus =
  | "NEW"
  | "PACKED"
  | "SHIPPED"
  | "REFUSED"
  | "RECEIVED"

export const ORDER_STATUSES: Array<{ value: OrderStatus; label: string }> = [
  { value: "NEW", label: "Новый" },
  { value: "PACKED", label: "Упакован" },
  { value: "SHIPPED", label: "Отправлен" },
  { value: "REFUSED", label: "Отказались" },
  { value: "RECEIVED", label: "Получен" },
]

export function normalizeOrderStatus(raw: string | null | undefined): OrderStatus | null {
  if (!raw) return null
  if (raw === "Нове") return "NEW"
  if (raw === "Новий") return "NEW"
  if (raw === "Новый") return "NEW"
  if (raw === "Упакованный") return "PACKED"
  if (raw === "Отправленный") return "SHIPPED"
  if (raw === "Отказались от получения") return "REFUSED"
  if (raw === "Получен") return "RECEIVED"
  if (raw === "NEW" || raw === "PACKED" || raw === "SHIPPED" || raw === "REFUSED" || raw === "RECEIVED") {
    return raw
  }
  return null
}

