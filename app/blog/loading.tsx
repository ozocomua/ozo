export default function BlogLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-8">
      <div className="h-8 w-48 bg-muted rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="space-y-3">
          <div className="aspect-video bg-muted rounded-2xl" />
          <div className="h-4 w-3/4 bg-muted rounded-lg" />
          <div className="h-3 w-1/2 bg-muted rounded-lg" />
        </div>)}
      </div>
    </div>
  )
}
