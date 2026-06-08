'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@comfytag/ui'
import { useCreateEventWizard } from '@/hooks/useCreateEventWizard'
import { WizardProgressBar } from '@/components/events/wizard/WizardProgressBar'
import { Step1BasicInfo } from '@/components/events/wizard/Step1BasicInfo'
import { Step2Media } from '@/components/events/wizard/Step2Media'
import { Step3Tiers } from '@/components/events/wizard/Step3Tiers'
import { Step4Details } from '@/components/events/wizard/Step4Details'
import { Step5Summary } from '@/components/events/wizard/Step5Summary'

export default function CreateEventPage() {
  const wizard = useCreateEventWizard()

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Create Event"
        subtitle="Build your event in 5 steps"
        action={
          <Link
            href="/events"
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '14px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <WizardProgressBar
        currentStep={wizard.step}
        totalSteps={5}
        onStepClick={wizard.goToStep}
      />

      <div style={{ maxWidth: '720px' }}>
        {wizard.step === 1 && (
          <Step1BasicInfo
            formData={wizard.formData}
            updateField={wizard.updateField}
            stepErrors={wizard.stepErrors}
            onNext={wizard.nextStep}
            onPrev={wizard.prevStep}
          />
        )}

        {wizard.step === 2 && (
          <Step2Media
            formData={wizard.formData}
            updateField={wizard.updateField}
            handleUpload={wizard.handleUpload}
            stepErrors={wizard.stepErrors}
            onNext={wizard.nextStep}
            onPrev={wizard.prevStep}
          />
        )}

        {wizard.step === 3 && (
          <Step3Tiers
            formData={wizard.formData}
            handleAddTier={wizard.handleAddTier}
            handleEditTier={wizard.handleEditTier}
            handleRemoveTier={wizard.handleRemoveTier}
            handleOpenTierModal={wizard.handleOpenTierModal}
            tierModal={wizard.tierModal}
            setTierModal={wizard.setTierModal}
            currentTier={wizard.currentTier}
            setCurrentTier={wizard.setCurrentTier}
            editingIndex={wizard.editingIndex}
            stepErrors={wizard.stepErrors}
            onNext={wizard.nextStep}
            onPrev={wizard.prevStep}
          />
        )}

        {wizard.step === 4 && (
          <Step4Details
            formData={wizard.formData}
            updateField={wizard.updateField}
            handleAddPerformer={wizard.handleAddPerformer}
            handleRemovePerformer={wizard.handleRemovePerformer}
            performerInput={wizard.performerInput}
            setPerformerInput={wizard.setPerformerInput}
            stepErrors={wizard.stepErrors}
            onNext={wizard.nextStep}
            onPrev={wizard.prevStep}
          />
        )}

        {wizard.step === 5 && (
          <Step5Summary
            formData={wizard.formData}
            stepErrors={wizard.stepErrors}
            onGoToStep={wizard.goToStep}
            onSubmit={wizard.submitEvent.mutate}
            isPending={wizard.submitEvent.isPending}
            onPrev={wizard.prevStep}
          />
        )}
      </div>
    </div>
  )
}
