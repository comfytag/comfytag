import React, { useEffect } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuthStore } from '../store'
import { useModeStore } from '../store'
import type { RootStackParamList } from './types'
import GuestNavigator from './GuestNavigator'
import AttendeeApp from './AttendeeNavigator'
import OrganizerApp from './OrganizerNavigator'
import { connectSocket, disconnectSocket } from '../lib/socket'
import { registerForPushNotifications } from '../lib/pushNotifications'

const Stack = createStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const userId = useAuthStore((state) => state.user?._id)
  const mode = useModeStore((state) => state.mode)

  useEffect(() => {
    if (isLoggedIn && userId) {
      connectSocket(userId)
      void registerForPushNotifications(userId)
    } else {
      disconnectSocket()
    }
  }, [isLoggedIn, userId])

  useEffect(() => () => disconnectSocket(), [])

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureResponseDistance: 50,
        transitionSpec: {
          open: {
            animation: 'spring' as const,
            config: { damping: 22, stiffness: 350, mass: 1 },
          },
          close: {
            animation: 'timing' as const,
            config: { duration: 180 },
          },
        },
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      {!isLoggedIn ? (
        <Stack.Screen
          name="GuestApp"
          component={GuestNavigator}
          options={{ animation: 'none' }}
        />
      ) : mode === 'organizer' ? (
        <Stack.Screen
          name="OrganizerApp"
          component={OrganizerApp}
          options={{ animation: 'none' }}
        />
      ) : (
        <Stack.Screen
          name="AttendeeApp"
          component={AttendeeApp}
          options={{ animation: 'none' }}
        />
      )}
    </Stack.Navigator>
  )
}
