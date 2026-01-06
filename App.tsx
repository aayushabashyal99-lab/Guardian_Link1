
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Types ---
interface Guardian {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface UserProfile {
  name: string;
  email: string;
  safetyPhrase: string;
  isLoggedIn: boolean;
}

interface AlertStatus {
  id: string;
  recipient: string;
  type: 'Email' | 'SMS';
  status: 'Sending...' | 'Delivered' | 'Failed';
}

// --- Main App Component ---
const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'home' | 'guardians'>('login');
  
  // User State
  const [user, setUser] = useState<UserProfile>({
    name: 'User',
    email: '',
    safetyPhrase: 'I am in danger',
    isLoggedIn: false,
  });

  // Guardian State
  const [guardians, setGuardians] = useState<Guardian[]>([
    { id: '1', name: 'Primary Guardian', email: 'family@example.com', phone: '555-0199' }
  ]);

  // SOS State
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [alertStatuses, setAlertStatuses] = useState<AlertStatus[]>([]);
  const [aiGuidance, setAiGuidance] = useState<{ summary: string; steps: string[] } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Form States
  const [newGuardian, setNewGuardian] = useState({ name: '', email: '', phone: '' });
  const [authEmail, setAuthEmail] = useState('');

  // --- Functions ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, isLoggedIn: true, name: authEmail.split('@')[0] });
    setView('home');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, isLoggedIn: true });
    setView('home');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`A reset link has been sent to ${authEmail}`);
    setView('login');
  };

  const addGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGuardian.name && (newGuardian.email || newGuardian.phone)) {
      setGuardians([...guardians, { ...newGuardian, id: Date.now().toString() }]);
      setNewGuardian({ name: '', email: '', phone: '' });
    }
  };

  const removeGuardian = (id: string) => {
    setGuardians(guardians.filter(g => g.id !== id));
  };

  const triggerSOS = async () => {
    setIsSOSActive(true);
    setIsListening(false);
    
    // 1. Simulate Automatic Alerts (SMS & Email)
    const initialAlerts: AlertStatus[] = [];
    guardians.forEach(g => {
      if (g.email) initialAlerts.push({ id: `e-${g.id}`, recipient: g.email, type: 'Email', status: 'Sending...' });
      if (g.phone) initialAlerts.push({ id: `s-${g.id}`, recipient: g.phone, type: 'SMS', status: 'Sending...' });
    });
    setAlertStatuses(initialAlerts);

    // Update statuses to delivered after a delay
    setTimeout(() => {
      setAlertStatuses(prev => prev.map(a => ({ ...a, status: 'Delivered' })));
    }, 2500);

    // 2. Fetch AI Emergency Triage
    setLoadingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `EMERGENCY ALERT TRIGGERED. Safety Phrase used: "${user.safetyPhrase}". 
        The user's guardians have been notified. Provide 3 high-priority survival steps. 
        Format as JSON: { "summary": "brief overview", "steps": ["step1", "step2", "step3"] }`;
      
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
      setAiGuidance(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("AI Dispatch Error:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  // --- Auth Views ---

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/20 mb-4">
              <i className="fas fa-shield-heart text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">SafetyGuardian</h1>
            <p className="text-slate-500 text-sm">Always protected, always connected.</p>
          </div>

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <input required type="email" placeholder="Email Address" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
              <input required type="password" placeholder="Password" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95">Sign In</button>
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <button type="button" onClick={() => setView('forgot-password')} className="hover:text-blue-400">Forgot Password?</button>
                <button type="button" onClick={() => setView('register')} className="hover:text-blue-400">Create Account</button>
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <input required type="text" placeholder="Full Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" onChange={e => setUser({...user, name: e.target.value})} />
              <input required type="email" placeholder="Email Address" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
              <input required type="password" placeholder="Password" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
              <div className="p-3 bg-blue-600/5 rounded-xl border border-blue-500/20">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Emergency Trigger Phrase</label>
                <input required type="text" placeholder="e.g. Save me now" className="w-full bg-transparent text-sm text-white border-none outline-none focus:ring-0 p-0" value={user.safetyPhrase} onChange={e => setUser({...user, safetyPhrase: e.target.value})} />
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95">Complete Registration</button>
              <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold hover:text-blue-400">Back to Login</button>
            </form>
          )}

          {view === 'forgot-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-400 mb-2">Enter your email to receive a password reset link.</p>
              <input required type="email" placeholder="Email Address" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95">Send Reset Link</button>
              <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold hover:text-blue-400">Back to Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- Main App Views ---

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-50 flex flex-col transition-colors duration-1000 ${isSOSActive ? 'bg-red-950' : ''}`}>
      
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${isSOSActive ? 'bg-red-600 shadow-red-600/40' : 'bg-blue-600 shadow-blue-600/40'}`}>
            <i className={`fas ${isSOSActive ? 'fa-exclamation-triangle animate-pulse' : 'fa-shield-heart'} text-white`}></i>
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">Guardian</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              {isSOSActive ? 'Emergency Active' : 'System Secure'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{user.name}</p>
            <p className="text-[10px] text-slate-500">Member ID: {Math.floor(Math.random()*9000)+1000}</p>
          </div>
          <button onClick={() => setUser({...user, isLoggedIn: false})} className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors">
            <i className="fas fa-power-off text-xs"></i>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* SOS OVERLAY */}
        {isSOSActive && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-red-600 rounded-[2rem] p-8 text-center text-white shadow-2xl shadow-red-600/30 border border-red-500">
              <h2 className="text-3xl font-black italic mb-2 tracking-tighter uppercase">Help is Coming</h2>
              <p className="text-red-100 text-sm font-medium opacity-90 leading-tight">
                Emergency emails and texts have been automatically sent to your loved ones.
              </p>
              <button onClick={() => setIsSOSActive(false)} className="mt-8 bg-white text-red-600 px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                I Am Safe Now
              </button>
            </div>

            <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="text-xs font-black text-red-400 uppercase tracking-widest">Notification Log</h3>
              <div className="space-y-2">
                {alertStatuses.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${alert.type === 'Email' ? 'bg-blue-600/10 text-blue-400' : 'bg-green-600/10 text-green-400'}`}>
                        <i className={`fas ${alert.type === 'Email' ? 'fa-envelope' : 'fa-comment-sms'}`}></i>
                      </div>
                      <span className="text-xs font-bold">{alert.recipient}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase ${alert.status === 'Delivered' ? 'text-green-400' : 'text-slate-500'}`}>
                      {alert.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {loadingAI ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Connecting AI Command...</p>
              </div>
            ) : aiGuidance && (
              <div className="bg-blue-600 rounded-[2rem] p-6 text-white space-y-4 shadow-2xl">
                <div className="flex items-center gap-2">
                  <i className="fas fa-brain"></i>
                  <span className="text-xs font-black uppercase tracking-widest">AI Safety Dispatch</span>
                </div>
                <p className="text-sm font-bold leading-tight">{aiGuidance.summary}</p>
                <div className="space-y-3">
                  {aiGuidance.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 items-center bg-white/10 p-4 rounded-2xl">
                      <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                      <span className="text-xs font-medium leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Home Hub View */}
        {!isSOSActive && view === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center py-4">
              <h1 className="text-2xl font-bold">Safe for now, {user.name}</h1>
              <p className="text-slate-500 text-sm mt-1">Tap the shield or say your phrase if you feel unsafe.</p>
            </div>

            <div className="relative flex justify-center py-8">
              <button 
                onClick={triggerSOS}
                className="w-64 h-64 rounded-full bg-slate-900 border-[12px] border-slate-800 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all group hover:border-red-600/40"
              >
                <i className="fas fa-shield-heart text-6xl text-slate-600 mb-4 group-hover:text-red-500 transition-colors"></i>
                <span className="text-xs font-black text-slate-500 group-hover:text-white tracking-[0.2em] uppercase">Emergency SOS</span>
              </button>
              {isListening && (
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping pointer-events-none"></div>
              )}
            </div>

            <button 
              onClick={() => setIsListening(!isListening)}
              className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between ${isListening ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10`}>
                  <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'}`}></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{isListening ? 'Listening Active' : 'Voice Trigger Off'}</p>
                  <p className="text-[10px] opacity-70 italic">Phrase: "{user.safetyPhrase}"</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-white' : 'bg-slate-800'}`}></div>
            </button>

            {isListening && (
              <button onClick={triggerSOS} className="w-full text-center text-[10px] font-bold text-blue-500 uppercase tracking-widest animate-bounce">
                [ Click here to simulate saying phrase ]
              </button>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-2">
                <i className="fas fa-user-shield text-blue-500"></i>
                <p className="text-xs font-bold">{guardians.length}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">Active Guardians</p>
              </div>
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-2">
                <i className="fas fa-location-dot text-green-500"></i>
                <p className="text-xs font-bold">Secure</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">Location Status</p>
              </div>
            </div>
          </div>
        )}

        {/* Guardians Management View */}
        {!isSOSActive && view === 'guardians' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold">Your Circle</h2>
            <p className="text-xs text-slate-500 leading-relaxed">Add trusted family members or friends. We will email and text them immediately during an emergency.</p>
            
            <form onSubmit={addGuardian} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Add New Guardian</h3>
              <input required placeholder="Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" value={newGuardian.name} onChange={e => setNewGuardian({...newGuardian, name: e.target.value})} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input placeholder="Email" type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" value={newGuardian.email} onChange={e => setNewGuardian({...newGuardian, email: e.target.value})} />
                <input placeholder="Phone" type="tel" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" value={newGuardian.phone} onChange={e => setNewGuardian({...newGuardian, phone: e.target.value})} />
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <i className="fas fa-plus-circle text-xs"></i>
                <span>Add to Circle</span>
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Currently Protecting You</h3>
              {guardians.length === 0 ? (
                <div className="text-center py-10 text-slate-600 italic text-sm">No guardians added yet. Your safety is at risk.</div>
              ) : (
                guardians.map(g => (
                  <div key={g.id} className="bg-slate-900/40 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {g.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{g.name}</h4>
                        <div className="flex gap-3 text-[10px] text-slate-500 mt-0.5">
                          {g.email && <span><i className="fas fa-envelope mr-1"></i>Email</span>}
                          {g.phone && <span><i className="fas fa-phone mr-1"></i>SMS</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeGuardian(g.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-3xl border-t border-white/5 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center px-4">
          <button onClick={() => { setView('home'); setIsSOSActive(false); }} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' && !isSOSActive ? 'text-blue-500 scale-110' : 'text-slate-500'}`}>
            <i className="fas fa-house-chimney text-lg"></i>
            <span className="text-[10px] font-black tracking-widest">HOME</span>
          </button>
          
          <button 
            onClick={triggerSOS}
            className={`w-16 h-16 rounded-full flex items-center justify-center -mt-12 border-[6px] border-slate-950 shadow-2xl transition-all active:scale-90 ${isSOSActive ? 'bg-white text-red-600 scale-110 shadow-red-600/50' : 'bg-red-600 text-white shadow-red-600/30 hover:scale-105'}`}
          >
            <i className={`fas ${isSOSActive ? 'fa-exclamation-triangle' : 'fa-bolt-lightning'} text-xl`}></i>
          </button>

          <button onClick={() => { setView('guardians'); setIsSOSActive(false); }} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'guardians' ? 'text-blue-500 scale-110' : 'text-slate-500'}`}>
            <i className="fas fa-user-shield text-lg"></i>
            <span className="text-[10px] font-black tracking-widest">CIRCLE</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
