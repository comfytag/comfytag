import React from 'react'
import { View, StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import {
  Compass,
  Search,
  Ticket,
  Bell,
  User,
} from 'lucide-react-native'
import type { AttendeeTabParamList } from './types'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { SharedTabBar } from '../components/navigation/SharedTabBar'
import { MiniBar } from '../components/navigation/MiniBar'
import { useAuthStore } from '../store'
import { navigateUpTo } from '../lib/navigation'
import DiscoverStackNavigator from './DiscoverStackNavigator'
import SearchStackNavigator from './SearchStackNavigator'
import TicketsStackNavigator from './TicketsStackNavigator'
import InboxScreen from '../screens/attendee/inbox/InboxScreen'
import ProfileStackNavigator from './ProfileStackNavigator'

const Tab = createBottomTabNavigator<AttendeeTabParamList>()

// Hidden for now — the "next ticket" strip above the tab bar was showing up
// on every attendee tab and reads as an unexplained fixed element. Flip back
// to true to restore it once there's a clearer affordance for what it is.
const SHOW_TICKET_MINI_BAR = false

// MiniBar renders as a normal sibling above SharedTabBar (not an absolute
// overlay), so BottomTabView's own height measurement already reserves the
// right amount of space for screen content — no per-screen list padding needed.
function AttendeeTabBar(props: BottomTabBarProps) {
  return (
    <View style={styles.tabBarStack}>
      {SHOW_TICKET_MINI_BAR && <MiniBar />}
      <SharedTabBar {...props} theme="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  tabBarStack: {
    width: '100%',
  },
})

// Mounted both as the top-level app for logged-in attendees and, nested
// inside GuestNavigator's GuestHome screen, as the guest browsing experience.
// Discover/Search are open to everyone; Tickets/Inbox/Profile intercept the
// tab press itself for guests and send them straight to Login instead of
// switching tabs — so there's no dead-end "sign in" screen to land on or
// back out of, and no gate shown until they actually tap one of those tabs.
function guestGateListeners({ navigation }: { navigation: Parameters<typeof navigateUpTo>[0] }) {
  return {
    tabPress: (e: { preventDefault: () => void }) => {
      if (!useAuthStore.getState().isLoggedIn) {
        e.preventDefault()
        navigateUpTo(navigation, 'Login')
      }
    },
  }
}

export default function AttendeeNavigator() {
  return (
    <ErrorBoundary theme="light">
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AttendeeTabBar {...props} />}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverStackNavigator}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color }) => <Compass size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <Search size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketsStackNavigator}
        listeners={guestGateListeners}
        options={{
          tabBarLabel: 'Tickets',
          tabBarIcon: ({ color }) => <Ticket size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        listeners={guestGateListeners}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color }) => <Bell size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        listeners={guestGateListeners}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
    </ErrorBoundary>
  )
}
