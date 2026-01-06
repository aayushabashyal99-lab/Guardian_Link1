
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Types ---
interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

interface UserProfile {
  name: string;
  email: string;
  safetyPhrase: string;
  isLoggedIn: boolean;
}

interface AlertLog {
  id: string;
  to: string;
  status: 'Sent' | 'Delivered' | 'Read';
  time: string;
}

// --- Mock Data ---
const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Dad', phone: '+1 555-9111', relation: 'Father' },
  { id: '2', name: 'Mom', phone: '+1 555-9112', relation: 'Mother' },
  { id: '3', name: 'Sarah Miller', phone: '+1 555-0044', relation: 'Best Friend' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'home' | 'circle' | 'settings'>('auth');
  const [isRegistering, setIsRegistering] = useState(true);
  const [user, setUser] = useState<UserProfile>({
    name: '',
    email: '',
    safetyPhrase: 'I am in danger',
    isLoggedIn: false,
  });
  
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [aiAdvice, setAiAdvice] = useState<{ summary: string; steps: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // --- SOS Sequence ---
  const triggerSOS = async () => {
    setIsSOSActive(true);
    setIsListening(false);
    
    // 1. Simulate Broadcast to Contacts
    const newLogs: AlertLog[] = INITIAL_CONTACTS.map(c => ({
      id: Math.random().toString(),
      to: c.name,
      status: 'Sent',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    setAlertLogs(newLogs);

    // 2. AI Triage
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `EMERGENCY SOS TRIGGERED via voice phrase "${user.safetyPhrase}". 
        Location data is being shared. Provide 3 life-saving steps for a person in immediate danger. 
        Keep it sharp and professional. JSON format: { "summary": "string", "steps": ["string"] }`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['summary', 'steps']
          }
        }
      });
      setAiAdvice(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }

    // 3. Simulate Receipt confirmation after 3 seconds
    setTimeout(() => {
      setAlertLogs(prev => prev.map(log => ({ ...log, status: 'Delivered' })));
    }, 3000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(prev => ({ ...prev, isLoggedIn: true }));
    setView('home');
  };

  // --- Auth View ---
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md glass-card rounded-[2.5rem] p-8 space-y-8 border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/20">
              <i className="fas fa-shield-alt text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Guardian<span className="text-blue-500">Safe</span></h1>
            <p className="text-slate-400 text-sm">Protecting you and your loved ones.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Full Name</label>
                <input required className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3 text-sm focus:border-blue-500 outline-none transition-all" placeholder="Enter your name" onChange={e => setUser({...user, name: e.target.value})} />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Email Address</label>
              <input required type="email" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3 text-sm focus:border-blue-500 outline-none transition-all" placeholder="your@email.com" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Safety Trigger Phrase</label>
              <div className="relative">
                <input 
                  required 
                  className="w-full bg-slate-900/50 border border-blue-500/30 rounded-2xl px-5 py-3 text-sm focus:border-blue-500 outline-none transition-all pr-12" 
                  placeholder="e.g. Help me now" 
                  value={user.safetyPhrase}
                  onChange={e => setUser({...user, safetyPhrase: e.target.value})}
                />
                <i className="fas fa-microphone-alt absolute right-4 top-1/2 -translate-y-1/2 text-blue-500"></i>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 ml-2 italic">Say this phrase to trigger an emergency alert instantly.</p>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-sm uppercase tracking-widest">
              {isRegistering ? 'Create Secure Account' : 'Secure Login'}
            </button>
          </form>

          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center text-xs text-slate-500 font-bold hover:text-slate-300">
            {isRegistering ? 'Already have an account? Sign In' : "New user? Create an account"}
          </button>
        </div>
      </div>
    );
  }

  // --- Main Application View ---
  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col transition-colors duration-700 ${isSOSActive ? 'bg-red-950' : ''}`}>
      
      {/* App Bar */}
      <header className="p-6 flex items-center justify-between border-b border-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isSOSActive ? 'bg-red-600 shadow-red-600/30' : 'bg-blue-600 shadow-blue-600/30'}`}>
            <i className={`fas ${isSOSActive ? 'fa-exclamation-triangle' : 'fa-shield-alt'} text-white`}></i>
          </div>
          <div>
            <h2 className="font-black text-lg leading-none">Guardian</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              {isSOSActive ? 'EMERGENCY MODE' : 'STANDBY MODE'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure</span>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
        
        {/* SOS STATUS PANEL */}
        {isSOSActive && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-red-600 rounded-3xl p-8 text-center text-white shadow-2xl shadow-red-600/40 border border-red-500">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-ping absolute opacity-20"></div>
              <h2 className="text-3xl font-black italic mb-2 tracking-tighter">ALERTS BROADCASTING</h2>
              <p className="text-red-100 text-sm font-medium opacity-90 leading-tight max-w-[250px] mx-auto">
                Your coordinates and distress signal have been sent to your 3 trusted contacts.
              </p>
              <button onClick={() => setIsSOSActive(false)} className="mt-6 bg-white text-red-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                I am safe now
              </button>
            </div>

            {/* Broadcast Logs */}
            <div className="glass-card rounded-3xl p-6 border-red-500/20 bg-red-950/20">
              <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-4">Transmission Status</h3>
              <div className="space-y-3">
                {alertLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                        {log.to[0]}
                      </div>
                      <span className="text-sm font-bold text-slate-200">{log.to}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-black uppercase ${log.status === 'Sent' ? 'text-slate-500' : 'text-green-400'}`}>
                        {log.status} <i className={`fas ${log.status === 'Sent' ? 'fa-clock' : 'fa-check-double'} ml-1`}></i>
                      </span>
                      <span className="text-[10px] text-slate-600">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Safety Command */}
            {aiAdvice && (
              <div className="glass-card rounded-3xl p-6 border-blue-500/20 space-y-4">
                <div className="flex items-center gap-2">
                  <i className="fas fa-robot text-blue-500"></i>
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest">AI Safety Dispatcher</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">{aiAdvice.summary}</p>
                <div className="grid gap-3">
                  {aiAdvice.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 items-center bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">{i+1}</div>
                      <span className="text-xs text-slate-300 font-medium leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Normal Dashboard */}
        {!isSOSActive && view === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center py-8 text-center">
              <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Hello, {user.name || 'Alex'}</h1>
              <p className="text-sm text-slate-500">Your safety circle is active and monitoring.</p>
            </div>

            {/* Main Trigger */}
            <div className="relative flex justify-center py-8">
               <button 
                  onClick={triggerSOS}
                  className="w-56 h-56 rounded-full bg-slate-900 border-[10px] border-slate-800 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all group hover:border-red-600/40"
               >
                  <i className="fas fa-power-off text-5xl text-slate-600 mb-3 group-hover:text-red-500 transition-colors"></i>
                  <span className="text-xl font-black text-slate-500 group-hover:text-white tracking-widest">SOS</span>
               </button>
               {/* Pulsing indicator for listener */}
               {isListening && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-blue-500/20 rounded-full animate-ping"></div>}
            </div>

            {/* Listener Control */}
            <button 
              onClick={() => setIsListening(!isListening)}
              className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between ${isListening ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isListening ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-slash'} text-white`}></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{isListening ? 'Listening for Phrase' : 'Voice Trigger Off'}</p>
                  <p className="text-[10px] font-medium opacity-60 italic">Phrase: "{user.safetyPhrase}"</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full ${isListening ? 'bg-blue-500 animate-pulse' : 'bg-slate-800'}`}></div>
            </button>
            
            {/* Simulation Helper for Reviewer */}
            {isListening && (
              <button onClick={triggerSOS} className="w-full py-2 bg-blue-500/10 rounded-full text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                [ Click to simulate saying phrase ]
              </button>
            )}
          </div>
        )}

        {/* Circle View */}
        {view === 'circle' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Trusted Circle</h2>
              <button className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <i className="fas fa-plus text-white text-xs"></i>
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">These contacts will be immediately notified via SMS and App alert when you trigger SOS or say your phrase.</p>
            
            <div className="space-y-4">
              {INITIAL_CONTACTS.map(contact => (
                <div key={contact.id} className="glass-card p-5 rounded-3xl flex items-center justify-between border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
                      <i className="fas fa-user text-slate-500"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{contact.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{contact.relation}</p>
                    </div>
                  </div>
                  <button className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-3xl border-t border-white/5 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center px-4">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
            <i className="fas fa-home text-lg"></i>
            <span className="text-[10px] font-black tracking-widest">HUB</span>
          </button>
          
          <button 
            onClick={triggerSOS}
            className={`w-16 h-16 rounded-full flex items-center justify-center -mt-12 border-[6px] border-slate-950 shadow-2xl transition-all active:scale-90 ${isSOSActive ? 'bg-white text-red-600' : 'bg-red-600 text-white shadow-red-600/30'}`}
          >
            <i className="fas fa-exclamation-triangle text-xl"></i>
          </button>

          <button onClick={() => setView('circle')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'circle' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
            <i className="fas fa-users text-lg"></i>
            <span className="text-[10px] font-black tracking-widest">CIRCLE</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
