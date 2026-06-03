import { OrdersList } from "../orders-list"

export default function AdminRefusedOrdersPage() {
  return <OrdersList title="Отказались от получения" status="REFUSED" />
}

