import { PropsWithChildren } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Text, Button, ActivityIndicator, PaperProvider } from 'react-native-paper';
import { goBack } from '../../utils/navigation';
import { ThemeColors, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { useAppTheme, usePaperTheme, useThemeValue } from '../../theme/ThemeProvider';
import { ThemeToggleButton } from './AppearanceSettings';

export const useWorkflowTheme = usePaperTheme;

export function WorkflowPage({
  title,
  children,
  loading,
  error,
  retry,
}: PropsWithChildren<{ title: string; loading?: boolean; error?: string; retry?: () => void }>) {
  const { colors: COLORS } = useAppTheme();
  const flowStyles = useFlowStyles();
  const workflowTheme = useWorkflowTheme();
  return (
    <PaperProvider theme={workflowTheme}>
      <SafeAreaView style={flowStyles.page} edges={['left', 'right', 'bottom']}>
        <Appbar.Header style={{ backgroundColor: COLORS.navyDark }}>
          <Appbar.BackAction onPress={goBack} color={COLORS.headerText} />
          <Appbar.Content
            title={title}
            titleStyle={{ color: COLORS.headerText, fontWeight: '800', fontSize: 18 }}
          />
          <View style={{ marginRight: SPACING.sm }}>
            <ThemeToggleButton compact inverse />
          </View>
        </Appbar.Header>
        <ScrollView contentContainerStyle={flowStyles.content} keyboardShouldPersistTaps="handled">
          {loading && <ActivityIndicator color={COLORS.primaryText} style={{ marginVertical: SPACING.md }} />}
          {!!error && (
            <View style={flowStyles.errorBanner}>
              <Text style={{ color: COLORS.red, fontWeight: '600', flex: 1 }} accessibilityRole="alert">
                {error}
              </Text>
              {retry && (
                <Button mode="outlined" textColor={COLORS.red} compact onPress={retry}>
                  Retry
                </Button>
              )}
            </View>
          )}
          {children}
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const createFlowStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.surface },
    content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxxl + 16 },
    card: {
      backgroundColor: COLORS.surfaceCard,
      padding: SPACING.lg,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      gap: SPACING.sm,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionHeading: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: TYPOGRAPHY.weights.bold,
      marginTop: SPACING.xs,
    },
    title: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: TYPOGRAPHY.weights.bold,
    },
    subtitle: {
      color: COLORS.textMuted,
      fontSize: TYPOGRAPHY.sizes.xs,
      fontWeight: TYPOGRAPHY.weights.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    body: { color: COLORS.textBody, fontSize: TYPOGRAPHY.sizes.sm, lineHeight: 20 },
    input: { backgroundColor: COLORS.surfaceCard, marginTop: SPACING.xs },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, alignItems: 'center' },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      backgroundColor: COLORS.redLight,
      borderColor: COLORS.red,
      borderWidth: 1,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    },
    successBanner: {
      backgroundColor: COLORS.emeraldLight,
      borderColor: COLORS.emerald,
      borderWidth: 1,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    },
  });

export function useFlowStyles() {
  return useThemeValue(createFlowStyles);
}
