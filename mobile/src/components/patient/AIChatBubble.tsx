
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface AIChatBubbleProps {
  message: string;
  sender?: 'user' | 'ai';
  isUser?: boolean;
  timestamp?: string;
  isLoading?: boolean;
  avatarUri?: string;
}

// ─────────────────────────────────────────────
// Loading Dots Sub-component
// ─────────────────────────────────────────────

const LoadingDots: React.FC = () => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const makePulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(700 - delay),
        ]),
      );

    const a1 = makePulse(dot1, 0);
    const a2 = makePulse(dot2, 200);
    const a3 = makePulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsRow}>
      {[dot1, dot2, dot3].map((anim, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// Avatar Sub-component
// ─────────────────────────────────────────────

const AvatarCircle: React.FC<{ uri?: string }> = ({ uri }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>AI</Text>
    </View>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export const AIChatBubble: React.FC<AIChatBubbleProps> = ({
  message,
  sender,
  isUser: isUserProp,
  timestamp,
  isLoading = false,
  avatarUri,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const isUser = isUserProp ?? (sender === 'user');

  // Slide from left (AI) or right (user) + fade
  const slideAnim = useRef(new Animated.Value(isUser ? 60 : -60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.rowWrapper,
        isUser ? styles.rowRight : styles.rowLeft,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {/* AI Avatar — left side */}
      {!isUser && (
        <View style={styles.avatarWrapper}>
          <AvatarCircle uri={avatarUri} />
        </View>
      )}

      <View style={[styles.column, isUser ? styles.columnRight : styles.columnLeft]}>
        {/* Bubble */}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          {/* Bubble tail */}
          {!isUser && <View style={styles.tailLeft} />}
          {isUser && <View style={styles.tailRight} />}

          {isLoading ? (
            <LoadingDots />
          ) : (
            <Text style={[styles.messageText, isUser ? styles.messageUser : styles.messageAI]}>
              {message}
            </Text>
          )}
        </View>

        {/* Timestamp */}
        {timestamp && (
          <Text style={[styles.timestamp, isUser ? styles.timestampRight : styles.timestampLeft]}>
            {timestamp}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  rowWrapper: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  column: {
    maxWidth: '75%',
  },
  columnLeft: {
    alignItems: 'flex-start',
  },
  columnRight: {
    alignItems: 'flex-end',
  },
  avatarWrapper: {
    marginRight: 8,
    marginBottom: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.teal,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
  },
  avatarInitials: {
    color: COLORS.onAccent,
    fontSize: 11,
    fontWeight: '800',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
  },
  bubbleUser: {
    backgroundColor: COLORS.teal,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.teal,
    borderBottomLeftRadius: 4,
  },
  // Bubble tail — user (right)
  tailRight: {
    position: 'absolute',
    bottom: 0,
    right: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: COLORS.teal,
    borderTopColor: COLORS.transparent,
  },
  // Bubble tail — AI (left)
  tailLeft: {
    position: 'absolute',
    bottom: 0,
    left: -6,
    width: 0,
    height: 0,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderRightColor: COLORS.teal,
    borderTopColor: COLORS.transparent,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageUser: {
    color: COLORS.onAccent,
    fontWeight: '500',
  },
  messageAI: {
    color: COLORS.textDark,
    fontWeight: '400',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emerald,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 4,
  },
  timestampLeft: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  timestampRight: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
}));
