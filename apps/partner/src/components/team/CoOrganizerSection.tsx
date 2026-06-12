'use client'

import { useState } from 'react'
import { Button, EmptyState, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import type { CoOrganizerMember, TeamPermission } from '@/hooks/useTeam'

const ALL_PERMISSIONS: { value: TeamPermission; label: string }[] = [
  { value: 'checkin', label: 'Check-in' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'edit', label: 'Edit Event' },
  { value: 'manage_tickets', label: 'Manage Tickets' },
]

interface CoOrganizerSectionProps {
  /** Organizer's event list for the event selector */
  events: Array<{ _id: string; name: string }>
  eventsLoading: boolean
  selectedEventId: string | null
  onSelectEvent: (id: string) => void
  /** Team data for the selected event */
  members: CoOrganizerMember[]
  teamLoading: boolean
  teamError: boolean
  /** Invite action */
  onInvite: (email: string, permissions: TeamPermission[]) => void
  isInviting: boolean
  inviteError: string | null
  /** Remove action */
  onRemove: (payload: { eventId: string; userId: string }) => void
  isRemoving: boolean
}

export function CoOrganizerSection({
  events,
  eventsLoading,
  selectedEventId,
  onSelectEvent,
  members,
  teamLoading,
  teamError,
  onInvite,
  isInviting,
  inviteError,
  onRemove,
  isRemoving,
}: CoOrganizerSectionProps) {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<TeamPermission[]>(['checkin'])

  const handlePermissionToggle = (perm: TeamPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const handleInviteSubmit = () => {
    if (!inviteEmail.trim()) return
    onInvite(inviteEmail.trim(), selectedPermissions)
    setInviteEmail('')
    setSelectedPermissions(['checkin'])
    setShowInviteForm(false)
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
      }}
    >
      {/* Section header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
          Co-organizers
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          Invite teammates to help manage a specific event.
        </p>
      </div>

      {/* Event selector */}
      <div style={{ marginBottom: '20px' }}>
        <label
          htmlFor="event-selector"
          style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Select Event
        </label>
        {eventsLoading ? (
          <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <select
            id="event-selector"
            value={selectedEventId ?? ''}
            onChange={(e) => onSelectEvent(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">— Choose an event —</option>
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Team content — only shown once an event is selected */}
      {selectedEventId && (
        <>
          {/* Team member list */}
          {teamLoading ? (
            <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
              <LoadingSpinner size="md" />
            </div>
          ) : teamError ? (
            <ErrorMessage message="Failed to load team members." />
          ) : members.length === 0 ? (
            <EmptyState
              title="No co-organizers yet"
              subtitle="Invite team members to collaborate on this event."
            />
          ) : (
            <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map((member) => (
                <li
                  key={member._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    gap: '12px',
                  }}
                >
                  {/* Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--color-brand)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {member.user_id?.logo ? (
                        <img src={member.user_id.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (member.user_id?.name ?? member.email).charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.user_id?.name ?? member.email}
                      </div>
                      {member.user_id && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.email}
                        </div>
                      )}
                      {/* Permissions */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {member.permissions.map((p) => (
                          <span
                            key={p}
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--color-brand-light, #EDE9FE)',
                              color: 'var(--color-brand)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status + remove */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: member.status === 'active' ? 'var(--color-success)' : 'var(--color-warning, #F59E0B)',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {member.status}
                    </span>
                    {member.user_id && (
                      <button
                        onClick={() => onRemove({ eventId: selectedEventId, userId: member.user_id!._id })}
                        disabled={isRemoving}
                        aria-label={`Remove ${member.user_id?.name ?? member.email}`}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          color: 'var(--color-error)',
                          cursor: isRemoving ? 'not-allowed' : 'pointer',
                          opacity: isRemoving ? 0.5 : 1,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Invite form */}
          {showInviteForm ? (
            <div
              style={{
                padding: '16px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                marginTop: '12px',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Permissions
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ALL_PERMISSIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-text)' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(value)}
                        onChange={() => handlePermissionToggle(value)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {inviteError && (
                <p style={{ fontSize: '13px', color: 'var(--color-error)', marginBottom: '12px' }}>{inviteError}</p>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  onClick={handleInviteSubmit}
                  disabled={isInviting || !inviteEmail.trim() || selectedPermissions.length === 0}
                >
                  {isInviting ? 'Sending invite…' : 'Send invite'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowInviteForm(false); setInviteEmail(''); setSelectedPermissions(['checkin']) }}
                  disabled={isInviting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: members.length > 0 ? '8px' : '16px' }}>
              <Button variant="ghost" fullWidth onClick={() => setShowInviteForm(true)}>
                + Invite Co-organizer
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
