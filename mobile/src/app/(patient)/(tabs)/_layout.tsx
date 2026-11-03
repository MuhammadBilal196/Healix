import { useAppTheme } from '../../../theme/ThemeProvider';

import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { SwipeTabs } from '../../../components/navigation/SwipeTabs';
import { Ionicons } from '@expo/vector-icons';


const TAB_ORDER = ['home', 'requests', 'records', 'messages', 'profile'];

export default function PatientTabsLayout() {
  const { colors: COLORS } = useAppTheme();

  return (
    <SwipeTabs base="/(patient)/(tabs)" tabs={TAB_ORDER}>
      <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarStyle: {
          backgroundColor: COLORS.surfaceCard,
          borderTopWidth: 1,
          borderTopColor: COLORS.inputBorder,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: COLORS.primaryText,
        tabBarInactiveTintColor: COLORS.textBody,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Care',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'folder-open' : 'folder-open-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* More tab hidden from tab bar but route still accessible */}
      <Tabs.Screen
        name="more"
        options={{
          href: null,
        }}
      />
    </Tabs>
      </SwipeTabs>
  );
}
