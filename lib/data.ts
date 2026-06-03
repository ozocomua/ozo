export type Category = {
  id: string
  name: string
  image: string
  description: string
}

export type Product = {
  id: string
  name: string
  price: number
  description: string
  fullDescription: string
  image: string
  categoryId: string
  badge?: string
}

export const categories: Category[] = [
  {
    id: "detailing-kits",
    name: "Набори для детейлінгу",
    image: "/images/cat-detailing-kits.jpg",
    description: "Все необхідне для повного детейлінгу вашого авто",
  },
  {
    id: "interior-chem",
    name: "Хімія для інтер'єру",
    image: "/images/cat-interior-chem.jpg",
    description: "Засоби для очищення та захисту салону",
  },
  {
    id: "interior-care",
    name: "Догляд за інтер'єром",
    image: "/images/cat-interior-care.jpg",
    description: "Інструменти та аксесуари для догляду за салоном",
  },
  {
    id: "exterior-chem",
    name: "Хімія для екстер'єру",
    image: "/images/cat-exterior-chem.jpg",
    description: "Засоби для миття та захисту кузова",
  },
  {
    id: "exterior-care",
    name: "Догляд за екстер'єром",
    image: "/images/cat-exterior-care.jpg",
    description: "Інструменти та аксесуари для зовнішнього догляду",
  },
]

export const products: Product[] = [
  {
    id: "pol-star",
    name: "Pol Star",
    price: 320,
    description: "Поліруючий засіб для відновлення лакофарбового покриття",
    fullDescription:
      "Pol Star — преміальний поліруючий засіб, що ефективно відновлює блиск та глибину лакофарбового покриття. Видаляє дрібні подряпини, потертості та сліди оксидації. Підходить для ручного та машинного нанесення.",
    image: "/images/product-pol-star.jpg",
    categoryId: "exterior-care",
    badge: "Хіт продажів",
  },
  {
    id: "mzr",
    name: "MZR",
    price: 280,
    description: "Антистатичний засіб для очищення пластику та вінілу",
    fullDescription:
      "MZR — спеціалізований засіб для глибокого очищення та захисту пластикових та вінілових поверхонь салону. Має антистатичні властивості, запобігає накопиченню пилу та забруднень.",
    image: "/images/product-mzr.jpg",
    categoryId: "interior-chem",
  },
  {
    id: "leather-star",
    name: "Leather Star",
    price: 350,
    description: "Кондиціонер та захист для натуральної та штучної шкіри",
    fullDescription:
      "Leather Star — комплексний засіб для догляду за шкіряним салоном. Живить, зволожує та захищає натуральну та штучну шкіру від пересихання та розтріскування. Надає матовий або легкий глянцевий ефект за вибором.",
    image: "/images/product-leather-star.jpg",
    categoryId: "interior-care",
    badge: "Новинка",
  },
  {
    id: "top-star",
    name: "Top Star",
    price: 290,
    description: "Комплексний набір для детейлінгу всього автомобіля",
    fullDescription:
      "Top Star — ідеальне рішення для повноцінного детейлінгу. Включає засоби для миття, полірування та захисту кузова. Підходить для регулярного використання та швидкого відновлення зовнішнього вигляду авто.",
    image: "/images/product-top-star.jpg",
    categoryId: "detailing-kits",
    badge: "Популярний",
  },
  {
    id: "anti-rain",
    name: "Anti Rain",
    price: 240,
    description: "Гідрофобний захист для скла та дзеркал",
    fullDescription:
      "Anti Rain — гідрофобний засіб для скла, що забезпечує захист від дощу та бруду. Створює невидиму захисну плівку, що відштовхує воду та покращує видимість під час дощу. Ефект тримається до 3 місяців.",
    image: "/images/product-anti-rain.jpg",
    categoryId: "exterior-chem",
  },
  {
    id: "wax",
    name: "Wax",
    price: 380,
    description: "Натуральний карнаубський віск для максимального блиску",
    fullDescription:
      "Преміальний натуральний карнаубський віск забезпечує неперевершений блиск та захист лакофарбового покриття. Утворює довговічний захисний шар проти УФ-випромінювання, дощу та дрібного забруднення. Ефект зберігається до 6 місяців.",
    image: "/images/product-wax.jpg",
    categoryId: "exterior-care",
    badge: "Преміум",
  },
]

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter((p) => p.categoryId === categoryId)
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}
