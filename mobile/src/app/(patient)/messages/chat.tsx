
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert } from '../../../components/common/AppDialogs';
import { voiceFileInfo } from '../../../hooks/useVoiceRecorder';
import { useState, useRef, useEffect, type ComponentRef } from 'react';
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
import { SPACING } from '../../../theme';

import {
  MessageList,
  ChatInput,
  AttachmentPicker,
  MessageItem,
  MediaPreview
} from '../../../components/patient/chat';
import { useAuthStore } from '../../../store/auth';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useChatHistory, useSendMessage, useMarkMessagesAsRead, useChatSocket, useSendMediaMessage } from '../../../hooks/useMessages';


export default function WhatsAppStyleChatScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const myId = user?.id;

  const threadId = params.threadId as string;
  const contactName = (params.name as string) || 'Care Provider';
  const contactRole = (params.role as string) || 'Verified Staff';

  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const { data: historyData, isLoading } = useChatHistory(threadId);
  const { mutateAsync: sendMessageMutation } = useSendMessage();
  const { mutateAsync: sendMediaMessageMutation } = useSendMediaMessage();
  const { mutate: markAsRead } = useMarkMessagesAsRead(threadId);
  const { typingUsers, sendTypingEvent } = useChatSocket(threadId);

  const handleTextChange = (text: string) => {
    setInputText(text);
    sendTypingEvent(text.length > 0);
  };

  // Unpack messages correctly based on API response structure
  const rawMessages = (historyData as any)?.data?.messages || historyData?.messages || [];

  // Transform raw messages to UI components MessageItem format
  const messages: MessageItem[] = [...rawMessages]
    .sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    .map((msg: any) => ({
      id: msg.id,
      from: msg.senderId === myId ? 'me' : 'them',
      type: msg.contentType === 'TEXT' ? 'text' : msg.contentType.toLowerCase(),
      text: msg.contentType === 'TEXT' ? msg.contentUrlOrText : undefined,
      mediaUrl: msg.contentType !== 'TEXT' ? msg.contentUrlOrText : undefined,
      time: new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: msg.status === 'READ' ? 'read' : (msg.status === 'DELIVERED' ? 'delivered' : 'sent'),
    }));

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages.length, typingUsers.length]);

  useEffect(() => {
    if (threadId && rawMessages.some((m: any) => m.senderId !== myId && m.status !== 'READ')) {
      markAsRead();
    }
  }, [rawMessages, myId, threadId, markAsRead]);

  const handleSend = async (textOnly?: string) => {
    const content = textOnly || inputText.trim();
    if (!content && !mediaPreview) return;

    try {
      sendTypingEvent(false);

      if (mediaPreview && mediaPreview.uri) {
        await sendMediaMessageMutation({
          threadId,
          uri: mediaPreview.uri,
          mimeType: mediaPreview.mimeType || 'application/octet-stream',
          filename: mediaPreview.name || 'upload.bin',
        });
      } else {
        await sendMessageMutation({
          threadId,
          contentType: 'TEXT',
          contentUrlOrText: content,
        });
      }

      setInputText('');
      setMediaPreview(null);
      setShowAttachMenu(false);
    } catch (err: any) {
      appAlert('Failed to send message', err.message || 'Please try again.');
    }
  };

  const handleSimulateAttachment = async (type: 'image' | 'video' | 'document') => {
    setShowAttachMenu(false);
    try {
      if (type === 'image' || type === 'video') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        });
        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          setMediaPreview({
            type,
            name: asset.fileName || `media-${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
            url: asset.uri,
            uri: asset.uri,
            mimeType: asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
            size: 'Unknown size'
          } as any);
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'application/msword', 'text/plain'],
          copyToCacheDirectory: true
        });
        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          setMediaPreview({
            type: 'document',
            name: asset.name,
            url: asset.uri,
            uri: asset.uri,
            mimeType: asset.mimeType || 'application/pdf',
            size: 'Unknown size'
          } as any);
        }
      }
    } catch (e) {
      console.log('Picker error', e);
    }
  };

  
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Avatar.Text
            size={38}
            label={contactName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            style={styles.avatarBg}
            color={COLORS.emerald}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{contactName}</Text>
            <Text style={styles.headerStatus}>{contactRole}</Text>
          </View>

          <View style={styles.headerActions}>
            </View>
        </View>

        {/* Encrypted Notice Banner */}
        <View style={styles.encryptionNotice}>
          <Text style={styles.encryptionText}>
            Care team conversation · messages and attachments
          </Text>
        </View>

        {/* Message Thread */}
        <MessageList ref={scrollViewRef} messages={messages} />

        {typingUsers.length > 0 && (
          <View style={styles.typingIndicatorContainer}>
            <Text style={styles.typingText}>Typing...</Text>
          </View>
        )}

        {/* Input Bar */}
        <ChatInput
          inputText={inputText}
          setInputText={handleTextChange}
          mediaPreview={mediaPreview}
          setMediaPreview={setMediaPreview}
          onSend={() => handleSend()}
          onAttachPress={() => setShowAttachMenu(true)}
          onSendAudio={async (uri, durationMs) => {
            try {
              await sendMediaMessageMutation({
                threadId,
                uri,
                mimeType: voiceFileInfo().mimeType,
                filename: voiceFileInfo().name,
                durationMs
              });
            } catch (err: any) {
              appAlert('Failed to send voice message', err.message);
            }
          }}
        />

        {/* Attachment Options Drawer / Modal */}
        <AttachmentPicker
          visible={showAttachMenu}
          onClose={() => setShowAttachMenu(false)}
          onSelect={handleSimulateAttachment}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  backBtn: {
    paddingRight: SPACING.xs,
  },
  backIcon: {
    color: COLORS.textDark,
    fontSize: 28,
    fontWeight: '300',
  },
  avatarBg: {
    backgroundColor: COLORS.surfaceMuted,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.emerald,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
  headerStatus: {
    color: COLORS.emerald,
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  headerActionIcon: {
    fontSize: 16,
  },
  encryptionNotice: {
    backgroundColor: COLORS.surfaceMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  encryptionText: {
    color: COLORS.textBody,
    fontSize: 10,
    textAlign: 'center',
  },
  typingIndicatorContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bg,
  },
  typingText: {
    color: COLORS.emerald,
    fontSize: 12,
    fontStyle: 'italic',
  },
}));


