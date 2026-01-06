
import React from 'react';

interface SOSButtonProps {
  isActive: boolean;
  onToggle: () => void;
}

const SOSButton: React.FC<SOSButtonProps> = ({ isActive, onToggle }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      <div className="relative">
        {isActive && (
          <>
            <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-25"></div>
            <div className="absolute inset-0 bg-red-600 rounded-full animate-pulse opacity-10 blur-xl"></div>
          </>
        )}
        <button
          onClick={onToggle}
          className={`relative z-10 w-48 h-48 rounded-full border-8 flex flex-col items-center justify-center transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-2xl ${
            isActive 
              ? 'bg-red-600 border-red-800 text-white emergency-glow shadow-red-900/50' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400'
          }`}
        >
          <i className={`fas fa-power-off text-6xl mb-2 ${isActive ? 'animate-pulse' : ''}`}></i>
          <span className="font-bold text-2xl tracking-widest">{isActive ? 'SOS ON' : 'SOS'}</span>
        </button>
      </div>
      
      <p className={`text-sm text-center font-medium transition-colors ${isActive ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
        {isActive 
          ? 'Emergency services notified. Broadcasting GPS.' 
          : 'Hold button for 3 seconds to trigger SOS'}
      </p>
    </div>
  );
};

export default SOSButton;
