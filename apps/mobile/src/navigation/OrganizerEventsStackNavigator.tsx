import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '@comfytag/ui/tokens'
import EventsListScreen from '../screens/organizer/events/EventsListScreen'
import EventDetailScreen from '../screens/organizer/events/EventDetailScreen'
import CreateEventScreen from '../screens/organizer/events/CreateEventScreen'
import EditEventScreen from '../screens/organizer/events/EditEventScreen'
import TicketTiersScreen from '../screens/organizer/events/TicketTiersScreen'
import PromoCodesScreen from '../screens/organizer/events/PromoCodesScreen'
import AudienceScreen from '../screens/organizer/events/AudienceScreen'
import type { OrganizerEventsStackParamList } from './types'

const Stack = createStackNavigator<OrganizerEventsStackParamList>()

export default function OrganizerEventsStackNavigator() {
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
      <Stack.Screen name="EventsList" component={EventsListScreen} />
      <Stack.Screen name="OrganizerEventDetail" component={EventDetailScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="EditEvent" component={EditEventScreen} />
      <Stack.Screen name="TicketTiers" component={TicketTiersScreen} />
      <Stack.Screen name="PromoCodes" component={PromoCodesScreen} />
      <Stack.Screen name="Audience" component={AudienceScreen} />
    </Stack.Navigator>
  )
}
