import { NextResponse } from 'next/server';

const API_KEY = '2e75104ead1958d18097f414c758facd';

// Добавляем GET метод для тестирования получения данных отправителя
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Получаем информацию об отправителе
    if (action === 'sender') {
      const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: API_KEY,
          modelName: "Counterparty",
          calledMethod: "getCounterparties",
          methodProperties: {
            CounterpartyProperty: "Sender"
          }
        }),
      });
      
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Получаем контакты "Приватної особи"
    if (action === 'recipient-contacts') {
      const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: API_KEY,
          modelName: "Counterparty",
          calledMethod: "getCounterpartyContactPersons",
          methodProperties: {
            Ref: "ebc3dcf5-09a4-11eb-8513-b88303659df5" // Приватна особа (правильний Ref)
          }
        }),
      });
      
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Получаем всех контрагентов-получателей
    if (action === 'recipients') {
      const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: API_KEY,
          modelName: "Counterparty",
          calledMethod: "getCounterparties",
          methodProperties: {
            CounterpartyProperty: "Recipient"
          }
        }),
      });
      
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Default: получаем отправителя
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: "Counterparty",
        calledMethod: "getCounterparties",
        methodProperties: {
          CounterpartyProperty: "Sender"
        }
      }),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Ошибка при получении данных:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();


    // 1. Якщо це пошук міста або відділення (не створення ТТН)
    if (body.calledMethod !== 'save') {
      const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: API_KEY,
          modelName: body.modelName,
          calledMethod: body.calledMethod,
          methodProperties: body.methodProperties || {}
        }),
      });
      const resData = await response.json();
      if (!resData.success) {
        console.error("Nova Poshta API Error:", resData.errors || resData.data);
      }
      return NextResponse.json(resData);
    }

    // 2. Логіка СТВОРЕННЯ ТТН (тільки при натисканні кнопки)
    // Отримуємо дані від клієнта
    const {
      CityRecipient,
      RecipientAddress,
      RecipientPhone,
      RecipientFullName = "Recipient",
      ServiceType = "WarehouseWarehouse",
      Weight = "1",
      Description = "Замовлення",
      SeatsAmount = "1"
    } = body.methodProperties || {};

    // Валідація обов'язкових полів
    if (!CityRecipient) {
      return NextResponse.json(
        { success: false, error: "CityRecipient is required" },
        { status: 400 }
      );
    }
    if (!RecipientAddress) {
      return NextResponse.json(
        { success: false, error: "RecipientAddress is required" },
        { status: 400 }
      );
    }
    if (!RecipientPhone) {
      return NextResponse.json(
        { success: false, error: "RecipientPhone is required" },
        { status: 400 }
      );
    }

    // КРОК 1: Для приватних осіб потрібен Ref контактного лица
    const recipientRef = "ebc3dcf5-09a4-11eb-8513-b88303659df5"; // Ref "Приватної особи"
    
    // Парсимо ФІО
    const nameParts = RecipientFullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts[1] || '';
    const middleName = nameParts.slice(2).join(' ') || '';

    // КРОК 1.1: Спробуємо створити новий контакт
    const createContactResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: "Counterparty",
        calledMethod: "save",
        methodProperties: {
          CounterpartyType: "PrivatePerson",
          CounterpartyProperty: "Recipient",
          FirstName: firstName,
          LastName: lastName,
          MiddleName: middleName,
          Phone: RecipientPhone,
          Email: ""
        }
      }),
    });

    const createContactData = await createContactResponse.json();
    let contactRecipientRef: string;

    console.log("Відповідь при створенні контакту:", JSON.stringify(createContactData, null, 2));

    if (createContactData.success && createContactData.data && createContactData.data[0]) {
      // Якщо контакт успішно створений, беремо його Ref
      contactRecipientRef = createContactData.data[0].Ref;
      console.log("Новий контакт створений:", RecipientFullName, "Ref:", contactRecipientRef);
    } else {
      // Якщо помилка, використовуємо перший доступний контакт як fallback
      console.log("Помилка при створенні контакту, використовуємо існуючий:", createContactData.errors);
      
      const contactsResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: API_KEY,
          modelName: "Counterparty",
          calledMethod: "getCounterpartyContactPersons",
          methodProperties: {
            Ref: recipientRef
          }
        }),
      });

      const contactsData = await contactsResponse.json();
      
      if (!contactsData.success || !contactsData.data || contactsData.data.length === 0) {
        return NextResponse.json(
          { success: false, error: "Не вдалося створити або знайти контактне лице отримувача" },
          { status: 400 }
        );
      }

      contactRecipientRef = contactsData.data[0].Ref;
      console.log("Використовуємо існуючий контакт:", contactsData.data[0].Description);
    }

    const finalMethodProperties = {
      Sender: "eba83ec7-09a4-11eb-8513-b88303659df5", // Ваш Sender Ref
      ContactSender: "eba8f2f7-09a4-11eb-8513-b88303659df5", // Ваш Contact Sender Ref
      CitySender: "06f87958-4079-11de-b509-001d92f78698", // Врадіївка
      SenderAddress: "336de192-e1c2-11e3-8c4a-0050568002cf", // Відділення №1
      SendersPhone: "380778687777",
      
      // Дані отримувача
      Recipient: recipientRef, // Ref контрагента-отримувача (завжди "Приватна особа")
      ContactRecipient: contactRecipientRef, // Ref контактної особи
      RecipientsPhone: RecipientPhone, // Телефон отримувача (з буквою "s")
      CityRecipient: CityRecipient,
      RecipientAddress: RecipientAddress,
      
      // Параметри доставки
      PayerType: "Sender",
      PaymentMethod: "Cash",
      CargoType: "Parcel",
      Weight: Weight,
      ServiceType: ServiceType,
      SeatsAmount: SeatsAmount,
      Description: "Замовлення",
      DateTime: (() => {
        const d = new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
      })()
    };

    console.log("Відправляємо дані:", JSON.stringify(finalMethodProperties, null, 2));

    const saveResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: "InternetDocument",
        calledMethod: "save",
        methodProperties: finalMethodProperties
      }),
    });

    const saveResult = await saveResponse.json();
    
    if (!saveResult.success) {
      console.error("Помилка при створенні ТТН:", saveResult.errors || saveResult.data);
    } else {
      console.log("ТТН успішно створена:", saveResult.data);
    }
    
    return NextResponse.json(saveResult);

  } catch (err: any) {
    console.error("Критична помилка:", err.message);
    return NextResponse.json({ success: false, error: "Помилка на сервері" }, { status: 500 });
  }
}