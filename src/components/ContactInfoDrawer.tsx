import React from 'react';
import { 
  X, 
  Phone, 
  Video, 
  Bell, 
  Shield, 
  Users, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Slash,
  Clock
} from 'lucide-react';
import { Chat, ThemeMode, Message } from '../types';

interface ContactInfoDrawerProps {
  chat: Chat;
  messages: Message[];
  theme: ThemeMode;
  onClose: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onClearChat: () => void;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({
  chat,
  messages,
  theme,
  onClose,
  onStartCall,
  onClearChat,
}) => {
  const mediaMessages = messages.filter((m) => m.type === 'image' && m.mediaUrl);
  const docMessages = messages.filter((m) => m.type === 'document');

  return (
    <aside 
      id="contact-info-drawer"
      className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col h-full border-r overflow-y-auto transition-colors duration-200 select-none ${
        theme === 'dark' ? 'bg-[#111b21] border-[#222d34] text-[#e9edef]' : 'bg-[#ffffff] border-[#e9edef] text-[#111b21]'
      }`}
    >
      {/* Header */}
      <div 
        className={`h-16 px-4 flex items-center justify-between border-b ${
          theme === 'dark' ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#e9edef]'
        }`}
      >
        <h2 className="text-sm font-semibold">
          {chat.isGroup ? 'معلومات المجموعة' : 'معلومات جهة الاتصال'}
        </h2>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#8696a0]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex flex-col items-center border-b border-black/5 dark:border-white/5">
        <img
          src={chat.avatar}
          alt={chat.name}
          className="w-32 h-32 rounded-full object-cover shadow-lg mb-4"
        />
        <h3 className="text-xl font-bold text-center">{chat.name}</h3>
        {chat.phone && (
          <p className="text-sm text-[#8696a0] mt-1" dir="ltr">{chat.phone}</p>
        )}

        {/* Quick Action buttons */}
        <div className="flex items-center gap-6 mt-6">
          <button
            onClick={() => onStartCall('voice')}
            className="flex flex-col items-center gap-1.5 text-xs text-[#00a884] hover:opacity-80 transition"
          >
            <div className="w-10 h-10 rounded-full bg-[#00a884]/10 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <span>صوتي</span>
          </button>

          <button
            onClick={() => onStartCall('video')}
            className="flex flex-col items-center gap-1.5 text-xs text-[#00a884] hover:opacity-80 transition"
          >
            <div className="w-10 h-10 rounded-full bg-[#00a884]/10 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <span>فيديو</span>
          </button>
        </div>
      </div>

      {/* About & Phone */}
      <div className="p-4 border-b border-black/5 dark:border-white/5 space-y-3">
        <div>
          <span className="text-xs text-[#8696a0] font-medium">الوصف / الحالة</span>
          <p className="text-sm mt-0.5 leading-relaxed">{chat.about || 'متاح للتواصل على واتساب'}</p>
        </div>
        {chat.isGroup && (
          <div>
            <span className="text-xs text-[#8696a0] font-medium">تاريخ الإنشاء</span>
            <p className="text-xs text-[#8696a0] mt-0.5">{chat.createdAt || '2024'}</p>
          </div>
        )}
      </div>

      {/* Media & Docs Section */}
      <div className="p-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#8696a0]">
            الوسائط والمستندات ({mediaMessages.length + docMessages.length})
          </span>
        </div>

        {mediaMessages.length === 0 && docMessages.length === 0 ? (
          <p className="text-xs text-[#8696a0] italic py-2">لا توجد وسائط تم تبادلها بعد</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {mediaMessages.slice(0, 6).map((m) => (
              <img
                key={m.id}
                src={m.mediaUrl}
                alt="وسائط"
                className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-90 transition"
              />
            ))}
          </div>
        )}
      </div>

      {/* Encryption & Security info */}
      <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#00a884] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-semibold">التشفير التام</h4>
          <p className="text-xs text-[#8696a0] mt-0.5 leading-relaxed">
            الرسائل والمكالمات مشفرة تماماً بين الطرفين. انقر للتحقق من مفاتيح الأمان.
          </p>
        </div>
      </div>

      {/* Danger Actions */}
      <div className="p-4 space-y-2">
        <button
          onClick={onClearChat}
          className="w-full py-2.5 px-3 text-right text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>مسح محتوى الدردشة</span>
        </button>
      </div>
    </aside>
  );
};
