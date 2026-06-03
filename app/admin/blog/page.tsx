import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"

export const metadata = { title: "Блог | Адмін панель" }
export const dynamic = "force-dynamic"

export default async function BlogPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Блог</h2>
        <a href="blog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Нова стаття
          </Button>
        </a>
      </div>

      <div className="border rounded-lg bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted">
            <tr>
              <th className="px-6 py-3">Назва</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3">Дата</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                  Немає статей
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">
                    <a href={`blog/${post.id}`} className="hover:underline">
                      {post.title}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">/{post.slug}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        post.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {post.status === "PUBLISHED" ? "Опубліковано" : "Чернетка"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString("uk-UA")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
