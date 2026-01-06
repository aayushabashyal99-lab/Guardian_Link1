
import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const SOSButton: React.FC = () => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startPress = () => {
    setIsPressing(true);
    setProgress(0);
    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / 3000) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        handleTrigger();
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 50);
  };

  const stopPress = () => {
    setIsPressing(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTrigger = () => {
    setIsTriggered(true);
    // Vibrate device if possible
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }
    
    // Simulate emergency protocol
    setTimeout(() => {
      alert("EMERGENCY SIGNAL SENT! Police and emergency contacts have been notified with your live coordinates.");
      setIsTriggered(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative">
        {/* Animated Rings */}
        {!isTriggered && (
          <>
            <div className={`absolute inset-0 bg-red-600/20 rounded-full animate-ping delay-75 ${isPressing ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className={`absolute inset-0 bg-red-600/10 rounded-full animate-ping delay-300 ${isPressing ? 'opacity-100' : 'opacity-0'}`}></div>
          </>
        )}

        <button
          onMouseDown={startPress}
          onMouseUp={stopPress}
          onMouseLeave={stopPress}
          onTouchStart={startPress}
          onTouchEnd={stopPress}
          className={`relative z-10 w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
            isTriggered 
              ? 'bg-red-600 sos-glow' 
              : isPressing 
                ? 'bg-red-500 scale-105' 
                : 'bg-gradient-to-br from-red-600 to-red-900 border-4 border-white/10'
          }`}
        >
          <AlertCircle size={64} className="text-white mb-2" />
          <span className="text-4xl font-black text-white tracking-tighter">SOS</span>
          <span className="text-xs font-bold text-red-200 mt-2 uppercase tracking-widest">Hold to Signal</span>
          
          {/* Progress Circular Path */}
          {isPressing && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle
                cx="112"
                cy="112"
                r="108"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeDasharray="678.58"
                strokeDashoffset={678.58 - (678.58 * progress) / 100}
                className="transition-all duration-75 ease-linear opacity-40"
              />
            </svg>
          )}
        </button>
      </div>

      <p className="text-sm text-slate-500 text-center max-w-xs font-medium uppercase tracking-wider">
        Emergency contacts and local authorities will be alerted immediately.
      </p>
    </div>
  );
};

export default SOSButton;
