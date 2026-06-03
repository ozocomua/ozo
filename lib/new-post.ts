const API_BASE_URL = "https://api.novaposhta.ua/v2.0/json/";
// Получаем API ключ из переменных окружения (используется на сервере)
const getApiKey = (): string => {
  if (typeof window === "undefined") {
    // На сервере используем переменную окружения
    return (globalThis as any).process?.env?.NEXT_PUBLIC_NOVA_POSHTA_API_KEY || "";
  }
  return "";
};

interface NovaPoshtaRequest {
  apiKey: string;
  modelName: string;
  calledMethod: string;
  methodProperties?: Record<string, any>;
  Language?: string;
}

interface NovaPoshtaResponse<T> {
  success: boolean;
  data: T;
  errors?: string[];
  warnings?: string[];
  info?: Record<string, any>;
}

interface City {
  Ref: string;
  DescriptionRu: string;
  Description: string;
  Area?: string;
  AreaDescription?: string;
}

interface Warehouse {
  Ref: string;
  Description: string;
  DescriptionRu: string;
  City: string;
  CityDescription?: string;
  CityDescriptionRu?: string;
  Number?: string;
  TypeOfWarehouse?: string;
  Address?: string;
}

/**
 * Выполняет запрос к API Новой Почты
 */
async function makeNovaPoshtaRequest<T>(
  modelName: string,
  calledMethod: string,
  methodProperties?: Record<string, any>
): Promise<NovaPoshtaResponse<T>> {
  const payload: NovaPoshtaRequest = {
    apiKey: getApiKey(),
    modelName,
    calledMethod,
    methodProperties,
    Language: "ru",
  };

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data: NovaPoshtaResponse<T> = await response.json();

    if (!data.success && data.errors && data.errors.length > 0) {
      console.error("Nova Poshta API Error:", data.errors);
    }

    return data;
  } catch (error) {
    console.error("Nova Poshta Request Error:", error);
    throw error;
  }
}

/**
 * Получает список всех городов
 */
export async function getCities(): Promise<City[]> {
  try {
    const response = await makeNovaPoshtaRequest<City[]>(
      "Address",
      "getCities"
    );

    if (!response.success) {
      console.error("Failed to get cities:", response.errors);
      return [];
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
}

/**
 * Получает список отделений Новой Почты по городу
 * @param cityRef - Ref города из getCities
 */
export async function getWarehouses(cityRef: string): Promise<Warehouse[]> {
  try {
    const response = await makeNovaPoshtaRequest<Warehouse[]>(
      "Address",
      "getWarehouses",
      {
        CityRef: cityRef,
        Language: "ru",
      }
    );

    if (!response.success) {
      console.error("Failed to get warehouses:", response.errors);
      return [];
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return [];
  }
}

/**
 * Получает список отделений по названию города
 * @param cityName - Название города (например, "Киев")
 */
export async function getWarehousesByCity(cityName: string): Promise<Warehouse[]> {
  try {
    const cities = await getCities();
    const city = cities.find(
      (c) =>
        c.Description.toLowerCase() === cityName.toLowerCase() ||
        c.DescriptionRu.toLowerCase() === cityName.toLowerCase()
    );

    if (!city) {
      console.error(`City not found: ${cityName}`);
      return [];
    }

    return getWarehouses(city.Ref);
  } catch (error) {
    console.error("Error fetching warehouses by city name:", error);
    return [];
  }
}
