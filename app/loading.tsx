export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-muted rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-64 bg-muted rounded-2xl" />)}
      </div>
    </div>
  )
}
