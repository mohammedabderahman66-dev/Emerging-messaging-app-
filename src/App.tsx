import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { CallModal } from './components/CallModal';
import { StatusModal } from './components/StatusModal';
import { NewChatModal } from './components/NewChatModal';
import { ContactInfoDrawer } from './components/ContactInfoDrawer';
import { SettingsModal } from './components/SettingsModal';
import { Chat, Message, User, ThemeMode, CallSession } from './types';
import { sounds } from './utils/audio';

const DEFAULT_USER: User = {
  id: 'user-me',
  name: 'محمد عبدالرحمن',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  about: 'لا حول ولا قوة إلا بالله العلي العظيم',
  phone: '+966 50 000 1122',
  online: true,
};

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('wa_theme') as ThemeMode) || 'dark';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('wa_sound') !== 'false';
  });

  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);

  // Modals & Panels
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showContactInfo, setShowContactInfo] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Persist theme & sound
  useEffect(() => {
    localStorage.setItem('wa_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('wa_sound', String(soundEnabled));
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Initial HTTP Fetch for fast render
  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.chats) {
          setChats(data.chats);
          if (!activeChatId && data.chats.length > 0) {
            // Select first chat on desktop by default
            if (window.innerWidth >= 768) {
              setActiveChatId(data.chats[0].id);
            }
          }
        }
        if (data.messages) {
          setMessages(data.messages);
        }
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        }
      })
      .catch((err) => {
        console.warn('Initial fetch error:', err);
      });
  }, []);

  // WebSocket Connection
  useEffect(() => {
    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to WhatsApp WebSocket server');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          switch (type) {
            case 'init': {
              if (payload.chats) setChats(payload.chats);
              if (payload.messages) setMessages(payload.messages);
              if (payload.onlineCount) setOnlineCount(payload.onlineCount);
              break;
            }

            case 'presence:update': {
              setOnlineCount(payload.onlineCount || 1);
              break;
            }

            case 'message:new': {
              const newMsg: Message = payload.message;
              const targetChatId = newMsg.chatId;

              setMessages((prev) => {
                const existing = prev[targetChatId] || [];
                // Prevent duplicate
                if (existing.some((m) => m.id === newMsg.id)) return prev;
                return {
                  ...prev,
                  [targetChatId]: [...existing, newMsg],
                };
              });

              // Play sound
              if (newMsg.senderId === 'user-me' || newMsg.senderId === currentUser.id) {
                sounds.playSent();
              } else {
                sounds.playReceived();
              }

              // Update chats list
              setChats((prevChats) => {
                const chatIndex = prevChats.findIndex((c) => c.id === targetChatId);
                if (chatIndex > -1) {
                  const updatedChat = { ...prevChats[chatIndex] };
                  updatedChat.lastMessage = newMsg;
                  if (targetChatId !== activeChatId && newMsg.senderId !== currentUser.id) {
                    updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
                  }
                  const remaining = prevChats.filter((c) => c.id !== targetChatId);
                  return [updatedChat, ...remaining];
                }
                return prevChats;
              });

              break;
            }

            case 'message:status': {
              const { messageId, chatId, status } = payload;
              setMessages((prev) => {
                const chatMsgs = prev[chatId];
                if (!chatMsgs) return prev;
                return {
                  ...prev,
                  [chatId]: chatMsgs.map((m) => (m.id === messageId ? { ...m, status } : m)),
                };
              });
              break;
            }

            case 'message:read': {
              const { chatId } = payload;
              setMessages((prev) => {
                const chatMsgs = prev[chatId];
                if (!chatMsgs) return prev;
                return {
                  ...prev,
                  [chatId]: chatMsgs.map((m) => (m.senderId !== currentUser.id ? { ...m, status: 'read' } : m)),
                };
              });
              setChats((prev) =>
                prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
              );
              break;
            }

            case 'message:updated': {
              const { chatId, message } = payload;
              setMessages((prev) => {
                const chatMsgs = prev[chatId];
                if (!chatMsgs) return prev;
                return {
                  ...prev,
                  [chatId]: chatMsgs.map((m) => (m.id === message.id ? message : m)),
                };
              });
              break;
            }

            case 'message:deleted': {
              const { chatId, messageId } = payload;
              setMessages((prev) => {
                const chatMsgs = prev[chatId];
                if (!chatMsgs) return prev;
                return {
                  ...prev,
                  [chatId]: chatMsgs.filter((m) => m.id !== messageId),
                };
              });
              break;
            }

            case 'chat:typing': {
              const { chatId, userName, isTyping } = payload;
              setChats((prev) =>
                prev.map((c) => {
                  if (c.id === chatId) {
                    const currentTyping = c.typingUsers || [];
                    const nextTyping = isTyping
                      ? Array.from(new Set([...currentTyping, userName]))
                      : currentTyping.filter((u) => u !== userName);
                    return { ...c, typingUsers: nextTyping };
                  }
                  return c;
                })
              );
              break;
            }

            case 'chat:created': {
              const { chat } = payload;
              setChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)]);
              setMessages((prev) => ({ ...prev, [chat.id]: [] }));
              setActiveChatId(chat.id);
              break;
            }
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWs();
        }, 2000);
      };

      socketRef.current = ws;
    }

    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
    };
  }, [currentUser.id, activeChatId]);

  // Mark chat as read when opened
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowContactInfo(false);

    // Send read event
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message:read',
          payload: { chatId, userId: currentUser.id },
        })
      );
    }

    // Local unread reset
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Send message
  const handleSendMessage = (payload: {
    text?: string;
    type?: 'text' | 'image' | 'audio' | 'document';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: string;
    audioDuration?: number;
    replyTo?: { id: string; text: string; senderName: string };
  }) => {
    if (!activeChatId) return;

    const messagePayload = {
      message: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        chatId: activeChatId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        text: payload.text,
        type: payload.type || 'text',
        mediaUrl: payload.mediaUrl,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        audioDuration: payload.audioDuration,
        timestamp: new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
        status: 'sent',
        replyTo: payload.replyTo,
      },
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message:send',
          payload: messagePayload,
        })
      );
    }
  };

  // Typing indicator
  const handleTyping = (isTyping: boolean) => {
    if (!activeChatId) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat:typing',
          payload: {
            chatId: activeChatId,
            userId: currentUser.id,
            userName: currentUser.name,
            isTyping,
          },
        })
      );
    }
  };

  // React to message
  const handleReact = (messageId: string, emoji: string) => {
    if (!activeChatId) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message:react',
          payload: {
            chatId: activeChatId,
            messageId,
            emoji,
            userName: currentUser.name,
          },
        })
      );
    }
  };

  // Star message
  const handleStar = (messageId: string) => {
    if (!activeChatId) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message:star',
          payload: { chatId: activeChatId, messageId },
        })
      );
    }
  };

  // Delete message
  const handleDelete = (messageId: string) => {
    if (!activeChatId) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message:delete',
          payload: { chatId: activeChatId, messageId },
        })
      );
    }
  };

  // Create new chat
  const handleCreateChat = (chatData: {
    name: string;
    isGroup: boolean;
    phone?: string;
    about?: string;
  }) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat:create',
          payload: chatData,
        })
      );
    }
  };

  // Start Call
  const handleStartCall = (type: 'voice' | 'video') => {
    const activeChat = chats.find((c) => c.id === activeChatId);
    if (!activeChat) return;

    setActiveCall({
      active: true,
      chatId: activeChat.id,
      contactName: activeChat.name,
      contactAvatar: activeChat.avatar,
      type,
      status: 'calling',
      duration: 0,
      isMuted: false,
      isVideoEnabled: type === 'video',
    });
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  const handleClearChat = () => {
    if (!activeChatId) return;
    setMessages((prev) => ({ ...prev, [activeChatId]: [] }));
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, lastMessage: undefined } : c))
    );
    setShowContactInfo(false);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeMessages = activeChatId ? messages[activeChatId] || [] : [];

  return (
    <div 
      id="whatsapp-app-root"
      dir="rtl"
      className={`w-screen h-screen flex overflow-hidden select-none font-['Cairo',system-ui,sans-serif] ${
        theme === 'dark' ? 'bg-[#0c1317] text-[#e9edef]' : 'bg-[#d1d7db] text-[#111b21]'
      }`}
    >
      {/* Top green accent bar like authentic WhatsApp Web */}
      <div 
        className="fixed top-0 left-0 right-0 h-32 bg-[#00a884] dark:bg-[#00a884]/20 -z-10" 
      />

      {/* Main Container */}
      <div className="w-full h-full max-w-[1700px] mx-auto flex shadow-2xl overflow-hidden relative">
        {/* Sidebar */}
        <div 
          className={`h-full ${
            activeChatId ? 'hidden md:flex' : 'flex w-full md:w-auto'
          }`}
        >
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            currentUser={currentUser}
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            onOpenNewChat={() => setShowNewChatModal(true)}
            onOpenStatus={() => setShowStatusModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onlineCount={onlineCount}
          />
        </div>

        {/* Active Chat Area */}
        <div 
          className={`h-full flex-1 flex ${
            !activeChatId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ChatArea
            chat={activeChat}
            messages={activeMessages}
            currentUser={currentUser}
            theme={theme}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onReact={handleReact}
            onStar={handleStar}
            onDelete={handleDelete}
            onStartCall={handleStartCall}
            onOpenInfo={() => setShowContactInfo(!showContactInfo)}
            onBackToSidebar={() => setActiveChatId(null)}
          />

          {/* Contact Details Drawer */}
          {showContactInfo && activeChat && (
            <ContactInfoDrawer
              chat={activeChat}
              messages={activeMessages}
              theme={theme}
              onClose={() => setShowContactInfo(false)}
              onStartCall={handleStartCall}
              onClearChat={handleClearChat}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showStatusModal && (
        <StatusModal
          currentUser={currentUser}
          theme={theme}
          onClose={() => setShowStatusModal(false)}
        />
      )}

      {showNewChatModal && (
        <NewChatModal
          theme={theme}
          onClose={() => setShowNewChatModal(false)}
          onCreateChat={handleCreateChat}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          user={currentUser}
          theme={theme}
          soundEnabled={soundEnabled}
          onUpdateUser={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {activeCall && (
        <CallModal
          call={activeCall}
          onEndCall={handleEndCall}
          onToggleMute={() => setActiveCall((prev) => prev ? { ...prev, isMuted: !prev.isMuted } : null)}
          onToggleVideo={() => setActiveCall((prev) => prev ? { ...prev, isVideoEnabled: !prev.isVideoEnabled } : null)}
        />
      )}
    </div>
  );
}
