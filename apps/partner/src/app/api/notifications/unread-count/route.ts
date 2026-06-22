import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { api } from '@/lib/api'
import type { Notification } from '@comfytag/types'

export async function GET() {
  const session = await getServerSession()

  if (!session?.user?.token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await api.get<{ notifications: Notification[] }>('/notification', {
      params: { page: 1, limit: 100 },
      headers: { Authorization: `Bearer ${session.user.token}` },
    })
    const notifications = response.data.notifications ?? []
    const count = notifications.filter((n) => !n.read).length
    return NextResponse.json({ data: { count } })
  } catch {
    return NextResponse.json({ data: { count: 0 } })
  }
}
