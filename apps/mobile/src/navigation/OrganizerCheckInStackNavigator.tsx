import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '@comfytag/ui/tokens'
import CheckInScreen from '../screens/organizer/checkin/CheckInScreen'
import FaceCheckInScreen from '../screens/organizer/checkin/FaceCheckInScreen'
import ManualCheckInScreen from '../screens/organizer/checkin/ManualCheckInScreen'
import type { OrganizerCheckInStackParamList } from './types'

const Stack = createStackNavigator<OrganizerCheckInStackParamList>()

export default function OrganizerCheckInStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureResponseDistance: 50,
        cardStyle: { backgroundColor: colors.mobile.bg },
        transitionSpec: {
          open: { animation: 'spring' as const, config: { damping: 22, stiffness: 350, mass: 1 } },
          close: { animation: 'timing' as const, config: { duration: 180 } },
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
      <Stack.Screen name="CheckInHome" component={CheckInScreen} />
      <Stack.Screen name="FaceCheckIn" component={FaceCheckInScreen} />
      <Stack.Screen name="ManualCheckIn" component={ManualCheckInScreen} />
    </Stack.Navigator>
  )
}
