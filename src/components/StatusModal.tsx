import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react';
import { StatusItem, ThemeMode, User } from '../types';

interface StatusModalProps {
  currentUser: User;
  theme: ThemeMode;
  onClose: () => void;
}

const SAMPLE_STATUSES: StatusItem[] = [
  {
    id: 's-1',
    userId: 'user-sara',
    userName: 'سارة العلي',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    timestamp: 'منذ 25 دقيقة',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'أجواء صباحية ساحرة وهادئة ☕🌄',
  },
  {
    id: 's-2',
    userId: 'user-khaled',
    userName: 'م. خالد المنصور',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    timestamp: 'منذ ساعتين',
    mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
    caption: 'جلسة برمجة وتطوير شيقة مع فنجان قهوة 💻⚡',
  },
  {
    id: 's-3',
    userId: 'user-mom',
    userName: 'الوالدة الغالية ❤️',
    userAvatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150&auto=format&fit=crop&q=80',
    timestamp: 'منذ 4 ساعات',
    mediaUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=80',
    caption: 'صباح الخير والبركة على الجميع 🌸 دعاكم لنا بالخير',
  },
];

export const StatusModal: React.FC<StatusModalProps> = ({
  currentUser,
  theme,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const activeStatus = SAMPLE_STATUSES[activeIndex];

  // Auto progression of stories
  useEffect(() => {
    setProgress(0);
    const duration = 5000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeIndex < SAMPLE_STATUSES.length - 1) {
            setActiveIndex((idx) => idx + 1);
            return 0;
          } else {
            clearInterval(interval);
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [activeIndex, onClose]);

  const handleNext = () => {
    if (activeIndex < SAMPLE_STATUSES.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <div 
      id="whatsapp-status-modal"
      className="fixed inset-0 z-50 bg-black/95 flex flex-col md:flex-row text-white select-none"
    >
      {/* Sidebar with stories list */}
      <div className="w-full md:w-80 h-auto md:h-full bg-[#111b21] border-l border-[#222d34] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#222d34]">
            <h2 className="text-lg font-bold text-[#e9edef]">الحالة</h2>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-[#8696a0]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* My status */}
          <div className="flex items-center gap-3 py-3 border-b border-[#222d34]">
            <div className="relative">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-12 h-12 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#00a884] text-white rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e9edef]">حالتي</p>
              <p className="text-xs text-[#8696a0]">انقر لإضافة تحديث للحالة</p>
            </div>
          </div>

          {/* Recent updates title */}
          <p className="text-xs font-semibold text-[#00a884] pt-4 pb-2 uppercase tracking-wide">
            التحديثات الحديثة
          </p>

          {/* Contacts statuses */}
          <div className="space-y-1">
            {SAMPLE_STATUSES.map((status, index) => (
              <div
                key={status.id}
                onClick={() => setActiveIndex(index)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                  index === activeIndex ? 'bg-[#202c33]' : 'hover:bg-[#202c33]/50'
                }`}
              >
                <div className="p-0.5 rounded-full ring-2 ring-[#00a884]">
                  <img 
                    src={status.userAvatar} 
                    alt={status.userName} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#e9edef] truncate">{status.userName}</p>
                  <p className="text-xs text-[#8696a0]">{status.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Story Viewer */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Progress bars header */}
        <div className="absolute top-4 left-4 right-4 max-w-lg mx-auto flex items-center gap-1.5 z-20">
          {SAMPLE_STATUSES.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{
                  width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info Overlay */}
        <div className="absolute top-8 left-4 right-4 max-w-lg mx-auto flex items-center justify-between z-20 px-2">
          <div className="flex items-center gap-2.5">
            <img 
              src={activeStatus.userAvatar} 
              alt={activeStatus.userName} 
              className="w-9 h-9 rounded-full object-cover border border-white"
            />
            <div>
              <p className="text-sm font-bold text-white">{activeStatus.userName}</p>
              <p className="text-[11px] text-white/80">{activeStatus.timestamp}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={handlePrev}
          className="absolute right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white z-20 hidden md:block"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute left-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white z-20 hidden md:block"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Story Media Card */}
        <div className="relative max-w-md w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-end">
          <img 
            src={activeStatus.mediaUrl} 
            alt="Status" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

          {/* Caption */}
          {activeStatus.caption && (
            <div className="relative z-10 p-6 text-center">
              <p className="text-white text-base font-medium drop-shadow-md leading-relaxed">
                {activeStatus.caption}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
