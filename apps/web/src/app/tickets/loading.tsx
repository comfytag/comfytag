import { Skeleton } from '@comfytag/ui'

export default function TicketsLoading() {
  const skeletons = Array.from({ length: 4 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      {skeletons.map((_, idx) => (
        <Skeleton key={idx} height={72} borderRadius={8} />
      ))}
    </div>
  )
}
