
import React, { useState, useEffect, useRef } from 'react';
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
    const saved = localStorage.getItem('guardian_user_v3');
    return saved ? JSON.parse(saved) : { name: '', email: '', secretPhrase: 'Help Me', isLoggedIn: false };
  });
  
  const [myPeople, setMyPeople] = useState<TrustedPerson[]>(() => {
    const saved = localStorage.getItem('guardian_people_v3');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('guardian_chat_v3');
    return saved ? JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [];
  });

  const [isEmergency, setIsEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [chatInput, setChatInput] = useState('');
  const recognitionRef = useRef<any>(null);

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Save data to LocalStorage on every change
  useEffect(() => {
    localStorage.setItem('guardian_user_v3', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('guardian_people_v3', JSON.stringify(myPeople));
  }, [myPeople]);

  useEffect(() => {
    localStorage.setItem('guardian_chat_v3', JSON.stringify(messages));
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

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
          .toLowerCase();

        if (transcript.includes(user.secretPhrase.toLowerCase())) {
          triggerSOS();
          recognition.stop();
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        if (isListening && !isEmergency) recognition.start();
      };
      recognitionRef.current = recognition;
    }
  }, [user.secretPhrase, isEmergency]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // --- SOS Logic ---
  const triggerSOS = () => {
    if (myPeople.length === 0) {
      alert("Please add at least one guardian in 'People' tab first!");
      setView('people');
      return;
    }
    setIsEmergency(true);
    setIsListening(false);
    
    const aiMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'AI',
      text: "SOS TRIPPED. Automatically opening mail client for your guardians...",
      timestamp: new Date()
    };
    setMessages([aiMsg]);

    // AUTO-SEND (Attempt to trigger mailto for the primary guardian immediately)
    if (myPeople.length > 0) {
      setTimeout(() => {
        sendEmailToGuardian(myPeople[0]);
      }, 500);
    }
  };

  const sendEmailToGuardian = (person: TrustedPerson) => {
    const locStr = location ? `\n\nLive Location: https://www.google.com/maps?q=${location.lat},${location.lng}` : '\n\nLocation: Not shared.';
    const subject = encodeURIComponent(`URGENT: ${user.name} IS IN DANGER!`);
    const body = encodeURIComponent(
      `URGENT ALERT FOR ${person.name.toUpperCase()},\n\n` +
      `${user.name} triggered their emergency SOS phrase "${user.secretPhrase}" and needs immediate assistance.` +
      `${locStr}\n\n` +
      `Please check on them or call emergency services immediately.`
    );
    
    // This will open the default mail app on the device
    window.location.href = `mailto:${person.email}?subject=${subject}&body=${body}`;
    
    const confirmationMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'AI',
      text: `Opening email for ${person.name}. Keep talking here.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmationMsg]);
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

    // Simulate Guardian reply
    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Guardian',
        text: "I received your alert! Where are you? Stay calm, help is on the way.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reply]);
    }, 2500);
  };

  const saveGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    const newPerson: TrustedPerson = { id: Date.now().toString(), name: formName, email: formEmail, phone: formPhone };
    setMyPeople(prev => [...prev, newPerson]);
    setFormName(''); setFormEmail(''); setFormPhone('');
    alert("Guardian Added Permanently.");
  };

  // --- Login View ---
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-700">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl text-white text-4xl">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">GuardianSafe</h1>
            <p className="text-slate-500 font-bold mt-2">Personal Safety & AI Support</p>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              {view === 'register' && (
                <div className="p-5 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">SOS Phrase (Word to say)</label>
                  <input required placeholder="e.g. Help Me" className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-900 outline-none focus:ring-0" value={user.secretPhrase} onChange={e => setUser({...user, secretPhrase: e.target.value})} />
                  <p className="text-[10px] text-slate-400 italic font-medium">Say this word out loud to trigger alerts automatically.</p>
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
                {view === 'login' ? "New here? Create Account" : "Back to Sign In"}
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
          <div className="h-full flex flex-col space-y-6 animate-in fade-in zoom-in duration-500 pb-10">
            <div className="text-center text-white pt-4">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter animate-pulse">Emergency Mode</h2>
              <p className="text-red-100 font-bold opacity-80 mt-1">Automatic alerts triggered for your circle.</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-4">Alert Status</p>
              {myPeople.map((p, idx) => (
                <div key={p.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-2xl border-2 border-white/20">
                  <div>
                    <p className="text-sm font-black text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{idx === 0 ? 'Primary Alert' : 'Secondary'}</p>
                  </div>
                  <button 
                    onClick={() => sendEmailToGuardian(p)}
                    className="bg-red-600 text-white text-[10px] font-black px-4 py-3 rounded-2xl uppercase tracking-widest active:scale-95"
                  >
                    Resend Email
                  </button>
                </div>
              ))}
            </div>

            {/* Emergency Chat Box */}
            <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex flex-col overflow-hidden shadow-2xl min-h-[400px]">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Emergency Chat</span>
                </div>
                <span className="text-[8px] text-white/40 uppercase">Encrypted</span>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[400px]">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-xl text-sm font-bold ${
                      m.sender === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 
                      m.sender === 'AI' ? 'bg-black/60 text-white/90 rounded-tl-none italic border border-white/10' :
                      'bg-white text-slate-900 rounded-tl-none'
                    }`}>
                      <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">{m.sender}</p>
                      <p>{m.text}</p>
                      <p className="text-[8px] opacity-30 mt-1 text-right">{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-black/40 flex gap-2">
                <input 
                  autoFocus
                  placeholder="Message your guardians..." 
                  className="flex-1 bg-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 outline-none border border-white/10 text-sm font-bold focus:bg-white/20 transition-all" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button type="submit" className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-xl active:scale-90 transition-all">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>

            <button onClick={() => setIsEmergency(false)} className="w-full bg-white text-red-600 font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 uppercase tracking-widest border-4 border-red-100">
              I am safe / End SOS
            </button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-10 py-10 animate-in fade-in duration-500">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Hi, {user.name || 'Friend'}</h2>
                  <p className="text-slate-500 font-bold mt-2">Voice safety is currently {isListening ? 'ACTIVE' : 'OFF'}.</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-white border-[20px] border-slate-100 flex flex-col items-center justify-center shadow-[0_30px_60px_rgba(0,0,0,0.08)] active:scale-95 group transition-all hover:border-red-50 relative">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase">Trigger SOS</span>
                    {isListening && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20"></div>}
                  </button>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <button 
                    onClick={() => setIsListening(!isListening)}
                    className={`w-full p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between shadow-xl ${isListening ? 'bg-blue-600 border-blue-400 text-white shadow-blue-200' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isListening ? 'bg-white/20' : 'bg-slate-50'}`}>
                        <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'} text-xl`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black uppercase tracking-widest">{isListening ? 'LISTENING' : 'VOICE OFF'}</p>
                        <p className="text-[10px] font-bold opacity-60">Phrase: "{user.secretPhrase}"</p>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isListening ? 'bg-blue-400' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white shadow-md ${isListening ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>

                  <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Contacts</p>
                      <p className="text-lg font-black">{myPeople.length} Guardians</p>
                    </div>
                    <button onClick={() => setView('people')} className="text-blue-600 font-black text-xs uppercase underline">Manage</button>
                  </div>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 py-4 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900">Guardian Circle</h2>
                  <p className="text-slate-500 font-bold">People who will receive your SOS.</p>
                </div>

                <form onSubmit={saveGuardian} className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 space-y-4 shadow-xl">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">Add New Guardian</h3>
                  <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formName} onChange={e => setFormName(e.target.value)} />
                  <input required placeholder="Email Address" type="email" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  <input placeholder="Phone (Optional)" type="tel" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-sm active:scale-95">Add to Circle</button>
                </form>

                <div className="space-y-3 pb-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Saved Circle</h3>
                  {myPeople.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold px-10">
                      Empty. Add an email to enable safety.
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
                  <h2 className="text-3xl font-black text-slate-900">Safety Setup</h2>
                  <p className="text-slate-500 font-bold">Manage your profile & voice key.</p>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 space-y-8 shadow-xl">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">My SOS Key-Phrase</label>
                    <input 
                      placeholder="e.g. Help Me" 
                      className="w-full p-6 bg-blue-50 rounded-[2rem] border-4 border-blue-100 text-3xl font-black text-slate-900 outline-none text-center focus:border-blue-400" 
                      value={user.secretPhrase} 
                      onChange={e => setUser({...user, secretPhrase: e.target.value})} 
                    />
                    <p className="text-xs text-slate-400 font-bold text-center italic px-4">Change this to any unique word or phrase.</p>
                  </div>

                  <div className="space-y-4 border-t-2 border-slate-50 pt-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Display Name</label>
                      <input className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900 mt-1" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                    </div>
                  </div>

                  <button onClick={() => setView('home')} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-2xl active:scale-95">Save Changes</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-2xl border-t-2 border-slate-100 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center px-4">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-home text-2xl"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
            </button>
            
            <button onClick={triggerSOS} className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center -mt-20 border-[8px] border-white shadow-2xl active:scale-90 transition-all hover:rotate-12">
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
