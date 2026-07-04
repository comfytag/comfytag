'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock } from 'lucide-react'
import { Button } from '@comfytag/ui'
import { api } from '@/lib/api'
import { kycKeys } from '@/hooks/queryKeys'

type StepDocType = 'photo' | 'idCard' | 'address'

interface KycWizardStepProps {
  docType: StepDocType
  label: string
  description: string
  isVerified: boolean
  /** True when this doc already has a submitted (but not yet reviewed) file — survives reloads. */
  hasSubmittedDoc: boolean
  userId: string
  token: string
  onUploadStart?: () => void
}

export function KycWizardStep({
  docType,
  label,
  description,
  isVerified,
  hasSubmittedDoc,
  userId,
  token,
  onUploadStart,
}: KycWizardStepProps) {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploadComplete, setUploadComplete] = useState(false)
  const isPendingReview = hasSubmittedDoc || uploadComplete

  const { mutate: uploadDoc, isPending: isUploading, isError: uploadError } = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected')

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('docType', docType)

      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      try {
        const response = await api.put<{ success: boolean }>(
          `/partner/users/${userId}/kyc`,
          formData
        )
        return response
      } catch (err) {
        console.error('[KYC Upload Error]', err)
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.status })
      setUploadComplete(true)
      setTimeout(() => {
        setSelectedFile(null)
        setPreviewUrl('')
      }, 1500)
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = () => {
    setUploadComplete(false)
    onUploadStart?.()
    uploadDoc()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Step Title */}
      <div>
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          {label}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>

      {/* Verified State */}
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
            Document verified and approved
          </p>
        </div>
      )}

      {/* Pending Review State — already submitted, awaiting admin review.
          Shown instead of the upload form so a page reload during the review
          window can't be mistaken for "nothing was submitted yet" and invite
          a silent re-upload that overwrites the original submission. */}
      {!isVerified && isPendingReview && (
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
          <Clock
            size={20}
            style={{
              color: '#F59E0B',
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: '0 0 4px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#D97706',
              }}
            >
              Under Review
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#B45309',
                lineHeight: 1.5,
              }}
            >
              We are validating your document. This typically takes less than 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* Upload State */}
      {!isVerified && !isPendingReview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Upload Area */}
          <div
            style={{
              padding: '32px 24px',
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              backgroundColor: previewUrl ? 'var(--color-bg)' : 'transparent',
            }}
            onClick={() => {
              const input = document.getElementById(`file-input-${docType}`) as HTMLInputElement
              input?.click()
            }}
          >
            {previewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '280px',
                    borderRadius: 'var(--radius-lg)',
                    objectFit: 'contain',
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--color-text-muted)',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedFile?.name}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-text-muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                    }}
                  >
                    Click to upload or drag & drop
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
            )}
            <input
              id={`file-input-${docType}`}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
              fullWidth
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--color-error)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Upload failed. Check your connection and try again.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
