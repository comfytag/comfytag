'use client'

interface IsVerify {
  email?: boolean
}

interface CrewIdentityCardProps {
  name: string
  username: string
  avatar?: string | null
  isVerify?: IsVerify
  kycStatus?: string
  hasBankAccount: boolean
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function StatusDot({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${verified ? 'text-emerald-600' : 'text-zinc-400'}`}>
      {verified ? <CheckIcon /> : <CrossIcon />}
      {label}
    </div>
  )
}

export function CrewIdentityCard({
  name,
  username,
  avatar,
  isVerify,
  kycStatus,
  hasBankAccount,
}: CrewIdentityCardProps) {
  const initial = name.charAt(0).toUpperCase()
  const kycVerified = kycStatus === 'verified'
  const emailVerified = !!isVerify?.email

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center gap-5">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white text-2xl font-black shrink-0 overflow-hidden ring-4 ring-violet-100">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-black text-zinc-900 leading-tight">{name}</h2>
          <span className="text-[11px] font-bold bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full tracking-wide">
            Owner
          </span>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">@{username}</p>

        {/* Status dots */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <StatusDot label="KYC" verified={kycVerified} />
          <StatusDot label="Bank Connected" verified={hasBankAccount} />
          <StatusDot label="Email" verified={emailVerified} />
        </div>
      </div>
    </div>
  )
}
