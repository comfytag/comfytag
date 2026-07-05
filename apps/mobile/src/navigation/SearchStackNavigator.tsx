import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import type { SearchStackParamList } from './types'
import SearchScreen from '../screens/attendee/search/SearchScreen'
import EventDetailScreen from '../screens/attendee/discover/EventDetailScreen'

const Stack = createStackNavigator<SearchStackParamList>()

export default function SearchStackNavigator() {
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
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  )
}
