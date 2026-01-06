
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Data Types ---
interface TrustedPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface User {
  name: string;
  email: string;
  secretPhrase: string;
  isLoggedIn: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'User' | 'Guardian' | 'AI';
  text: string;
  timestamp: Date;
}

const App: React.FC = () => {
  // --- Persistent State ---
  const [view, setView] = useState<'login' | 'register' | 'home' | 'people' | 'settings'>('login');
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('guardian_user_v2');
    return saved ? JSON.parse(saved) : { name: '', email: '', secretPhrase: 'Help Me', isLoggedIn: false };
  });
  
  const [myPeople, setMyPeople] = useState<TrustedPerson[]>(() => {
    const saved = localStorage.getItem('guardian_people_v2');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('guardian_chat_v2');
    return saved ? JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [];
  });

  const [isEmergency, setIsEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [chatInput, setChatInput] = useState('');

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Save data to LocalStorage on every change
  useEffect(() => {
    localStorage.setItem('guardian_user_v2', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('guardian_people_v2', JSON.stringify(myPeople));
  }, [myPeople]);

  useEffect(() => {
    localStorage.setItem('guardian_chat_v2', JSON.stringify(messages));
  }, [messages]);

  // Track location for SOS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location denied")
      );
    }
  }, []);

  // --- SOS Logic ---
  const triggerSOS = () => {
    if (myPeople.length === 0) {
      alert("Please add at least one guardian in 'People' tab before using SOS!");
      setView('people');
      return;
    }
    setIsEmergency(true);
    setIsListening(false);
    
    // Auto-add an AI message to guide the user
    const aiMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'AI',
      text: "SOS Active. I am monitoring your location. Please click 'Send Email' below to alert your guardians immediately.",
      timestamp: new Date()
    };
    setMessages([aiMsg]);
  };

  const sendEmailToGuardian = (person: TrustedPerson) => {
    const locStr = location ? `\n\nLive Location: https://www.google.com/maps?q=${location.lat},${location.lng}` : '\n\nLocation: Not shared.';
    const subject = encodeURIComponent(`URGENT: ${user.name} needs help!`);
    const body = encodeURIComponent(
      `HELLO ${person.name.toUpperCase()},\n\n` +
      `This is an EMERGENCY ALERT from GuardianSafe.\n` +
      `${user.name} has triggered their SOS alarm and needs help right now.` +
      `${locStr}\n\n` +
      `Please contact them immediately.`
    );
    
    // Standard mailto link - this is the only free way in a browser to send an email from the user's device.
    window.location.href = `mailto:${person.email}?subject=${subject}&body=${body}`;
    
    const confirmationMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'AI',
      text: `Alert sent to ${person.name}. Keep talking here.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmationMsg]);
  };

  // Fix: Added missing saveGuardian function to handle adding new guardians to the list
  const saveGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const newPerson: TrustedPerson = {
      id: Date.now().toString(),
      name: formName,
      email: formEmail,
      phone: formPhone,
    };

    setMyPeople(prev => [...prev, newPerson]);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'User',
      text: chatInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Simulate Guardian/AI reply
    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Guardian',
        text: "I received your alert! Where are you? Stay calm.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  // --- View Components ---

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl text-white text-4xl">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">GuardianSafe</h1>
            <p className="text-slate-500 font-bold mt-2">Safety that stays with you.</p>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100">
            <form onSubmit={(e) => { e.preventDefault(); setUser({...user, isLoggedIn: true}); setView('home'); }} className="space-y-5">
              {view === 'register' && (
                <input required placeholder="Your Full Name" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
              )}
              <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900" />
              
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              {view === 'register' && (
                <div className="p-5 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Emergency Secret Phrase</label>
                  <input required placeholder="e.g. Save Me" className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-900 outline-none focus:ring-0" value={user.secretPhrase} onChange={e => setUser({...user, secretPhrase: e.target.value})} />
                  <p className="text-[10px] text-slate-400 italic">Say this or type it to trigger SOS instantly.</p>
                </div>
              )}

              <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                {view === 'login' ? 'Sign In' : 'Create Account'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setView(view === 'login' ? 'register' : 'login')} 
                className="w-full text-center text-xs font-black text-slate-400 uppercase tracking-widest"
              >
                {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${isEmergency ? 'bg-red-600' : 'bg-slate-50'}`}>
      
      {!isEmergency && (
        <header className="p-6 bg-white flex justify-between items-center shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-heart"></i>
            </div>
            <h1 className="font-black text-xl tracking-tighter">GuardianSafe</h1>
          </div>
          <button onClick={() => { setUser({...user, isLoggedIn: false}); setView('login'); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="fas fa-power-off text-xs"></i>
          </button>
        </header>
      )}

      <main className="flex-1 p-6 pb-40 max-w-lg mx-auto w-full">
        {isEmergency ? (
          <div className="h-full flex flex-col space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center text-white pt-4">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">Emergency Active</h2>
              <p className="text-red-100 font-bold opacity-80 mt-1">Alerting guardians and recording location.</p>
            </div>

            {/* Guardian List & Email Buttons */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-4">Step 1: Send Alert Mails</p>
              {myPeople.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-2xl">
                  <div>
                    <p className="text-sm font-black text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{p.email}</p>
                  </div>
                  <button 
                    onClick={() => sendEmailToGuardian(p)}
                    className="bg-red-600 text-white text-[10px] font-black px-5 py-3 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95"
                  >
                    Send Email
                  </button>
                </div>
              ))}
            </div>

            {/* Chat Box */}
            <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-[2.5rem] border border-white/20 flex flex-col overflow-hidden min-h-[350px]">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Step 2: Guardian Chat</span>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-md text-sm font-bold ${
                      m.sender === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 
                      m.sender === 'AI' ? 'bg-black/40 text-white/90 rounded-tl-none italic' :
                      'bg-white text-slate-900 rounded-tl-none'
                    }`}>
                      <p>{m.text}</p>
                      <p className="text-[8px] opacity-40 mt-1 text-right">{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-black/20 flex gap-2">
                <input 
                  placeholder="Type message to guardian..." 
                  className="flex-1 bg-white/10 rounded-2xl p-4 text-white placeholder:text-white/40 outline-none border border-white/10 text-sm font-bold" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-xl">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>

            <button onClick={() => setIsEmergency(false)} className="w-full bg-white text-red-600 font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 uppercase tracking-widest">
              Stop SOS - I am safe
            </button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-10 py-10 animate-in fade-in duration-500">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Hello, {user.name || 'Friend'}</h2>
                  <p className="text-slate-500 font-bold mt-2">Guardians are ready to help you.</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-white border-[20px] border-slate-100 flex flex-col items-center justify-center shadow-2xl active:scale-95 group transition-all hover:border-red-50">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase">Trigger SOS</span>
                  </button>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                      <i className="fas fa-users text-xl"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Guardians</p>
                      <p className="text-lg font-black">{myPeople.length} People Watching</p>
                    </div>
                  </div>
                  <button onClick={() => setView('people')} className="text-blue-600 font-black text-xs uppercase underline">Manage</button>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 py-4 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900">My People</h2>
                  <p className="text-slate-500 font-bold">These people will receive your SOS emails.</p>
                </div>

                <form onSubmit={saveGuardian} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 space-y-4 shadow-xl">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">Add New Guardian</h3>
                  <input required placeholder="Full Name (e.g. Dad)" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formName} onChange={e => setFormName(e.target.value)} />
                  <input required placeholder="Email Address" type="email" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  <input placeholder="Phone Number" type="tel" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-sm active:scale-95">Save Guardian</button>
                </form>

                <div className="space-y-3 pb-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Saved Circle</h3>
                  {myPeople.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold px-10">
                      Empty. Add a guardian email to enable SOS.
                    </div>
                  ) : (
                    myPeople.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-[2rem] flex items-center justify-between border-2 border-slate-50 shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                            {p.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 leading-none">{p.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{p.email}</p>
                          </div>
                        </div>
                        <button onClick={() => setMyPeople(myPeople.filter(x => x.id !== p.id))} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div className="space-y-8 py-4 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900">App Setup</h2>
                  <p className="text-slate-500 font-bold">Manage your profile and safety words.</p>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 space-y-8 shadow-xl">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">My SOS Phrase</label>
                    <input 
                      placeholder="e.g. Save Me" 
                      className="w-full p-6 bg-blue-50 rounded-[2rem] border-4 border-blue-100 text-3xl font-black text-slate-900 outline-none text-center focus:border-blue-400" 
                      value={user.secretPhrase} 
                      onChange={e => setUser({...user, secretPhrase: e.target.value})} 
                    />
                    <p className="text-xs text-slate-400 font-bold text-center italic px-4">This word triggers the emergency system instantly.</p>
                  </div>

                  <div className="space-y-4 border-t-2 border-slate-50 pt-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Display Name</label>
                      <input className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900 mt-1" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                    </div>
                  </div>

                  <button onClick={() => setView('home')} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-2xl active:scale-95">Save & Finish</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-2xl border-t-2 border-slate-50 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center px-4">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-home text-2xl"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
            </button>
            
            <button onClick={triggerSOS} className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center -mt-20 border-[8px] border-white shadow-2xl active:scale-90 transition-all">
              <i className="fas fa-bolt text-3xl"></i>
            </button>

            <button onClick={() => setView('people')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'people' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-user-group text-2xl"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">People</span>
            </button>

            <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-gear text-2xl"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Setup</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
