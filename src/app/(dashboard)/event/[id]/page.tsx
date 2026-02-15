interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Event Detail</h1>
      <p className="text-muted-foreground">Event ID: {id}</p>
      {/* TODO: Probability chart */}
      {/* TODO: Source breakdown table */}
      {/* TODO: AI analysis block */}
      {/* TODO: Action buttons (watchlist, alert, export) */}
    </div>
  )
}
