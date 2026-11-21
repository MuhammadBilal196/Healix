import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useRef, useEffect, type ComponentRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../store/auth';
import { useChatHistory, useSendMessage, useMarkMessagesAsRead, useChatSocket, useSendMediaMessage } from '../../../hooks/useMessages';
import { apiClient } from '../../../api/client';

import { ChatBubble } from '../../../components/chat/ChatBubble';
import { ChatInput } from '../../../components/chat/ChatInput';
import { SPACING } from '../../../theme';

export default function DoctorChatScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const { user } = useAuthStore();
  const myId = user?.id;

  const threadId = params.threadId as string;
  const contactName = (params.name as string) || 'Assigned Patient';
  const contactRole = (params.role as string) || 'Verified Patient';

  const { data: historyData, isLoading } = useChatHistory(threadId);
  const { mutateAsync: sendMessage, isPending: isSending } = useSendMessage();
  const { mutateAsync: sendMediaMessage } = useSendMediaMessage();
  const { mutate: markAsRead } = useMarkMessagesAsRead(threadId);
  const { typingUsers, sendTypingEvent } = useChatSocket(threadId);

  const rawMessages = (historyData as any)?.data?.messages || historyData?.messages || [];

  // Sort messages
  const messages = [...rawMessages].sort((a: any, b: any) =>
    new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages.length, typingUsers.length]);

  // Mark unread as read
  useEffect(() => {
    if (threadId && rawMessages.some((m: any) => m.senderId !== myId && m.status !== 'READ')) {
      markAsRead();
    }
  }, [rawMessages, myId, threadId, markAsRead]);

  const handleSend = async (text: string, mediaPreview: any) => {
    try {
      if (mediaPreview && mediaPreview.uri) {
        await sendMediaMessage({
          threadId,
          uri: mediaPreview.uri,
          mimeType: mediaPreview.mimeType || 'application/octet-stream',
          filename: mediaPreview.name || 'upload.bin',
          durationMs: mediaPreview.durationMs
        });
      } else {
        await sendMessage({
          threadId,
          contentType: 'TEXT',
          contentUrlOrText: text,
        });
      }
    } catch (err: any) {
      Alert.alert('Message Failed', err.message || 'Error sending message');
      throw err;
    }
  };



  const handleRequestEmergency = async () => {
    Alert.alert(
      'Request Emergency Dispatch',
      'Are you sure you want to request an emergency ambulance dispatch from the doctor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/chat/threads/${threadId}/messages`, {
                contentType: 'EMERGENCY_REQUEST',
                contentUrlOrText: 'NURSE REQUESTED EMERGENCY DISPATCH'
              });
              Alert.alert('Requested', 'The doctor has been notified.');
            } catch(e: any) {
              Alert.alert('Error', e.message || 'Failed to send request');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Avatar.Text
            size={38}
            label={contactName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            style={styles.avatarBg}
            color={COLORS.primaryText}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{contactName}</Text>
            <Text style={styles.headerStatus}>{contactRole}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleRequestEmergency} style={[styles.headerActionBtn, { backgroundColor: COLORS.red }]}>
              <Text style={[styles.headerActionIcon, { color: COLORS.textDark }]}>🚨</Text>
            </TouchableOpacity>
            </View>
        </View>

        {/* Banner */}
        <View style={styles.encryptionNotice}>
          <Text style={styles.encryptionText}>
            Care team conversation - messages and attachments
          </Text>
        </View>

        {/* Thread */}
        <ScrollView ref={scrollViewRef} style={styles.messagesList} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
          {messages.length === 0 && !isLoading && (
            <Text style={styles.emptyText}>No messages yet. Send a message to start the consultation.</Text>
          )}
          {messages.map((msg: any) => (
            <ChatBubble key={msg.id} message={{
              ...msg,
              text: msg.contentType === 'TEXT' ? msg.contentUrlOrText : undefined,
              mediaUrl: msg.contentType !== 'TEXT' ? msg.contentUrlOrText : undefined,
              type: msg.contentType === 'TEXT' ? 'text' : msg.contentType.toLowerCase(),
              status: msg.status === 'READ' ? 'read' : (msg.status === 'DELIVERED' ? 'delivered' : 'sent')
            }} isMe={msg.senderId === myId} />
          ))}
        </ScrollView>

        {typingUsers.length > 0 && (
          <View style={styles.typingIndicatorContainer}>
            <Text style={styles.typingText}>Patient is typing...</Text>
          </View>
        )}

        <ChatInput onSend={handleSend} disabled={isSending} onTyping={sendTypingEvent} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.inputBorder },
  backBtn: { padding: 8, marginRight: 8, marginLeft: -8 },
  backIcon: { color: COLORS.primaryText, fontSize: 32, lineHeight: 32, marginTop: -4 },
  avatarBg: { backgroundColor: COLORS.surfaceCard, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerName: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  headerStatus: { color: COLORS.textBody, fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  headerActionIcon: { fontSize: 16 },
  encryptionNotice: { backgroundColor: COLORS.bg, padding: 8, alignItems: 'center' },
  encryptionText: { color: COLORS.textBody, fontSize: 11, fontWeight: '600' },
  messagesList: { flex: 1, backgroundColor: COLORS.bg },
  messagesContent: { padding: SPACING.md, paddingBottom: 20 },
  emptyText: { color: COLORS.textBody, textAlign: 'center', marginTop: 40, fontSize: 14 },
  typingIndicatorContainer: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.bg },
  typingText: { color: COLORS.primaryText, fontSize: 12, fontStyle: 'italic' },
}));


