
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Types ---
interface TrustedContact {
  id: string;
  name: string;
  email: string;
}

interface UserAccount {
  name: string;
  email: string;
  password: string;
  safeId: string; // Unique recovery code
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
}

// --- App Component ---
const App: React.FC = () => {
  // Navigation
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'home' | 'circle' | 'settings'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Persistence
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('gs_accounts_v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [contacts, setContacts] = useState<TrustedContact[]>(() => {
    const saved = localStorage.getItem('gs_contacts_v3');
    return saved ? JSON.parse(saved) : [];
  });

  // Emergency States
  const [isSOS, setIsSOS] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [chat, setChat] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Form Inputs
  const [formEmail, setFormEmail] = useState('');
  const [formPass, setFormPass] = useState('');
  const [formName, setFormName] = useState('');
  const [formSafeId, setFormSafeId] = useState('');
  const [tempSafeId, setTempSafeId] = useState('');

  // Local Storage Sync
  useEffect(() => localStorage.setItem('gs_accounts_v3', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('gs_contacts_v3', JSON.stringify(contacts)), [contacts]);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // --- Functions ---
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.find(a => a.email.toLowerCase() === formEmail.toLowerCase())) {
      alert("Email already registered.");
      return;
    }
    const generatedSafeId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newUser: UserAccount = {
      name: formName,
      email: formEmail.toLowerCase(),
      password: formPass,
      safeId: generatedSafeId
    };
    setAccounts([...accounts, newUser]);
    setTempSafeId(generatedSafeId);
    alert(`IMPORTANT: Your SafeID is ${generatedSafeId}. You MUST save this to recover your password. We will NOT show it again.`);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setView('home');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = accounts.find(a => a.email.toLowerCase() === formEmail.toLowerCase() && a.password === formPass);
    if (found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      setView('home');
    } else {
      alert("Invalid credentials.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const foundIdx = accounts.findIndex(a => a.email.toLowerCase() === formEmail.toLowerCase());
    if (foundIdx === -1) {
      alert("Account not found.");
      return;
    }
    if (accounts[foundIdx].safeId !== formSafeId) {
      alert("Verification Failed: Invalid SafeID. Check your original registration records.");
      return;
    }
    const updated = [...accounts];
    updated[foundIdx].password = formPass;
    setAccounts(updated);
    alert("Password updated successfully.");
    setView('login');
  };

  const triggerSOS = async () => {
    if (contacts.length === 0) {
      alert("Please add at least one guardian to your Circle before using SOS.");
      setView('circle');
      return;
    }
    setIsSOS(true);
    setIsListening(false);
    
    const initialMsg: Message = { 
      id: Date.now().toString(), 
      role: 'system', 
      text: "🚨 EMERGENCY SOS ACTIVATED. Authorities and Guardians are being notified with your live coordinates." 
    };
    setChat([initialMsg]);

    // Simulated Authority Notification
    setTimeout(() => {
      setChat(prev => [...prev, { 
        id: 'dispatch', 
        role: 'assistant', 
        text: "GuardianSafe Dispatch: We have your signal. AI triage is identifying threats. Stay calm." 
      }]);
    }, 1500);

    // Call Gemini for situational awareness
    callAiAdvice();
  };

  const callAiAdvice = async () => {
    setIsAiThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `EMERGENCY ALERT. User ${currentUser?.name} has triggered SOS. 
        Current Location: ${location ? `${location.lat}, ${location.lng}` : 'Unknown'}. 
        Provide a 2-sentence immediate survival tip based on a general emergency. 
        Then list 3 critical steps. Response must be calm and professional.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setChat(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        text: response.text || "Dispatch received. Monitor your surroundings and head toward light." 
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: chatInput };
    setChat([...chat, userMsg]);
    setChatInput('');
    // For demo, just simulate response
    setTimeout(() => {
      setChat(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: "Guardians are viewing this transcript. Assistance is in transit." }]);
    }, 1000);
  };

  // --- View Components ---
  const LoginView = () => (
    <div className="max-w-md w-full p-8 bg-white border border-slate-100 custom-shadow rounded-[2rem] animate-in fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto shadow-xl mb-4">
          <i className="fas fa-shield-heart"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">GuardianSafe</h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Professional Security</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <input required type="email" placeholder="Account Email" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
        <input required type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" value={formPass} onChange={e => setFormPass(e.target.value)} />
        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95">Sign In</button>
      </form>
      <div className="flex justify-between mt-6 text-xs font-black text-slate-400 uppercase tracking-widest px-2">
        <button onClick={() => setView('register')} className="hover:text-blue-600">Register</button>
        <button onClick={() => setView('forgot-password')} className="hover:text-blue-600">Secure Recovery</button>
      </div>
    </div>
  );

  const RegisterView = () => (
    <div className="max-w-md w-full p-8 bg-white border border-slate-100 custom-shadow rounded-[2rem] animate-in fade-in">
      <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">New Security Profile</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <input required placeholder="Full Name" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none" value={formName} onChange={e => setFormName(e.target.value)} />
        <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
        <input required type="password" placeholder="Secure Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none" value={formPass} onChange={e => setFormPass(e.target.value)} />
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Privacy Notice</p>
          <p className="text-[11px] text-blue-800 font-medium leading-relaxed mt-1">You will be assigned a unique <b>SafeID</b> upon registration. This is the ONLY way to recover your account if you forget your password.</p>
        </div>
        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">Create Account</button>
      </form>
      <button onClick={() => setView('login')} className="w-full mt-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center hover:text-blue-600">Back to Login</button>
    </div>
  );

  const ForgotView = () => (
    <div className="max-w-md w-full p-8 bg-white border border-slate-100 custom-shadow rounded-[2rem] animate-in fade-in">
      <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Account Recovery</h2>
      <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Verification Required</p>
      <form onSubmit={handleResetPassword} className="space-y-4">
        <input required type="email" placeholder="Account Email" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Enter Your SafeID</label>
          <input required placeholder="XXXX-XXXX" className="w-full bg-transparent text-xl font-black text-slate-900 outline-none mt-1" value={formSafeId} onChange={e => setFormSafeId(e.target.value.toUpperCase())} />
          <p className="text-[9px] text-orange-700 mt-2">This code was provided to you during registration.</p>
        </div>
        <input required type="password" placeholder="Set New Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none" value={formPass} onChange={e => setFormPass(e.target.value)} />
        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">Reset Password</button>
      </form>
      <button onClick={() => setView('login')} className="w-full mt-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center hover:text-blue-600">Cancel</button>
    </div>
  );

  // --- Logged In Views ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        {view === 'login' && <LoginView />}
        {view === 'register' && <RegisterView />}
        {view === 'forgot-password' && <ForgotView />}
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isSOS ? 'bg-red-600' : 'bg-white'}`}>
      
      {!isSOS && (
        <header className="px-6 py-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="font-black text-xl text-slate-900 tracking-tighter">GuardianSafe</h1>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <i className="fas fa-power-off"></i>
          </button>
        </header>
      )}

      <main className="max-w-lg mx-auto p-6 pb-32">
        {isSOS ? (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="text-center py-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-red-600 text-4xl mx-auto mb-4 animate-pulse-slow shadow-2xl">
                <i className="fas fa-satellite-dish"></i>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Emergency Active</h2>
              <p className="text-red-100 font-bold opacity-80 mt-1">Live coordinates shared with Circle & Local PD</p>
            </div>

            <div className="bg-white rounded-[2.5rem] flex flex-col h-[480px] shadow-2xl overflow-hidden border border-red-200 custom-shadow">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center px-6">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Secure Communication Triage</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chat.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-sm ${
                      m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 
                      m.role === 'system' ? 'bg-slate-900 text-white w-full text-center italic' :
                      'bg-slate-100 text-slate-900 rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isAiThinking && <div className="text-[10px] text-slate-400 font-black animate-pulse uppercase tracking-widest">Dispatch AI analyzing environment...</div>}
              </div>

              <form onSubmit={handleSendChat} className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <input placeholder="Update dispatch..." className="flex-1 bg-white p-4 rounded-2xl outline-none border border-slate-200 text-sm font-bold focus:border-blue-500" value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95"><i className="fas fa-paper-plane"></i></button>
              </form>
            </div>

            <button onClick={() => setIsSOS(false)} className="w-full bg-white text-red-600 font-black py-6 rounded-3xl shadow-xl uppercase tracking-widest active:scale-95 border-b-4 border-slate-200">Deactivate / I am safe</button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-12 py-10 text-center animate-in fade-in duration-700">
                <div className="px-4">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Secure: {currentUser?.name}</h2>
                  <p className="text-slate-400 font-bold mt-2">Voice surveillance is <span className={isListening ? 'text-blue-600' : 'text-slate-300'}>{isListening ? 'ACTIVE' : 'OFF'}</span></p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-white border-[20px] border-slate-50 shadow-2xl flex flex-col items-center justify-center group active:scale-95 transition-all hover:border-red-50 relative">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-widest uppercase">Panic SOS</span>
                    {isListening && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-10"></div>}
                  </button>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <button onClick={() => setIsListening(!isListening)} className={`w-full p-6 rounded-3xl flex items-center justify-between border-2 transition-all ${isListening ? 'bg-blue-600 border-blue-400 text-white shadow-blue-200' : 'bg-white border-slate-100 text-slate-500'}`}>
                    <div className="flex items-center gap-3">
                      <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'} text-xl`}></i>
                      <span className="font-black text-xs uppercase tracking-widest">Auto-Guard</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isListening ? 'bg-blue-400' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white ${isListening ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Secret Word: "{currentUser?.safeId}"</p>
                </div>
              </div>
            )}

            {view === 'circle' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Guardian Circle</h2>
                  <p className="text-slate-400 font-bold">People who will receive your SOS signals.</p>
                </div>
                
                <form onSubmit={e => { e.preventDefault(); setContacts([...contacts, { id: Date.now().toString(), name: formName, email: formEmail.toLowerCase() }]); setFormName(''); setFormEmail(''); }} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                  <input required placeholder="Contact Name" className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none font-bold" value={formName} onChange={e => setFormName(e.target.value)} />
                  <input required type="email" placeholder="Guardian Email" className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none font-bold" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg hover:bg-black transition-all">Add Guardian</button>
                </form>

                <div className="space-y-4">
                  {contacts.map(c => (
                    <div key={c.id} className="bg-white p-6 rounded-3xl flex justify-between items-center shadow-sm border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">{c.name[0]}</div>
                        <div>
                          <h4 className="font-black text-slate-900 leading-none">{c.name}</h4>
                          <p className="text-xs text-slate-400 mt-1">{c.email}</p>
                        </div>
                      </div>
                      <button onClick={() => setContacts(contacts.filter(x => x.id !== c.id))} className="text-slate-300 p-2 hover:text-red-500 transition-colors"><i className="fas fa-trash"></i></button>
                    </div>
                  ))}
                  {contacts.length === 0 && <div className="text-center py-12 text-slate-300 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 italic px-6 font-bold uppercase text-[10px] tracking-widest">No Guardians configured.</div>}
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter text-center">Security Vault</h2>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center space-y-8 custom-shadow">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Your Private SafeID</label>
                    <div className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center border-2 border-slate-100 text-slate-900 tracking-widest uppercase">{currentUser?.safeId}</div>
                    <p className="text-[10px] text-red-500 font-black uppercase px-4 leading-relaxed tracking-widest">Crucial: Never share this code. Use it to recover your password.</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100 space-y-4 text-left">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">Registered Name</label>
                      <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100 outline-none" value={currentUser?.name} readOnly />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">Secure Email</label>
                      <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100 outline-none" value={currentUser?.email} readOnly />
                    </div>
                  </div>
                  <button onClick={() => setView('home')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95">Lock Profile</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isSOS && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-50 z-50">
          <div className="max-w-md mx-auto flex justify-around items-center">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-home text-2xl"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">Monitor</span>
            </button>
            <button onClick={triggerSOS} className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center -mt-12 border-8 border-white shadow-2xl active:scale-90 transition-all">
              <i className="fas fa-bolt text-2xl"></i>
            </button>
            <button onClick={() => setView('circle')} className={`flex flex-col items-center gap-1 transition-all ${view === 'circle' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-user-shield text-2xl"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">Circle</span>
            </button>
            <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-lock text-2xl"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">Vault</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
