import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import {
  LayoutDashboard,
  CalendarDays,
  ScanFace,
  Wallet,
  Settings,
} from 'lucide-react-native'
import type { OrganizerTabParamList } from './types'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { SharedTabBar } from '../components/navigation/SharedTabBar'
import DashboardScreen from '../screens/organizer/dashboard/DashboardScreen'
import OrganizerEventsStackNavigator from './OrganizerEventsStackNavigator'
import OrganizerCheckInStackNavigator from './OrganizerCheckInStackNavigator'
import PayoutsScreen from '../screens/organizer/payouts/PayoutsScreen'
import OrganizerAccountStackNavigator from './OrganizerAccountStackNavigator'

const Tab = createBottomTabNavigator<OrganizerTabParamList>()

export default function OrganizerNavigator() {
  return (
    <ErrorBoundary theme="light">
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <SharedTabBar {...props} theme="light" />}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={OrganizerEventsStackNavigator}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={OrganizerCheckInStackNavigator}
        options={{
          tabBarLabel: 'Check-in',
          tabBarIcon: ({ color }) => <ScanFace size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Payouts"
        component={PayoutsScreen}
        options={{
          tabBarLabel: 'Payouts',
          tabBarIcon: ({ color }) => <Wallet size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={OrganizerAccountStackNavigator}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => <Settings size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
    </ErrorBoundary>
  )
}
