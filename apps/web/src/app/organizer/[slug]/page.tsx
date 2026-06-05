import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { OrganizerClient } from './OrganizerClient'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

async function getOrganizerProfile(slug: string) {
  try {
    const res = await fetch(`${API}/organizer/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.data ?? data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = await getOrganizerProfile(slug)
  const name = profile?.organizer?.name ?? profile?.name ?? slug
  return {
    title: `${name} — Events & Tickets | ComfyTag`,
    description: `Buy tickets for upcoming ${name} events on ComfyTag. Face-powered entry, instant checkout, no stress. Your face is your ticket here.`,
    alternates: { canonical: `https://comfytag.com/organizer/${slug}` },
    openGraph: {
      images: profile?.organizer?.avatar
        ? [{ url: profile.organizer.avatar }]
        : [],
    },
  }
}

export default async function OrganizerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = await getOrganizerProfile(slug)

  if (!profile) {
    notFound()
  }

  return <OrganizerClient slug={slug} initialProfile={profile} />
}
