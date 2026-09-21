import React, { useEffect, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Shield } from 'lucide-react';
import { CallSession } from '../types';
import { sounds } from '../utils/audio';

interface CallModalProps {
  call: CallSession;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  call,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}) => {
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<'calling' | 'connected'>(call.status === 'connected' ? 'connected' : 'calling');

  useEffect(() => {
    // Play dial tone for 3 seconds then connect
    const stopDialTone = sounds.playDialTone();

    const connectTimeout = setTimeout(() => {
      stopDialTone();
      setStatus('connected');
    }, 3200);

    return () => {
      stopDialTone();
      clearTimeout(connectTimeout);
    };
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    if (status === 'connected') {
      interval = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  return (
    <div 
      id="whatsapp-call-modal"
      className="fixed inset-0 z-50 bg-[#111b21]/95 backdrop-blur-md flex flex-col items-center justify-between p-8 text-white select-none"
    >
      {/* Top Header */}
      <div className="flex flex-col items-center gap-2 pt-6">
        <div className="flex items-center gap-1.5 text-xs text-[#00a884] bg-[#00a884]/10 px-3 py-1 rounded-full border border-[#00a884]/20">
          <Shield className="w-3.5 h-3.5" />
          <span>مكالمة مشفرة تماماً بين الطرفين</span>
        </div>
        <h2 className="text-2xl font-bold mt-2">{call.contactName}</h2>
        <p className="text-sm text-[#8696a0]">
          {status === 'calling' ? (
            <span className="animate-pulse">جاري الرنين...</span>
          ) : (
            <span className="text-[#00a884] font-medium">{formatDuration(duration)}</span>
          )}
        </p>
      </div>

      {/* Center Avatar / Video Box */}
      <div className="relative flex flex-col items-center">
        {call.type === 'video' && call.isVideoEnabled ? (
          <div className="w-72 h-96 sm:w-80 sm:h-96 rounded-2xl overflow-hidden bg-black/60 border border-white/10 relative shadow-2xl flex items-center justify-center">
            <img 
              src={call.contactAvatar} 
              alt={call.contactName} 
              className="w-full h-full object-cover filter brightness-90"
            />
            <div className="absolute bottom-4 left-4 bg-black/50 px-2.5 py-1 rounded-md text-xs">
              {call.contactName}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-[#00a884]/40 shadow-2xl relative">
              <img 
                src={call.contactAvatar} 
                alt={call.contactName} 
                className="w-full h-full object-cover"
              />
            </div>
            {status === 'calling' && (
              <span className="absolute inset-0 rounded-full ring-4 ring-[#00a884] animate-ping opacity-30" />
            )}
          </div>
        )}
      </div>

      {/* Control Actions Bar */}
      <div className="flex items-center gap-6 pb-6">
        <button
          onClick={onToggleMute}
          className={`p-4 rounded-full transition ${
            call.isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={call.isMuted ? 'إلغاء كتم الصوت' : 'كتم الميكروفون'}
        >
          {call.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {call.type === 'video' && (
          <button
            onClick={onToggleVideo}
            className={`p-4 rounded-full transition ${
              !call.isVideoEnabled ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={call.isVideoEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          >
            {call.isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={onEndCall}
          className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl transition transform active:scale-95"
          title="إنهاء المكالمة"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
