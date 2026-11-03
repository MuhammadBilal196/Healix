import { AppThemeProvider, useAppTheme, usePaperTheme } from '../theme/ThemeProvider';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/auth';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ImmersiveMode } from '../components/navigation/ImmersiveMode';
import { BackBar } from '../components/navigation/BackBar';
import * as SystemUI from 'expo-system-ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { AppDialogs } from '../components/common/AppDialogs';
import { getAuthRedirect } from '../utils/authRouting';

export default function RootLayout() {
  return <AppThemeProvider><ThemedRootLayout /></AppThemeProvider>;
}

function ThemedRootLayout() {
  const { colors: COLORS, ready } = useAppTheme();
  const paperTheme = usePaperTheme();

  const { user, isInitializing, loadUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const redirect = isInitializing ? null : getAuthRedirect(user?.role, segments, user?.status);
  useEffect(() => { void loadUser(); }, [loadUser]);
  useEffect(() => { void SystemUI.setBackgroundColorAsync(COLORS.bg).catch(() => {}); }, [COLORS.bg]);
  useEffect(() => { if (redirect) router.replace(redirect as any); }, [redirect, router]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <ImmersiveMode />
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          {!redirect && <BackBar />}
          <View style={{ flex: 1 }}><Slot /></View>
        </View>
        <AppDialogs />
        {(!ready || isInitializing || redirect) && (
          <View pointerEvents="auto" style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
            <ActivityIndicator size="large" color={COLORS.primaryText} />
          </View>
        )}
      </PaperProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
