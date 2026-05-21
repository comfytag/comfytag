'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, User, CheckCircle2, Trash2, Lock, Bell, FileText, Camera } from 'lucide-react'
import { Button, Input, Modal, ErrorMessage, Skeleton, PageHeader, MediaUploader } from '@comfytag/ui'
import type { BankAccount } from '@comfytag/types'
import { SectionCard } from '@/components/settings/SectionCard'
import api, { authHeader } from '@/lib/api'

const sectionHeaderBase: React.CSSProperties = {
  alignItems: 'center',
  gap: '10px',
  marginBottom: '24px',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: '16px',
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()

  const [name, setName] = useState(session?.user.name ?? '')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [avatarUrls, setAvatarUrls] = useState<string[]>(session?.user.image ? [session.user.image] : [])
  const [bankModal, setBankModal] = useState(false)
  const [bankForm, setBankForm] = useState({ bankName: '', acctName: '', acctNumber: '' })
  const [bankError, setBankError] = useState('')
  const [bankActionError, setBankActionError] = useState('')
  const [passwordModal, setPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [bioForm, setBioForm] = useState({
    businessName: session?.user.businessName ?? '',
    bio: '',
    instagram: '',
    twitter: '',
    facebook: '',
  })
  const [bioSuccess, setBioSuccess] = useState(false)
  const [bioError, setBioError] = useState('')
  const [notificationPrefs, setNotificationPrefs] = useState({
    orderConfirmations: true,
    orderReminders: true,
    newFollowers: true,
    comments: true,
    promotions: false,
  })
  const [notifPrefsSuccess, setNotifPrefsSuccess] = useState(false)
  const [notifPrefsError, setNotifPrefsError] = useState('')
  const [kycDocs, setKycDocs] = useState({
    idPhotoUrl: '',
    facePhotoUrl: '',
  })
  const [kycSuccess, setKycSuccess] = useState(false)
  const [kycError, setKycError] = useState('')

  useEffect(() => {
    if (session?.user.name) setName(session.user.name)
    if (session?.user.image) setAvatarUrls([session.user.image])
  }, [session?.user.name, session?.user.image])

  const banksQuery = useQuery({
    queryKey: ['banks', session?.user.id],
    queryFn: () => api.get<BankAccount[]>('/bank/' + session!.user.id, authHeader(session?.user.token)).then(r => r.data),
    enabled: !!session?.user.id,
  })

  const banks = banksQuery.data ?? []

  const profileMutation = useMutation({
    mutationFn: (body: { name: string }) =>
      api.patch('/users/' + session!.user.id, body, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: async () => {
      await update({ name })
      setProfileSuccess(true)
      setProfileError('')
      setTimeout(() => setProfileSuccess(false), 3000)
    },
    onError: () => {
      setProfileError('Failed to save profile. Please try again.')
    },
  })

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeader(session?.user.token).headers },
      })
      return response.data.url
    },
  })

  const updateAvatarMutation = useMutation({
    mutationFn: (imageUrl: string) =>
      api.patch('/users/' + session!.user.id, { image: imageUrl }, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: async () => {
      await update({ image: avatarUrls[0] })
      setProfileSuccess(true)
      setProfileError('')
      setTimeout(() => setProfileSuccess(false), 3000)
    },
    onError: () => {
      setProfileError('Failed to upload avatar. Please try again.')
    },
  })

  const updateBioMutation = useMutation({
    mutationFn: (body: {
      businessName?: string
      bio?: string
      socialLinks?: { instagram?: string; twitter?: string; facebook?: string }
    }) =>
      api.patch('/users/' + session!.user.id, body, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      setBioSuccess(true)
      setBioError('')
      setTimeout(() => setBioSuccess(false), 3000)
    },
    onError: () => {
      setBioError('Failed to save bio and social links. Please try again.')
    },
  })

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: (body: typeof notificationPrefs) =>
      api.patch('/users/' + session!.user.id, { notificationPreferences: body }, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      setNotifPrefsSuccess(true)
      setNotifPrefsError('')
      setTimeout(() => setNotifPrefsSuccess(false), 3000)
    },
    onError: () => {
      setNotifPrefsError('Failed to save notification preferences. Please try again.')
    },
  })

  const uploadKYCMutation = useMutation({
    mutationFn: (body: typeof kycDocs) =>
      api.put(`/users/${session!.user.id}/kyc`, body, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      setKycSuccess(true)
      setKycError('')
      setTimeout(() => setKycSuccess(false), 3000)
    },
    onError: () => {
      setKycError('Failed to upload KYC documents. Please try again.')
    },
  })

  const uploadFileMutationForKYC = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeader(session?.user.token).headers },
      })
      return response.data.url
    },
  })

  const addBankMutation = useMutation({
    mutationFn: (body: { bankName: string; acctName: string; acctNumber: string }) =>
      api.post('/bank/' + session!.user.id, body, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks', session?.user.id] })
      setBankModal(false)
      setBankForm({ bankName: '', acctName: '', acctNumber: '' })
    },
    onError: () => {
      setBankError('Failed to add bank account. Please try again.')
    },
  })

  const deleteBankMutation = useMutation({
    mutationFn: (bankId: string) =>
      api.delete('/bank/' + bankId, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      setBankActionError('')
      queryClient.invalidateQueries({ queryKey: ['banks', session?.user.id] })
    },
    onError: () => {
      setBankActionError('Failed to delete bank account. Please try again.')
    },
  })

  const setActiveBankMutation = useMutation({
    mutationFn: (bankId: string) =>
      api.put(`/bank/${session!.user.id}/${bankId}`, {}, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      setBankActionError('')
      queryClient.invalidateQueries({ queryKey: ['banks', session?.user.id] })
    },
    onError: () => {
      setBankActionError('Failed to update active account. Please try again.')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.post(`/auth/change-password`, body, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      setPasswordSuccess(true)
      setPasswordError('')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordModal(false)
      setTimeout(() => setPasswordSuccess(false), 3000)
    },
    onError: () => {
      setPasswordError('Failed to change password. Please try again.')
    },
  })

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    profileMutation.mutate({ name: name.trim() })
  }

  function handleAvatarAdd(urls: string[]) {
    setAvatarUrls(urls)
    if (urls.length > 0) {
      updateAvatarMutation.mutate(urls[0])
    }
  }

  function handleAvatarRemove(url: string) {
    setAvatarUrls([])
    updateAvatarMutation.mutate('')
  }

  function handleSaveBio() {
    setBioError('')
    if (!bioForm.businessName.trim()) {
      setBioError('Business name is required')
      return
    }
    updateBioMutation.mutate({
      businessName: bioForm.businessName.trim(),
      bio: bioForm.bio.trim(),
      socialLinks: {
        instagram: bioForm.instagram.trim(),
        twitter: bioForm.twitter.trim(),
        facebook: bioForm.facebook.trim(),
      },
    })
  }

  function handleSaveNotificationPrefs() {
    setNotifPrefsError('')
    updateNotificationPrefsMutation.mutate(notificationPrefs)
  }

  function toggleNotificationPref(key: keyof typeof notificationPrefs) {
    setNotificationPrefs({
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    })
  }

  function handleKYCIdPhotoUpload(url: string) {
    setKycDocs({ ...kycDocs, idPhotoUrl: url })
    uploadKYCMutation.mutate({ ...kycDocs, idPhotoUrl: url })
  }

  function handleKYCFacePhotoUpload(url: string) {
    setKycDocs({ ...kycDocs, facePhotoUrl: url })
    uploadKYCMutation.mutate({ ...kycDocs, facePhotoUrl: url })
  }

  function handleAddBank() {
    if (!bankForm.bankName.trim() || !bankForm.acctName.trim() || !bankForm.acctNumber.trim()) {
      setBankError('All fields are required')
      return
    }
    if (!/^\d{10}$/.test(bankForm.acctNumber.trim())) {
      setBankError('Account number must be exactly 10 digits')
      return
    }
    setBankError('')
    addBankMutation.mutate(bankForm)
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')

    if (!passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader title="Settings" subtitle="Manage your profile and payment details" />

      <div style={{ maxWidth: '720px' }}>
        {/* Profile Section */}
        <SectionCard>
          <div style={{ display: 'flex', ...sectionHeaderBase }}>
            <User size={18} color="var(--color-brand)" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Profile
            </h2>
          </div>

          <form onSubmit={handleProfileSave}>
            <Input
              label="Display Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div style={{ marginTop: '16px' }}>
              <Input
                label="Email"
                type="email"
                value={session?.user.email ?? ''}
                onChange={() => {}}
                disabled
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <MediaUploader
                label="Profile Avatar"
                accept="image"
                multiple={false}
                urls={avatarUrls}
                onAdd={handleAvatarAdd}
                onRemove={handleAvatarRemove}
                uploadFn={uploadFileMutation.mutateAsync}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
              <Button type="submit" variant="primary" loading={profileMutation.isPending || updateAvatarMutation.isPending}>
                Save Changes
              </Button>
              {profileSuccess && (
                <span
                  style={{
                    fontSize: '14px',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  Saved!
                </span>
              )}
            </div>
            {profileError && (
              <div style={{ marginTop: '16px' }}>
                <ErrorMessage message={profileError} />
              </div>
            )}
          </form>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 20px 0' }}>
              Public Profile
            </h3>
            <Input
              label="Business Name"
              placeholder="Your event company name"
              value={bioForm.businessName}
              onChange={e => setBioForm({ ...bioForm, businessName: e.target.value })}
            />
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
                Bio
              </label>
              <textarea
                placeholder="Tell attendees about your events and organization"
                value={bioForm.bio}
                onChange={e => setBioForm({ ...bioForm, bio: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
            <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '24px', marginBottom: '12px', textTransform: 'uppercase' }}>
              Social Links (Optional)
            </h4>
            <Input
              label="Instagram"
              placeholder="@yourhandle"
              value={bioForm.instagram}
              onChange={e => setBioForm({ ...bioForm, instagram: e.target.value })}
            />
            <div style={{ marginTop: '16px' }}>
              <Input
                label="Twitter"
                placeholder="@yourhandle"
                value={bioForm.twitter}
                onChange={e => setBioForm({ ...bioForm, twitter: e.target.value })}
              />
            </div>
            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
              <Input
                label="Facebook"
                placeholder="yourpage"
                value={bioForm.facebook}
                onChange={e => setBioForm({ ...bioForm, facebook: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button variant="primary" size="sm" loading={updateBioMutation.isPending} onClick={handleSaveBio}>
                Save Bio & Links
              </Button>
              {bioSuccess && (
                <span
                  style={{
                    fontSize: '14px',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  Saved!
                </span>
              )}
            </div>
            {bioError && <ErrorMessage message={bioError} style={{ marginTop: '12px' }} />}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 12px 0' }}>
                Security
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
                Change your password to keep your account secure
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button variant="ghost" size="sm" onClick={() => setPasswordModal(true)}>
                <Lock size={16} style={{ marginRight: '6px' }} />
                Change Password
              </Button>
              {passwordSuccess && (
                <span
                  style={{
                    fontSize: '14px',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  Updated!
                </span>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Bank Accounts Section */}
        <SectionCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', ...sectionHeaderBase }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={18} color="var(--color-brand)" />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                Bank Accounts
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setBankModal(true)}>
              + Add Account
            </Button>
          </div>

          {banksQuery.isError && (
            <ErrorMessage message="Failed to load bank accounts." />
          )}

          {bankActionError && (
            <div style={{ marginBottom: '12px' }}>
              <ErrorMessage message={bankActionError} />
            </div>
          )}

          {banksQuery.isLoading ? (
            <>
              <div style={{ marginBottom: '8px' }}>
                <Skeleton height={56} borderRadius={8} />
              </div>
              <Skeleton height={56} borderRadius={8} />
            </>
          ) : banks.length === 0 ? (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-muted)',
                padding: '20px 0',
                textAlign: 'center',
              }}
            >
              No bank accounts added yet.
            </p>
          ) : (
            banks.map(bank => (
              <div
                key={bank._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text)' }}>
                    {bank.bankName}
                  </div>
                  <div
                    style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}
                  >
                    {bank.acctName} · {bank.acctNumber}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {bank.isActive && (
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: 9999,
                        background: 'var(--color-success)',
                        color: 'white',
                        fontWeight: 500,
                      }}
                    >
                      Active
                    </span>
                  )}
                  {!bank.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={setActiveBankMutation.isPending}
                      onClick={() => setActiveBankMutation.mutate(bank._id)}
                    >
                      Set Active
                    </Button>
                  )}
                  <button
                    onClick={() => deleteBankMutation.mutate(bank._id)}
                    disabled={deleteBankMutation.isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-error)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: deleteBankMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </SectionCard>

        {/* Notification Preferences Section */}
        <SectionCard>
          <div style={{ display: 'flex', ...sectionHeaderBase }}>
            <Bell size={18} color="var(--color-brand)" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Notification Preferences
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { key: 'orderConfirmations' as const, label: 'Order Confirmations', description: 'Get notified when attendees purchase tickets' },
              { key: 'orderReminders' as const, label: 'Order Reminders', description: 'Receive reminders about upcoming events' },
              { key: 'newFollowers' as const, label: 'New Followers', description: 'Get notified when someone follows your profile' },
              { key: 'comments' as const, label: 'Event Comments', description: 'Notifications about comments on your events' },
              { key: 'promotions' as const, label: 'Promotions', description: 'Marketing and promotional emails' },
            ].map(({ key, label, description }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPrefs[key]}
                  onChange={() => toggleNotificationPref(key)}
                  style={{ marginTop: '4px', cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
            <Button
              variant="primary"
              size="sm"
              loading={updateNotificationPrefsMutation.isPending}
              onClick={handleSaveNotificationPrefs}
            >
              Save Preferences
            </Button>
            {notifPrefsSuccess && (
              <span
                style={{
                  fontSize: '14px',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={16} />
                Saved!
              </span>
            )}
          </div>
          {notifPrefsError && <ErrorMessage message={notifPrefsError} style={{ marginTop: '12px' }} />}
        </SectionCard>

        {/* KYC Documents Section */}
        <SectionCard>
          <div style={{ display: 'flex', ...sectionHeaderBase }}>
            <FileText size={18} color="var(--color-brand)" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              KYC Verification
            </h2>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
              Upload your identity documents to complete KYC verification and unlock higher transaction limits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
                <FileText size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                ID Document Photo
              </label>
              {kycDocs.idPhotoUrl ? (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-success)',
                    color: 'var(--color-success)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  Uploaded
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e: any) => {
                      const file = e.target.files[0]
                      if (file) {
                        try {
                          const url = await uploadFileMutationForKYC.mutateAsync(file)
                          handleKYCIdPhotoUpload(url)
                        } catch (err) {
                          setKycError('Failed to upload ID photo')
                        }
                      }
                    }
                    input.click()
                  }}
                  fullWidth
                >
                  Upload ID Photo
                </Button>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
                <Camera size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Face Photo
              </label>
              {kycDocs.facePhotoUrl ? (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-success)',
                    color: 'var(--color-success)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  Uploaded
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e: any) => {
                      const file = e.target.files[0]
                      if (file) {
                        try {
                          const url = await uploadFileMutationForKYC.mutateAsync(file)
                          handleKYCFacePhotoUpload(url)
                        } catch (err) {
                          setKycError('Failed to upload face photo')
                        }
                      }
                    }
                    input.click()
                  }}
                  fullWidth
                >
                  Upload Face Photo
                </Button>
              )}
            </div>
          </div>

          {kycSuccess && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                color: 'var(--color-success)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              KYC documents uploaded successfully!
            </div>
          )}

          {kycError && <ErrorMessage message={kycError} />}
        </SectionCard>
      </div>

      <Modal
        isOpen={bankModal}
        onClose={() => {
          setBankModal(false)
          setBankError('')
          setBankForm({ bankName: '', acctName: '', acctNumber: '' })
        }}
        title="Add Bank Account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBankModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={addBankMutation.isPending} onClick={handleAddBank}>
              Add Account
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Bank Name"
            placeholder="e.g. GTBank, Access Bank, Zenith"
            value={bankForm.bankName}
            onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
          />
          <Input
            label="Account Name"
            placeholder="Account holder name"
            value={bankForm.acctName}
            onChange={e => setBankForm({ ...bankForm, acctName: e.target.value })}
          />
          <Input
            label="Account Number"
            placeholder="10-digit account number"
            value={bankForm.acctNumber}
            onChange={e => setBankForm({ ...bankForm, acctNumber: e.target.value })}
          />
          {bankError && <ErrorMessage message={bankError} />}
        </div>
      </Modal>

      <Modal
        isOpen={passwordModal}
        onClose={() => {
          setPasswordModal(false)
          setPasswordError('')
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        }}
        title="Change Password"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={changePasswordMutation.isPending} onClick={handleChangePassword}>
              Update Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            value={passwordForm.currentPassword}
            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter your new password (min 6 characters)"
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your new password"
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
          {passwordError && <ErrorMessage message={passwordError} />}
        </form>
      </Modal>
    </div>
  )
}
