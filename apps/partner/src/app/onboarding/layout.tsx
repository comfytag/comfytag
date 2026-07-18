import { WelcomeBackdrop } from '@/components/layout/WelcomeBackdrop'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <WelcomeBackdrop>{children}</WelcomeBackdrop>
}
