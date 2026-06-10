import { OrdersList } from "../orders-list"

export default function AdminRefusedOrdersPage() {
  return <OrdersList title="Відмовились від отримання" status="REFUSED" />
}

