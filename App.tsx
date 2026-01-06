
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
  // --- Persistent State (Ensuring info is never removed automatically) ---
  const [view, setView] = useState<'login' | 'register' | 'home' | 'people' | 'settings'>('login');
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('gs_user_data_final');
    return saved ? JSON.parse(saved) : { name: '', email: '', secretPhrase: 'Help Me', isLoggedIn: false };
  });
  
  const [myPeople, setMyPeople] = useState<TrustedPerson[]>(() => {
    const saved = localStorage.getItem('gs_guardian_list_final');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('gs_chat_history_final');
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

  // Save data to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gs_user_data_final', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('gs_guardian_list_final', JSON.stringify(myPeople));
  }, [myPeople]);

  useEffect(() => {
    localStorage.setItem('gs_chat_history_final', JSON.stringify(messages));
  }, [messages]);

  // Track location continuously for SOS
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location denied"),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Web Speech API for Phrase Detection
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

        // If secret phrase is detected, trigger SOS automatically
        if (transcript.includes(user.secretPhrase.toLowerCase())) {
          triggerSOS();
          recognition.stop();
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        if (isListening && !isEmergency) {
          try { recognition.start(); } catch(e) {}
        }
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
      alert("WARNING: No guardians added! Please go to 'People' and add an email.");
      setView('people');
      return;
    }
    
    setIsEmergency(true);
    setIsListening(false);
    
    const alertMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'AI',
      text: "🚨 SOS TRIGGERED! Opening your email app automatically to notify guardians. PLEASE TAP 'SEND' IN YOUR MAIL APP.",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, alertMsg]);

    // AUTOMATIC ACTION: Open mail client for the first guardian immediately
    if (myPeople.length > 0) {
      autoEmail(myPeople[0]);
    }
  };

  const autoEmail = (person: TrustedPerson) => {
    const locStr = location ? `\n\nMY LIVE LOCATION: https://www.google.com/maps?q=${location.lat},${location.lng}` : '\n\nLocation: GPS not available yet.';
    const subject = encodeURIComponent(`URGENT EMERGENCY: ${user.name} NEEDS HELP!`);
    const body = encodeURIComponent(
      `TO ${person.name.toUpperCase()},\n\n` +
      `THIS IS AN EMERGENCY. ${user.name} has triggered their GuardianSafe SOS alarm.` +
      `${locStr}\n\n` +
      `Please check on them or contact authorities immediately.`
    );
    
    // Automatically trigger the mail client
    window.location.href = `mailto:${person.email}?subject=${subject}&body=${body}`;
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

    // Mock response from guardian/AI for testing visibility
    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Guardian',
        text: "I am seeing your alert! Hang tight, I am calling for help now. Stay where you are!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reply]);
    }, 3000);
  };

  const saveGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    const newPerson: TrustedPerson = { id: Date.now().toString(), name: formName, email: formEmail, phone: formPhone };
    setMyPeople(prev => [...prev, newPerson]);
    setFormName(''); setFormEmail(''); setFormPhone('');
    alert("Guardian saved successfully.");
  };

  // --- Auth View ---
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-700">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl text-white text-4xl border-4 border-blue-400/30">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">GuardianSafe</h1>
            <p className="text-slate-400 font-bold mt-2">Zero-Time Safety Response</p>
          </div>

          <div className="bg-slate-800 p-8 rounded-[3rem] shadow-2xl border border-slate-700">
            <form onSubmit={(e) => { e.preventDefault(); setUser({...user, isLoggedIn: true}); setView('home'); }} className="space-y-5">
              {view === 'register' && (
                <input required placeholder="Your Full Name" className="w-full p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-blue-500 outline-none font-bold text-white" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
              )}
              <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-blue-500 outline-none font-bold text-white" />
              
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-blue-500 outline-none font-bold text-white" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              {view === 'register' && (
                <div className="p-5 bg-blue-600/10 rounded-3xl border-2 border-blue-500/30 space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">SOS Phrase (Word to say)</label>
                  <input required placeholder="e.g. Help Me" className="w-full bg-transparent border-none p-0 text-2xl font-black text-white outline-none focus:ring-0" value={user.secretPhrase} onChange={e => setUser({...user, secretPhrase: e.target.value})} />
                  <p className="text-[10px] text-slate-500 italic">Saying this word will trigger the alarm automatically.</p>
                </div>
              )}

              <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all border-b-4 border-blue-800">
                {view === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setView(view === 'login' ? 'register' : 'login')} 
                className="w-full text-center text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
              >
                {view === 'login' ? "Need account? Register" : "Have account? Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${isEmergency ? 'bg-red-700' : 'bg-slate-900 text-white'}`}>
      
      {!isEmergency && (
        <header className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-heart"></i>
            </div>
            <h1 className="font-black text-xl tracking-tighter">GuardianSafe</h1>
          </div>
          <button onClick={() => { setUser({...user, isLoggedIn: false}); setView('login'); }} className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
            <i className="fas fa-power-off text-xs"></i>
          </button>
        </header>
      )}

      <main className="flex-1 p-6 pb-40 max-w-lg mx-auto w-full">
        {isEmergency ? (
          <div className="h-full flex flex-col space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center text-white pt-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-700 text-3xl mx-auto mb-4 animate-pulse shadow-2xl">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Emergency Mode</h2>
              <p className="text-red-100 font-bold opacity-80 mt-1">Automatic alert emails triggered.</p>
            </div>

            {/* Emergency Message Center */}
            <div className="flex-1 bg-black/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl min-h-[500px]">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-black text-white uppercase tracking-widest">Guardian Direct Link</span>
                </div>
                <button onClick={() => myPeople.length > 0 && autoEmail(myPeople[0])} className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-widest">Resend Alert</button>
              </div>
              
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-xl text-sm font-bold ${
                      m.sender === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 
                      m.sender === 'AI' ? 'bg-white/10 text-white/90 rounded-tl-none italic border border-white/5' :
                      'bg-white text-slate-900 rounded-tl-none'
                    }`}>
                      <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">{m.sender}</p>
                      <p className="leading-relaxed">{m.text}</p>
                      <p className="text-[8px] opacity-30 mt-1 text-right">{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-5 bg-black/40 flex gap-3 border-t border-white/10">
                <input 
                  autoFocus
                  placeholder="Type message..." 
                  className="flex-1 bg-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 outline-none border border-white/10 text-sm font-bold focus:bg-white/20 transition-all" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button type="submit" className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-700 shadow-xl active:scale-90 transition-all">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>

            <button onClick={() => setIsEmergency(false)} className="w-full bg-white text-red-700 font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 uppercase tracking-widest border-4 border-red-500/20">
              Stop SOS - I am safe
            </button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-10 py-10 animate-in fade-in duration-500">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-white tracking-tighter">Hi, {user.name || 'Friend'}</h2>
                  <p className="text-slate-400 font-bold mt-2">Safety monitoring is currently {isListening ? 'ACTIVE' : 'OFF'}.</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-slate-800 border-[20px] border-slate-700 flex flex-col items-center justify-center shadow-2xl active:scale-95 group transition-all hover:border-red-600/30 relative">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase">Manual SOS</span>
                    {isListening && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20"></div>}
                  </button>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <button 
                    onClick={() => setIsListening(!isListening)}
                    className={`w-full p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between shadow-2xl ${isListening ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/20' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isListening ? 'bg-white/20' : 'bg-slate-900'}`}>
                        <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'} text-xl`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black uppercase tracking-widest">{isListening ? 'LISTENING' : 'VOICE OFF'}</p>
                        <p className="text-[10px] font-bold opacity-60">Say: "{user.secretPhrase}"</p>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isListening ? 'bg-blue-400' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white shadow-md ${isListening ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>

                  <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                          <i className="fas fa-user-shield"></i>
                       </div>
                       <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Guardians</p>
                        <p className="text-lg font-black text-white">{myPeople.length} People</p>
                       </div>
                    </div>
                    <button onClick={() => setView('people')} className="text-blue-400 font-black text-xs uppercase underline tracking-widest">Circle</button>
                  </div>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 py-4 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-white tracking-tighter">My Guardian Circle</h2>
                  <p className="text-slate-400 font-bold">These people are saved forever in your account.</p>
                </div>

                <form onSubmit={saveGuardian} className="bg-slate-800 p-8 rounded-[3rem] border border-slate-700 space-y-4 shadow-xl">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Add New Guardian</h3>
                  <input required placeholder="Guardian Name" className="w-full p-4 bg-slate-900 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-white rounded-2xl" value={formName} onChange={e => setFormName(e.target.value)} />
                  <input required placeholder="Email (Critical for Alerting)" type="email" className="w-full p-4 bg-slate-900 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-white rounded-2xl" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  <input placeholder="Phone Number" type="tel" className="w-full p-4 bg-slate-900 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-white rounded-2xl" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-sm active:scale-95 transition-all border-b-4 border-blue-800">Save Guardian</button>
                </form>

                <div className="space-y-4 pb-10">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Saved Circle</h3>
                  {myPeople.length === 0 ? (
                    <div className="text-center py-10 bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-slate-700 text-slate-500 font-bold px-10">
                      Empty. Add a parent or friend email to enable SOS alerts.
                    </div>
                  ) : (
                    myPeople.map(p => (
                      <div key={p.id} className="bg-slate-800 p-6 rounded-[2rem] flex items-center justify-between border border-slate-700 shadow-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
                            {p.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-white leading-none">{p.name}</h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{p.email}</p>
                          </div>
                        </div>
                        <button onClick={() => setMyPeople(myPeople.filter(x => x.id !== p.id))} className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center border border-red-500/20">
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
                  <h2 className="text-3xl font-black text-white tracking-tighter">Safety Configuration</h2>
                  <p className="text-slate-400 font-bold">Manage your profile and secret phrase.</p>
                </div>

                <div className="bg-slate-800 p-8 rounded-[3rem] border border-slate-700 space-y-8 shadow-xl">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">My Secret SOS Phrase</label>
                    <input 
                      placeholder="e.g. Help Me" 
                      className="w-full p-6 bg-slate-900 rounded-[2rem] border-4 border-slate-700 text-3xl font-black text-white outline-none text-center focus:border-blue-500 transition-all" 
                      value={user.secretPhrase} 
                      onChange={e => setUser({...user, secretPhrase: e.target.value})} 
                    />
                    <p className="text-xs text-slate-500 font-bold text-center italic px-4">Say this phrase out loud to instantly trigger the SOS alarm and emails.</p>
                  </div>

                  <div className="space-y-4 border-t border-slate-700 pt-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">My Full Name</label>
                      <input className="w-full p-4 bg-slate-900 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-white rounded-2xl mt-1" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                    </div>
                  </div>

                  <button onClick={() => setView('home')} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-2xl active:scale-95 border-b-4 border-blue-800 transition-all">Save & Return Home</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-slate-800/95 backdrop-blur-2xl border-t border-slate-700 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center px-4">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
              <i className="fas fa-home text-2xl"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
            </button>
            
            <button onClick={triggerSOS} className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center -mt-20 border-[8px] border-slate-900 shadow-[0_15px_30px_rgba(220,38,38,0.4)] active:scale-90 transition-all">
              <i className="fas fa-bolt text-3xl"></i>
            </button>

            <button onClick={() => setView('people')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'people' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
              <i className="fas fa-user-group text-2xl"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Circle</span>
            </button>

            <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'settings' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}>
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
