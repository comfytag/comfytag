import React from 'react'
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack'
import { colors } from '@comfytag/ui/tokens'
import type { GuestStackParamList } from './types'
import SplashScreen from '../screens/onboarding/SplashScreen'
import WelcomeScreen from '../screens/onboarding/WelcomeScreen'
import GuestBrowseScreen from '../screens/onboarding/GuestBrowseScreen'
import LoginScreen from '../screens/onboarding/LoginScreen'
import RegisterScreen from '../screens/onboarding/RegisterScreen'
import ForgotPasswordScreen from '../screens/onboarding/ForgotPasswordScreen'

const Stack = createStackNavigator<GuestStackParamList>()

const DiceFmTransition = {
  transitionSpec: {
    open: {
      animation: 'spring' as const,
      config: {
        damping: 22,
        stiffness: 350,
        mass: 1,
      },
    },
    close: {
      animation: 'timing' as const,
      config: {
        duration: 180,
      },
    },
  },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
}

export default function GuestNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...DiceFmTransition,
        gestureEnabled: true,
        cardStyle: {
          backgroundColor: colors.mobile.bg,
        },
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{
          animation: 'none',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="GuestBrowse" component={GuestBrowseScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  )
}
