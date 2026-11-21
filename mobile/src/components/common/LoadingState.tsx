
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();

  const styles = useThemeValue(createStyles);
  return (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.emerald} />
      <Text style={styles.message}>{message}</Text>
    </View>
  </SafeAreaView>
);
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    color: COLORS.textBody,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
}));
