import { useAppTheme } from '../../../theme/ThemeProvider';

import { SPACING, TYPOGRAPHY } from '../../../theme';
import React from 'react';
import { Tabs } from 'expo-router';
import { SwipeTabs } from '../../../components/navigation/SwipeTabs';
import { Ionicons } from '@expo/vector-icons';

const TAB_ORDER = ['home', 'messages', 'profile'];

export default function DoctorTabsLayout() {
  const { colors: COLORS } = useAppTheme();

  return (
    <SwipeTabs base="/(doctor)/(tabs)" tabs={TAB_ORDER}>
      <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarStyle: {
          backgroundColor: COLORS.surfaceCard,
          borderTopWidth: 1,
          borderTopColor: COLORS.inputBorder,
          height: 65,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.sm,
        },
        tabBarActiveTintColor: COLORS.primaryText,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.sizes.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Case Queue',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={24} color={color} />
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
    </Tabs>
      </SwipeTabs>
  );
}

