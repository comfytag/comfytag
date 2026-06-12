'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Menu } from 'lucide-react'
import type { AdminRole } from '../../lib/roles'

interface TopbarProps {
  onMenuClick: () => void
  role: AdminRole
  userName: string | null | undefined
}

interface RoleBadgeStyle {
  bg: string
  label: string
}

const ROLE_BADGE: Record<AdminRole, RoleBadgeStyle> = {
  super_admin:  { bg: 'var(--color-brand)',   label: 'Super Admin'  },
  finance:      { bg: 'var(--color-gold)',    label: 'Finance'      },
  kyc_reviewer: { bg: '#7C3AED',             label: 'KYC Reviewer' },
  support:      { bg: '#0EA5E9',             label: 'Support'      },
  moderator:    { bg: 'var(--color-success)', label: 'Moderator'   },
}

function toTitleCase(str: string): string {
  return str
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return (words[0][0] ?? '?').toUpperCase()
  return ((words[0][0] ?? '') + (words[words.length - 1][0] ?? '')).toUpperCase()
}

export function Topbar({ onMenuClick, role, userName }: TopbarProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const segment = pathname.startsWith('/dashboard/')
    ? pathname.slice('/dashboard/'.length).split('/')[0]
    : 'Dashboard'
  const pageTitle = toTitleCase(segment || 'Dashboard')

  const badge = ROLE_BADGE[role] || { bg: 'var(--color-brand)', label: 'Admin' }
  const initials = getInitials(userName)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        height: '60px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        paddingInline: '20px',
        gap: '16px',
        zIndex: 30,
      }}
    >
      <style>{`@media (min-width: 769px) { .ct-topbar-menu { display: none !important; } }`}</style>

      <button
        className="ct-topbar-menu"
        onClick={onMenuClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--color-text)',
          cursor: 'pointer',
          borderRadius: '6px',
          flexShrink: 0,
        }}
      >
        <Menu size={20} />
      </button>

      <span
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-text)',
          flex: 1,
        }}
      >
        {pageTitle}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: badge.bg,
            color: '#fff',
          }}
        >
          {badge.label}
        </span>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'var(--color-brand)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '160px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 50,
              }}
            >
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-error)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
