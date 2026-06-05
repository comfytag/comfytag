'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
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

const STEPS = ['Experience', 'Team Size & Events', 'Expected Turnout', 'Interests']

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Professional']
const TURNOUT_OPTIONS = ['< 100', '100-500', '500-1000', '1000+']
const INTERESTS_OPTIONS = ['Music', 'Comedy', 'Sports', 'Fashion', 'Food', 'Tech', 'Arts', 'Other']

export function OnboardingWizard({ initialData = {} }: OnboardingWizardProps) {
  const router = useRouter()
  const { data: session } = useSession()
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
    onSuccess: () => {
      setError('')
      router.push('/overview')
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

  const progressPercent = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Let's Get You Started
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          Help us understand your event expertise and interests.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '32px', height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            background: 'var(--color-brand)',
            width: `${progressPercent}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Step indicator */}
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 24px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
      </p>

      {/* Error message */}
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
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 24px 0' }}>
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
                  background: 'var(--color-surface)',
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
                  background: 'var(--color-surface)',
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
      <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
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
