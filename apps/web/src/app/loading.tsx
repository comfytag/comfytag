import { LoadingSpinner } from '@comfytag/ui'
export default function RootLoading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <LoadingSpinner size="lg" centered />
    </div>
  )
}
