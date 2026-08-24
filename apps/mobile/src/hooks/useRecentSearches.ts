import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const RECENT_SEARCHES_KEY = 'comfytag_recent_searches'
const MAX_RECENT_SEARCHES = 6

// Shared between SearchScreen and ExploreScreen — one persisted list so a
// term searched from either place shows up as "recent" in both.
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((raw) => {
        if (raw) setRecentSearches(JSON.parse(raw) as string[])
      })
      .catch(() => {})
  }, [])

  const persist = (next: string[]) => {
    setRecentSearches(next)
    AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => {})
  }

  const addRecentSearch = (term: string) => {
    const trimmed = term.trim()
    if (trimmed.length === 0) return
    const next = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())]
      .slice(0, MAX_RECENT_SEARCHES)
    persist(next)
  }

  const removeRecentSearch = (term: string) => {
    persist(recentSearches.filter((s) => s !== term))
  }

  const clearRecentSearches = () => {
    persist([])
  }

  return { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches }
}
