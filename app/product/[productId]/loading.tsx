export default function ProductLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-3xl" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 bg-muted rounded-xl" />
          <div className="h-6 w-1/3 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-12 w-40 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  )
}
