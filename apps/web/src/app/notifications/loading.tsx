import { Skeleton } from '@comfytag/ui'

export default function NotificationsLoading() {
  const skeletons = Array.from({ length: 6 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      {skeletons.map((_, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flexShrink: 0 }}>
            <Skeleton width={40} height={40} borderRadius="50%" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '8px' }}>
              <Skeleton height={14} />
            </div>
            <Skeleton height={14} width="80%" />
          </div>
        </div>
      ))}
    </div>
  )
}
