import { Skeleton } from '@comfytag/ui'

export default function OverviewLoading() {
  return (
    <div style={{ padding: '16px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} height={100} borderRadius={12} />
        ))}
      </div>
      <Skeleton height={200} borderRadius={12} />
    </div>
  )
}
