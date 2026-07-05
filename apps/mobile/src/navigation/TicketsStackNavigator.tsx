import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import type { TicketsStackParamList } from './types'
import MyTicketsScreen from '../screens/attendee/tickets/MyTicketsScreen'
import TicketDetailScreen from '../screens/attendee/tickets/TicketDetailScreen'
import TransferTicketScreen from '../screens/attendee/tickets/TransferTicketScreen'

const Stack = createStackNavigator<TicketsStackParamList>()

export default function TicketsStackNavigator() {
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
      <Stack.Screen name="TicketsList" component={MyTicketsScreen} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
      <Stack.Screen name="TransferTicket" component={TransferTicketScreen} />
    </Stack.Navigator>
  )
}
