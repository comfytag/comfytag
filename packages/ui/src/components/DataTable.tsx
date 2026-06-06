import React from 'react'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

export interface ColumnDef<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  width?: string
}

export interface DataTableProps<T extends object> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  keyField?: string
  emptyTitle?: string
  emptySubtitle?: string
}

export function DataTable<T extends object>({
  columns,
  data,
  isLoading,
  keyField,
  emptyTitle = 'No data',
  emptySubtitle,
}: DataTableProps<T>) {
  if (!isLoading && data.length === 0) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
  }

  const skeletonRows = Array.from({ length: 5 })

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface-2)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  fontFamily: 'var(--font-label), sans-serif', // NEW: Space Grotesk labels
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            skeletonRows.map((_, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <Skeleton height={16} width="80%" />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            data.map((row, rowIdx) => (
              <TableRow
                key={keyField ? String((row as Record<string, unknown>)[keyField]) : rowIdx}
                row={row}
                columns={columns}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function TableRow<T extends object>({ row, columns }: { row: T; columns: ColumnDef<T>[] }) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <tr
      style={{
        backgroundColor: hovered ? 'var(--color-surface-2)' : undefined,
        transition: 'background-color 150ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {columns.map((col) => (
        <td
          key={col.key}
          style={{
            padding: '12px 16px',
            fontSize: '14px',
            color: 'var(--color-text)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {col.render(row)}
        </td>
      ))}
    </tr>
  )
}
