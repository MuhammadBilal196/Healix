
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { useVoicePlayback } from '../../hooks/useVoicePlayback';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MessageItem } from '../patient/chat/types';
import { RADIUS } from '../../theme';
import { API_URL } from '../../api/client';

interface ChatBubbleProps {
  message: MessageItem;
  isMe: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isMe }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const resolvedMediaUrl = message.mediaUrl?.startsWith('/') 
    ? `${API_URL.replace('/api/v1', '')}${message.mediaUrl}` 
    : message.mediaUrl;

  const { isPlaying, position, duration, togglePlayback } = useVoicePlayback(message.type === 'audio' ? resolvedMediaUrl : undefined, message.fileMetadata?.durationMs);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {message.type === 'image' && resolvedMediaUrl && (
          <View style={styles.imageWrap}>
            <Image source={{ uri: resolvedMediaUrl }} style={styles.imageContent} resizeMode="cover" />
          </View>
        )}

        {message.type === 'audio' && resolvedMediaUrl && (
          <View style={styles.audioCard}>
            <TouchableOpacity style={styles.audioPlayBtn} onPress={togglePlayback}>
              <Text style={styles.audioPlayIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <View style={styles.audioTrack}>
              <View style={styles.audioProgressBg}>
                <View style={[styles.audioProgressFill, { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }]} />
              </View>
              <Text style={styles.audioTime}>
                {formatTime(position)} / {formatTime(duration)}
              </Text>
            </View>
          </View>
        )}

        {message.type === 'video' && (
          <View style={styles.videoCard}>
            <View style={styles.videoThumbnailPlaceholder}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <View style={styles.videoMeta}>
              <Text style={styles.videoName} numberOfLines={1}>{message.fileName || 'Clinical_Video.mp4'}</Text>
              <Text style={styles.videoSize}>{message.duration || '0:30'} • {message.fileSize || '3.5 MB'}</Text>
            </View>
          </View>
        )}

        {message.type === 'document' && (
          <View style={styles.docCard}>
            <View style={styles.docIconBg}>
              <Text style={styles.docIcon}>📄</Text>
            </View>
            <View style={styles.docMeta}>
              <Text style={styles.docName} numberOfLines={1}>{message.fileName}</Text>
              <Text style={styles.docSize}>{message.fileSize}</Text>
            </View>
          </View>
        )}

        {!!message.text && (
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
            {message.text}
          </Text>
        )}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.timeText}>{message.time || (message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</Text>
        {isMe && (
          <Text style={[styles.statusIcon, message.status === 'read' && styles.statusRead]}>
            {message.status === 'sent' ? '✓' : '✓✓'}
          </Text>
        )}
      </View>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  msgRow: { marginBottom: 16, maxWidth: '85%' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },
  bubble: { padding: 12, borderRadius: RADIUS.lg },
  bubbleThem: { backgroundColor: COLORS.surfaceCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.inputBorder },
  bubbleMe: { backgroundColor: COLORS.tealFill, borderBottomRightRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextThem: { color: COLORS.textDark },
  msgTextMe: { color: COLORS.onAccent },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  timeText: { fontSize: 11, color: COLORS.textBody },
  statusIcon: { fontSize: 11, color: COLORS.textBody, marginLeft: 4, fontWeight: '700' },
  statusRead: { color: COLORS.emerald },
  imageWrap: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 8, backgroundColor: COLORS.bg, width: 220, height: 160 },
  imageContent: { width: '100%', height: '100%' },
  videoCard: { width: 240, backgroundColor: COLORS.modalBackdrop, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: COLORS.glassBorder },
  videoThumbnailPlaceholder: { height: 120, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 32, color: COLORS.textDark, opacity: 0.8 },
  videoMeta: { padding: 8, backgroundColor: COLORS.modalBackdrop },
  videoName: { color: COLORS.textDark, fontSize: 13, fontWeight: '600' },
  videoSize: { color: COLORS.textBody, fontSize: 11, marginTop: 2 },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassSurface, padding: 10, borderRadius: RADIUS.md, marginBottom: 8, width: 220 },
  docIconBg: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.glassSurface, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  docIcon: { fontSize: 18 },
  docMeta: { flex: 1 },
  docName: { color: COLORS.textDark, fontSize: 14, fontWeight: '600' },
  docSize: { color: COLORS.inverseMuted, fontSize: 11, marginTop: 2 },
  audioCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.modalBackdrop, padding: 8, borderRadius: RADIUS.md, marginBottom: 8, width: 220 },
  audioPlayBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.tealFill, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  audioPlayIcon: { color: COLORS.onAccent, fontSize: 16, marginLeft: 2 },
  audioTrack: { flex: 1 },
  audioProgressBg: { height: 4, backgroundColor: COLORS.glassSurface, borderRadius: 2, marginBottom: 6 },
  audioProgressFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 2 },
  audioTime: { color: COLORS.textDark, fontSize: 10, fontWeight: '600' },
}));
