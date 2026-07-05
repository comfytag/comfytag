import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import type { DiscoverStackParamList } from './types'
import HomeScreen from '../screens/attendee/discover/HomeScreen'
import CategoryScreen from '../screens/attendee/discover/CategoryScreen'
import EventDetailScreen from '../screens/attendee/discover/EventDetailScreen'
import OrganizerProfileScreen from '../screens/attendee/discover/OrganizerProfileScreen'
import CheckoutScreen from '../screens/attendee/checkout/CheckoutScreen'
import OrderConfirmationScreen from '../screens/attendee/checkout/OrderConfirmationScreen'

const Stack = createStackNavigator<DiscoverStackParamList>()

export default function DiscoverStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="OrganizerProfile" component={OrganizerProfileScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
    </Stack.Navigator>
  )
}
