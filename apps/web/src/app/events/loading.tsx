import { Skeleton } from '@comfytag/ui'

export default function EventsLoading() {
  const skeletons = Array.from({ length: 12 })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        padding: '16px',
      }}
    >
      {skeletons.map((_, idx) => (
        <div key={idx}>
          <div style={{ marginBottom: '12px' }}>
            <Skeleton height={220} borderRadius={12} />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <Skeleton height={14} />
          </div>
          <Skeleton height={14} width="80%" />
        </div>
      ))}
    </div>
  )
}
