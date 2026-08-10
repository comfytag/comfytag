import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  NavigationContainer,
  DarkTheme,
  createNavigationContainerRef,
} from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { colors } from '@comfytag/ui/tokens'
import RootNavigator from './src/navigation'
import { setupNotificationHandler } from './src/lib/pushNotifications'
import { OfflineBanner } from './src/components/ui/OfflineBanner'
import type { RootStackParamList } from './src/navigation/types'

// Configure foreground notification display before any component mounts
setupNotificationHandler()

// Shared navigation ref — passed to NavigationContainer and used by
// the notification tap handler to navigate from outside the component tree
const navigationRef = createNavigationContainerRef<RootStackParamList>()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
})

const DarkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.mobile.bg,
    card: colors.mobile.surface,
    text: colors.mobile.textPrimary,
    border: colors.mobile.border,
    primary: colors.brand.DEFAULT,
  },
}

export default function App() {
  // Handle notification taps (background + killed state)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      if (!navigationRef.isReady()) return
      const state = navigationRef.getRootState()
      const topRoute = state?.routes[state.index ?? 0]?.name
      // Only navigate to Inbox when the attendee navigator is active.
      // Organizer mode has no dedicated inbox tab.
      if (topRoute === 'AttendeeApp') {
        navigationRef.navigate('AttendeeApp', { screen: 'Inbox' } as never)
      }
    })
    return () => sub.remove()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <NavigationContainer theme={DarkNavigationTheme} ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
      <OfflineBanner />
      <StatusBar style="light" />
    </GestureHandlerRootView>
  )
}
