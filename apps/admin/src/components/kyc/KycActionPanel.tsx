'use client'

import { useState } from 'react'
import { Modal, Badge, Button } from '@comfytag/ui'
import type { UserAdminProfile, KycApprovalPayload } from '@comfytag/types'
import { useApproveKyc, useRejectKyc } from '@/hooks'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KycActionPanelProps {
  userId: string
  user: UserAdminProfile
}

interface DocCardProps {
  label: string
  kycType: KycApprovalPayload['kycType']
  urls: (string | undefined | null)[]
  verified: boolean | undefined
  onApprove: (kycType: KycApprovalPayload['kycType']) => void
  disabled: boolean
  loading: boolean
}

// ─── DocCard ───────────────────────────────────────────────────────────────────
// Shows a document image (or placeholder), its verification status, and an
// inline Approve button that fires only for this specific kycType.

function DocCard({ label, kycType, urls, verified, onApprove, disabled, loading }: DocCardProps) {
  const populated = urls.filter((u): u is string => !!u)
  const hasDoc = populated.length > 0

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${verified ? 'color-mix(in srgb, var(--color-success) 40%, var(--color-border))' : 'var(--color-border)'}`,
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
          {label}
        </span>
        <Badge status={verified ? 'verified' : hasDoc ? 'pending' : 'missing'} />
      </div>

      {/* Document images */}
      {hasDoc ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {populated.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', borderRadius: 8, overflow: 'hidden' }}
              title="Open full size"
            >
              <img
                src={url}
                alt={`${label}${populated.length > 1 ? (i === 0 ? ' — front' : ' — back') : ''}`}
                style={{
                  width: '100%',
                  maxHeight: 180,
                  objectFit: 'cover',
                  display: 'block',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                }}
              />
            </a>
          ))}
        </div>
      ) : (
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            color: 'var(--color-text-muted)',
            border: '1px dashed var(--color-border)',
            borderRadius: 8,
          }}
        >
          No document uploaded
        </div>
      )}

      {/* Approve button — only if document is uploaded and not yet verified */}
      {!verified && hasDoc && (
        <Button
          size="sm"
          onClick={() => onApprove(kycType)}
          disabled={disabled}
          loading={loading}
          fullWidth
        >
          {loading ? 'Approving…' : `Approve ${label}`}
        </Button>
      )}

      {verified && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-success)',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          ✓ Verified
        </div>
      )}
    </div>
  )
}

// ─── KycActionPanel ────────────────────────────────────────────────────────────

export function KycActionPanel({ userId, user }: KycActionPanelProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const approveKyc = useApproveKyc()
  const rejectKyc = useRejectKyc()

  const isBusy = approveKyc.isPending || rejectKyc.isPending

  const handleApprove = (kycType: KycApprovalPayload['kycType']) => {
    approveKyc.mutate({ userId, kycType })
  }

  const handleRejectSubmit = () => {
    const reason = rejectionReason.trim()
    if (!reason) return
    rejectKyc.mutate(
      { userId, rejectionReason: reason },
      {
        onSuccess: () => {
          setRejectOpen(false)
          setRejectionReason('')
        },
      },
    )
  }

  const closeRejectModal = () => {
    if (rejectKyc.isPending) return
    setRejectOpen(false)
    setRejectionReason('')
  }

  const allVerified =
    !!user.isVerify?.photo && !!user.isVerify?.idCard && !!user.isVerify?.address

  const docs: Array<{
    label: string
    kycType: KycApprovalPayload['kycType']
    urls: (string | undefined | null)[]
    verified: boolean | undefined
  }> = [
    {
      label: 'Profile Photo',
      kycType: 'photo',
      urls: [user.verify?.photo],
      verified: user.isVerify?.photo,
    },
    {
      label: 'ID Card',
      kycType: 'idcard',
      urls: [user.verify?.idCard?.front, user.verify?.idCard?.back],
      verified: user.isVerify?.idCard,
    },
    {
      label: 'Proof of Address',
      kycType: 'address',
      urls: [user.verify?.address],
      verified: user.isVerify?.address,
    },
  ]

  return (
    <div>
      {/* ─── Section header ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Submitted Documents
        </h2>

        {!allVerified && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setRejectOpen(true)}
            disabled={isBusy}
          >
            Reject KYC
          </Button>
        )}

        {allVerified && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-success)',
            }}
          >
            ✓ Fully Verified
          </span>
        )}
      </div>

      {/* ─── Document grid ───────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {docs.map((doc) => (
          <DocCard
            key={doc.kycType}
            label={doc.label}
            kycType={doc.kycType}
            urls={doc.urls}
            verified={doc.verified}
            onApprove={handleApprove}
            disabled={isBusy}
            loading={
              approveKyc.isPending && approveKyc.variables?.kycType === doc.kycType
            }
          />
        ))}
      </div>

      {/* ─── Mutation feedback ───────────────────────────────── */}
      {approveKyc.isSuccess && (
        <div style={{ color: 'var(--color-success)', fontSize: 14, marginBottom: 12 }}>
          Document approved — organizer has been notified.
        </div>
      )}
      {approveKyc.isError && (
        <div style={{ color: 'var(--color-error)', fontSize: 14, marginBottom: 12 }}>
          Approval failed. Please try again.
        </div>
      )}
      {rejectKyc.isSuccess && (
        <div style={{ color: 'var(--color-success)', fontSize: 14, marginBottom: 12 }}>
          KYC rejected — organizer notified by email.
        </div>
      )}
      {rejectKyc.isError && (
        <div style={{ color: 'var(--color-error)', fontSize: 14, marginBottom: 12 }}>
          Rejection failed. Please try again.
        </div>
      )}

      {/* ─── Rejection modal ─────────────────────────────────── */}
      <Modal
        isOpen={rejectOpen}
        onClose={closeRejectModal}
        title="Reject KYC Submission"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeRejectModal}
              disabled={rejectKyc.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRejectSubmit}
              loading={rejectKyc.isPending}
              disabled={!rejectionReason.trim() || rejectKyc.isPending}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            marginTop: 0,
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          Provide a clear reason. The organiser will receive an email with this message
          and a link to re-upload their documents.
        </p>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="e.g. The ID card photo is too blurry — please re-upload a clear, well-lit image."
          rows={4}
          disabled={rejectKyc.isPending}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: rejectKyc.isPending ? 0.6 : 1,
          }}
        />
      </Modal>
    </div>
  )
}
