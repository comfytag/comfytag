import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '@comfytag/ui/tokens'
import ProfileScreen from '../screens/attendee/profile/ProfileScreen'
import EditProfileScreen from '../screens/attendee/profile/EditProfileScreen'
import FollowingScreen from '../screens/attendee/profile/FollowingScreen'
import FaceEnrollmentStatusScreen from '../screens/attendee/profile/FaceEnrollmentStatusScreen'
import FaceEnrollmentScreen from '../screens/onboarding/FaceEnrollmentScreen'
import type { ProfileStackParamList } from './types'

const Stack = createStackNavigator<ProfileStackParamList>()

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureResponseDistance: 50,
        cardStyle: { backgroundColor: colors.public.bg },
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
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Following" component={FollowingScreen} />
      <Stack.Screen name="FaceEnrollmentStatus" component={FaceEnrollmentStatusScreen} />
      <Stack.Screen name="FaceEnrollment" component={FaceEnrollmentScreen} />
    </Stack.Navigator>
  )
}
