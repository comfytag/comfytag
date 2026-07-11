'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { LoadingSpinner, EmptyState, ErrorMessage } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import { api } from '@/lib/api'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

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
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
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
    setUpgradeError(null)
    try {
      const res = await api.put(
        `/auth/register-organizer/${session?.user?.id}`,
        {},
        { headers: { Authorization: `Bearer ${session?.user?.token}` } },
      )
      const { token } = res.data
      const partnerUrl = process.env.NEXT_PUBLIC_PARTNER_URL ?? 'http://localhost:3001'
      window.location.href = `${partnerUrl}/handoff?t=${token}`
    } catch {
      setUpgradeError('Failed to upgrade. Please try again.')
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
        <div className="flex justify-center pt-20 px-6">
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
  const titleCaseName = toTitleCase(displayName)
  const referralCode = user?.referralCode || session?.user?.referralCode
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://comfytag.com'
  const referralLink = referralCode ? `${baseUrl}?ref=${referralCode}` : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-50/30 pt-28 pb-32 px-4 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-6">

          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            {user?.image || session.user.image ? (
              <div className="ring-4 ring-white rounded-full mx-auto">
                <Image
                  src={user?.image || session.user.image}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-violet-600 text-white flex items-center justify-center text-3xl font-black ring-4 ring-white mx-auto">
                {(displayName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-black text-zinc-900 mt-4">
              {titleCaseName || session.user.email}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">{user?.email ||session.user.email}</p>
          </div>

          {/* Edit Profile Card */}
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 flex flex-col">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Edit Profile</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3 transition-all text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3 transition-all text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || session.user.email}
                  onChange={() => undefined}
                  disabled
                  className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-400 cursor-not-allowed outline-none"
                />
                <p className="text-xs text-zinc-400 mt-1.5">
                  Email changes require contacting support
                </p>
              </div>
            </div>

            {saveSuccess && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                Profile saved successfully.
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all mt-4"
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>

            {saveError && (
              <div className="mt-3">
                <ErrorMessage message={saveError} />
              </div>
            )}
          </div>

          {/* Referral Link Card */}
          {referralLink && (
            <div className="w-full bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 flex flex-col">
              <h2 className="text-lg font-bold text-zinc-900 mb-6">Your Referral Link</h2>
              <p className="text-sm text-zinc-500 mb-2">Share this link to earn rewards</p>
              <div className="w-full bg-violet-50 border border-violet-100 rounded-xl p-2 pl-4 flex items-center justify-between mt-2">
                <span className="text-sm font-mono text-violet-700 truncate mr-4">
                  {referralLink}
                </span>
                <button
                  onClick={handleCopyReferralLink}
                  className="bg-white hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg px-4 py-2 text-sm font-bold transition-colors shrink-0"
                >
                  {copiedReferral ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Account Card */}
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 flex flex-col">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Account</h2>

            <div className="flex justify-between items-center text-sm pb-4 border-b border-zinc-100 mb-4">
              <span className="text-zinc-500">Account type</span>
              <span className="font-medium text-zinc-900">
                {user?.isPartner || session.user.isPartner ? 'Organizer' : 'Attendee'}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm pb-4 border-b border-zinc-100 mb-6">
              <span className="text-zinc-500">Member since</span>
              <span className="font-medium text-zinc-900">
                {user?.createdAt || session.user.createdAt ? formatDate(user?.createdAt || session.user.createdAt) : '—'}
              </span>
            </div>

            {user?.isPartner || session.user.isPartner ? (
              <button
                onClick={() => {
                  const partnerUrl = process.env.NEXT_PUBLIC_PARTNER_URL ?? 'http://localhost:3001'
                  window.location.href = `${partnerUrl}/handoff?t=${session.user.token}`
                }}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all mb-4"
              >
                Go to Partner Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={handleBecomePartner}
                  disabled={isUpgrading}
                  className="w-full py-4 border-2 border-zinc-200 hover:border-violet-600 hover:text-violet-700 text-zinc-900 font-bold rounded-xl transition-all mb-4 disabled:opacity-60"
                >
                  {isUpgrading ? 'Upgrading…' : 'Become a Partner'}
                </button>
                {upgradeError && (
                  <div className="mb-4">
                    <ErrorMessage message={upgradeError} />
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all"
            >
              Log Out
            </button>
          </div>

        </div>
      </main>
    </>
  )
}
