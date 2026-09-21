import React, { useState } from 'react';
import { X, Users, UserPlus, Phone, Search } from 'lucide-react';
import { ThemeMode } from '../types';

interface NewChatModalProps {
  theme: ThemeMode;
  onClose: () => void;
  onCreateChat: (chatData: {
    name: string;
    isGroup: boolean;
    phone?: string;
    about?: string;
  }) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  theme,
  onClose,
  onCreateChat,
}) => {
  const [isGroup, setIsGroup] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateChat({
      name: name.trim(),
      isGroup,
      phone: phone.trim() || undefined,
      about: about.trim() || undefined,
    });
    onClose();
  };

  return (
    <div 
      id="new-chat-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#111b21] border-[#222d34] text-[#e9edef]' : 'bg-white border-[#e9edef] text-[#111b21]'
        }`}
      >
        {/* Header */}
        <div 
          className={`h-16 px-6 flex items-center justify-between border-b ${
            theme === 'dark' ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#008069] text-white'
          }`}
        >
          <h2 className="text-base font-bold flex items-center gap-2">
            {isGroup ? <Users className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            <span>{isGroup ? 'إنشاء مجموعة جديدة' : 'محادثة جديدة'}</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => setIsGroup(false)}
            className={`flex-1 py-3 text-center text-sm font-semibold transition border-b-2 ${
              !isGroup
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-inherit'
            }`}
          >
            جهة اتصال جديدة
          </button>
          <button
            type="button"
            onClick={() => setIsGroup(true)}
            className={`flex-1 py-3 text-center text-sm font-semibold transition border-b-2 ${
              isGroup
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-inherit'
            }`}
          >
            مجموعة جديدة
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1.5">
              {isGroup ? 'اسم المجموعة' : 'اسم جهة الاتصال'} *
            </label>
            <input
              type="text"
              required
              placeholder={isGroup ? 'مثال: زملاء العمل 🎯' : 'مثال: عبدالله الشمري'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition ${
                theme === 'dark'
                  ? 'bg-[#202c33] border-[#2a3942] focus:border-[#00a884] text-[#e9edef]'
                  : 'bg-[#f0f2f5] border-[#e9edef] focus:border-[#00a884] text-[#111b21]'
              }`}
            />
          </div>

          {!isGroup && (
            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1.5">
                رقم الهاتف (اختياري)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+966 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition ${
                    theme === 'dark'
                      ? 'bg-[#202c33] border-[#2a3942] focus:border-[#00a884] text-[#e9edef]'
                      : 'bg-[#f0f2f5] border-[#e9edef] focus:border-[#00a884] text-[#111b21]'
                  }`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1.5">
              الوصف أو الحالة
            </label>
            <input
              type="text"
              placeholder={isGroup ? 'وصف للمجموعة وأهدافها' : 'متاح للتواصل'}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition ${
                theme === 'dark'
                  ? 'bg-[#202c33] border-[#2a3942] focus:border-[#00a884] text-[#e9edef]'
                  : 'bg-[#f0f2f5] border-[#e9edef] focus:border-[#00a884] text-[#111b21]'
              }`}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#8696a0] hover:text-inherit transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 rounded-lg bg-[#00a884] text-white text-sm font-semibold hover:bg-[#008f6f] transition disabled:opacity-50"
            >
              بدء الدردشة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
