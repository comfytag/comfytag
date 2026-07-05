import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { colors, layout } from '@comfytag/ui/tokens'
import {
  LayoutDashboard,
  CalendarDays,
  ScanFace,
  Wallet,
  Settings,
} from 'lucide-react-native'
import type { OrganizerTabParamList } from './types'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import DashboardScreen from '../screens/organizer/dashboard/DashboardScreen'
import OrganizerEventsStackNavigator from './OrganizerEventsStackNavigator'
import OrganizerCheckInStackNavigator from './OrganizerCheckInStackNavigator'
import PayoutsScreen from '../screens/organizer/payouts/PayoutsScreen'
import OrganizerAccountStackNavigator from './OrganizerAccountStackNavigator'

const Tab = createBottomTabNavigator<OrganizerTabParamList>()

export default function OrganizerNavigator() {
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
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={OrganizerEventsStackNavigator}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color }) => (
            <CalendarDays size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={OrganizerCheckInStackNavigator}
        options={{
          tabBarLabel: 'Check-in',
          tabBarIcon: ({ color }) => (
            <ScanFace size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Payouts"
        component={PayoutsScreen}
        options={{
          tabBarLabel: 'Payouts',
          tabBarIcon: ({ color }) => (
            <Wallet size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={OrganizerAccountStackNavigator}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => (
            <Settings size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
    </ErrorBoundary>
  )
}
