'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { api } from '@/lib/api'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await api.post('/newsletter/subscribe', { email: email.trim() })
      setSubmitted(true)
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Something went wrong — please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="relative bg-zinc-950 rounded-[2rem] md:rounded-[3rem] p-10 md:p-20 overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Never miss a<br />moment again.
            </h2>
            <p className="text-white/60 text-lg mb-8 md:mb-10">
              Get notified about exclusive events, pre-sales, and early bird access tailored to your preferences.
            </p>

            {submitted ? (
              <p className="text-white font-semibold">✓ You&apos;re subscribed — we&apos;ll notify you.</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  className="flex-grow px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:ring-2 focus:ring-brand focus:outline-none transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-dark transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Subscribing…' : 'Notify Me'}
                </button>
              </form>
            )}
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <p className="text-white/40 text-xs mt-6 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              We respect your privacy. No spam, ever.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
