'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
  previewShape?: 'circle' | 'rect'
  disabled?: boolean
}

export function ImageUploadInput({ value, onChange, label, previewShape = 'rect', disabled }: Props) {
  const { data: session } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session?.user?.token) return

    setIsUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/upload', formData, {
        headers: { Authorization: `Bearer ${session.user.token}` },
      })
      onChange(res.data.url)
    } catch {
      setUploadError('Upload failed. Try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      {label && (
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          {label}
        </div>
      )}
      {value && (
        <div style={{ marginBottom: '8px' }}>
          <img
            src={value}
            alt="Preview"
            style={{
              width: previewShape === 'circle' ? 64 : '100%',
              height: previewShape === 'circle' ? 64 : 80,
              borderRadius: previewShape === 'circle' ? '50%' : '8px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      )}
      <label style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled || isUploading}
          id={`file-input-${label}`}
        />
        <div
          style={{
            display: 'inline-block',
            padding: '8px 12px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: disabled || isUploading ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            opacity: disabled || isUploading ? 0.6 : 1,
          }}
        >
          {isUploading ? 'Uploading...' : value ? 'Change Image' : 'Upload Image'}
        </div>
      </label>
      {uploadError && (
        <div style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>{uploadError}</div>
      )}
    </div>
  )
}
