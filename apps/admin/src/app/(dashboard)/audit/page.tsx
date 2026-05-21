'use client'

import { EmptyState } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'

export default function AuditPage() {
  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: 'var(--color-bg)',
        padding: '24px',
      }}
    >
      <PageHeader
        title="Audit Log"
        subtitle="System activity and admin actions"
      />
      <EmptyState
        title="Audit log coming soon"
        subtitle="This feature will be available in the next release."
      />
    </div>
  )
}
