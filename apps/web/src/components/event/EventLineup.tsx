'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Divider } from '@/components/events/EventIcons'
import { initials } from '@comfytag/utils'

interface Performer {
  name: string
  photo?: string
}

interface EventLineupProps {
  performers: Performer[]
}

export function EventLineup({ performers }: EventLineupProps) {
  if (!performers || performers.length === 0) return null

  return (
    <>
      <Divider />
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px' }}>
        Lineup
      </h2>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {performers.map((p) => (
          <Link
            key={p.name}
            href={`/search?q=${encodeURIComponent(p.name)}`}
            style={{ flexShrink: 0, textAlign: 'center', textDecoration: 'none', width: '72px' }}
          >
            {p.photo ? (
              <Image
                src={p.photo}
                alt={p.name}
                width={64}
                height={64}
                style={{ borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto' }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--color-brand)',
                  color: 'var(--color-text-on-brand)',
                  fontSize: '18px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                {initials(p.name)}
              </div>
            )}
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text)',
                margin: '6px 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p.name}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
