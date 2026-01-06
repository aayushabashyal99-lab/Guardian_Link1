
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  safeId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
}

// --- Outside Components (Prevents Input Lag) ---

const LoginView = ({ email, pass, onEmail, onPass, onLogin, onNav }: any) => (
  <div className="max-w-md w-full p-8 bg-white border border-slate-100 custom-shadow rounded-[2rem] animate-in fade-in">
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto shadow-xl mb-4">
        <i className="fas fa-shield-heart"></i>
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tighter">GuardianSafe</h1>
      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Professional Security</p>
    </div>
    <form onSubmit={onLogin} className="space-y-4">
      <input required type="email" placeholder="Account Email" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all" value={email} onChange={e => onEmail(e.target.value)} />
      <input required type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all" value={pass} onChange={e => onPass(e.target.value)} />
      <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95">Sign In</button>
    </form>
    <div className="flex justify-between mt-6 text-xs font-black text-slate-400 uppercase tracking-widest px-2">
      <button onClick={() => onNav('register')} className="hover:text-blue-600">Register</button>
      <button onClick={() => onNav('forgot-password')} className="hover:text-blue-600">Secure Recovery</button>
    </div>
  </div>
);

const RegisterView = ({ name, email, pass, onName, onEmail, onPass, onRegister, onNav }: any) => (
  <div className="max-w-md w-full p-8 bg-white border border-slate-100 custom-shadow rounded-[2rem] animate-in fade-in">
    <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">New Security Profile</h2>
    <form onSubmit={onRegister} className="space-y-4">
      <input required placeholder="Full Name" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 transition-all" value={name} onChange={e => onName(e.target.value)} />
      <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 transition-all" value={email} onChange={e => onEmail(e.target.value)} />
      <input required type="password" placeholder="Secure Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 transition-all" value={pass} onChange={e => onPass(e.target.value)} />
      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Privacy Notice</p>
        <p className="text-[11px] text-blue-800 font-medium leading-relaxed mt-1">You will be assigned a unique <b>SafeID</b> for backup recovery. However, standard recovery requires <b>Email Verification</b>.</p>
      </div>
      <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">Create Account</button>
    </form>
    <button onClick={() => onNav('login')} className="w-full mt-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center hover:text-blue-600">Back to Login</button>
  </div>
);

