
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Shared Types ---
interface Contact {
  id: string;
  name: string;
  phone: string;
  isTrusted: boolean;
}

interface Message {
  id: string;
  sender: 'Me' | 'Contact' | 'System' | 'AI';
  text: string;
  timestamp: Date;
}

interface UserState {
  isLoggedIn: boolean;
  isSOSActive: boolean;
  name: string;
  location: { lat: number; lng: number } | null;
}

// --- Mock Data ---
const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Mom', phone: '+1 555-0101', isTrusted: true },
  { id: '2', name: 'Dad', phone: '+1 555-0102', isTrusted: true },
  { id: '3', name: 'Sister', phone: '+1 555-0103', isTrusted: true },
];

// --- Custom Components ---

const CustomChart: React.FC = () => (
  <svg viewBox="0 0 300 60" className="w-full h-12 opacity-50">
    <path d="M0 30 Q 50 10, 100 40 T 200 20 T 300 35" fill="none" stroke="#3b82f6" strokeWidth="2" />
  </svg>
);

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'home' | 'contacts' | 'chat'>('auth');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState<UserState>({
    isLoggedIn: false,
    isSOSActive: false,
    name: '',
    location: null,
  });
  const [contacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiAdvice, setAiAdvice] = useState<{ summary: string, steps: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition((pos) => {
        setUser(prev => ({ ...prev, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
      });
    }
  }, []);

  // --- Actions ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(prev => ({ ...prev, isLoggedIn: true, name: 'Alex' }));
    setView('home');
  };

  const triggerSOS = async () => {
    setUser(prev => ({ ...prev, isSOSActive: true }));
    const sosMsg: Message = {
      id: Date.now().toString(),
      sender: 'System',
      text: "🚨 EMERGENCY ALERT: SOS triggered. Broadcasting location to all trusted contacts.",
      timestamp: new Date()
    };
    setMessages(prev => [sosMsg, ...prev]);
    
    // Simulate sending to contacts
    contacts.filter(c => c.isTrusted).forEach(c => {
      console.log(`Sending SMS to ${c.name}: I need help! My location: ${user.location?.lat}, ${user.location?.lng}`);
    });

    // Get AI Advice
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `User is in an EMERGENCY SOS situation. Battery is 80%. Signal is strong. Provide 3 immediate survival steps. JSON format only.`;
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
  };

  const deactivateSOS = () => {
    setUser(prev => ({ ...prev, isSOSActive: false }));
    setAiAdvice(null);
  };

  // --- Sub-Views ---

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-md glass-card rounded-3xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/30">
              <i className="fas fa-shield-alt text-2xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">SafetyGuardian</h1>
            <p className="text-slate-400 mt-2">{isRegistering ? 'Create your secure account' : 'Welcome back, stay safe'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Full Name</label>
                <input required className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="John Doe" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Email Address</label>
              <input required type="email" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="name@email.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Password</label>
              <input required type="password" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="••••••••" />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-slate-950 transition-colors duration-500 ${user.isSOSActive ? 'bg-red-950/20' : ''}`}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.isSOSActive ? 'bg-red-600' : 'bg-blue-600'}`}>
            <i className="fas fa-shield-alt text-xs text-white"></i>
          </div>
          <span className="font-bold text-lg">Guardian</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] bg-slate-900 px-2 py-1 rounded-full border border-slate-800">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>LIVE GPS</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs border border-slate-700">
            {user.name[0]}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 p-4 space-y-6">
        
        {/* SOS OVERLAY / MODE */}
        {user.isSOSActive && (
          <div className="space-y-4 animate-in slide-in-from-top duration-500">
            <div className="bg-red-600 rounded-2xl p-6 text-center shadow-2xl shadow-red-600/30">
              <h2 className="text-2xl font-black text-white italic mb-1">SOS ACTIVE</h2>
              <p className="text-red-100 text-sm opacity-80">Emergency services and contacts notified.</p>
              <button 
                onClick={deactivateSOS}
                className="mt-4 bg-white text-red-600 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg"
              >
                Cancel Alert
              </button>
            </div>

            {aiAdvice && (
              <div className="glass-card border-red-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <i className="fas fa-brain"></i>
                  <span>AI SAFETY COMMAND</span>
                </div>
                <p className="text-sm text-slate-200">{aiAdvice.summary}</p>
                <div className="space-y-2">
                  {aiAdvice.steps.map((s, i) => (
                    <div key={i} className="flex gap-3 items-center text-xs bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                      <span className="w-5 h-5 flex-shrink-0 bg-red-600 rounded-full flex items-center justify-center font-bold">{i+1}</span>
                      <span className="text-slate-300">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Home View */}
        {view === 'home' && !user.isSOSActive && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={triggerSOS} className="col-span-2 h-40 rounded-3xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-center group active:scale-[0.97] transition-all hover:border-red-600/50">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-red-600 transition-colors">
                  <i className="fas fa-power-off text-2xl text-slate-400 group-hover:text-white"></i>
                </div>
                <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest">Emergency SOS</span>
              </button>

              <button className="h-28 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between hover:border-blue-500/50">
                <i className="fas fa-street-view text-blue-500 text-xl"></i>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Check-in</p>
                  <p className="text-[10px] text-slate-500">Update status</p>
                </div>
              </button>

              <button onClick={() => setView('contacts')} className="h-28 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between hover:border-blue-500/50">
                <i className="fas fa-user-friends text-green-500 text-xl"></i>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Contacts</p>
                  <p className="text-[10px] text-slate-500">Trusted circle</p>
                </div>
              </button>
            </div>

            <section className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-400">SAFETY INTEGRITY</h3>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Stable</span>
              </div>
              <CustomChart />
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>08:00 AM</span>
                <span>NOW</span>
              </div>
            </section>
          </>
        )}

        {/* Contacts View */}
        {view === 'contacts' && (
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Trusted Contacts</h2>
              <button className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <i className="fas fa-plus text-xs"></i>
              </button>
            </div>
            {contacts.map(contact => (
              <div key={contact.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                    <i className="fas fa-user text-slate-500"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{contact.name}</h4>
                    <p className="text-xs text-slate-500">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500">
                    <i className="fas fa-comment"></i>
                   </button>
                </div>
              </div>
            ))}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 text-center italic">
              Trusted contacts receive your location automatically during an SOS event.
            </div>
          </div>
        )}

        {/* Recent Activity List (Bottom of Main) */}
        {view === 'home' && messages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Activity</h3>
            {messages.map(m => (
              <div key={m.id} className="p-3 bg-slate-900/40 rounded-xl border border-white/5 text-xs animate-in slide-in-from-bottom-2">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-blue-400">{m.sender}</span>
                  <span className="opacity-40">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center z-50">
        <button 
          onClick={() => setView('home')} 
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <i className="fas fa-home text-lg"></i>
          <span className="text-[10px] font-bold">HOME</span>
        </button>
        <button 
          onClick={triggerSOS}
          className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center -mt-10 shadow-xl shadow-red-600/40 border-4 border-slate-950 active:scale-90 transition-transform"
        >
          <i className="fas fa-exclamation-triangle text-xl text-white"></i>
        </button>
        <button 
          onClick={() => setView('contacts')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'contacts' ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <i className="fas fa-users text-lg"></i>
          <span className="text-[10px] font-bold">CIRCLE</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
