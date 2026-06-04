'use client'

import Link from 'next/link'
import React from 'react'

interface CategoryCard {
  label: string
  emoji: string
  category: string
  gradient: string
}

const categories: CategoryCard[] = [
  { label: 'Music', emoji: '🎵', category: 'music', gradient: 'linear-gradient(135deg, #7C3AED, #C026D3)' },
  { label: 'Comedy', emoji: '😂', category: 'comedy', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { label: 'Tech', emoji: '💻', category: 'tech', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  { label: 'Sports', emoji: '⚽', category: 'sports', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
  { label: 'Nightlife', emoji: '🌃', category: 'nightlife', gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
  { label: 'Arts', emoji: '🎨', category: 'arts', gradient: 'linear-gradient(135deg, #EC4899, #BE185D)' },
]

export function CategoryGridSection() {
  return (
    <section
      style={{
        padding: '64px 16px',
        background: 'var(--color-surface)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '12px',
              letterSpacing: '-0.01em',
            }}
          >
            Browse by Category
          </h2>
        </div>

        {/* 3-column grid on desktop, 2-column on mobile */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {categories.map((category) => (
            <Link
              key={category.category}
              href={`/events?category=${category.category}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  background: category.gradient,
                  padding: '24px',
                  borderRadius: '12px',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'scale(1.05)'
                  el.style.boxShadow = '0 12px 16px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'scale(1)'
                  el.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div
                  style={{
                    fontSize: '48px',
                    marginBottom: '12px',
                  }}
                >
                  {category.emoji}
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  {category.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
