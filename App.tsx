
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Types ---
export interface SafetyAlert {
  id: string;
  type: 'emergency' | 'warning' | 'info';
  timestamp: Date;
  message: string;
  location?: { lat: number; lng: number };
}

export interface UserState {
  isSOSActive: boolean;
  batteryLevel: number;
  signalStrength: number;
  location: { lat: number; lng: number } | null;
}

export interface AIAdvice {
  summary: string;
  steps: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// --- Custom Components ---

/**
 * A custom SVG chart to replace recharts dependency for build stability.
 */
const CustomSafetyChart: React.FC<{ data: { val: number }[] }> = ({ data }) => {
  const width = 300;
  const height = 100;
  const maxVal = 100;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.val / maxVal) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <line
            key={v}
            x1="0"
            y1={height - (v / 100) * height}
            x2={width}
            y2={height - (v / 100) * height}
            stroke="#1e293b"
            strokeWidth="0.5"
          />
        ))}
        {/* The Area */}
        <polyline
          points={areaPoints}
          fill="url(#chartGradient)"
        />
        {/* The Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points on the line */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - (d.val / maxVal) * height;
          return (
            <circle key={i} cx={x} cy={y} r="2" fill="#3b82f6" />
          );
        })}
      </svg>
    </div>
  );
};

const EmergencyButton: React.FC<{ isActive: boolean; onToggle: () => void }> = ({ isActive, onToggle }) => (
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

const AIAssistant: React.FC<{ isSOSActive: boolean; userState: UserState }> = ({ isSOSActive, userState }) => {
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  
  const generateEmergencyAdvice = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `SOS Beacon is ACTIVE. 
        User Status: Battery ${userState.batteryLevel}%, Signal Strength ${userState.signalStrength}/5.
        Location: ${userState.location ? `${userState.location.lat}, ${userState.location.lng}` : 'Unknown'}.
        Please provide immediate safety triage steps. Response must be JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              priority: { type: Type.STRING }
            },
            required: ['summary', 'steps', 'priority']
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAdvice(result);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSOSActive) generateEmergencyAdvice();
    else setAdvice(null);
  }, [isSOSActive]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({ model: 'gemini-3-flash-preview' });
      const response = await chat.sendMessage({ message: userMsg });
      setChatHistory(prev => [...prev, { role: 'assistant', text: response.text || '' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Error contacting command center.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">AI Safety Command</h2>
        {isSOSActive && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded animate-pulse">TRIAGE ACTIVE</span>}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {advice && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm font-bold text-red-400 mb-2">{advice.summary}</p>
            <ul className="text-xs space-y-1 text-slate-300">
              {advice.steps.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        )}
        {chatHistory.length === 0 && !advice && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <i className="fas fa-brain text-slate-700 text-4xl mb-4"></i>
            <p className="text-slate-500 text-sm max-w-xs">AI Safety Command is monitoring. Ask for safety advice.</p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800'}`}>{msg.text}</div>
          </div>
        ))}
        {loading && <div className="text-slate-500 text-xs italic">AI is thinking...</div>}
      </div>
      <div className="relative mt-4">
        <input 
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pr-10 text-sm focus:outline-none" 
          value={chatInput} 
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask AI Safety Command..."
        />
        <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500"><i className="fas fa-paper-plane"></i></button>
      </div>
    </div>
  );
};

const StatusCharts: React.FC<{ userState: UserState }> = ({ userState }) => {
  const chartData = [{ val: 98 }, { val: 95 }, { val: 85 }, { val: 90 }, { val: 92 }, { val: 88 }, { val: 94 }];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Battery</div>
          <div className="text-2xl font-bold">{Math.round(userState.batteryLevel)}%</div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Signal</div>
          <div className="text-2xl font-bold">{userState.signalStrength}G</div>
        </div>
      </div>
      <div className="h-40">
        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Safety Integrity History</div>
        <CustomSafetyChart data={chartData} />
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [userState, setUserState] = useState<UserState>({
    isSOSActive: false,
    batteryLevel: 85,
    signalStrength: 4,
    location: null,
  });

  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUserState(prev => ({
        ...prev,
        batteryLevel: Math.max(0, prev.batteryLevel - 0.1),
      }));
    }, 10000);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserState(prev => ({
          ...prev,
          location: { lat: position.coords.latitude, lng: position.coords.longitude }
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <section className="glass-card rounded-3xl p-4 overflow-hidden shadow-2xl">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-4 pt-4 mb-2">Emergency Hub</h2>
              <EmergencyButton isActive={userState.isSOSActive} onToggle={toggleSOS} />
            </section>
            <section className="glass-card rounded-3xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Device Status</h2>
              <StatusCharts userState={userState} />
            </section>
          </div>
          <div className="lg:col-span-8 space-y-8">
            <section className="glass-card rounded-3xl p-6 min-h-[400px]">
              <AIAssistant isSOSActive={userState.isSOSActive} userState={userState} />
            </section>
            <section className="glass-card rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Recent Activity</h2>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 italic text-sm">No recent incidents. Safe environment confirmed.</div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className="flex gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.type === 'emergency' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        <i className={`fas ${alert.type === 'emergency' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-slate-200 text-sm">{alert.message}</h4>
                          <span className="text-[10px] text-slate-500">{alert.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
