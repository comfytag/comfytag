'use client'

import { Fragment, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Button, ErrorMessage, LoadingSpinner } from '@comfytag/ui'
import { OnboardingStep } from './OnboardingStep'
import { InterestPicker } from './InterestPicker'
import { api } from '@/lib/api'

interface OnboardingData {
  experience?: string
  team?: string
  event_per_year?: string
  event_turnout?: string
  interest?: string[]
}

interface OnboardingWizardProps {
  initialData?: OnboardingData
}

const STEPS = ['Experience', 'Team', 'Turnout', 'Interests']

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Professional']
const TURNOUT_OPTIONS = ['< 100', '100-500', '500-1000', '1000+']

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
      {STEPS.map((label, i) => (
        <Fragment key={label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                background: i <= currentStep ? 'var(--color-brand)' : 'var(--color-surface-2)',
                color: i <= currentStep ? 'var(--color-text-on-brand)' : 'var(--color-text-muted)',
                transition: `background var(--duration-fast) ease, color var(--duration-fast) ease`,
              }}
            >
              {i < currentStep ? <Check size={14} /> : i + 1}
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: i === currentStep ? 'var(--color-text)' : 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: '2px',
                background: i < currentStep ? 'var(--color-brand)' : 'var(--color-border)',
                margin: '0 8px 18px',
                transition: `background var(--duration-fast) ease`,
              }}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
}

export function OnboardingWizard({ initialData = {} }: OnboardingWizardProps) {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    experience: initialData.experience || '',
    team: initialData.team || '',
    event_per_year: initialData.event_per_year || '',
    event_turnout: initialData.event_turnout || '',
    interest: initialData.interest || [],
  })
  const [error, setError] = useState('')

  const { mutate: submitOnboarding, isPending } = useMutation({
    mutationFn: (onboardingData: OnboardingData) =>
      api.put(
        `/users/onboard/${session!.user.id}`,
        onboardingData
      ).then(r => r.data),
    onSuccess: async () => {
      setError('')
      // Refresh the JWT immediately so the middleware's onboarding gate
      // doesn't bounce us right back based on the stale pre-completion token.
      // The onboarding data is already saved server-side at this point, so a
      // failure here must never block navigation — worst case the middleware
      // re-derives the flag from a plain reload instead of this fast path.
      try {
        await updateSession({ onboarding: { completed: true } })
      } catch (err) {
        console.error('[Onboarding] Session refresh failed, navigating anyway:', err)
      }
      router.push('/overview')
      router.refresh()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to save onboarding. Please try again.')
    },
  })

  const handleNext = () => {
    setError('')
    if (currentStep === 0 && !data.experience) {
      setError('Please select your experience level.')
      return
    }
    if (currentStep === 1 && (!data.team || !data.event_per_year)) {
      setError('Please fill in team size and events per year.')
      return
    }
    if (currentStep === 2 && !data.event_turnout) {
      setError('Please select expected turnout.')
      return
    }
    if (currentStep === 3 && (!data.interest || data.interest.length === 0)) {
      setError('Please select at least one interest.')
      return
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setError('')
    if (!data.interest || data.interest.length === 0) {
      setError('Please select at least one interest.')
      return
    }
    submitOnboarding(data)
  }

  return (
    <div>
      <Stepper currentStep={currentStep} />

      {error && <div style={{ marginBottom: '24px' }}><ErrorMessage message={error} /></div>}

      {/* Step: Experience */}
      {currentStep === 0 && (
        <OnboardingStep
          title="What's your event experience?"
          subtitle="Select the option that best describes you."
          options={EXPERIENCE_OPTIONS}
          value={data.experience || ''}
          onChange={(value) => setData({ ...data, experience: value })}
        />
      )}

      {/* Step: Team Size & Events/Year */}
      {currentStep === 1 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-anybody)', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 24px 0' }}>
            Team size & event volume
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Team size (1-50)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={data.team || ''}
                onChange={(e) => setData({ ...data, team: e.target.value })}
                placeholder="e.g., 5"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Events per year
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={data.event_per_year || ''}
                onChange={(e) => setData({ ...data, event_per_year: e.target.value })}
                placeholder="e.g., 12"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step: Expected Turnout */}
      {currentStep === 2 && (
        <OnboardingStep
          title="What's your typical event turnout?"
          subtitle="This helps us tailor recommendations for you."
          options={TURNOUT_OPTIONS}
          value={data.event_turnout || ''}
          onChange={(value) => setData({ ...data, event_turnout: value })}
        />
      )}

      {/* Step: Interests */}
      {currentStep === 3 && (
        <InterestPicker
          selected={data.interest || []}
          onChange={(interests) => setData({ ...data, interest: interests })}
        />
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        {currentStep > 0 && (
          <div style={{ flex: 1 }}>
            <Button
              onClick={handleBack}
              variant="ghost"
              disabled={isPending}
              fullWidth
            >
              Back
            </Button>
          </div>
        )}
        {currentStep < STEPS.length - 1 ? (
          <div style={{ flex: 1 }}>
            <Button
              onClick={handleNext}
              disabled={isPending}
              fullWidth
            >
              Next
            </Button>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <Button
              onClick={handleComplete}
              disabled={isPending}
              fullWidth
            >
              {isPending ? <LoadingSpinner centered size="sm" /> : 'Complete Setup'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
