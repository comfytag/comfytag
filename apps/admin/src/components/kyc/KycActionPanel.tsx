'use client'

import { useState } from 'react'
import { Modal, Button } from '@comfytag/ui'
import type { UserAdminProfile } from '@comfytag/types'
import { useApproveKyc, useRejectKyc } from '@/hooks'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KycActionPanelProps {
  userId: string
  user: UserAdminProfile
}

const ID_TYPE_LABELS: Record<string, string> = {
  nin: 'National ID (NIN)',
  passport: 'International Passport',
  voters_card: "Voter's Card",
}

interface DocPreviewProps {
  label: string
  url: string | undefined | null
}

// Shows a single document image, or a placeholder when nothing was uploaded.

function DocPreview({ label, url }: DocPreviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
          title="Open full size"
        >
          <img
            src={url}
            alt={label}
            style={{
              width: '100%',
              maxHeight: 220,
              objectFit: 'cover',
              display: 'block',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          />
        </a>
      ) : (
        <div
          style={{
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            color: 'var(--color-text-muted)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          No document uploaded
        </div>
      )}
    </div>
  )
}

// ─── KycActionPanel ────────────────────────────────────────────────────────────
// Reviews one combined submission (ID document + selfie) and applies a single
// approve/reject decision — there's no per-document state anymore.

export function KycActionPanel({ userId, user }: KycActionPanelProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const approveKyc = useApproveKyc()
  const rejectKyc = useRejectKyc()

  const isBusy = approveKyc.isPending || rejectKyc.isPending
  const isVerified = user.kycStatus === 'verified'
  const idTypeLabel = user.verify?.idType ? ID_TYPE_LABELS[user.verify.idType] ?? user.verify.idType : null

  const handleApprove = () => {
    approveKyc.mutate({ userId })
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
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            KYC Submission
          </h2>
          {idTypeLabel && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Document type: {idTypeLabel}
            </p>
          )}
        </div>

        {!isVerified && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="danger" size="sm" onClick={() => setRejectOpen(true)} disabled={isBusy}>
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isBusy}
              loading={approveKyc.isPending}
            >
              {approveKyc.isPending ? 'Approving…' : 'Approve'}
            </Button>
          </div>
        )}

        {isVerified && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>
            ✓ Verified
          </span>
        )}
      </div>

      {/* ─── Document preview ───────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <DocPreview label="ID Document" url={user.verify?.idDocument} />
        <DocPreview label="Selfie" url={user.verify?.photo} />
      </div>

      {/* ─── Mutation feedback ───────────────────────────────── */}
      {approveKyc.isSuccess && (
        <div style={{ color: 'var(--color-success)', fontSize: 14, marginBottom: 12 }}>
          KYC approved — organizer has been notified.
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
            borderRadius: 'var(--radius-lg)',
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
