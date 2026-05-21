'use client'

import React, { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { AvatarInitials, Button, LoadingSpinner } from '@comfytag/ui'
import { authHeader } from '@comfytag/utils'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import api from '@/lib/api'

export interface Comment {
  _id: string
  text: string
  userId: string
  userName: string
  userAvatar?: string
  createdAt: string
  isPinned?: boolean
}

export interface CommentSectionProps {
  eventId: string
  comments?: Comment[]
  onPost?: (text: string) => Promise<void>
  organizerId?: string
  initialComments?: Comment[]
  initialHasMore?: boolean
}

const MAX_TEXT = 500

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <AvatarInitials name={comment.userName} size={36} fontSize={13} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '3px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            {comment.userName}
          </span>
          {comment.isPinned && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-brand)',
                background: 'rgba(124,58,237,0.08)',
                padding: '1px 6px',
                borderRadius: '99px',
              }}
            >
              Pinned
            </span>
          )}
          <span
            style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}
          >
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text)',
            lineHeight: 1.5,
            margin: 0,
            wordBreak: 'break-word',
          }}
        >
          {comment.text}
        </p>
      </div>
    </div>
  )
}

export function CommentSection({
  eventId,
  comments: oldInitialComments,
  onPost: onPostProp,
  organizerId,
  initialComments,
  initialHasMore,
}: CommentSectionProps) {
  const { data: session } = useSession()
  const finalInitialComments = initialComments ?? oldInitialComments ?? []
  const [comments, setComments] = useState<Comment[]>(finalInitialComments)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const optimisticIdRef = useRef<string | null>(null)

  // Sort: pinned first, then reverse-chron (RA style: newest + pinned prominent)
  const sorted = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  async function handlePost() {
    if (!session || !text.trim()) return
    const trimmed = text.trim()
    const tempId = `optimistic-${Date.now()}`
    optimisticIdRef.current = tempId

    const optimistic: Comment = {
      _id: tempId,
      text: trimmed,
      userId: session.user.id,
      userName: session.user.name ?? 'You',
      createdAt: new Date().toISOString(),
    }

    setComments((prev) => [optimistic, ...prev])
    setText('')
    setPosting(true)

    try {
      if (onPostProp) await onPostProp(trimmed)
      const res = await api.post<Comment>(
        `/events/${eventId}/comments`,
        { text: trimmed },
        authHeader(session.user.token),
      )
      const created = res.data
      setComments((prev) =>
        prev.map((c) => (c._id === tempId ? created : c)),
      )
    } catch {
      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c._id !== tempId))
      setText(trimmed)
    } finally {
      setPosting(false)
      optimisticIdRef.current = null
    }
  }

  async function handleDelete(commentId: string) {
    setComments(prev => prev.filter(c => c._id !== commentId))
    try {
      await api.delete(`/comments/${commentId}`, authHeader(session!.user.token))
    } catch {
      // silent — optimistic delete already applied
    }
  }

  async function handlePin(commentId: string) {
    setComments(prev => {
      const pinned = prev.map(c => ({ ...c, isPinned: c._id === commentId }))
      return [...pinned.filter(c => c.isPinned), ...pinned.filter(c => !c.isPinned)]
    })
    try {
      await api.post(`/comments/${commentId}/pin`, null, authHeader(session!.user.token))
    } catch {
      // silent
    }
  }

  return (
    <>
      <AuthGateSheet
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        trigger="comment"
      />

      {/* Post form */}
      <div style={{ marginBottom: '24px' }}>
        {session ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
              placeholder="Share your thoughts about this event…"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid var(--color-border)',
                borderRadius: '10px',
                fontSize: '14px',
                color: 'var(--color-text)',
                background: 'var(--color-surface)',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'var(--color-brand)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = 'var(--color-border)')
              }
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                }}
              >
                {text.length}/{MAX_TEXT}
              </span>
              <Button
                variant="primary"
                size="sm"
                loading={posting}
                onClick={handlePost}
              >
                Post
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setGateOpen(true)}
            style={{
              width: '100%',
              padding: '14px',
              border: '1.5px dashed var(--color-border)',
              borderRadius: '10px',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-muted)',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'center',
            }}
          >
            Join the conversation — log in to comment
          </button>
        )}
      </div>

      {/* Comment list */}
      {sorted.length === 0 ? (
        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            padding: '24px 0',
          }}
        >
          No comments yet. Be the first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sorted.map((comment) => (
            <div key={comment._id}>
              <CommentItem comment={comment} />
              {/* Actions — only if logged in */}
              {session && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {/* Pin — organizer only, only on unpinned comments */}
                  {organizerId && session.user.id === organizerId && !comment.isPinned && (
                    <button
                      type="button"
                      onClick={() => handlePin(comment._id)}
                      style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit' }}
                    >
                      📌 Pin
                    </button>
                  )}
                  {/* Delete — own comment, organizer, or admin */}
                  {(session.user.id === comment.userId || session.user.id === organizerId || session.user.isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment._id)}
                      style={{ fontSize: 11, color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </>
  )
}
