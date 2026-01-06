
import React, { useState, useEffect, useRef } from 'react';

// --- Data Types ---
interface TrustedPerson {
  id: string;
  name: string;
  email: string;
}

interface UserAccount {
  name: string;
  email: string;
  password: string;
  secretPhrase: string;
}

interface ChatMessage {
  id: string;
  sender: 'User' | 'Guardian' | 'AI';
  text: string;
  timestamp: Date;
}

const App: React.FC = () => {
  // --- Navigation & Auth State ---
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'home' | 'people' | 'settings'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // --- Safe Persistent Storage (Fixes potential blank screen on bad data) ---
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('gs_accounts_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse accounts:", e);
      return [];
    }
  });

  const [myPeople, setMyPeople] = useState<TrustedPerson[]>(() => {
    try {
      const saved = localStorage.getItem('gs_guardians_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('gs_chat_v2');
      if (!saved) return [];
      return JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch (e) {
      return [];
    }
  });

  // --- UI & Emergency State ---
  const [isEmergency, setIsEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [chatInput, setChatInput] = useState('');
  const recognitionRef = useRef<any>(null);

  // Auth Inputs
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phraseInput, setPhraseInput] = useState('');
  const [newPass, setNewPass] = useState('');

  // Circle Inputs
  const [gName, setGName] = useState('');
  const [gEmail, setGEmail] = useState('');

  // --- Sync State to LocalStorage ---
  useEffect(() => localStorage.setItem('gs_accounts_v2', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('gs_guardians_v2', JSON.stringify(myPeople)), [myPeople]);
  useEffect(() => localStorage.setItem('gs_chat_v2', JSON.stringify(messages)), [messages]);

  // Track Geolocation
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

  // --- Voice Recognition Setup ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && currentUser) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
          .toLowerCase();

        if (transcript.includes(currentUser.secretPhrase.toLowerCase())) {
          triggerSOS();
          recognition.stop();
        }
      };

      recognition.onend = () => {
        if (isListening && !isEmergency) {
          try { recognition.start(); } catch(e) {}
        }
      };
      recognitionRef.current = recognition;
    }
  }, [currentUser, isListening, isEmergency]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // --- Auth Handlers ---
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (accounts.find(a => a.email.toLowerCase() === normalizedEmail)) {
      alert("This email is already registered.");
      return;
    }
    const newUser = { name: nameInput.trim(), email: normalizedEmail, password: passInput, secretPhrase: phraseInput.trim() || "Help Me" };
    setAccounts([...accounts, newUser]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setView('home');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = emailInput.trim().toLowerCase();
    const found = accounts.find(a => a.email.toLowerCase() === normalizedEmail && a.password === passInput);
    if (found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      setView('home');
    } else {
      alert("Invalid email or password.");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = emailInput.trim().toLowerCase();
    const found = accounts.find(a => a.email.toLowerCase() === normalizedEmail);
    if (found) {
      setView('reset-password');
      setPhraseInput('');
    } else {
      alert(`No account found for ${emailInput}.`);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = emailInput.trim().toLowerCase();
    const foundIdx = accounts.findIndex(a => a.email.toLowerCase() === normalizedEmail);
    if (foundIdx !== -1 && phraseInput.trim().toLowerCase() === accounts[foundIdx].secretPhrase.toLowerCase()) {
      const updated = [...accounts];
      updated[foundIdx].password = newPass;
      setAccounts(updated);
      alert("Password updated! Please log in.");
      setView('login');
    } else {
      alert("Incorrect secret phrase.");
    }
  };

  // --- SOS Logic ---
  const triggerSOS = () => {
    if (myPeople.length === 0) {
      alert("Please add guardians in the 'Circle' tab before using SOS.");
      setView('people');
      return;
    }
    setIsEmergency(true);
    setIsListening(false);
    setMessages([{ id: Date.now().toString(), sender: 'AI', text: "🚨 EMERGENCY ALERT ACTIVE! Notifying guardians...", timestamp: new Date() }]);

    if (myPeople.length > 0) {
      const locStr = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : 'Unknown';
      const subject = encodeURIComponent(`URGENT: ${currentUser?.name} NEEDS HELP!`);
      const body = encodeURIComponent(`SOS Alert from GuardianSafe.\nLocation: ${locStr}\nUser: ${currentUser?.name}`);
      window.location.href = `mailto:${myPeople[0].email}?subject=${subject}&body=${body}`;
    }
  };

  // --- View Renders ---
  const renderAuth = () => {
    switch (view) {
      case 'login':
        return (
          <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-slate-900 text-center mb-8">Welcome Back</h2>
            <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" value={passInput} onChange={e => setPassInput(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400"><i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
            </div>
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">Sign In</button>
            <div className="flex justify-between text-xs font-bold text-slate-500 px-2">
              <button type="button" onClick={() => setView('register')}>Create Account</button>
              <button type="button" onClick={() => setView('forgot-password')}>Forgot Password?</button>
            </div>
          </form>
        );
      case 'register':
        return (
          <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-slate-900 text-center mb-8">Start Safe</h2>
            <input required placeholder="Your Name" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" value={nameInput} onChange={e => setNameInput(e.target.value)} />
            <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
            <input required type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <label className="text-[10px] font-black uppercase text-blue-600">Voice Trigger Phrase</label>
              <input required placeholder="e.g. Help Me" className="w-full bg-transparent outline-none text-xl font-bold mt-1 text-slate-900" value={phraseInput} onChange={e => setPhraseInput(e.target.value)} />
            </div>
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">Register</button>
            <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold">Already have an account? Login</button>
          </form>
        );
      case 'forgot-password':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-900 text-center mb-4">Reset Password</h2>
            <p className="text-xs text-slate-500 text-center mb-6">Enter your email to find your account.</p>
            <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">Search Account</button>
            <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold">Back to Login</button>
          </form>
        );
      case 'reset-password':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-900 text-center mb-4">Security Check</h2>
            <p className="text-xs text-slate-500 text-center mb-6">Verify your identity for: <span className="font-bold">{emailInput}</span></p>
            <input required placeholder="Enter Your Secret Phrase" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500" value={phraseInput} onChange={e => setPhraseInput(e.target.value)} />
            <input required type="password" placeholder="New Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500" value={newPass} onChange={e => setNewPass(e.target.value)} />
            <button className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg">Update Password</button>
          </form>
        );
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-2xl mb-4">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">GuardianSafe</h1>
            <p className="text-slate-500 font-bold mt-1">Intelligent Safety Shield</p>
          </div>
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
            {renderAuth()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isEmergency ? 'bg-red-600' : 'bg-slate-50'}`}>
      
      {!isEmergency && (
        <header className="p-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-heart"></i></div>
            <h1 className="font-black text-xl text-slate-900 tracking-tighter">GuardianSafe</h1>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><i className="fas fa-power-off"></i></button>
        </header>
      )}

      <main className="max-w-lg mx-auto p-6 pb-32">
        {isEmergency ? (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="text-center py-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-red-600 text-4xl mx-auto mb-4 animate-pulse shadow-2xl">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Emergency Active</h2>
              <p className="text-red-100 font-bold opacity-80">Location shared with guardians.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] flex flex-col h-[450px] shadow-2xl overflow-hidden border border-red-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-400">Guardian Chat</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm font-bold ${m.sender === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-900 rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); if(!chatInput) return; setMessages([...messages, {id: Date.now().toString(), sender: 'User', text: chatInput, timestamp: new Date()}]); setChatInput(''); }} className="p-4 bg-slate-50 flex gap-2 border-t border-slate-100">
                <input placeholder="Type message..." className="flex-1 bg-white p-4 rounded-2xl outline-none border border-slate-200 text-sm font-bold" value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all"><i className="fas fa-paper-plane"></i></button>
              </form>
            </div>

            <button onClick={() => setIsEmergency(false)} className="w-full bg-white text-red-600 font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest active:scale-95">I am safe now</button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-12 py-10 text-center animate-in fade-in duration-700">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Hello, {currentUser?.name}</h2>
                  <p className="text-slate-500 font-bold mt-2">Monitoring is <span className={isListening ? 'text-blue-600' : 'text-slate-400'}>{isListening ? 'ACTIVE' : 'OFF'}</span></p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-white border-[16px] border-slate-100 shadow-2xl flex flex-col items-center justify-center group active:scale-95 transition-all hover:border-red-50">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-widest uppercase">Panic SOS</span>
                    {isListening && <div className="absolute w-72 h-72 border-4 border-blue-500 rounded-full animate-ping opacity-10"></div>}
                  </button>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <button onClick={() => setIsListening(!isListening)} className={`w-full p-6 rounded-3xl flex items-center justify-between border-2 transition-all ${isListening ? 'bg-blue-600 border-blue-400 text-white shadow-blue-200' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <div className="flex items-center gap-3">
                      <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'} text-xl`}></i>
                      <span className="font-black text-xs uppercase tracking-widest">Voice Watch</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isListening ? 'bg-blue-400' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white ${isListening ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>
                  <p className="text-[10px] text-slate-400 font-bold italic">Trigger: "{currentUser?.secretPhrase}"</p>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter text-center">Guardian Circle</h2>
                <form onSubmit={e => { e.preventDefault(); setMyPeople([...myPeople, { id: Date.now().toString(), name: gName, email: gEmail.toLowerCase() }]); setGName(''); setGEmail(''); }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4">
                  <input required placeholder="Contact Name" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none font-bold" value={gName} onChange={e => setGName(e.target.value)} />
                  <input required type="email" placeholder="Contact Email" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none font-bold" value={gEmail} onChange={e => setGEmail(e.target.value)} />
                  <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase text-sm shadow-lg">Add Guardian</button>
                </form>
                <div className="space-y-4">
                  {myPeople.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-3xl flex justify-between items-center shadow-sm border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">{p.name[0]}</div>
                        <div>
                          <h4 className="font-black text-slate-900 leading-none">{p.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{p.email}</p>
                        </div>
                      </div>
                      <button onClick={() => setMyPeople(myPeople.filter(x => x.id !== p.id))} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors"><i className="fas fa-trash"></i></button>
                    </div>
                  ))}
                  {myPeople.length === 0 && <div className="text-center py-12 text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 italic px-6">Circle empty. Add someone you trust.</div>}
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter text-center">Security Setup</h2>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Secret Voice Phrase</label>
                    <input className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center border-2 border-slate-100 focus:border-blue-500 outline-none" value={currentUser?.secretPhrase} onChange={e => setCurrentUser(prev => prev ? {...prev, secretPhrase: e.target.value} : null)} />
                    <p className="text-xs text-slate-400 font-medium">Say this word anytime to trigger SOS.</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100 focus:border-blue-500 outline-none" value={currentUser?.name} onChange={e => setCurrentUser(prev => prev ? {...prev, name: e.target.value} : null)} />
                  </div>
                  <button onClick={() => setView('home')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95">Save Profile</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <div className="max-w-md mx-auto flex justify-around items-center">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
              <i className="fas fa-home text-2xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
            </button>
            <button onClick={triggerSOS} className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center -mt-12 border-8 border-slate-50 shadow-xl active:scale-90 transition-all hover:bg-red-500">
              <i className="fas fa-bolt text-2xl"></i>
            </button>
            <button onClick={() => setView('people')} className={`flex flex-col items-center gap-1 transition-all ${view === 'people' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
              <i className="fas fa-user-group text-2xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">Circle</span>
            </button>
            <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
              <i className="fas fa-gear text-2xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">Setup</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
