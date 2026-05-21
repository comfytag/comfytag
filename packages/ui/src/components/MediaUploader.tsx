'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader, Video } from 'lucide-react'

interface Props {
  label: string
  accept: 'image' | 'video'
  multiple?: boolean
  urls: string[]
  onAdd: (newUrls: string[]) => void
  onRemove: (url: string) => void
  uploadFn: (file: File) => Promise<string>
}

export function MediaUploader({ label, accept, multiple = false, urls, onAdd, onRemove, uploadFn }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const acceptAttr =
    accept === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/quicktime,video/webm'

  async function handleFiles(files: FileList) {
    setError('')
    setUploading(true)
    try {
      const newUrls: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadFn(file)
        newUrls.push(url)
      }
      onAdd(newUrls)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const showDropzone = multiple || urls.length === 0

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--color-text)',
          marginBottom: '8px',
        }}
      >
        {label}
      </label>

      {urls.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {urls.map((url) => (
            <div key={url} style={{ position: 'relative', display: 'inline-flex' }}>
              {accept === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <Video size={14} />
                  Video uploaded
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(url)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-error, #ef4444)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  padding: 0,
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showDropzone && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 10,
            padding: '24px 16px',
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            color: 'var(--color-text-muted)',
            fontSize: 13,
            backgroundColor: 'var(--color-surface-2)',
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader size={16} />
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <Upload size={20} style={{ margin: '0 auto 6px', display: 'block' }} />
              <span>Click to upload {accept === 'image' ? (multiple ? 'images' : 'an image') : 'a video'}</span>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {accept === 'image' ? 'JPG, PNG, WEBP' : 'MP4, MOV, WEBM'} · Max 100 MB
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {error && (
        <div style={{ fontSize: 13, color: 'var(--color-error, #ef4444)', marginTop: 8 }}>{error}</div>
      )}
    </div>
  )
}
