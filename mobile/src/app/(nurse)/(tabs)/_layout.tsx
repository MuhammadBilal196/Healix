import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { SwipeTabs } from '../../../components/navigation/SwipeTabs';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { navigate } from '../../../utils/navigation';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

const TAB_ORDER = ['home', 'visits', 'marketplace', 'messages', 'profile'];

export default function NurseTabsLayout() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [moreVisible, setMoreVisible] = useState(false);

  const handleMoreItemPress = (path: any) => {
    setMoreVisible(false);
    navigate(path);
  };

  return (
    <>
      <SwipeTabs base="/(nurse)/(tabs)" tabs={TAB_ORDER}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          tabBarStyle: {
            backgroundColor: COLORS.surfaceCard,
            borderTopWidth: 1,
            borderTopColor: COLORS.inputBorder,
            height: 65,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: COLORS.primaryText,
          tabBarInactiveTintColor: COLORS.textMuted,
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
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="visits"
          options={{
            title: 'Visits',
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="marketplace"
          options={{
            title: 'Marketplace',
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="more"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setMoreVisible(true);
            },
          }}
          options={{
            title: 'More',
            tabBarIcon: ({ color }) => <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={color} />,
          }}
        />
      </Tabs>
      </SwipeTabs>

      {/* More Menu Bottom Sheet / Modal */}
      <Modal
        visible={moreVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoreVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMoreVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>Nurse Options</Text>
                  <TouchableOpacity onPress={() => setMoreVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={COLORS.textBody} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={() => handleMoreItemPress('/(nurse)/ai')}>
                  <View style={[styles.iconBox, { backgroundColor: COLORS.blueLight }]}>
                    <Ionicons name="sparkles" size={22} color={COLORS.primaryText} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>AI Assistant</Text>
                    <Text style={styles.menuItemSub}>Clinical support & insights</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textBody} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => handleMoreItemPress('/(nurse)/patients')}>
                  <View style={[styles.iconBox, { backgroundColor: COLORS.purpleLight }]}>
                    <Ionicons name="people" size={22} color={COLORS.purple} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>Patients</Text>
                    <Text style={styles.menuItemSub}>Active patient roster</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textBody} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => handleMoreItemPress('/(nurse)/schedule')}>
                  <View style={[styles.iconBox, { backgroundColor: COLORS.redLight }]}>
                    <Ionicons name="calendar" size={22} color={COLORS.red} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>Schedule</Text>
                    <Text style={styles.menuItemSub}>Shifts and availability</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textBody} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => handleMoreItemPress('/(nurse)/sync')}>
                  <View style={[styles.iconBox, { backgroundColor: COLORS.emeraldLight }]}>
                    <Ionicons name="sync" size={22} color={COLORS.emerald} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>Data Sync</Text>
                    <Text style={styles.menuItemSub}>Offline mode & syncing</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textBody} />
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.emeraldLight,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  menuTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassSurface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSub: {
    color: COLORS.textBody,
    fontSize: 12,
  },
}));

