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
    id: "napuvalky",
    name: "Напувалки",
    image: "/images/cat-napuvalky.jpg",
    description: "Ніпельні, чашкові та вакуумні напувалки для птиці",
  },
  {
    id: "godivnytsi",
    name: "Годівниці",
    image: "/images/cat-godivnytsi.jpg",
    description: "Бункерні та лінійні годівниці для всіх видів птиці",
  },
  {
    id: "klimaty",
    name: "Обігрів",
    image: "/images/cat-klimaty.jpg",
    description: "Нагрівальні килимки, лампи та системи обігріву",
  },
  {
    id: "klitky",
    name: "Клітки та інвентар",
    image: "/images/cat-klitky.jpg",
    description: "Клітки, сідала, гнізда та інший інвентар",
  },
  {
    id: "inkubatory",
    name: "Інкубатори",
    image: "/images/cat-inkubatory.jpg",
    description: "Інкубатори для виведення курчат та іншої птиці",
  },
]

export const products: Product[] = [
  {
    id: "napuvalka-nipelna",
    name: "Ніпельна напувалка",
    price: 45,
    description: "Ніпельна напувалка з нержавіючої сталі для курей та перепелів",
    fullDescription:
      "Ніпельна напувалка виготовлена з якісної нержавіючої сталі. Підходить для курей, перепелів, бройлерів та іншої птиці. Легко монтується на трубу 25 мм. Забезпечує постійний доступ до чистої води.",
    image: "/images/product-napuvalka-nipelna.jpg",
    categoryId: "napuvalky",
    badge: "Хіт продажів",
  },
  {
    id: "godivnytsia-bunkerna",
    name: "Бункерна годівниця",
    price: 320,
    description: "Бункерна годівниця на 20 кг для птахоферм",
    fullDescription:
      "Бункерна годівниця — надійне рішення для автоматичної подачі корму. Виготовлена з ударостійкого пластику. Підходить для курей, бройлерів, індиків. Об'єм бункера 20 кг. Зменшує втрати корму.",
    image: "/images/product-godivnytsia-bunkerna.jpg",
    categoryId: "godivnytsi",
  },
  {
    id: "kylymok-standart",
    name: "Килимок OZO Стандарт",
    price: 850,
    description: "Нагрівальний килимок для курчат 50×100 см",
    fullDescription:
      "Нагрівальний килимок OZO Стандарт — безпечний обігрів для молодняку. Розмір 50×100 см. Потужність 50 Вт. Рівномірний нагрів без перегріву. Економічне споживання електроенергії. Підходить для курчат, каченят, перепелів.",
    image: "/images/product-kylymok-standart.jpg",
    categoryId: "klimaty",
    badge: "Новинка",
  },
  {
    id: "kylymok-premium",
    name: "Килимок OZO Преміум",
    price: 1200,
    description: "Нагрівальний килимок для курчат 50×160 см",
    fullDescription:
      "Нагрівальний килимок OZO Преміум — збільшений розмір для великого поголів'я. Розмір 50×160 см. Потужність 75 Вт. Терморегулятор в комплекті. Надійний захист від вологи. Ідеальний для професійних птахоферм.",
    image: "/images/product-kylymok-premium.jpg",
    categoryId: "klimaty",
    badge: "Популярний",
  },
  {
    id: "klitka-3-yarusy",
    name: "Клітка для курей 3-ярусна",
    price: 4500,
    description: "Триярусна клітка для курей-несучок на 30 голів",
    fullDescription:
      "Триярусна клітка для утримання курей-несучок. Розрахована на 30 голів. Виготовлена з оцинкованої сітки. Похилі підлоги для збору яєць. Знімні піддони для посліду. Компактна конструкція економить простір.",
    image: "/images/product-klitka-3-yarusy.jpg",
    categoryId: "klitky",
  },
  {
    id: "inkubator-auto",
    name: "Інкубатор автоматичний",
    price: 3800,
    description: "Автоматичний інкубатор на 100 курячих яєць",
    fullDescription:
      "Автоматичний інкубатор з цифровим контролером температури та вологості. Автоповорот яєць. Вбудований вентилятор для рівномірного прогріву. Підходить для курячих, качиних, гусячих та перепелиних яєць. Енергоефективний нагрівач 120 Вт.",
    image: "/images/product-inkubator-auto.jpg",
    categoryId: "inkubatory",
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
