import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router, useSegments } from 'expo-router';

/**
 * WhatsApp-style switching between bottom tabs: swipe left for the next tab,
 * swipe right for the previous one. Wrap a role's <Tabs> with it.
 *
 * @param base   route prefix of the tab group, e.g. '/(patient)/(tabs)'
 * @param tabs   tab route names in the order they appear in the tab bar
 */
export function SwipeTabs({ base, tabs, children }: { base: string; tabs: string[]; children: React.ReactNode }) {
  const segments = useSegments() as string[];
  const tabsIndex = segments.indexOf('(tabs)');
  const current = tabsIndex >= 0 ? segments[tabsIndex + 1] : undefined;
  const index = current ? tabs.indexOf(current) : -1;

  const gesture = useMemo(() => Gesture.Pan()
    // Only clearly horizontal swipes: vertical scrolling keeps working normally.
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .runOnJS(true)
    .onEnd((event) => {
      if (index < 0) return;
      const farEnough = Math.abs(event.translationX) > 80 || Math.abs(event.velocityX) > 700;
      if (!farEnough) return;
      const next = event.translationX < 0 ? index + 1 : index - 1;
      if (next < 0 || next >= tabs.length) return;
      router.navigate(`${base}/${tabs[next]}` as any);
    }), [base, tabs, index]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1 }} collapsable={false}>{children}</View>
    </GestureDetector>
  );
}
