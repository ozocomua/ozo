const API_URL = "https://api.novaposhta.ua/v2.0/json/"

interface NpResponse<T> {
  success: boolean
  data: T[]
  errors: string[]
  warnings?: string[]
  info?: unknown
}

async function npRequest<T>(model: string, method: string, props: Record<string, unknown>): Promise<T[]> {
  const body = {
    apiKey: process.env.NP_API_KEY ?? "",
    modelName: model,
    calledMethod: method,
    methodProperties: props,
  }

  const LOG_PREFIX = `[NP API 2.0] ${model} / ${method}`

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error(`${LOG_PREFIX} → HTTP ${res.status} ${res.statusText}`)
    throw new Error(`Nova Poshta API error: HTTP ${res.status} ${res.statusText}`)
  }

  const json: NpResponse<T> = await res.json()

  if (json.warnings && json.warnings.length > 0) {
    console.warn(`${LOG_PREFIX} → WARNINGS:`, json.warnings)
  }

  if (!json.success) {
    const errorList = json.errors?.join("; ") ?? "unknown"
    console.error(`${LOG_PREFIX} → FAILED`)
    console.error(`  REQUEST:`, JSON.stringify(props, null, 2))
    console.error(`  RESPONSE errors:`, json.errors)
    console.error(`  RESPONSE warnings:`, json.warnings)
    console.error(`  RESPONSE info:`, json.info)
    throw new Error(`${errorList}`)
  }

  console.log(`${LOG_PREFIX} → OK (${json.data.length} results)`)
  return json.data
}

interface NpCity {
  Description: string
  Ref: string
}

export async function searchCities(query: string): Promise<NpCity[]> {
  return npRequest<NpCity>("Address", "getCities", {
    FindByString: query,
    Limit: "20",
  })
}

interface NpWarehouse {
  Description: string
  Ref: string
}

export async function searchWarehouses(cityRef: string): Promise<NpWarehouse[]> {
  return npRequest<NpWarehouse>("Address", "getWarehouses", {
    CityRef: cityRef,
    Limit: "50",
  })
}

export interface NpRecipientResult {
  recipientRef: string
  contactRef: string
}

export async function createRecipient(name: string, phone: string): Promise<NpRecipientResult> {
  const parts = name.trim().split(/\s+/)
  const lastName = parts[0] ?? name
  const firstName = parts[1] ?? ""
  const middleName = parts.slice(2).join(" ") ?? ""

  const data = await npRequest<{ Ref: string; ContactPerson: { data: Array<{ Ref: string }> } }>(
    "Counterparty",
    "save",
    {
      FirstName: firstName,
      MiddleName: middleName,
      LastName: lastName,
      Phone: phone,
      CounterpartyType: "PrivatePerson",
      CounterpartyProperty: "Recipient",
    }
  )

  if (!data[0]) {
    throw new Error("Failed to create recipient counterparty")
  }

  const recipientRef = data[0].Ref
  const contactRef = data[0].ContactPerson?.data?.[0]?.Ref ?? ""

  if (!contactRef) {
    throw new Error("Recipient contact person not created")
  }

  return { recipientRef, contactRef }
}

export async function updateCounterpartyName(ref: string, name: string) {
  // Try with Organization type first (most common for sender counterparties)
  try {
    await npRequest("Counterparty", "update", {
      Ref: ref,
      FirstName: name,
      MiddleName: "",
      LastName: "",
      CounterpartyType: "Organization",
      CounterpartyProperty: "Sender",
    })
    console.log(`[NP] Counterparty ${ref} renamed to "${name}" (Organization)`)
  } catch {
    // Fallback: try as PrivatePerson
    await npRequest("Counterparty", "update", {
      Ref: ref,
      FirstName: name,
      MiddleName: "",
      LastName: "",
      CounterpartyType: "PrivatePerson",
    })
    console.log(`[NP] Counterparty ${ref} renamed to "${name}" (PrivatePerson)`)
  }
}

export interface NpDocumentInput {
  senderRef: string
  senderCityRef: string
  senderAddressRef: string
  senderContactRef: string
  senderPhone: string
  recipientRef: string
  recipientCityRef: string
  recipientAddressRef: string
  recipientContactRef: string
  recipientName: string
  recipientPhone: string
  weight: number
  seatsAmount: number
  description: string
  cost: number
  serviceType?: string
  backwardDeliveryRedeliveryString?: string
  infoRegClientBarcodes?: string
  additionalInformation?: string
}

interface NpDocumentResult {
  Ref: string
  IntDocNumber: string
  CostOnSite: number
  EstimatedDeliveryDate: string
}

export async function createDocument(input: NpDocumentInput): Promise<NpDocumentResult> {
  const props: Record<string, unknown> = {
    PayerType: "Recipient",
    PaymentMethod: "Cash",
    CargoType: "Cargo",
    ServiceType: input.serviceType ?? "WarehouseWarehouse",
    SeatsAmount: String(input.seatsAmount),
    Weight: String(input.weight),
    Description: input.description,
    Cost: String(input.cost),

    Sender: input.senderRef,
    CitySender: input.senderCityRef,
    SenderAddress: input.senderAddressRef,
    ContactSender: input.senderContactRef,
    SendersPhone: input.senderPhone,

    Recipient: input.recipientRef,
    CityRecipient: input.recipientCityRef,
    RecipientAddress: input.recipientAddressRef,
    ContactRecipient: input.recipientContactRef,
    RecipientsPhone: input.recipientPhone,
    RecipientType: "PrivatePerson",
    RecipientName: input.recipientName,
  }

  if (input.infoRegClientBarcodes) {
    props.InfoRegClientBarcodes = input.infoRegClientBarcodes
  }
  if (input.additionalInformation) {
    props.AdditionalInformation = input.additionalInformation
  }

  // "Контроль оплати" для ФОП — используем AfterpaymentOnGoodsCost вместо BackwardDeliveryData.
  // AfterpaymentOnGoodsCost = сумма, которую получатель платит, а НП переводит на расчётный счёт ФОП.
  // BackwardDeliveryData — это услуга "Післяплата" (недоступна на договорах ФОП без отдельного подключения).
  if (
    input.backwardDeliveryRedeliveryString &&
    parseFloat(input.backwardDeliveryRedeliveryString) > 0
  ) {
    props.AfterpaymentOnGoodsCost = input.backwardDeliveryRedeliveryString
  }

  const data = await npRequest<NpDocumentResult>("InternetDocument", "save", props)

  if (!data[0]) {
    throw new Error("Nova Poshta did not return document data")
  }

  return data[0]
}