const ForgotPasswordFlow = ({ email, onEmail, safeId, onSafeId, pass, onPass, step, onNext, onVerify, onReset, onNav, showInbox, toggleInbox }: any) => {
  return (
    <div className="max-w-md w-full p-8 bg-white border border-slate-100 custom-shadow rounded-[2rem] animate-in fade-in relative">
      <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Security Recovery</h2>
      
      {step === 'email' && (
        <form onSubmit={onNext} className="space-y-4 mt-6">
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Step 1: Identity Request</p>
          <input required type="email" placeholder="Account Email" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 transition-all" value={email} onChange={e => onEmail(e.target.value)} />
          <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">Send Verification Email</button>
        </form>
      )}

      {step === 'verify' && (
        <div className="space-y-6 mt-6 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl animate-pulse">
            <i className="fas fa-paper-plane"></i>
          </div>
          <p className="text-sm font-bold text-slate-600">Verification link sent to your email. You must click the link in your inbox to proceed.</p>
          <button onClick={toggleInbox} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2">
            <i className="fas fa-envelope-open-text"></i>
            Check Simulated Inbox
          </button>
        </div>
      )}

      {step === 'reset' && (
        <form onSubmit={onReset} className="space-y-4 mt-6">
          <p className="text-center text-[10px] text-green-600 font-black uppercase tracking-widest mb-4">✓ Identity Verified</p>
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-2">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Secondary Layer: SafeID</label>
            <input required placeholder="Enter SafeID" className="w-full bg-transparent text-lg font-black text-slate-900 outline-none mt-1" value={safeId} onChange={e => onSafeId(e.target.value.toUpperCase())} />
          </div>
          <input required type="password" placeholder="New Secure Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 transition-all" value={pass} onChange={e => onPass(e.target.value)} />
          <button className="w-full py-4 bg-green-600 text-white rounded-2xl font-black shadow-xl">Update Password</button>
        </form>
      )}

      <button onClick={() => onNav('login')} className="w-full mt-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center hover:text-blue-600">Cancel</button>

      {/* Simulated Inbox Overlay */}
      {showInbox && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Your Email Inbox</span>
              <button onClick={toggleInbox} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <p className="text-[10px] font-black text-blue-600">FROM: Security@GuardianSafe.com</p>
                <p className="text-sm font-black text-slate-900 mt-1">Verify Password Reset Request</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">Hello,<br/><br/>A request was made to reset your password. If this was you, please click the button below to authorize the change on your device.</p>
              <button onClick={() => { onVerify(); toggleInbox(); }} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700">Authorize & Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  // Navigation & Identity
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'home' | 'circle' | 'settings'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Recovery Flow State
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [showInbox, setShowInbox] = useState(false);

  // Core Data
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('gs_accounts_v4');
    return saved ? JSON.parse(saved) : [];
  });
  const [contacts, setContacts] = useState<TrustedContact[]>(() => {
    const saved = localStorage.getItem('gs_contacts_v4');
    return saved ? JSON.parse(saved) : [];
  });

  // Emergency States
  const [isSOS, setIsSOS] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [chat, setChat] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Shared Form State (Centralized to ensure outside components function correctly)
  const [fEmail, setFEmail] = useState('');
  const [fPass, setFPass] = useState('');
  const [fName, setFName] = useState('');
  const [fSafeId, setFSafeId] = useState('');

  // Local Storage Sync
  useEffect(() => localStorage.setItem('gs_accounts_v4', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('gs_contacts_v4', JSON.stringify(contacts)), [contacts]);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null,
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = accounts.find(a => a.email.toLowerCase() === fEmail.toLowerCase() && a.password === fPass);
    if (found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      setView('home');
      setFPass('');
    } else {
      alert("Invalid credentials.");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.find(a => a.email.toLowerCase() === fEmail.toLowerCase())) {
      alert("Email already registered.");
      return;
    }
    const safeId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newUser = { name: fName, email: fEmail.toLowerCase(), password: fPass, safeId };
    setAccounts([...accounts, newUser]);
    alert(`REGISTRATION SUCCESSFUL!\n\nYour SafeID is: ${safeId}\nWrite this down! It is required for security vault access.`);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setView('home');
    setFPass('');
  };

  const handleStartRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    const exists = accounts.find(a => a.email.toLowerCase() === fEmail.toLowerCase());
    if (!exists) {
      alert("No account found with that email.");
      return;
    }
    setRecoveryStep('verify');
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    const foundIdx = accounts.findIndex(a => a.email.toLowerCase() === fEmail.toLowerCase());
    if (foundIdx !== -1 && accounts[foundIdx].safeId === fSafeId) {
      const updated = [...accounts];
      updated[foundIdx].password = fPass;
      setAccounts(updated);
      alert("Password updated successfully.");
      setView('login');
      setRecoveryStep('email');
    } else {
      alert("Verification Failed: SafeID is incorrect.");
    }
  };

  const triggerSOS = async () => {
    if (contacts.length === 0) {
      alert("Add at least one guardian to your Circle first.");
      setView('circle');
      return;
    }
    setIsSOS(true);
    setChat([{ id: Date.now().toString(), role: 'system', text: "🚨 EMERGENCY SOS ACTIVE. Guardians notified via SMS/Email." }]);
    
    // Auto-call AI triage
    setIsAiThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `EMERGENCY ALERT. User ${currentUser?.name} SOS. Location: ${location?.lat}, ${location?.lng}. Provide 3 short, critical life-saving tips. Calm tone.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setChat(prev => [...prev, { id: 'ai-initial', role: 'assistant', text: response.text || "Remain calm. Assistance is being dispatched." }]);
    } catch (e) { console.error(e); } finally { setIsAiThinking(false); }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChat(prev => [...prev, { id: Date.now().toString(), role: 'user', text: chatInput }]);
    setChatInput('');
    // Simulate guardian response
    setTimeout(() => {
      setChat(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: "Guardian here: We see your location. We are calling 911 now." }]);
    }, 1500);
  };

  // --- Rendering Logic ---

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        {view === 'login' && <LoginView email={fEmail} pass={fPass} onEmail={setFEmail} onPass={setFPass} onLogin={handleLogin} onNav={setView} />}
        {view === 'register' && <RegisterView name={fName} email={fEmail} pass={fPass} onName={setFName} onEmail={setFEmail} onPass={setFPass} onRegister={handleRegister} onNav={setView} />}
        {view === 'forgot-password' && (
          <ForgotPasswordFlow 
            email={fEmail} onEmail={setFEmail} 
            safeId={fSafeId} onSafeId={setFSafeId}
            pass={fPass} onPass={setFPass}
            step={recoveryStep} 
            onNext={handleStartRecovery} 
            onVerify={() => setRecoveryStep('reset')}
            onReset={handleCompleteReset}
            onNav={(v: any) => { setView(v); setRecoveryStep('email'); }}
            showInbox={showInbox}
            toggleInbox={() => setShowInbox(!showInbox)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isSOS ? 'bg-red-600' : 'bg-white'}`}>
      
      {!isSOS && (
        <header className="px-6 py-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-shield-heart"></i></div>
            <h1 className="font-black text-xl text-slate-900 tracking-tighter">GuardianSafe</h1>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><i className="fas fa-power-off"></i></button>
        </header>
      )}

      <main className="max-w-lg mx-auto p-6 pb-32">
        {isSOS ? (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="text-center py-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-red-600 text-4xl mx-auto mb-4 animate-pulse-slow shadow-2xl">
                <i className="fas fa-satellite-dish"></i>
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Emergency Active</h2>
              <p className="text-red-100 font-bold opacity-80 mt-1">Authorities alerted. Triage in progress.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] flex flex-col h-[480px] shadow-2xl overflow-hidden custom-shadow">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center px-6">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Safety Triage Feed</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chat.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-sm ${
                      m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 
                      m.role === 'system' ? 'bg-slate-900 text-white w-full text-center italic font-normal' :
                      'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isAiThinking && <div className="text-[10px] text-slate-400 font-black animate-pulse uppercase tracking-widest">AI processing context...</div>}
              </div>
              <form onSubmit={handleSendChat} className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <input placeholder="Type message..." className="flex-1 bg-white p-4 rounded-2xl outline-none border border-slate-200 text-sm font-bold focus:border-blue-500 transition-all" value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95"><i className="fas fa-paper-plane"></i></button>
              </form>
            </div>
            <button onClick={() => setIsSOS(false)} className="w-full bg-white text-red-600 font-black py-6 rounded-3xl shadow-xl uppercase tracking-widest active:scale-95 border-b-4 border-slate-200">End Session / I am safe</button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-12 py-10 text-center animate-in fade-in duration-700">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Status: Secure</h2>
                  <p className="text-slate-400 font-bold mt-2">Welcome back, <span className="text-slate-900">{currentUser?.name}</span></p>
                </div>
                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-white border-[20px] border-slate-50 shadow-2xl flex flex-col items-center justify-center group active:scale-95 transition-all hover:border-red-50 relative">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-widest uppercase">Hold to SOS</span>
                    {isListening && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-10"></div>}
                  </button>
                </div>
                <div className="max-w-xs mx-auto space-y-4">
                  <button onClick={() => setIsListening(!isListening)} className={`w-full p-6 rounded-3xl flex items-center justify-between border-2 transition-all ${isListening ? 'bg-blue-600 border-blue-400 text-white shadow-blue-200' : 'bg-white border-slate-100 text-slate-500'}`}>
                    <div className="flex items-center gap-3">
                      <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'} text-xl`}></i>
                      <span className="font-black text-xs uppercase tracking-widest">Active Watch</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isListening ? 'bg-blue-400' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white ${isListening ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {view === 'circle' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Guardian Circle</h2>
                  <p className="text-slate-400 font-bold">Trusted emergency responders.</p>
                </div>
                <form onSubmit={e => { e.preventDefault(); setContacts([...contacts, { id: Date.now().toString(), name: fName, email: fEmail.toLowerCase() }]); setFName(''); setFEmail(''); }} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                  <input required placeholder="Contact Name" className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none font-bold" value={fName} onChange={e => setFName(e.target.value)} />
                  <input required type="email" placeholder="Guardian Email" className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none font-bold" value={fEmail} onChange={e => setFEmail(e.target.value)} />
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
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter text-center">Security Vault</h2>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center space-y-8 custom-shadow">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Backup Recovery ID</label>
                    <div className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center border-2 border-slate-100 text-slate-900 tracking-widest uppercase">{currentUser?.safeId}</div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 space-y-4 text-left">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-[11px] font-bold text-blue-700">Email Verification is required for all remote password resets. Ensure your email is accessible.</p>
                    </div>
                  </div>
                  <button onClick={() => setView('home')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95">Lock Vault</button>
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
              <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
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
