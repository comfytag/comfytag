import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { colors, layout } from '@comfytag/ui/tokens'
import {
  Compass,
  Search,
  Ticket,
  Bell,
  User,
} from 'lucide-react-native'
import type { AttendeeTabParamList } from './types'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import DiscoverStackNavigator from './DiscoverStackNavigator'
import SearchStackNavigator from './SearchStackNavigator'
import TicketsStackNavigator from './TicketsStackNavigator'
import InboxScreen from '../screens/attendee/inbox/InboxScreen'
import ProfileStackNavigator from './ProfileStackNavigator'

const Tab = createBottomTabNavigator<AttendeeTabParamList>()

export default function AttendeeNavigator() {
  return (
    <ErrorBoundary>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.mobile.surface,
          borderTopColor: colors.mobile.border,
          borderTopWidth: 1,
          height: parseInt(layout.tabBarHeight),
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.brand.DEFAULT,
        tabBarInactiveTintColor: colors.mobile.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverStackNavigator}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color }) => (
            <Compass size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => (
            <Search size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketsStackNavigator}
        options={{
          tabBarLabel: 'Tickets',
          tabBarIcon: ({ color }) => (
            <Ticket size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color }) => (
            <Bell size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <User size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
    </ErrorBoundary>
  )
}
