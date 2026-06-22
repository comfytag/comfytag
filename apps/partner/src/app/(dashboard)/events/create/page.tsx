'use client'

import Link from 'next/link'
import { useCreateEventWizard } from '@/hooks/useCreateEventWizard'
import { WizardProgressBar } from '@/components/events/wizard/WizardProgressBar'
import { LiveTicketPreview } from '@/components/events/wizard/LiveTicketPreview'
import { Step1BasicInfo } from '@/components/events/wizard/Step1BasicInfo'
import { Step2Media } from '@/components/events/wizard/Step2Media'
import { Step3Tiers } from '@/components/events/wizard/Step3Tiers'
import { Step4Details } from '@/components/events/wizard/Step4Details'
import { Step5Summary } from '@/components/events/wizard/Step5Summary'

function BackArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

export default function CreateEventPage() {
  const wizard = useCreateEventWizard()

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 pb-44 md:pb-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/events"
          className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
        >
          <BackArrowIcon />
          Events
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Launch Wizard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Build your event in 5 steps</p>
        </div>
      </div>

      {/* Progress bar — full width */}
      <WizardProgressBar
        currentStep={wizard.step}
        totalSteps={5}
        onStepClick={wizard.goToStep}
      />

      {/* Split-screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* ── Left: form steps (7 cols) ── */}
        <div className="lg:col-span-7">
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

        {/* ── Right: live ticket preview (5 cols) ── */}
        {/* Hidden on mobile for steps 1-4; always visible on lg; shown on mobile at step 5 */}
        <div
          className={[
            'lg:col-span-5 lg:sticky lg:top-8',
            wizard.step < 5 ? 'hidden lg:block' : 'block',
          ].join(' ')}
        >
          <LiveTicketPreview formData={wizard.formData} />
        </div>
      </div>
    </div>
  )
}
