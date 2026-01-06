
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

  // Unified Auth Form Inputs
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phraseInput, setPhraseInput] = useState('');
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
          .map((result: any) => (result as any)[0].transcript)
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
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (accounts.find(a => a.email.toLowerCase() === normalizedEmail)) {
      alert("An account with this email already exists!");
      return;
    }
    const newUser: UserAccount = {
      name: nameInput.trim(),
      email: normalizedEmail,
      password: passInput,
      secretPhrase: phraseInput.trim() || "Help Me"
    };
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
      alert("Invalid email or password!");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = emailInput.trim().toLowerCase();
    const found = accounts.find(a => a.email.toLowerCase() === normalizedEmail);
    if (found) {
      // Keep the same email for the reset view
      setView('reset-password');
      // Reset phrase input for the check
      setPhraseInput('');
    } else {
      alert(`Account not found with email: ${emailInput}. Please check your spelling.`);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = emailInput.trim().toLowerCase();
    const foundIndex = accounts.findIndex(a => a.email.toLowerCase() === normalizedEmail);
    
    if (foundIndex !== -1) {
      const found = accounts[foundIndex];
      // Check phrase (case-insensitive for safety)
      if (phraseInput.trim().toLowerCase() === found.secretPhrase.trim().toLowerCase()) {
        const updatedAccounts = [...accounts];
        updatedAccounts[foundIndex] = { ...found, password: newPass };
        setAccounts(updatedAccounts);
        alert("Password successfully updated! You can now log in.");
        setView('login');
      } else {
        alert("The secret phrase you entered is incorrect.");
      }
    } else {
      alert("Error: Account context lost. Please try again from the identifying step.");
      setView('forgot-password');
    }
  };

  // --- SOS Logic ---
  const triggerSOS = () => {
    if (myPeople.length === 0) {
      alert("Emergency! But you haven't added any guardians yet. Please go to the 'Circle' tab to add at least one contact.");
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
      const body = encodeURIComponent(`This is an SOS alert from GuardianSafe. ${currentUser?.name} is in danger.\nLive Location: ${locStr}\n\nPlease check on them or call authorities immediately.`);
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
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'Guardian', text: "I've received your alert! I'm calling for help and heading your way. Stay safe!", timestamp: new Date() }]);
    }, 2000);
  };

  // --- Render Auth Views ---
  const renderAuth = () => {
    if (view === 'login') return (
      <form onSubmit={handleLogin} className="space-y-4 w-full animate-in fade-in duration-500">
        <h2 className="text-3xl font-black text-center mb-8 text-slate-900">Sign In</h2>
        <input required type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 focus:border-blue-500 transition-colors shadow-sm" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
        <div className="relative">
          <input required type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 focus:border-blue-500 transition-colors shadow-sm" value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Login</button>
        <div className="flex justify-between text-xs text-slate-500 font-bold px-2">
          <button type="button" onClick={() => setView('register')} className="hover:text-blue-600">Create Account</button>
          <button type="button" onClick={() => setView('forgot-password')} className="hover:text-blue-600">Forgot Password?</button>
        </div>
      </form>
    );

    if (view === 'register') return (
      <form onSubmit={handleRegister} className="space-y-4 w-full animate-in fade-in duration-500">
        <h2 className="text-3xl font-black text-center mb-8 text-slate-900">Join GuardianSafe</h2>
        <input required placeholder="Full Name" className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 focus:border-blue-500 shadow-sm" value={nameInput} onChange={e => setNameInput(e.target.value)} />
        <input required type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 focus:border-blue-500 shadow-sm" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
        <div className="relative">
          <input required type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 focus:border-blue-500 shadow-sm" value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <label className="text-[10px] font-bold uppercase text-blue-600">Emergency Voice Phrase</label>
          <input required placeholder="e.g. Help Me" className="w-full bg-transparent outline-none text-xl font-bold mt-1 text-slate-900" value={phraseInput} onChange={e => setPhraseInput(e.target.value)} />
        </div>
        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Register</button>
        <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold hover:text-blue-600">Back to Login</button>
      </form>
    );

    if (view === 'forgot-password') return (
      <form onSubmit={handleForgotPassword} className="space-y-4 w-full animate-in fade-in duration-500">
        <h2 className="text-2xl font-black text-center mb-4 text-slate-900">Reset Your Password</h2>
        <p className="text-xs text-slate-500 text-center mb-8">Enter the email associated with your account to find your safety profile.</p>
        <input required type="email" placeholder="Account Email" className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 focus:border-blue-500 shadow-sm" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Search Account</button>
        <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold hover:text-blue-600">Back to Login</button>
      </form>
    );

    if (view === 'reset-password') return (
      <form onSubmit={handleResetPassword} className="space-y-4 w-full animate-in fade-in duration-500">
        <h2 className="text-2xl font-black text-center mb-4 text-slate-900">Security Verification</h2>
        <p className="text-xs text-slate-500 text-center mb-8">Verify your identity using your Emergency Voice Phrase for account: <span className="font-bold text-blue-600">{emailInput}</span></p>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Your Secret Phrase</label>
          <input required placeholder="Enter Secret Phrase" className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 focus:border-blue-500 shadow-sm" value={phraseInput} onChange={e => setPhraseInput(e.target.value)} />
        </div>
        <div className="space-y-1 relative">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">New Password</label>
          <input required type={showPassword ? "text" : "password"} placeholder="Set New Password" className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 focus:border-blue-500 shadow-sm" value={newPass} onChange={e => setNewPass(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-10 text-slate-400 hover:text-slate-600">
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <button className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Complete Reset</button>
        <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-slate-500 font-bold hover:text-blue-600">Cancel</button>
      </form>
    );

    return null;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-sm w-full">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-2xl mb-4 text-white">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900">GuardianSafe</h1>
            <p className="text-slate-500 font-bold">Always Protected.</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            {renderAuth()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${isEmergency ? 'bg-red-600' : 'bg-slate-50'}`}>
      
      {!isEmergency && (
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white"><i className="fas fa-heart"></i></div>
            <h1 className="font-black text-xl tracking-tighter text-slate-900">GuardianSafe</h1>
          </div>
          <button onClick={() => {setIsLoggedIn(false); setView('login')}} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shadow-sm"><i className="fas fa-power-off"></i></button>
        </header>
      )}

      <main className="flex-1 p-6 pb-32 max-w-lg mx-auto w-full">
        {isEmergency ? (
          <div className="h-full flex flex-col space-y-6 animate-in zoom-in duration-500">
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-600 text-3xl mx-auto mb-4 animate-pulse shadow-2xl">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Emergency Mode</h2>
              <p className="text-red-100 font-bold opacity-80">Guardians notified of your location.</p>
            </div>

            {/* Emergency Chat Box */}
            <div className="flex-1 bg-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl min-h-[450px] border border-red-200">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Emergency Dispatch Chat</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white custom-scrollbar">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm font-bold ${
                      m.sender === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-900 rounded-tl-none'
                    }`}>
                      <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">{m.sender}</p>
                      <p className="leading-relaxed">{m.text}</p>
                      <p className="text-[8px] opacity-30 mt-1 text-right">{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 flex gap-2 border-t border-slate-100">
                <input placeholder="Message guardians..." className="flex-1 bg-white rounded-2xl p-4 text-slate-900 placeholder:text-slate-400 outline-none border border-slate-200 text-sm font-bold focus:border-blue-500 shadow-sm" value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button type="submit" className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all"><i className="fas fa-paper-plane"></i></button>
              </form>
            </div>

            <button onClick={() => setIsEmergency(false)} className="w-full bg-white text-red-600 font-black py-5 rounded-3xl shadow-2xl uppercase tracking-widest active:scale-95 border-b-4 border-slate-200">I'M SAFE NOW</button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-10 py-10 text-center animate-in fade-in duration-500">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter text-slate-900">Hi, {currentUser?.name}</h2>
                  <p className="text-slate-500 font-bold mt-2">Safety monitoring is <span className={isListening ? 'text-blue-600' : 'text-slate-400'}>{isListening ? 'ACTIVE' : 'OFF'}</span></p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-white border-[20px] border-slate-100 flex flex-col items-center justify-center shadow-2xl active:scale-95 group transition-all hover:border-red-50 relative">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-widest uppercase">Manual SOS</span>
                    {isListening && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20"></div>}
                  </button>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <button onClick={() => setIsListening(!isListening)} className={`w-full p-6 rounded-3xl flex items-center justify-between border-2 transition-all ${isListening ? 'bg-blue-600 border-blue-400 text-white shadow-blue-200' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                      <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'} text-xl`}></i>
                      <span className="font-black text-xs uppercase tracking-widest">{isListening ? 'Listening' : 'Voice Off'}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative ${isListening ? 'bg-blue-400' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white shadow-sm ${isListening ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>
                  <p className="text-[10px] text-slate-400 font-bold italic">Voice Trigger Phrase: "{currentUser?.secretPhrase}"</p>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Guardian Circle</h2>
                  <p className="text-slate-500 font-medium">Add people you trust to be notified instantly.</p>
                </div>
                
                <form onSubmit={e => { e.preventDefault(); setMyPeople([...myPeople, { id: Date.now().toString(), name: gName, email: gEmail.toLowerCase(), phone: '' }]); setGName(''); setGEmail(''); }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-xl">
                  <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">New Trusted Contact</h3>
                  <input required placeholder="Contact Name" className="w-full p-4 bg-slate-50 border border-slate-100 focus:border-blue-500 outline-none font-bold rounded-2xl text-slate-900 shadow-sm" value={gName} onChange={e => setGName(e.target.value)} />
                  <input required placeholder="Contact Email" type="email" className="w-full p-4 bg-slate-50 border border-slate-100 focus:border-blue-500 outline-none font-bold rounded-2xl text-slate-900 shadow-sm" value={gEmail} onChange={e => setGEmail(e.target.value)} />
                  <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all">Save Guardian</button>
                </form>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">My Saved Circle</h3>
                  {myPeople.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-3xl flex items-center justify-between border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner">{p.name[0]}</div>
                        <div>
                          <h4 className="font-black leading-none text-slate-900">{p.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{p.email}</p>
                        </div>
                      </div>
                      <button onClick={() => setMyPeople(myPeople.filter(x => x.id !== p.id))} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors"><i className="fas fa-trash"></i></button>
                    </div>
                  ))}
                  {myPeople.length === 0 && (
                    <div className="text-center py-12 text-slate-400 font-medium bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 italic px-6">
                      No guardians added yet. Please add a trusted email to ensure your safety features work correctly.
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <h2 className="text-3xl font-black text-center text-slate-900 tracking-tighter">Safety Setup</h2>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-8 shadow-xl text-center">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Emergency Secret Phrase</label>
                    <input className="w-full p-6 bg-slate-50 rounded-3xl text-3xl font-black text-center outline-none border border-slate-100 focus:border-blue-500 text-slate-900 shadow-sm" value={currentUser?.secretPhrase} onChange={e => setCurrentUser(prev => prev ? {...prev, secretPhrase: e.target.value} : null)} />
                    <p className="text-xs text-slate-400 font-medium px-4 leading-relaxed">Say this phrase out loud at any time while monitoring is active to trigger the SOS alarm and notify your circle.</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 border border-slate-100 focus:border-blue-500 outline-none shadow-sm" value={currentUser?.name} onChange={e => setCurrentUser(prev => prev ? {...prev, name: e.target.value} : null)} />
                  </div>
                  <button onClick={() => setView('home')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Update Settings</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-2xl border-t border-slate-100 z-50">
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
