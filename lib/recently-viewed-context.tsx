"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type RecentlyViewedProduct = {
  id: number
  name: string
  slug: string
  image: string
  price: number
}

type RecentlyViewedContextType = {
  items: RecentlyViewedProduct[]
  addItem: (product: RecentlyViewedProduct) => void
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType>({
  items: [],
  addItem: () => {},
})

const STORAGE_KEY = "ozo-recently-viewed"
const MAX_ITEMS = 8

function loadFromStorage(): RecentlyViewedProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

function saveToStorage(items: RecentlyViewedProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage full — ignore
  }
}

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([])

  useEffect(() => {
    setItems(loadFromStorage())
  }, [])

  const addItem = (product: RecentlyViewedProduct) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id)
      const updated = [product, ...filtered].slice(0, MAX_ITEMS)
      saveToStorage(updated)
      return updated
    })
  }

  return (
    <RecentlyViewedContext.Provider value={{ items, addItem }}>
      {children}
    </RecentlyViewedContext.Provider>
  )
}

export function useRecentlyViewed() {
  return useContext(RecentlyViewedContext)
}
