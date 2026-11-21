
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { forwardRef, type ComponentRef } from 'react';
import { useVoicePlayback } from '../../../hooks/useVoicePlayback';
import { View, ScrollView, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { RADIUS, SPACING } from '../../../theme';
import { MessageItem } from './types';

interface MessageListProps {
  messages: MessageItem[];
}

import { API_URL } from '../../../api/client';

const PatientAudioBubble = ({ uri, isMe, durationMs }: { uri: string; isMe: boolean; durationMs?: number }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { isPlaying, position, duration, togglePlayback } = useVoicePlayback(uri, durationMs);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.audioCard}>
      <TouchableOpacity style={[styles.audioPlayBtn, isMe && { backgroundColor: COLORS.bg }]} onPress={togglePlayback}>
        <Text style={[styles.audioPlayIcon, isMe && { color: COLORS.emerald }]}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      <View style={styles.audioTrack}>
        <View style={styles.audioProgressBg}>
          <View style={[styles.audioProgressFill, { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }, isMe && { backgroundColor: COLORS.bg }]} />
        </View>
        <Text style={[styles.audioTime, isMe && { color: COLORS.textMuted }]}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
};

export const MessageList = forwardRef<ComponentRef<typeof ScrollView>, MessageListProps>(({ messages }, ref) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  return (
    <ScrollView
      ref={ref}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg) => {
        const isMe = msg.from === 'me';
        const resolvedMediaUrl = msg.mediaUrl?.startsWith('/') 
          ? `${API_URL.replace('/api/v1', '')}${msg.mediaUrl}` 
          : msg.mediaUrl;

        return (
          <View
            key={msg.id}
            style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}
          >
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              {/* IMAGE ATTACHMENT */}
              {msg.type === 'image' && resolvedMediaUrl && (
                <View style={styles.imageWrap}>
                  <Image source={{ uri: resolvedMediaUrl }} style={styles.imageContent} resizeMode="cover" />
                </View>
              )}

              {/* AUDIO ATTACHMENT */}
              {msg.type === 'audio' && resolvedMediaUrl && (
                <PatientAudioBubble uri={resolvedMediaUrl} isMe={isMe} durationMs={(msg as any).fileMetadata?.durationMs || 0} />
              )}

              {/* VIDEO ATTACHMENT */}
              {msg.type === 'video' && (
                <View style={styles.videoCard}>
                  <View style={styles.videoThumbnailPlaceholder}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <View style={styles.videoMeta}>
                    <Text style={styles.videoName} numberOfLines={1}>{msg.fileName || 'Clinical_Video.mp4'}</Text>
                    <Text style={styles.videoSize}>{msg.duration || '0:45'} · {msg.fileSize || '3.5 MB'}</Text>
                  </View>
                </View>
              )}

              {/* DOCUMENT ATTACHMENT */}
              {msg.type === 'document' && (
                <View style={styles.docCard}>
                  <View style={styles.docIconBg}>
                    <Text style={{ fontSize: 20 }}>📄</Text>
                  </View>
                  <View style={styles.docMeta}>
                    <Text style={styles.docName} numberOfLines={1}>{msg.fileName || 'Report.pdf'}</Text>
                    <Text style={styles.docSize}>{msg.fileSize || '1.2 MB'} · PDF Document</Text>
                  </View>
                </View>
              )}

              {/* TEXT CONTENT */}
              {msg.text && (
                <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
                  {msg.text}
                </Text>
              )}

              {/* TIMESTAMP & TICKS */}
              <View style={styles.timeRow}>
                <Text style={[styles.msgTime, isMe ? { color: COLORS.inverseMuted } : { color: COLORS.textBody }]}>
                  {msg.time}
                </Text>
                {isMe && (
                  <Text style={[styles.ticks, msg.status === 'read' && { color: COLORS.textMuted }]}>
                    {msg.status === 'sent' ? ' ✓' : ' ✓✓'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
});

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    paddingBottom: 20,
    gap: SPACING.md,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  bubbleThem: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderTopLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: COLORS.emeraldFill,
    borderTopRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 19,
  },
  msgTextThem: {
    color: COLORS.textDark,
  },
  msgTextMe: {
    color: COLORS.onAccent,
    fontWeight: '500',
  },
  imageWrap: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 6,
  },
  imageContent: {
    width: 220,
    height: 140,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.modalBackdrop,
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: 6,
  },
  videoThumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 2,
  },
  videoMeta: {
    marginLeft: 10,
    flex: 1,
  },
  videoName: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '700',
  },
  videoSize: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.modalBackdrop,
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: 6,
  },
  docIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docMeta: {
    marginLeft: 10,
    flex: 1,
  },
  docName: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '700',
  },
  docSize: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.modalBackdrop,
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: 6,
    width: 220,
  },
  audioPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.emeraldFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  audioPlayIcon: {
    color: COLORS.onAccent,
    fontSize: 16,
    marginLeft: 2,
  },
  audioTrack: {
    flex: 1,
  },
  audioProgressBg: {
    height: 4,
    backgroundColor: COLORS.glassSurface,
    borderRadius: 2,
    marginBottom: 6,
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: COLORS.emerald,
    borderRadius: 2,
  },
  audioTime: {
    color: COLORS.textDark,
    fontSize: 10,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  msgTime: {
    fontSize: 10,
  },
  ticks: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '800',
  },
}));
