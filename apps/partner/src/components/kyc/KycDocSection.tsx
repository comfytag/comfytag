'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@comfytag/ui'
import { api } from '@/lib/api'

interface KycDocSectionProps {
  docType: 'photo' | 'idCard' | 'address'
  label: string
  description: string
  isVerified: boolean
  userId: string
  token: string
  onUploadStart?: () => void
}

export function KycDocSection({
  docType,
  label,
  description,
  isVerified,
  userId,
  token,
  onUploadStart,
}: KycDocSectionProps) {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const { mutate: uploadDoc, isPending: isUploading } = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected')

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('docType', docType)

      return api.put<{ success: boolean }>(
        `/partner/users/${userId}/kyc`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycUser', userId] })
      setSelectedFile(null)
      setPreviewUrl('')
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
    onUploadStart?.()
    uploadDoc()
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: '0 0 4px',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            {label}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        </div>

        {/* Status Badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: isVerified ? 'var(--color-success)' : 'var(--color-border)',
            color: isVerified ? 'white' : 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {isVerified ? 'âœ“ Verified' : 'Pending'}
        </span>
      </div>

      {/* Upload Area or Status */}
      {!isVerified ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* File Input */}
          <div
            style={{
              padding: '20px',
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background-color 200ms ease',
              backgroundColor: previewUrl ? 'var(--color-bg)' : 'transparent',
            }}
            onClick={() => {
              const input = document.getElementById(`file-input-${docType}`) as HTMLInputElement
              input?.click()
            }}
          >
            {previewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: 'var(--radius-md)',
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {selectedFile?.name}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-text-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                  }}
                >
                  Click to upload or drag & drop
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  PNG, JPG, PDF up to 10MB
                </p>
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
        </div>
      ) : (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-success)',
            borderRadius: 'var(--radius-md)',
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
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
            Document verified and approved
          </p>
        </div>
      )}
    </div>
  )
}

