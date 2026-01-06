
import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { UserState, SafetyAlert } from './types';

const App: React.FC = () => {
  const [userState, setUserState] = useState<UserState>({
    isSOSActive: false,
    batteryLevel: 85,
    signalStrength: 4,
    location: null,
  });

  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);

  useEffect(() => {
    // Simulate periodic updates
    const interval = setInterval(() => {
      setUserState(prev => ({
        ...prev,
        batteryLevel: Math.max(0, prev.batteryLevel - 0.1),
      }));
    }, 10000);

    // Get initial location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserState(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
      });
    }

    return () => clearInterval(interval);
  }, []);

  const toggleSOS = () => {
    setUserState(prev => {
      const newState = !prev.isSOSActive;
      if (newState) {
        const newAlert: SafetyAlert = {
          id: Date.now().toString(),
          type: 'emergency',
          timestamp: new Date(),
          message: "SOS Beacon Activated",
          location: prev.location || undefined
        };
        setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
      }
      return { ...prev, isSOSActive: newState };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center animate-pulse">
                <i className="fas fa-shield-alt text-white"></i>
              </div>
              <span className="text-xl font-bold tracking-tight">SAFETY<span className="text-red-500">GUARDIAN</span></span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-1 text-slate-400">
                <i className="fas fa-signal"></i>
                <span>{userState.signalStrength}G</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <i className={`fas fa-battery-${userState.batteryLevel > 20 ? 'full' : 'quarter'}`}></i>
                <span>{Math.round(userState.batteryLevel)}%</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard 
          userState={userState} 
          alerts={alerts} 
          onToggleSOS={toggleSOS} 
        />
      </main>
    </div>
  );
};

export default App;
