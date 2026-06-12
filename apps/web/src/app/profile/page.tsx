'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { AvatarInitials, Button, Input, LoadingSpinner, EmptyState, ErrorMessage } from '@comfytag/ui'
import { authHeader, formatDate } from '@comfytag/utils'
import { api } from '@/lib/api'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: user } = useProfile()
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()
  const [name, setName] = useState(session?.user?.name ?? '')
  const [username, setUsername] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name ?? session?.user?.name ?? '')
      setUsername(user.username ?? '')
    }
  }, [user, session?.user?.name])

  async function handleSave() {
    setSaveError(null)
    try {
      updateProfile({ name, username }, {
        onSuccess: () => {
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 3000)
        },
        onError: () => {
          setSaveError('Failed to save. Please try again.')
        },
      })
    } catch {
      setSaveError('Failed to save. Please try again.')
    }
  }

  async function handleBecomePartner() {
    setIsUpgrading(true)
    try {
      const res = await api.put(`/auth/register-organizer/${session?.user?.id}`)
      const { token } = res.data
      router.push(`https://partner.comfytag.com/handoff?t=${token}`)
    } catch {
      setSaveError('Failed to upgrade. Please try again.')
      setIsUpgrading(false)
    }
  }

  function handleCopyReferralLink() {
    const referralCode = user?.referralCode || session?.user?.referralCode
    if (!referralCode) return

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://comfytag.com'
    const referralLink = `${baseUrl}?ref=${referralCode}`

    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedReferral(true)
      setTimeout(() => setCopiedReferral(false), 2000)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  if (status === 'loading') {
    return (
      <>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
          <LoadingSpinner size="lg" centered />
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <Navbar />
        <EmptyState
          title="Sign in to view your profile"
          action={{ label: 'Log In', href: '/login' }}
        />
      </>
    )
  }

  const displayName = name || session.user.name || ''

  return (
    <>
      <Navbar />
      <main
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '32px 24px 80px',
        }}
      >
        {/* Avatar section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {session.user.image ? (
            <div style={{ margin: '0 auto 12px', width: '80px', height: '80px' }}>
              <Image
                src={session.user.image}
                alt={displayName}
                width={80}
                height={80}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div style={{ margin: '0 auto 12px', width: 80 }}>
              <AvatarInitials name={displayName || '?'} size={80} fontSize={28} />
            </div>
          )}
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
            {displayName}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {session.user.email}
          </div>
        </div>

        {/* Edit section */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)', margin: '0 0 16px' }}>
            Edit Profile
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            />

            <div>
              <Input
                label="Email"
                type="email"
                value={session.user.email}
                onChange={() => undefined}
                disabled
              />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', margin: '4px 0 0' }}>
                Email changes require contacting support
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            {saveSuccess && (
              <div
                style={{
                  /* --color-success at 10% alpha */
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  /* --color-success at 25% alpha */
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--color-success)',
                  marginBottom: '12px',
                }}
              >
                Profile saved successfully.
              </div>
            )}

            <Button variant="primary" fullWidth loading={isSaving} onClick={handleSave}>
              Save Changes
            </Button>

            {saveError && (
              <div style={{ marginTop: '12px' }}>
                <ErrorMessage message={saveError} />
              </div>
            )}
          </div>
        </div>

        {/* Referral Link section */}
        {(user?.referralCode || session?.user?.referralCode) && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '20px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px' }}>
              Your Referral Link
            </h2>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
                Share this link to earn rewards
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  backgroundColor: 'rgba(124, 58, 237, 0.05)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  alignItems: 'center',
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    color: 'var(--color-brand)',
                    fontFamily: 'monospace',
                    margin: 0,
                    wordBreak: 'break-all',
                    padding: 0,
                  }}
                >
                  ?ref={user?.referralCode || session?.user?.referralCode}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyReferralLink}
                  className="text-xs whitespace-nowrap"
                >
                  {copiedReferral ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Account section */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>
            Account
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '12px',
            }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>Account type</span>
            <span style={{ color: 'var(--color-text)' }}>
              {session.user.isPartner ? 'Organizer' : 'Attendee'}
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            {session.user.isPartner ? (
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  router.push(`https://partner.comfytag.com/handoff?t=${session.user.token}`)
                }}
              >
                Go to Partner Dashboard
              </Button>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                loading={isUpgrading}
                onClick={handleBecomePartner}
              >
                Become a Partner
              </Button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>Member since</span>
            <span style={{ color: 'var(--color-text)' }}>
              {session.user.createdAt ? formatDate(session.user.createdAt) : '—'}
            </span>
          </div>

          <Button
            variant="danger"
            fullWidth
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Log Out
          </Button>
        </div>
      </main>
    </>
  )
}
