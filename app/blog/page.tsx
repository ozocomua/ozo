import type { Metadata } from "next"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { getTopCategories, getPublishedPosts, countPublishedPosts } from "@/lib/storefront-db"
import { normalizeImageUrl } from "@/lib/image-path"
import BlogPostsClient from "@/components/blog-posts-client"

export const revalidate = 60

export function generateMetadata(): Metadata {
  return {
    title: "Блог | OZO — поради для птахівників",
    description: "Корисні статті та поради для птахівників: догляд за птицею, вибір обладнання, годування, розведення курчат.",
  }
}

export default async function BlogPage() {
  const categories = await getTopCategories()
  const headerCategories = categories.map((c) => ({ slug: c.slug, name: c.name }))
  const posts = await getPublishedPosts({ limit: 12 })
  const totalPosts = await countPublishedPosts()

  return (
    <>
      <Header categories={headerCategories} />
      <main>
        <section className="max-w-5xl mx-auto px-4 pt-8 pb-2">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
            Блог
          </h1>
          <BlogPostsClient initialPosts={posts} total={totalPosts} />
        </section>
      </main>
      <Footer />
    </>
  )
}
