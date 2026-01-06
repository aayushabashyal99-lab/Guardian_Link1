
import React, { useState, useEffect, useRef } from 'react';

// --- Data Types ---
interface TrustedPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  // --- Auth & Navigation State ---
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'home' | 'people' | 'settings'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  
  // --- Persistent Storage Management ---
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('gs_accounts_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [myPeople, setMyPeople] = useState<TrustedPerson[]>(() => {
    const saved = localStorage.getItem('gs_guardians_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('gs_chat_history');
    return saved ? JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [];
  });

  // --- UI & Emergency State ---
  const [isEmergency, setIsEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [chatInput, setChatInput] = useState('');
  const recognitionRef = useRef<any>(null);

  // Form Inputs
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phraseInput, setPhraseInput] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPass, setNewPass] = useState('');

  // Guardian Form
  const [gName, setGName] = useState('');
  const [gEmail, setGEmail] = useState('');

  // --- Persistence Side Effects ---
  useEffect(() => {
    localStorage.setItem('gs_accounts_db', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('gs_guardians_db', JSON.stringify(myPeople));
  }, [myPeople]);

  useEffect(() => {
    localStorage.setItem('gs_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Track location
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

  // --- Voice Recognition ---
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

  // --- Auth Actions ---
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.find(a => a.email === emailInput)) {
      alert("Email already exists!");
      return;
    }
    const newUser: UserAccount = {
      name: nameInput,
      email: emailInput,
      password: passInput,
      secretPhrase: phraseInput || "Help Me"
    };
    setAccounts([...accounts, newUser]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setView('home');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = accounts.find(a => a.email === emailInput && a.password === passInput);
    if (found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      setView('home');
    } else {
      alert("Invalid credentials!");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const found = accounts.find(a => a.email === resetEmail);
    if (found) {
      setView('reset-password');
    } else {
      alert("Account not found with this email.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const found = accounts.find(a => a.email === resetEmail);
    if (found && phraseInput === found.secretPhrase) {
      const updatedAccounts = accounts.map(a => 
        a.email === resetEmail ? { ...a, password: newPass } : a
      );
      setAccounts(updatedAccounts);
      alert("Password reset successful! Please log in.");
      setView('login');
    } else {
      alert("Secret phrase is incorrect!");
    }
  };

  // --- SOS Logic ---
  const triggerSOS = () => {
    if (myPeople.length === 0) {
      alert("Add guardians first in the 'Circle' tab!");
      setView('people');
      return;
    }
    setIsEmergency(true);
    setIsListening(false);
    
    const alertMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'AI',
      text: "🚨 EMERGENCY ALERT TRIGGERED! Notifying guardians now.",
      timestamp: new Date()
    };
    setMessages([alertMsg]);

    // Automatic email trigger
    if (myPeople.length > 0) {
      const p = myPeople[0];
      const locStr = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : 'Unknown';
      const subject = encodeURIComponent(`URGENT: ${currentUser?.name} NEEDS HELP!`);
      const body = encodeURIComponent(`This is an SOS alert from GuardianSafe. ${currentUser?.name} is in danger.\nLive Location: ${locStr}`);
      window.location.href = `mailto:${p.email}?subject=${subject}&body=${body}`;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg: ChatMessage = { id: Date.now().toString(), sender: 'User', text: chatInput, timestamp: new Date() };
    setMessages([...messages, msg]);
    setChatInput('');
    // Mock Response
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'Guardian', text: "I'm coming! Stay on the line.", timestamp: new Date() }]);
    }, 2000);
  };

  // --- Views ---
  const renderAuth = () => {
    if (view === 'login') return (
      <form onSubmit={handleLogin} className="space-y-4 w-full animate-in fade-in duration-500">
        <h2 className="text-3xl font-black text-center mb-8">Sign In</h2>
        <input required type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
        <div className="relative">
          <input required type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none" value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <button className="w-full py-4 bg-blue-600 rounded-2xl font-bold shadow-xl">Login</button>
        <div className="flex justify-between text-xs text-slate-500 font-bold px-2">
          <button type="button" onClick={() => setView('register')}>Create Account</button>
          <button type="button" onClick={() => setView('forgot-password')}>Forgot Password?</button>
        </div>
      </form>
    );

    if (view === 'register') return (
      <form onSubmit={handleRegister} className="space-y-4 w-full animate-in fade-in duration-500">
        <h2 className="text-3xl font-black text-center mb-8">Join GuardianSafe</h2>
        <input required placeholder="Full Name" className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none" value={nameInput} onChange={e => setNameInput(e.target.value)} />
        <input required type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
        <div className="relative">
          <input required type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none" value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
          <label className="text-[10px] font-bold uppercase text-blue-400">Secret Recovery Phrase</label>
          <input required placeholder="e.g. Blue Phoenix" className="w-full bg-transparent outline-none text-xl font-bold mt-1" value={phraseInput} onChange={e => setPhraseInput(e.target.value)} />
        </div>
        <button className="w-full py-4 bg-blue-600 rounded-2xl font-bold shadow-xl">Register</button>
        <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold">Back to Login</button>
      </form>
    );

    if (view === 'forgot-password') return (
      <form onSubmit={handleForgotPassword} className="space-y-4 w-full animate-in fade-in duration-500">
        <h2 className="text-2xl font-black text-center mb-8">Identify Account</h2>
        <input required type="email" placeholder="Enter your email" className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
        <button className="w-full py-4 bg-blue-600 rounded-2xl font-bold shadow-xl">Next</button>
        <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold">Back to Login</button>
      </form>
    );

    if (view === 'reset-password') return (
      <form onSubmit={handleResetPassword} className="space-y-4 w-full animate-in fade-in duration-500">
        <h2 className="text-2xl font-black text-center mb-8">Reset Password</h2>
        <p className="text-xs text-slate-400 text-center mb-4">Enter your secret phrase to set a new password.</p>
        <input required placeholder="Your Secret Phrase" className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none" value={phraseInput} onChange={e => setPhraseInput(e.target.value)} />
        <div className="relative">
          <input required type={showPassword ? "text" : "password"} placeholder="New Password" className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 outline-none" value={newPass} onChange={e => setNewPass(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <button className="w-full py-4 bg-green-600 rounded-2xl font-bold shadow-xl">Update Password</button>
      </form>
    );

    return null;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-2xl mb-4">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">GuardianSafe</h1>
            <p className="text-slate-500 font-bold">Always Protected.</p>
          </div>
          {renderAuth()}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${isEmergency ? 'bg-red-900' : 'bg-slate-900'}`}>
      
      {!isEmergency && (
        <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-heart"></i></div>
            <h1 className="font-black text-xl tracking-tighter">GuardianSafe</h1>
          </div>
          <button onClick={() => {setIsLoggedIn(false); setView('login')}} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500"><i className="fas fa-power-off"></i></button>
        </header>
      )}

      <main className="flex-1 p-6 pb-32 max-w-lg mx-auto w-full">
        {isEmergency ? (
          <div className="h-full flex flex-col space-y-6 animate-in zoom-in duration-500">
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-700 text-3xl mx-auto mb-4 animate-pulse shadow-2xl">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Emergency Mode</h2>
              <p className="text-red-100 font-bold opacity-80">Guardians notified of your location.</p>
            </div>

            {/* Chat Box */}
            <div className="flex-1 glass-card rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl min-h-[450px]">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Guardian Response Chat</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl text-sm font-bold ${
                      m.sender === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'
                    }`}>
                      <p>{m.text}</p>
                      <p className="text-[8px] opacity-30 mt-1 text-right">{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-black/40 flex gap-2">
                <input placeholder="Type message..." className="flex-1 bg-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 outline-none border border-white/10 text-sm font-bold" value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-700 shadow-xl active:scale-90 transition-all"><i className="fas fa-paper-plane"></i></button>
              </form>
            </div>

            <button onClick={() => setIsEmergency(false)} className="w-full bg-white text-red-700 font-black py-5 rounded-3xl shadow-2xl uppercase tracking-widest active:scale-95">I'M SAFE NOW</button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-10 py-10 text-center animate-in fade-in duration-500">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter">Hi, {currentUser?.name}</h2>
                  <p className="text-slate-500 font-bold mt-2">Safety monitoring is {isListening ? 'ACTIVE' : 'OFF'}</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-slate-800 border-[20px] border-slate-800/50 flex flex-col items-center justify-center shadow-2xl active:scale-95 group transition-all hover:border-red-600/20 relative">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-500 tracking-widest uppercase">Manual SOS</span>
                    {isListening && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20"></div>}
                  </button>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <button onClick={() => setIsListening(!isListening)} className={`w-full p-6 rounded-3xl flex items-center justify-between border-2 transition-all ${isListening ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                    <div className="flex items-center gap-3">
                      <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'} text-xl`}></i>
                      <span className="font-black text-xs uppercase tracking-widest">{isListening ? 'Listening' : 'Voice Off'}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative ${isListening ? 'bg-blue-400' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white ${isListening ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>
                  <p className="text-[10px] text-slate-600 font-bold italic">Trigger Phrase: "{currentUser?.secretPhrase}"</p>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <h2 className="text-3xl font-black text-center">Guardian Circle</h2>
                <form onSubmit={e => { e.preventDefault(); setMyPeople([...myPeople, { id: Date.now().toString(), name: gName, email: gEmail, phone: '' }]); setGName(''); setGEmail(''); }} className="bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
                  <input required placeholder="Name" className="w-full p-4 bg-slate-900 border-2 border-transparent focus:border-blue-500 outline-none font-bold rounded-2xl" value={gName} onChange={e => setGName(e.target.value)} />
                  <input required placeholder="Email" type="email" className="w-full p-4 bg-slate-900 border-2 border-transparent focus:border-blue-500 outline-none font-bold rounded-2xl" value={gEmail} onChange={e => setGEmail(e.target.value)} />
                  <button className="w-full bg-blue-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl">Add Guardian</button>
                </form>

                <div className="space-y-4">
                  {myPeople.map(p => (
                    <div key={p.id} className="bg-slate-800 p-6 rounded-3xl flex items-center justify-between border border-slate-700">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-xl font-bold">{p.name[0]}</div>
                        <div>
                          <h4 className="font-black leading-none">{p.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{p.email}</p>
                        </div>
                      </div>
                      <button onClick={() => setMyPeople(myPeople.filter(x => x.id !== p.id))} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <h2 className="text-3xl font-black text-center">Safety Setup</h2>
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-8 shadow-xl text-center">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-400 uppercase">Emergency Secret Phrase</label>
                    <input className="w-full p-6 bg-slate-900 rounded-3xl text-3xl font-black text-center outline-none border-2 border-slate-700 focus:border-blue-500" value={currentUser?.secretPhrase} onChange={e => setCurrentUser(prev => prev ? {...prev, secretPhrase: e.target.value} : null)} />
                  </div>
                  <button onClick={() => setView('home')} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl">Save Changes</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/90 backdrop-blur-2xl border-t border-slate-800 z-50">
          <div className="max-w-md mx-auto flex justify-around items-center">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
              <i className="fas fa-home text-2xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
            </button>
            <button onClick={triggerSOS} className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center -mt-12 border-8 border-slate-900 shadow-xl active:scale-90 transition-all">
              <i className="fas fa-bolt text-2xl"></i>
            </button>
            <button onClick={() => setView('people')} className={`flex flex-col items-center gap-1 transition-all ${view === 'people' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
              <i className="fas fa-user-group text-2xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">Circle</span>
            </button>
            <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
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
