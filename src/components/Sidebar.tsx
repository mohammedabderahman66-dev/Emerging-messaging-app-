import React, { useState } from 'react';
import { 
  Search, 
  MessageSquarePlus, 
  MoreVertical, 
  CircleDot, 
  Pin, 
  VolumeX, 
  Check, 
  CheckCheck, 
  Users, 
  Moon, 
  Sun, 
  Settings as SettingsIcon,
  Volume2,
  Filter,
  X
} from 'lucide-react';
import { Chat, User, ThemeMode } from '../types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: User;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenNewChat: () => void;
  onOpenStatus: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onlineCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  currentUser,
  theme,
  onToggleTheme,
  onOpenNewChat,
  onOpenStatus,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  onlineCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [showMenu, setShowMenu] = useState(false);

  // Filter chats by search query and category
  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage?.text && chat.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'unread') {
      return chat.unreadCount > 0;
    }
    if (filterTab === 'groups') {
      return chat.isGroup;
    }
    return true;
  });

  return (
    <aside 
      id="whatsapp-sidebar"
      className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col h-full border-l transition-colors duration-200 select-none ${
        theme === 'dark' 
          ? 'bg-[#111b21] border-[#222d34] text-[#e9edef]' 
          : 'bg-[#ffffff] border-[#e9edef] text-[#111b21]'
      }`}
    >
      {/* Top Header */}
      <header 
        id="sidebar-header"
        className={`h-16 px-4 flex items-center justify-between border-b ${
          theme === 'dark' ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#e9edef]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="current-user-avatar-btn"
            onClick={onOpenSettings}
            className="relative group focus:outline-none"
            title="الملف الشخصي والإعدادات"
          >
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#00a884] transition"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#202c33] rounded-full" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold truncate max-w-[120px]">{currentUser.name}</h2>
            <p className="text-[11px] text-[#00a884] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
              {onlineCount > 1 ? `${onlineCount} متصلين الآن` : 'متصل بالخادم'}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-[#aebac1]">
          {/* Status / Stories icon */}
          <button
            id="status-stories-btn"
            onClick={onOpenStatus}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition relative focus:outline-none"
            title="الحالات (Stories)"
          >
            <CircleDot className="w-5 h-5 text-[#8696a0] hover:text-[#00a884]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00a884]" />
          </button>

          {/* New chat icon */}
          <button
            id="new-chat-btn"
            onClick={onOpenNewChat}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition focus:outline-none"
            title="محادثة جديدة"
          >
            <MessageSquarePlus className="w-5 h-5 text-[#8696a0] hover:text-[#00a884]" />
          </button>

          {/* Theme toggle icon */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition focus:outline-none"
            title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-[#8696a0] hover:text-[#f7c04a]" />
            ) : (
              <Moon className="w-5 h-5 text-[#54656f] hover:text-[#111b21]" />
            )}
          </button>

          {/* More menu dropdown */}
          <div className="relative">
            <button
              id="sidebar-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition focus:outline-none"
              title="خيارات إضافية"
            >
              <MoreVertical className="w-5 h-5 text-[#8696a0]" />
            </button>

            {showMenu && (
              <div 
                id="sidebar-dropdown-menu"
                className={`absolute left-0 mt-2 w-48 rounded-lg shadow-xl py-2 z-50 border text-sm ${
                  theme === 'dark' ? 'bg-[#233138] border-[#222d34] text-[#d1d7db]' : 'bg-white border-[#e9edef] text-[#111b21]'
                }`}
              >
                <button
                  onClick={() => { setShowMenu(false); onOpenNewChat(); }}
                  className="w-full text-right px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between"
                >
                  <span>مجموعة جديدة</span>
                  <Users className="w-4 h-4 text-[#8696a0]" />
                </button>
                <button
                  onClick={() => { setShowMenu(false); onToggleSound(); }}
                  className="w-full text-right px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between"
                >
                  <span>أصوات الإشعارات</span>
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#00a884]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#8696a0]" />
                  )}
                </button>
                <button
                  onClick={() => { setShowMenu(false); onOpenSettings(); }}
                  className="w-full text-right px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between"
                >
                  <span>الإعدادات</span>
                  <SettingsIcon className="w-4 h-4 text-[#8696a0]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar & Filter */}
      <div className="p-2.5 space-y-2">
        <div 
          className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
            theme === 'dark' 
              ? 'bg-[#202c33] border-transparent focus-within:border-[#00a884]' 
              : 'bg-[#f0f2f5] border-transparent focus-within:border-[#00a884]'
          }`}
        >
          <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
          <input
            id="chat-search-input"
            type="text"
            placeholder="بحث أو بدء دردشة جديدة"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-[#8696a0]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-[#8696a0] hover:text-[#00a884]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1 text-xs">
          <button
            id="filter-all-btn"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-full font-medium transition whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-[#00a884] text-white'
                : theme === 'dark'
                  ? 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                  : 'bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]'
            }`}
          >
            الكل
          </button>
          <button
            id="filter-unread-btn"
            onClick={() => setFilterTab('unread')}
            className={`px-3 py-1 rounded-full font-medium transition whitespace-nowrap flex items-center gap-1 ${
              filterTab === 'unread'
                ? 'bg-[#00a884] text-white'
                : theme === 'dark'
                  ? 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                  : 'bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]'
            }`}
          >
            <span>غير مقروءة</span>
            {chats.some(c => c.unreadCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-[#00a884]" />
            )}
          </button>
          <button
            id="filter-groups-btn"
            onClick={() => setFilterTab('groups')}
            className={`px-3 py-1 rounded-full font-medium transition whitespace-nowrap flex items-center gap-1 ${
              filterTab === 'groups'
                ? 'bg-[#00a884] text-white'
                : theme === 'dark'
                  ? 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                  : 'bg-[#f0f2f5] text-[#54656f] hover:text-[#111b21]'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>المجموعات</span>
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div 
        id="chats-scroll-list"
        className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/5"
      >
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-[#8696a0]">
            <Filter className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">لا توجد محادثات تطابق بحثك</p>
            <p className="text-xs mt-1 text-[#8696a0]/70">جرب البحث بكلمات أخرى أو ابدأ محادثة جديدة</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isTyping = chat.typingUsers && chat.typingUsers.length > 0;

            return (
              <div
                key={chat.id}
                id={`chat-item-${chat.id}`}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors relative group ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-[#2a3942]'
                      : 'bg-[#f0f2f5]'
                    : theme === 'dark'
                      ? 'hover:bg-[#202c33]'
                      : 'hover:bg-[#f5f6f6]'
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {chat.online && !chat.isGroup && (
                    <span 
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 rounded-full" 
                      style={{ borderColor: theme === 'dark' ? '#111b21' : '#ffffff' }}
                      title="متصل الآن"
                    />
                  )}
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold truncate text-inherit flex items-center gap-1.5">
                      <span>{chat.name}</span>
                      {chat.isGroup && (
                        <Users className="w-3.5 h-3.5 text-[#8696a0] flex-shrink-0" />
                      )}
                    </h3>
                    <span className="text-[11px] text-[#8696a0] flex-shrink-0">
                      {chat.lastMessage?.timestamp || 'الآن'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#8696a0]">
                    <div className="truncate flex items-center gap-1 max-w-[210px]">
                      {isTyping ? (
                        <span className="text-[#00a884] font-medium flex items-center gap-1 animate-pulse">
                          <span>يكتب الآن...</span>
                        </span>
                      ) : (
                        <>
                          {chat.lastMessage && chat.lastMessage.senderId === 'user-me' && (
                            <span className="flex-shrink-0">
                              {chat.lastMessage.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                              ) : chat.lastMessage.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                              )}
                            </span>
                          )}

                          <span className="truncate">
                            {chat.lastMessage ? (
                              chat.lastMessage.type === 'image' ? (
                                '📷 صورة'
                              ) : chat.lastMessage.type === 'audio' ? (
                                '🎤 رسالة صوتية'
                              ) : chat.lastMessage.type === 'document' ? (
                                `📄 ${chat.lastMessage.fileName || 'ملف مرفق'}`
                              ) : (
                                chat.lastMessage.text
                              )
                            ) : (
                              <span className="italic text-gray-400">انقر لبدء المحادثة</span>
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {chat.muted && <VolumeX className="w-3.5 h-3.5 text-[#8696a0]" />}
                      {chat.pinned && <Pin className="w-3.5 h-3.5 text-[#8696a0] rotate-45" />}
                      {chat.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-[#00a884] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
