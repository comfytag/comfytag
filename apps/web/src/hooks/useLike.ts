import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { authHeader } from '@comfytag/utils'
import api from '@/lib/api'

interface UseLikeOptions {
  eventId: string
  initialLiked?: boolean
  initialCount?: number
}

export function useLike(eventId: string, initialLiked = false, initialCount?: number) {
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState<number | null>(initialCount ?? null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (initialCount !== undefined) {
      setLikeCount(initialCount)
    }
  }, [initialCount])

  const toggleLike = async () => {
    if (!session) {
      // Caller should handle auth gate
      return
    }
    setIsPending(true)
    try {
      const res = await api.post<{ liked: boolean; likeCount: number }>(
        `/events/${eventId}/like`,
        null,
        authHeader(session.user.token),
      )
      setIsLiked(res.data.liked)
      if (initialCount !== undefined) {
        setLikeCount(res.data.likeCount)
      }
    } catch {
      // silent
    } finally {
      setIsPending(false)
    }
  }

  return {
    isLiked,
    likeCount,
    toggleLike,
    isPending,
  }
}
