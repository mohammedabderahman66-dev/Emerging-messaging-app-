import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  Bell, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Laptop, 
  Globe 
} from 'lucide-react';
import { User, ThemeMode } from '../types';

interface SettingsModalProps {
  user: User;
  theme: ThemeMode;
  soundEnabled: boolean;
  onUpdateUser: (updated: Partial<User>) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  theme,
  soundEnabled,
  onUpdateUser,
  onToggleTheme,
  onToggleSound,
  onClose,
}) => {
  const [name, setName] = useState(user.name);
  const [about, setAbout] = useState(user.about);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ name: name.trim(), about: about.trim() });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div 
      id="settings-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transition-colors ${
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
            <span>الإعدادات والملف الشخصي</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Profile Section */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[#00a884]"
              />
              <div className="flex-1">
                <p className="text-xs text-[#8696a0]">رقم الهاتف المسجل</p>
                <p className="text-sm font-semibold" dir="ltr">{user.phone}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1">الاسم المعروض</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                  theme === 'dark'
                    ? 'bg-[#202c33] border-[#2a3942] focus:border-[#00a884] text-[#e9edef]'
                    : 'bg-[#f0f2f5] border-[#e9edef] focus:border-[#00a884] text-[#111b21]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1">الحالة (About)</label>
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                  theme === 'dark'
                    ? 'bg-[#202c33] border-[#2a3942] focus:border-[#00a884] text-[#e9edef]'
                    : 'bg-[#f0f2f5] border-[#e9edef] focus:border-[#00a884] text-[#111b21]'
                }`}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {isSaved && <span className="text-xs text-[#00a884] font-medium">تم الحفظ بنجاح!</span>}
              <button
                type="submit"
                className="mr-auto px-4 py-1.5 rounded-lg bg-[#00a884] text-white text-xs font-semibold hover:bg-[#008f6f] transition"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>

          {/* Preferences Section */}
          <div className="border-t border-black/10 dark:border-white/10 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">التفضيلات والمظهر</h4>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-[#00a884]" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <div>
                  <p className="text-sm font-semibold">{theme === 'dark' ? 'الوضع الليلي (Dark)' : 'الوضع النهاري (Light)'}</p>
                  <p className="text-xs text-[#8696a0]">تغيير نمط العرض حسب رغبتك</p>
                </div>
              </div>
              <button
                onClick={onToggleTheme}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                تبديل
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-[#00a884]" /> : <VolumeX className="w-5 h-5 text-[#8696a0]" />}
                <div>
                  <p className="text-sm font-semibold">أصوات التنبيهات</p>
                  <p className="text-xs text-[#8696a0]">تشغيل نغمات إرسال واستقبال الرسائل</p>
                </div>
              </div>
              <button
                onClick={onToggleSound}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  soundEnabled ? 'bg-[#00a884] text-white' : 'bg-gray-500/20 text-[#8696a0]'
                }`}
              >
                {soundEnabled ? 'مفعل' : 'معطل'}
              </button>
            </div>
          </div>

          {/* Connected Session Info */}
          <div className="border-t border-black/10 dark:border-white/10 pt-4 flex items-center gap-3 text-xs text-[#8696a0]">
            <Laptop className="w-5 h-5 text-[#00a884] flex-shrink-0" />
            <div>
              <p className="font-semibold text-inherit">واتساب ويب متصل عبر WebSockets</p>
              <p className="text-[11px]">مزامنة فورية كاملة في الوقت الحقيقي بين كافة الأجهزة والمتصفحات</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
