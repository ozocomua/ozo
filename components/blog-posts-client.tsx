"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import type { StorefrontPost } from "@/lib/storefront-db"
import { normalizeImageUrl } from "@/lib/image-path"

interface BlogPostsClientProps {
  initialPosts: StorefrontPost[]
  total: number
  pageSize?: number
}

export default function BlogPostsClient({ initialPosts, total, pageSize = 12 }: BlogPostsClientProps) {
  const [posts, setPosts] = useState<StorefrontPost[]>(initialPosts)
  const [loading, setLoading] = useState(false)

  const hasMore = posts.length < total

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts?skip=${posts.length}&take=${pageSize}`)
      const data = await res.json()
      if (Array.isArray(data.posts)) {
        setPosts((prev) => [...prev, ...data.posts])
      }
    } finally {
      setLoading(false)
    }
  }, [posts.length, pageSize])

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm">Немає статей</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
              <Image
                src={normalizeImageUrl(post.image || "/placeholder.jpg")}
                alt={post.title}
                fill
                unoptimized
                loading="lazy"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="p-4 flex flex-col flex-1">
              <p className="text-[11px] sm:text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {new Date(post.createdAt).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h3 className="font-semibold text-foreground text-base line-clamp-2 mb-2 group-hover:underline">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                  {post.excerpt}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="border border-[#00B5D1] text-[#00B5D1] hover:bg-gradient-to-r hover:from-[#0B53A4] hover:to-[#00B5D1] hover:text-white hover:border-transparent transition-all px-8 py-3 text-sm uppercase tracking-wider font-medium"
          >
            {loading ? "Завантаження..." : "Показати ще"}
          </button>
        </div>
      )}
    </>
  )
}
