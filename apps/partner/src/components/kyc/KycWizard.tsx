'use client'

import { useState } from 'react'
import { Button } from '@comfytag/ui'
import { KycWizardStep } from './KycWizardStep'

type StepType = 'photo' | 'idCard' | 'address'

interface StepConfig {
  id: StepType
  label: string
  description: string
  index: number
}

interface KycWizardProps {
  kycData: {
    isVerify: {
      photo?: boolean
      idCard?: boolean
      address?: boolean
    }
    verify?: {
      photo?: string
      idCard?: { front?: string; back?: string }
      address?: string
    }
    kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected'
  }
  userId: string
  token: string
}

const STEPS: StepConfig[] = [
  {
    id: 'photo',
    label: 'Selfie Photo',
    description: 'A clear photo of your face for identity verification',
    index: 0,
  },
  {
    id: 'idCard',
    label: 'Government ID',
    description: 'Front side of your national ID, passport, or driver\'s license',
    index: 1,
  },
  {
    id: 'address',
    label: 'Address Proof',
    description: 'Recent utility bill, bank statement, or government letter with your address',
    index: 2,
  },
]

export function KycWizard({ kycData, userId, token }: KycWizardProps) {
  const verifyData = kycData.isVerify || {}
  const docUrls = kycData.verify || {}
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  const currentStep = STEPS[activeStepIndex]
  const isStepVerified = verifyData[currentStep.id] ?? false
  // A doc counts as "already submitted, awaiting review" once it has a stored
  // URL but isn't verified yet — unless the whole KYC application was
  // rejected, in which case re-upload should be allowed again.
  const hasSubmittedDoc =
    kycData.kycStatus !== 'rejected' &&
    !!(currentStep.id === 'idCard' ? docUrls.idCard?.front : docUrls[currentStep.id])
  const completedCount = Object.values(verifyData).filter(Boolean).length
  const totalSteps = STEPS.length

  const handleNext = () => {
    if (activeStepIndex < totalSteps - 1) {
      setActiveStepIndex(activeStepIndex + 1)
    }
  }

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1)
    }
  }

  const isFirstStep = activeStepIndex === 0
  const isLastStep = activeStepIndex === totalSteps - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Mobile-First Progress Header */}
      <div
        style={{
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Step {currentStep.index + 1} of {totalSteps}
          </h3>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-bg)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {completedCount}/{totalSteps} Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: '4px',
            backgroundColor: 'var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((activeStepIndex + 1) / totalSteps) * 100}%`,
              backgroundColor: 'var(--color-brand)',
              transition: 'width 300ms ease-out',
            }}
          />
        </div>
      </div>

      {/* Step Content - Single Column, Mobile Optimized */}
      <div style={{ maxWidth: '448px', margin: '0 auto', width: '100%' }}>
        <KycWizardStep
          docType={currentStep.id}
          label={currentStep.label}
          description={currentStep.description}
          isVerified={isStepVerified}
          hasSubmittedDoc={hasSubmittedDoc}
          userId={userId}
          token={token}
        />
      </div>

      {/* Navigation Buttons - Full Width on Mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isFirstStep ? '1fr' : '1fr 1fr',
          gap: '12px',
          maxWidth: '448px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {!isFirstStep && (
          <Button
            onClick={handlePrev}
            variant="secondary"
            fullWidth
          >
            Back
          </Button>
        )}
        {!isLastStep && (
          <Button
            onClick={handleNext}
            disabled={!isStepVerified}
            fullWidth
          >
            Next Step
          </Button>
        )}
        {isLastStep && isStepVerified && (
          <Button
            onClick={handleNext}
            fullWidth
            disabled
          >
            All Steps Complete
          </Button>
        )}
      </div>

      {/* Summary Card */}
      <div
        style={{
          maxWidth: '448px',
          margin: '0 auto',
          width: '100%',
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
