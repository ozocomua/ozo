const map: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  ґ: "g",
  д: "d",
  е: "e",
  ё: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "i",
  і: "i",
  ї: "yi",
  й: "j",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  " ": "-",
  _: "-",
  ",": "",
  ".": "",
  "/": "-",
  "\\": "-",
  "(": "",
  ")": "",
  "&": "-and-",
  "+": "-plus-",
  "№": "",
  "\"": "",
  "'": "",
  "«": "",
  "»": "",
}

export function slugify(input: string): string {
  const raw = input
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => (map[ch] != null ? map[ch] : ch))
    .join("")

  return raw
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191)
}

