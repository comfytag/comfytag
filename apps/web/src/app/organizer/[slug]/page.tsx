import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { OrganizerClient } from './OrganizerClient'
import type { Event } from '@comfytag/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

async function getOrganizerProfile(slug: string) {
  try {
    const res = await fetch(`${API}/users/${slug}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const organizer = data.data ?? data ?? null
    return organizer
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
  const organizer = await getOrganizerProfile(slug)

  if (!organizer) {
    return { title: 'Organizer Not Found' }
  }

  return {
    title: `${organizer.name} — Events & Tickets | ComfyTag`,
    description: `Check out upcoming events from ${organizer.name} on ComfyTag. Your face is your ticket.`,
  }
}

export default async function OrganizerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const organizer = await getOrganizerProfile(slug)

  if (!organizer) {
    notFound()
  }

  return <OrganizerClient slug={slug} initialProfile={{ organizer, events: [] }} />
}
