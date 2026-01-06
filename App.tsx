
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

interface SentLog {
  id: string;
  to: string;
  email: string;
  type: 'Email' | 'SMS';
  status: 'READY' | 'SENDING...' | 'SENT';
}

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<'login' | 'register' | 'home' | 'people' | 'settings'>('login');
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('guardian_user');
    return saved ? JSON.parse(saved) : { name: '', email: '', secretPhrase: 'Help Me Now', isLoggedIn: false };
  });
  const [myPeople, setMyPeople] = useState<TrustedPerson[]>(() => {
    const saved = localStorage.getItem('guardian_people');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isEmergency, setIsEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [logs, setLogs] = useState<SentLog[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Save data locally
  useEffect(() => {
    localStorage.setItem('guardian_user', JSON.stringify(user));
    localStorage.setItem('guardian_people', JSON.stringify(myPeople));
  }, [user, myPeople]);

  // Track location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location denied")
      );
    }
  }, []);

  // Phrase Listener Logic
  useEffect(() => {
    if (isListening && voiceInput.toLowerCase().includes(user.secretPhrase.toLowerCase())) {
      triggerSOS();
      setVoiceInput('');
    }
  }, [voiceInput, isListening]);

  // --- Functions ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, isLoggedIn: true });
    setView('home');
  };

  const saveGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return alert("Type a name first!");
    const newPerson: TrustedPerson = { id: Date.now().toString(), name: formName, email: formEmail, phone: formPhone };
    setMyPeople([...myPeople, newPerson]);
    setFormName(''); setFormEmail(''); setFormPhone('');
    alert("Guardian saved to your circle!");
  };

  const sendActualEmail = (person: TrustedPerson) => {
    const locStr = location ? `\n\nMy location: https://www.google.com/maps?q=${location.lat},${location.lng}` : '';
    const subject = encodeURIComponent(`EMERGENCY: ${user.name} needs help!`);
    const body = encodeURIComponent(`This is an emergency alert from GuardianSafe.\n\n${user.name} is in danger and has requested your immediate help!${locStr}\n\nPlease check on them immediately.`);
    window.location.href = `mailto:${person.email}?subject=${subject}&body=${body}`;
    
    // Update log status locally
    setLogs(prev => prev.map(l => l.email === person.email ? { ...l, status: 'SENT' } : l));
  };

  const triggerSOS = async () => {
    if (myPeople.length === 0) {
      alert("You have no guardians! Go to 'People' and add an email for your parent or friend first.");
      setView('people');
      return;
    }

    setIsEmergency(true);
    setIsListening(false);

    const initialLogs: SentLog[] = myPeople.flatMap(p => {
      const pLogs: SentLog[] = [];
      if (p.email) pLogs.push({ id: `e-${p.id}`, to: p.name, email: p.email, type: 'Email', status: 'READY' });
      return pLogs;
    });
    setLogs(initialLogs);

    // Get AI Advice
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `EMERGENCY! User ${user.name} is in danger. 
      Location: ${location ? `${location.lat}, ${location.lng}` : 'Unknown'}. 
      Give 3 short, easy safety tips for a child or senior. 
      JSON array: ["tip1", "tip2", "tip3"]`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      setAiAdvice(JSON.parse(res.text || '[]'));
    } catch {
      setAiAdvice(["Move to a well-lit area", "Shout for help loudly", "Stay on this screen"]);
    }
  };

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl text-white text-3xl">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">GuardianSafe</h1>
            <p className="text-slate-500 font-bold">The app that actually keeps you safe.</p>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
            {view === 'login' ? (
              <form onSubmit={handleAuth} className="space-y-4">
                <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900" />
                <input required type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900" />
                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all">Sign In</button>
                <button type="button" onClick={() => setView('register')} className="w-full text-center text-xs font-black text-blue-600 mt-4 uppercase tracking-widest">Create New Account</button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                <input required placeholder="Your Name" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900" />
                
                <div className="p-5 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">My Secret Phrase (HELP WORD)</label>
                  <input required placeholder="e.g. Apples" className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-900 outline-none focus:ring-0" value={user.secretPhrase} onChange={e => setUser({...user, secretPhrase: e.target.value})} />
                  <p className="text-[10px] text-slate-400 italic">If you say this word, the alarm starts.</p>
                </div>

                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all">Register Now</button>
                <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs font-black text-slate-400 mt-4 uppercase tracking-widest">Back to Login</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${isEmergency ? 'bg-red-600' : 'bg-slate-50 text-slate-900'}`}>
      
      {!isEmergency && (
        <header className="p-6 bg-white flex justify-between items-center shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-heart"></i>
            </div>
            <h1 className="font-black text-xl tracking-tighter">GuardianSafe</h1>
          </div>
          <button onClick={() => setUser({...user, isLoggedIn: false})} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="fas fa-power-off text-xs"></i>
          </button>
        </header>
      )}

      <main className="flex-1 p-6 pb-40 max-w-lg mx-auto w-full">
        {isEmergency ? (
          <div className="h-full flex flex-col justify-center items-center text-white text-center space-y-8 animate-in zoom-in duration-500">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-red-600 text-5xl shadow-2xl animate-pulse">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">Emergency Mode</h2>
              <p className="text-red-100 font-bold opacity-80">Click the buttons below to actually send emails!</p>
            </div>

            <div className="w-full space-y-4">
              {logs.map((log, idx) => {
                const person = myPeople.find(p => p.email === log.email);
                return (
                  <div key={log.id} className="bg-white rounded-[2rem] p-5 shadow-2xl text-slate-900 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-black">{log.to}</p>
                      <p className="text-[10px] font-bold text-slate-400">{log.email}</p>
                    </div>
                    {log.status === 'SENT' ? (
                      <span className="bg-green-100 text-green-600 text-[10px] font-black px-4 py-2 rounded-full border border-green-200 uppercase tracking-widest">
                        <i className="fas fa-check-circle mr-1"></i> Sent
                      </span>
                    ) : (
                      <button 
                        onClick={() => person && sendActualEmail(person)}
                        className="bg-red-600 text-white text-[10px] font-black px-4 py-3 rounded-2xl shadow-lg active:scale-95 uppercase tracking-widest"
                      >
                        Click to Email Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {aiAdvice.length > 0 && (
              <div className="w-full bg-white text-red-600 rounded-[2.5rem] p-6 shadow-2xl space-y-4">
                <p className="text-[10px] font-black uppercase border-b border-red-50 pb-2 tracking-widest">Immediate Safety Steps</p>
                <div className="space-y-3">
                  {aiAdvice.map((tip, i) => (
                    <div key={i} className="flex gap-4 items-center text-left">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                      <p className="text-sm font-black leading-tight">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setIsEmergency(false)} className="bg-white text-red-600 px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 text-sm">
              I am safe now
            </button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-10 py-10 animate-in fade-in duration-500">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-slate-900 leading-none">Safe & Secure</h2>
                  <p className="text-slate-500 font-bold mt-2 px-10">Press the SOS if you are in danger.</p>
                </div>

                <div className="flex justify-center py-4">
                  <button onClick={triggerSOS} className="w-72 h-72 rounded-full bg-white border-[20px] border-slate-100 flex flex-col items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,0.1)] active:scale-95 group hover:border-red-50">
                    <i className="fas fa-bolt text-7xl text-red-600 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase">Emergency SOS</span>
                  </button>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <div className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col gap-3 ${isListening ? 'bg-blue-600 border-blue-400 text-white shadow-2xl scale-105' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                        <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'} text-xl`}></i>
                        <p className="text-sm font-black uppercase tracking-widest">{isListening ? 'Listening...' : 'Voice Off'}</p>
                       </div>
                       <button onClick={() => setIsListening(!isListening)} className={`w-12 h-6 rounded-full relative transition-colors ${isListening ? 'bg-white/30' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${isListening ? 'right-1 bg-white' : 'left-1 bg-slate-400'}`}></div>
                       </button>
                    </div>
                    {isListening && (
                      <input 
                        placeholder={`Type "${user.secretPhrase}" to test`}
                        className="w-full bg-white/10 rounded-xl p-3 text-xs border border-white/20 outline-none text-white placeholder:text-white/50"
                        value={voiceInput}
                        onChange={(e) => setVoiceInput(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 py-4 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900">My People</h2>
                  <p className="text-slate-500 font-bold">Add the people who care about you.</p>
                </div>

                <form onSubmit={saveGuardian} className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 space-y-5 shadow-xl">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest ml-2">New Guardian</h3>
                  <div className="space-y-4">
                    <input required placeholder="Name (e.g. Dad)" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formName} onChange={e => setFormName(e.target.value)} />
                    <input required placeholder="Email (They will get your SOS)" type="email" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                    <input placeholder="Phone Number" type="tel" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-sm active:scale-95">Add to My Circle</button>
                </form>

                <div className="space-y-4 pb-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Guardians in Circle</h3>
                  {myPeople.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold px-10">
                      Empty. Add someone so we can notify them in danger!
                    </div>
                  ) : (
                    myPeople.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-[2rem] flex items-center justify-between border-2 border-slate-50 shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-600/20">
                            {p.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-lg leading-tight">{p.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.email}</p>
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
                  <h2 className="text-3xl font-black text-slate-900">Safety Settings</h2>
                  <p className="text-slate-500 font-bold">Customize how the app works.</p>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 space-y-8 shadow-xl">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">Your Secret Help Word</label>
                    <input 
                      placeholder="e.g. Apples" 
                      className="w-full p-6 bg-blue-50 rounded-[2rem] border-4 border-blue-100 text-3xl font-black text-slate-900 outline-none text-center focus:border-blue-400" 
                      value={user.secretPhrase} 
                      onChange={e => setUser({...user, secretPhrase: e.target.value})} 
                    />
                    <p className="text-xs text-slate-400 font-bold text-center italic px-4">When "Listening" is ON, saying or typing this word triggers the alarm instantly.</p>
                  </div>

                  <div className="space-y-3 border-t-2 border-slate-50 pt-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">My Full Name</label>
                    <input 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-slate-900" 
                      value={user.name} 
                      onChange={e => setUser({...user, name: e.target.value})} 
                    />
                  </div>

                  <button onClick={() => setView('home')} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-2xl active:scale-95">Save & Return Home</button>
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
            
            <button onClick={triggerSOS} className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center -mt-20 border-[8px] border-white shadow-[0_20px_40px_rgba(220,38,38,0.4)] active:scale-90 transition-all hover:scale-105">
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
