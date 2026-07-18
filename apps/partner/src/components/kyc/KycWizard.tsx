'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button, Select, SelectItem } from '@comfytag/ui'
import { api } from '@/lib/api'
import { kycKeys } from '@/hooks/queryKeys'

type IdType = 'nin' | 'passport' | 'voters_card'

const ID_TYPE_LABELS: Record<IdType, string> = {
  nin: 'National ID (NIN)',
  passport: 'International Passport',
  voters_card: "Voter's Card",
}

interface KycWizardProps {
  kycData: {
    isVerify?: { email?: boolean }
    verify?: { photo?: string; idType?: IdType; idDocument?: string }
    kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected'
    kycRejectionReason?: string
  }
  userId: string
  token: string
}

interface UploadBoxProps {
  label: string
  description: string
  previewUrl: string
  fileName?: string
  onSelect: (file: File) => void
}

function UploadBox({ label, description, previewUrl, fileName, onSelect }: UploadBoxProps) {
  const inputId = `kyc-upload-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>{description}</p>
      </div>
      <div
        style={{
          padding: '24px 16px',
          border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: previewUrl ? 'var(--color-bg)' : 'transparent',
        }}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        {previewUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <img
              src={previewUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-lg)', objectFit: 'contain' }}
            />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', wordBreak: 'break-word' }}>
              {fileName}
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
            Click to upload
          </p>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onSelect(file)
          }}
        />
      </div>
    </div>
  )
}

export function KycWizard({ kycData, userId, token }: KycWizardProps) {
  const queryClient = useQueryClient()
  const { kycStatus, verify, kycRejectionReason } = kycData

  const isVerified = kycStatus === 'verified'
  const isPendingReview = kycStatus === 'pending'
  const isRejected = kycStatus === 'rejected'
  const showForm = !isVerified && !isPendingReview

  const [idType, setIdType] = useState<IdType | ''>(verify?.idType ?? '')
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState('')
  const [idDocFile, setIdDocFile] = useState<File | null>(null)
  const [idDocPreview, setIdDocPreview] = useState('')

  const readFile = (file: File, setPreview: (url: string) => void) => {
    const reader = new FileReader()
    reader.onload = (event) => setPreview(event.target?.result as string)
    reader.readAsDataURL(file)
  }

  const { mutate: submitKyc, isPending, isError } = useMutation({
    mutationFn: async () => {
      if (!idType || !selfieFile || !idDocFile) throw new Error('Missing required fields')

      const formData = new FormData()
      formData.append('idType', idType)
      formData.append('selfie', selfieFile)
      formData.append('idDocument', idDocFile)

      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      return api.put(`/users/${userId}/kyc`, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.status })
    },
  })

  const canSubmit = !!idType && !!selfieFile && !!idDocFile && !isPending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '448px', margin: '0 auto' }}>
      {isVerified && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-success)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
          }}
        >
          <CheckCircle2 size={20} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Identity verified and approved</p>
        </div>
      )}

      {isPendingReview && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#FEF3C7',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <Clock size={20} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#D97706' }}>Under Review</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#B45309', lineHeight: 1.5 }}>
              We're validating your submission. This typically takes less than 24 hours.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--color-error)' }}>
              Submission not approved
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {kycRejectionReason || 'Please review and resubmit your documents.'}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <>
          <Select
            label="Document type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as IdType)}
          >
            <option value="" disabled>
              Select a document type
            </option>
            {(Object.keys(ID_TYPE_LABELS) as IdType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {ID_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </Select>

          <UploadBox
            label="Government ID"
            description="A clear photo of your NIN, passport, or voter's card"
            previewUrl={idDocPreview}
            fileName={idDocFile?.name}
            onSelect={(file) => {
              setIdDocFile(file)
              readFile(file, setIdDocPreview)
            }}
          />

          <UploadBox
            label="Selfie"
            description="A clear photo of your face for identity verification"
            previewUrl={selfiePreview}
            fileName={selfieFile?.name}
            onSelect={(file) => {
              setSelfieFile(file)
              readFile(file, setSelfiePreview)
            }}
          />

          {isError && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--color-error)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
              }}
            >
              Submission failed. Check your connection and try again.
            </div>
          )}

          <Button onClick={() => submitKyc()} disabled={!canSubmit} fullWidth>
            {isPending ? 'Submitting…' : 'Submit for Review'}
          </Button>
        </>
      )}

      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '13px',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--color-text)' }}>
          Why we need this information
        </p>
        <p style={{ margin: 0 }}>
          We require KYC (Know Your Customer) verification for all organizers to comply with Nigerian
          financial regulations and to protect your account. Your documents are encrypted and stored
          securely. We'll review your submission within 24 hours.
        </p>
      </div>
    </div>
  )
}
