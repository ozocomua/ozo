export default function CatalogLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-8">
      <div className="h-8 w-48 bg-muted rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="space-y-2">
          <div className="aspect-square bg-muted rounded-2xl" />
          <div className="h-3 w-3/4 bg-muted rounded-lg" />
          <div className="h-4 w-1/3 bg-muted rounded-lg" />
        </div>)}
      </div>
    </div>
  )
}
