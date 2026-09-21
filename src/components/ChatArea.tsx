import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  Search, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Mic, 
  Send, 
  Check, 
  CheckCheck, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  CornerUpLeft, 
  Star, 
  Heart, 
  X, 
  Play, 
  Pause, 
  Lock, 
  Square,
  Users
} from 'lucide-react';
import { Chat, Message, User, ThemeMode } from '../types';
import { startAudioRecording } from '../utils/audio';

interface ChatAreaProps {
  chat: Chat | null;
  messages: Message[];
  currentUser: User;
  theme: ThemeMode;
  onSendMessage: (payload: {
    text?: string;
    type?: 'text' | 'image' | 'audio' | 'document';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: string;
    audioDuration?: number;
    replyTo?: { id: string; text: string; senderName: string };
  }) => void;
  onTyping: (isTyping: boolean) => void;
  onReact: (messageId: string, emoji: string) => void;
  onStar: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onOpenInfo: () => void;
  onBackToSidebar?: () => void;
}

const COMMON_EMOJIS = ['😀', '😂', '😍', '❤️', '👍', '🙏', '🔥', '🎉', '☕', '🌿', '✨', '🌹', '👏', '🤩', '😎', '🤝'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  currentUser,
  theme,
  onSendMessage,
  onTyping,
  onReact,
  onStar,
  onDelete,
  onStartCall,
  onOpenInfo,
  onBackToSidebar,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordSessionRef = useRef<{ stop: () => Promise<{ blob: Blob; url: string; duration: number }>; cancel: () => void } | null>(null);
  const recordIntervalRef = useRef<number | null>(null);

  // Voice note playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioIntervalRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [chat?.id]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  // Send text message
  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage({
      text: inputText.trim(),
      type: 'text',
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text || (replyingTo.type === 'image' ? 'صورة' : 'ملف'),
        senderName: replyingTo.senderName,
      } : undefined,
    });
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    onTyping(false);
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onSendMessage({
          type: 'image',
          mediaUrl: url,
          text: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
    setShowAttachMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Document upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      onSendMessage({
        type: 'document',
        fileName: file.name,
        fileSize: sizeStr,
      });
    }
    setShowAttachMenu(false);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  // Start voice recording
  const handleStartRecord = async () => {
    try {
      const session = await startAudioRecording();
      recordSessionRef.current = session;
      setIsRecording(true);
      setRecordingDuration(0);

      recordIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  // Stop & send voice recording
  const handleStopRecord = async () => {
    if (!recordSessionRef.current) return;
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);

    const result = await recordSessionRef.current.stop();
    setIsRecording(false);

    onSendMessage({
      type: 'audio',
      mediaUrl: result.url || undefined,
      audioDuration: result.duration,
    });
  };

  // Cancel voice recording
  const handleCancelRecord = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    recordSessionRef.current?.cancel();
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Toggle voice playback simulation
  const togglePlayAudio = (messageId: string, duration: number = 10) => {
    if (playingAudioId === messageId) {
      setPlayingAudioId(null);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setAudioProgress(0);
    } else {
      setPlayingAudioId(messageId);
      setAudioProgress(0);
      const totalSteps = duration * 10;
      let step = 0;
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);

      audioIntervalRef.current = window.setInterval(() => {
        step++;
        setAudioProgress((step / totalSteps) * 100);
        if (step >= totalSteps) {
          if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
          setPlayingAudioId(null);
          setAudioProgress(0);
        }
      }, 100);
    }
  };

  // Filter messages if search is active
  const displayedMessages = chatSearchQuery.trim()
    ? messages.filter((m) => m.text?.toLowerCase().includes(chatSearchQuery.toLowerCase()))
    : messages;

  if (!chat) {
    return (
      <main 
        id="empty-chat-welcome"
        className={`flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center border-b-[6px] border-[#00a884] ${
          theme === 'dark' ? 'bg-[#222e35] text-[#8696a0]' : 'bg-[#f0f2f5] text-[#54656f]'
        }`}
      >
        <div className="max-w-md space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-[#00a884]/10 flex items-center justify-center text-[#00a884]">
            <Lock className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-inherit">واتساب ويب للكمبيوتر</h2>
          <p className="text-sm leading-relaxed text-[#8696a0]">
            أرسل واستقبل الرسائل بدون الحاجة لإبقاء هاتفك متصلاً بالإنترنت.
            <br />
            استخدم واتساب على ما يصل إلى 4 أجهزة مرتبطة وهاتف واحد في الوقت نفسه.
          </p>
          <div className="pt-6 flex items-center justify-center gap-2 text-xs text-[#8696a0]">
            <Lock className="w-3.5 h-3.5" />
            <span>رسائلك الشخصية مشفرة تماماً بين الطرفين</span>
          </div>
        </div>
      </main>
    );
  }

  const isTyping = chat.typingUsers && chat.typingUsers.length > 0;

  return (
    <main 
      id="active-chat-area"
      className="flex-1 flex flex-col h-full overflow-hidden relative"
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip"
        className="hidden"
        onChange={handleDocUpload}
      />

      {/* Header */}
      <header 
        id="chat-header"
        className={`h-16 px-4 flex items-center justify-between border-b z-20 transition-colors ${
          theme === 'dark' ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#e9edef]'
        }`}
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenInfo}>
          {onBackToSidebar && (
            <button 
              onClick={(e) => { e.stopPropagation(); onBackToSidebar(); }}
              className="md:hidden p-1 rounded-full text-[#8696a0]"
            >
              <CornerUpLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <img 
              src={chat.avatar} 
              alt={chat.name} 
              className="w-10 h-10 rounded-full object-cover"
            />
            {chat.online && !chat.isGroup && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#202c33] rounded-full" />
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold truncate flex items-center gap-1.5 text-inherit">
              <span>{chat.name}</span>
              {chat.isGroup && <Users className="w-3.5 h-3.5 text-[#8696a0]" />}
            </h2>
            <p className="text-xs text-[#8696a0] truncate max-w-[200px] sm:max-w-xs">
              {isTyping ? (
                <span className="text-[#00a884] font-medium animate-pulse">يكتب الآن...</span>
              ) : chat.isGroup ? (
                'انقر لمعلومات المجموعة'
              ) : chat.online ? (
                <span className="text-[#00a884]">متصل الآن</span>
              ) : (
                chat.lastSeen || 'آخر ظهور اليوم'
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 text-[#8696a0]">
          <button
            id="audio-call-btn"
            onClick={() => onStartCall('voice')}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
            title="مكالمة صوتية"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            id="video-call-btn"
            onClick={() => onStartCall('video')}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
            title="مكالمة فيديو"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            id="toggle-search-btn"
            onClick={() => setShowSearchInChat(!showSearchInChat)}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
            title="بحث في المحادثة"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            id="chat-info-btn"
            onClick={onOpenInfo}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
            title="معلومات المحادثة"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Search in chat banner */}
      {showSearchInChat && (
        <div 
          id="chat-search-bar"
          className={`px-4 py-2 flex items-center gap-2 border-b z-10 ${
            theme === 'dark' ? 'bg-[#182229] border-[#222d34]' : 'bg-[#f7f8fa] border-[#e9edef]'
          }`}
        >
          <Search className="w-4 h-4 text-[#8696a0]" />
          <input
            type="text"
            placeholder="البحث في الرسائل..."
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm"
          />
          {chatSearchQuery && (
            <button onClick={() => setChatSearchQuery('')} className="text-[#8696a0] hover:text-inherit">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setShowSearchInChat(false)} className="text-xs text-[#00a884] font-medium mr-2">
            إغلاق
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div 
        id="messages-scroll-area"
        className={`flex-1 overflow-y-auto p-4 space-y-3 ${
          theme === 'dark' ? 'wa-chat-bg-dark text-[#e9edef]' : 'wa-chat-bg-light text-[#111b21]'
        }`}
      >
        {/* Encryption notice */}
        <div className="flex justify-center my-2">
          <div 
            className={`max-w-md px-4 py-2 rounded-lg text-center text-xs flex items-center gap-2 shadow-sm ${
              theme === 'dark' ? 'bg-[#182229] text-[#ffd279]' : 'bg-[#ffeecd] text-[#54656f]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>الرسائل والمكالمات مشفرة تماماً بين الطرفين. لا أحد خارج هذه المحادثة يمكنه قراءتها أو الاستماع إليها.</span>
          </div>
        </div>

        {/* Date badge */}
        <div className="flex justify-center my-3">
          <span 
            className={`px-3 py-1 rounded-md text-[11px] font-medium uppercase tracking-wide shadow-sm ${
              theme === 'dark' ? 'bg-[#182229] text-[#8696a0]' : 'bg-white text-[#54656f]'
            }`}
          >
            اليوم
          </span>
        </div>

        {/* Message items */}
        {displayedMessages.map((msg) => {
          const isMe = msg.senderId === 'user-me' || msg.senderId === currentUser.id;
          const isHovered = hoveredMessageId === msg.id;

          return (
            <div
              key={msg.id}
              id={`message-bubble-${msg.id}`}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`flex items-end gap-1.5 group relative ${isMe ? 'justify-start flex-row-reverse' : 'justify-start'}`}
            >
              {/* Message Bubble Container */}
              <div 
                className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-lg px-3 py-2 text-sm shadow-sm transition-all ${
                  isMe
                    ? theme === 'dark'
                      ? 'bg-[#005c4b] text-[#e9edef] rounded-tl-none'
                      : 'bg-[#d9fdd3] text-[#111b21] rounded-tl-none'
                    : theme === 'dark'
                      ? 'bg-[#202c33] text-[#e9edef] rounded-tr-none'
                      : 'bg-[#ffffff] text-[#111b21] rounded-tr-none'
                }`}
              >
                {/* Group sender name */}
                {chat.isGroup && !isMe && (
                  <p className="text-xs font-semibold text-[#00a884] mb-1">
                    {msg.senderName}
                  </p>
                )}

                {/* Reply To Reference Bubble */}
                {msg.replyTo && (
                  <div 
                    className={`mb-2 p-2 rounded-md border-r-4 text-xs ${
                      isMe 
                        ? theme === 'dark' ? 'bg-[#025141] border-[#00a884]' : 'bg-[#c6f8be] border-[#008069]'
                        : theme === 'dark' ? 'bg-[#182229] border-[#00a884]' : 'bg-[#f0f2f5] border-[#008069]'
                    }`}
                  >
                    <p className="font-semibold text-[#00a884]">{msg.replyTo.senderName}</p>
                    <p className="truncate text-inherit/80">{msg.replyTo.text}</p>
                  </div>
                )}

                {/* Message Body by Type */}
                {msg.type === 'text' && (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.text}
                  </p>
                )}

                {msg.type === 'image' && (
                  <div className="space-y-1">
                    <img
                      src={msg.mediaUrl}
                      alt={msg.text || 'صورة'}
                      onClick={() => setPreviewImage(msg.mediaUrl || null)}
                      className="rounded-md max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition"
                    />
                    {msg.text && (
                      <p className="whitespace-pre-wrap break-words pt-1">{msg.text}</p>
                    )}
                  </div>
                )}

                {msg.type === 'audio' && (
                  <div className="flex items-center gap-3 py-1 min-w-[200px]">
                    <button
                      onClick={() => togglePlayAudio(msg.id, msg.audioDuration || 10)}
                      className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#008f6f] transition"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      {/* Audio waveform / progress bar */}
                      <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#00a884] h-full transition-all duration-100"
                          style={{ width: `${playingAudioId === msg.id ? audioProgress : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-[#8696a0]">
                        <span>0:{String(msg.audioDuration || 10).padStart(2, '0')}</span>
                        <Mic className="w-3.5 h-3.5 text-[#00a884]" />
                      </div>
                    </div>
                  </div>
                )}

                {msg.type === 'document' && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-black/5 dark:bg-white/5 min-w-[220px]">
                    <div className="w-10 h-10 rounded-lg bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{msg.fileName || 'ملف مرفق'}</p>
                      <p className="text-[11px] text-[#8696a0]">{msg.fileSize || '1.2 MB'}</p>
                    </div>
                    <button 
                      className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#8696a0]"
                      title="تحميل الملف"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Footer: Time & Status */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[#8696a0]">
                  {msg.starred && <Star className="w-3 h-3 fill-current text-[#f7c04a]" />}
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-4 h-4 text-[#8696a0]" />
                      ) : (
                        <Check className="w-4 h-4 text-[#8696a0]" />
                      )}
                    </span>
                  )}
                </div>

                {/* Reactions Pill Display */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 bg-[#233138] dark:bg-[#202c33] border border-black/10 dark:border-white/10 rounded-full px-1.5 py-0.5 shadow-sm text-xs">
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <span key={emoji} className="flex items-center gap-0.5">
                        <span>{emoji}</span>
                        {users.length > 1 && <span className="text-[10px] text-[#8696a0]">{users.length}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover Action Menu */}
              {isHovered && (
                <div 
                  className={`flex items-center gap-1 px-1.5 py-1 rounded-full shadow-md text-[#8696a0] z-10 transition-all ${
                    theme === 'dark' ? 'bg-[#233138] border border-[#222d34]' : 'bg-white border border-[#e9edef]'
                  }`}
                >
                  <button
                    onClick={() => onReact(msg.id, '❤️')}
                    className="p-1 hover:text-red-500 rounded-full hover:bg-black/5"
                    title="تفاعل بقلب"
                  >
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 hover:text-[#00a884] rounded-full hover:bg-black/5"
                    title="رد"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onStar(msg.id)}
                    className="p-1 hover:text-[#f7c04a] rounded-full hover:bg-black/5"
                    title="تمييز بنجمة"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  {isMe && (
                    <button
                      onClick={() => onDelete(msg.id)}
                      className="p-1 hover:text-red-500 rounded-full hover:bg-black/5"
                      title="حذف الرسالة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quoted reply banner */}
      {replyingTo && (
        <div 
          id="reply-preview-banner"
          className={`px-4 py-2 border-t flex items-center justify-between z-10 ${
            theme === 'dark' ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#e9edef]'
          }`}
        >
          <div className="border-r-4 border-[#00a884] pr-2 text-xs">
            <span className="font-semibold text-[#00a884] block">رد على {replyingTo.senderName}</span>
            <p className="truncate text-[#8696a0] max-w-sm">{replyingTo.text || 'مرفق'}</p>
          </div>
          <button 
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full text-[#8696a0] hover:text-inherit"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <footer 
        id="chat-input-bar"
        className={`px-3 py-2 border-t flex items-center gap-2 relative z-20 transition-colors ${
          theme === 'dark' ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#e9edef]'
        }`}
      >
        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div 
            id="emoji-picker-popover"
            className={`absolute bottom-16 right-4 p-3 rounded-xl shadow-2xl border grid grid-cols-8 gap-2 z-50 ${
              theme === 'dark' ? 'bg-[#233138] border-[#222d34]' : 'bg-white border-[#e9edef]'
            }`}
          >
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { setInputText((prev) => prev + emoji); setShowEmojiPicker(false); }}
                className="text-xl p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Attachment menu popup */}
        {showAttachMenu && (
          <div 
            id="attachment-menu-popover"
            className={`absolute bottom-16 right-12 p-2 rounded-xl shadow-2xl border space-y-1 z-50 text-sm ${
              theme === 'dark' ? 'bg-[#233138] border-[#222d34] text-[#e9edef]' : 'bg-white border-[#e9edef] text-[#111b21]'
            }`}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-right px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span>الصور ومقاطع الفيديو</span>
            </button>
            <button
              onClick={() => docInputRef.current?.click()}
              className="w-full text-right px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span>مستند</span>
            </button>
          </div>
        )}

        {isRecording ? (
          /* Active Recording UI */
          <div className="flex-1 flex items-center justify-between px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-sm font-semibold text-red-500">
                0:{String(recordingDuration).padStart(2, '0')}
              </span>
              <span className="text-xs text-[#8696a0]">جاري تسجيل رسالة صوتية...</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelRecord}
                className="p-1.5 rounded-full hover:bg-red-500/20 text-red-500 transition"
                title="إلغاء التسجيل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleStopRecord}
                className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#008f6f] transition"
                title="إرسال التسجيل"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Message Input */
          <>
            <button
              id="emoji-picker-btn"
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }}
              className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] transition"
              title="رموز تعبيرية"
            >
              <Smile className="w-6 h-6" />
            </button>

            <button
              id="attachment-menu-btn"
              onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }}
              className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] transition"
              title="إرفاق ملف أو صورة"
            >
              <Paperclip className="w-6 h-6" />
            </button>

            <div 
              className={`flex-1 flex items-center px-4 py-2 rounded-lg border text-sm transition-colors ${
                theme === 'dark' 
                  ? 'bg-[#2a3942] border-transparent focus-within:border-[#00a884]' 
                  : 'bg-white border-transparent focus-within:border-[#00a884]'
              }`}
            >
              <input
                id="message-text-input"
                type="text"
                placeholder="اكتب رسالة..."
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none text-sm placeholder:text-[#8696a0]"
              />
            </div>

            {inputText.trim() ? (
              <button
                id="send-message-btn"
                onClick={handleSend}
                className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#008f6f] transition flex-shrink-0"
                title="إرسال"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            ) : (
              <button
                id="mic-record-btn"
                onClick={handleStartRecord}
                className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 transition flex-shrink-0"
                title="تسجيل رسالة صوتية"
              >
                <Mic className="w-6 h-6" />
              </button>
            )}
          </>
        )}
      </footer>

      {/* Lightbox for previewing images */}
      {previewImage && (
        <div 
          id="image-preview-modal"
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 left-4 p-2 text-white/80 hover:text-white"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={previewImage} 
            alt="معاينة الصورة" 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}
    </main>
  );
};
