import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '@comfytag/ui/tokens'
import AccountScreen from '../screens/organizer/account/AccountScreen'
import BankScreen from '../screens/organizer/account/BankScreen'
import KycScreen from '../screens/organizer/account/KycScreen'
import type { OrganizerAccountStackParamList } from './types'

const Stack = createStackNavigator<OrganizerAccountStackParamList>()

export default function OrganizerAccountStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureResponseDistance: 50,
        cardStyle: { backgroundColor: colors.mobile.bg },
        transitionSpec: {
          open:  { animation: 'spring' as const, config: { damping: 22, stiffness: 350, mass: 1 } },
          close: { animation: 'timing' as const, config: { duration: 180 } },
        },
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen name="AccountHome" component={AccountScreen} />
      <Stack.Screen name="Bank"        component={BankScreen} />
      <Stack.Screen name="Kyc"         component={KycScreen} />
    </Stack.Navigator>
  )
}
