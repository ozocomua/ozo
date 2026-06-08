"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { Menu, X, ShoppingCart, Search } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import SearchDropdown from "@/components/search-dropdown"

type HeaderCategory = { slug: string; name: string }

type SearchProduct = {
  id: number
  name: string
  slug: string
  price: number
  oldPrice: number | null
  image: string | null
}

export default function Header({ categories }: { categories: HeaderCategory[] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cart, setIsModalOpen, hydrated } = useCart()

  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchProduct[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearchActive, setIsSearchActive] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.products ?? [])
      setShowDropdown(true)
    } catch {
      setResults([])
    }
  }, [])

  const handleChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResults(value), 350)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setIsSearchActive(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = () => {
    setShowDropdown(false)
    setIsSearchActive(false)
    setSearchQuery("")
    setResults([])
  }

  const openMobileSearch = () => {
    setIsSearchActive(true)
    setTimeout(() => mobileInputRef.current?.focus(), 50)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4">
        <div className="max-w-5xl mx-auto h-16 flex items-center justify-between relative">
          <Link
            href="/"
            className="flex-shrink-0 leading-none"
            onClick={() => setMenuOpen(false)}
          >
            <span className="font-serif text-2xl md:text-3xl font-black tracking-wider text-foreground">
              OZO
            </span>
          </Link>

          {/* Desktop search */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-md mx-6 relative">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Пошук..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-secondary rounded-full outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>
            {showDropdown && (
              <SearchDropdown results={results} searchQuery={searchQuery} onSelect={handleSelect} />
            )}
          </div>

          {/* Desktop cart */}
          <div className="hidden md:flex items-center gap-4">
            <button
              className="relative p-2 text-foreground hover:text-primary transition-all active:scale-90"
              onClick={() => setIsModalOpen(true)}
              aria-label="Корзина"
            >
              <ShoppingCart size={22} />
              {hydrated && cart.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: Cart */}
          {!isSearchActive && (
            <button
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden p-2 text-foreground active:scale-90 transition-all duration-300"
              onClick={() => setIsModalOpen(true)}
              aria-label="Корзина"
            >
              <ShoppingCart size={22} />
              {hydrated && cart.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          )}

          {/* Mobile search */}
          <div
            ref={searchContainerRef}
            className={`md:hidden flex items-center gap-1 transition-all duration-300 ${isSearchActive ? "flex-1 ml-[13px]" : ""}`}
          >
            {isSearchActive ? (
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleChange(e.target.value)}
                  onFocus={() => setIsSearchActive(true)}
                  placeholder="Пошук..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-secondary rounded-full outline-none focus:ring-2 focus:ring-black transition-all"
                />
                {showDropdown && (
                  <SearchDropdown results={results} searchQuery={searchQuery} onSelect={handleSelect} />
                )}
              </div>
            ) : (
              <button
                className="p-2 text-foreground active:scale-90 transition-all duration-300"
                onClick={openMobileSearch}
                aria-label="Пошук"
              >
                <Search size={22} />
              </button>
            )}

            {!isSearchActive && (
              <button
                className="p-2 text-foreground transition-all duration-300"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-background flex flex-col pt-16 animate-in fade-in duration-200">
          <nav className="flex flex-col px-4 pt-6 gap-1">
            <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4 font-bold">
              Категорії
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/catalog/${cat.slug}`}
                className="py-3 text-lg font-medium text-foreground border-b border-border last:border-0"
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-4 pb-8 flex gap-6 flex-wrap">
            <a href="https://t.me/ozo_com_ua" target="_blank" rel="noopener noreferrer nofollow" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Telegram</a>
            <a href="https://www.tiktok.com/@ozo.com.ua?_r=1&_t=ZM-91ouAZFUUdk" target="_blank" rel="noopener noreferrer nofollow" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">TikTok</a>
            <a href="https://www.instagram.com/ozo.com.ua" target="_blank" rel="noopener noreferrer nofollow" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Instagram</a>
            <a href="https://www.facebook.com/share/16szMEhHWR/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer nofollow" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Facebook</a>
            <a href="https://www.youtube.com/@ozo_com_ua" target="_blank" rel="noopener noreferrer nofollow" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">YouTube</a>
          </div>
        </div>
      )}
    </>
  )
}
