import { StatusBar } from 'expo-status-bar';

/**
 * Full-screen app: hides the status bar (time, battery, signal).
 * Swiping down from the top edge shows it temporarily.
 *
 * Hiding the Android navigation buttons as well needs the optional `expo-navigation-bar`
 * package (`npx expo install expo-navigation-bar`); it is not required for the app to run.
 */
export function ImmersiveMode() {
  return <StatusBar hidden />;
}
