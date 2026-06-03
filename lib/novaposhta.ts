const API_URL = "https://api.novaposhta.ua/v2.0/json/"

interface NpResponse<T> {
  success: boolean
  data: T[]
  errors: string[]
}

async function npRequest<T>(model: string, method: string, props: Record<string, unknown>): Promise<T[]> {
  const body = {
    apiKey: process.env.NP_API_KEY ?? "",
    modelName: model,
    calledMethod: method,
    methodProperties: props,
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Nova Poshta API error: ${res.status} ${res.statusText}`)
  }

  const json: NpResponse<T> = await res.json()
  if (!json.success) {
    throw new Error(`Nova Poshta API error: ${json.errors?.join(", ") ?? "unknown"}`)
  }

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

  if (
    input.backwardDeliveryRedeliveryString &&
    parseFloat(input.backwardDeliveryRedeliveryString) > 0
  ) {
    props.BackwardDeliveryData = [
      {
        PayerType: "Recipient",
        CargoType: "Money",
        RedeliveryString: input.backwardDeliveryRedeliveryString,
      },
    ]
  }

  const data = await npRequest<NpDocumentResult>("InternetDocument", "save", props)

  if (!data[0]) {
    throw new Error("Nova Poshta did not return document data")
  }

  return data[0]
}
