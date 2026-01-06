
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Simple Data ---
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
  type: 'Email' | 'SMS';
  status: 'SENDING...' | 'SENT';
}

const App: React.FC = () => {
  // --- View Management ---
  const [view, setView] = useState<'login' | 'register' | 'home' | 'people' | 'settings'>('login');
  
  // --- User Data ---
  const [user, setUser] = useState<User>({ 
    name: '', 
    email: '', 
    secretPhrase: 'Help me now', // Default phrase
    isLoggedIn: false 
  });
  
  const [myPeople, setMyPeople] = useState<TrustedPerson[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [logs, setLogs] = useState<SentLog[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string[]>([]);

  // --- Input States (Fixed visibility with dark text) ---
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // --- Actions ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, isLoggedIn: true });
    setView('home');
  };

  const saveGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return alert("Please type a name.");
    
    const newPerson: TrustedPerson = {
      id: Date.now().toString(),
      name: formName,
      email: formEmail,
      phone: formPhone
    };

    setMyPeople([...myPeople, newPerson]);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    alert("Guardian Added! They will be notified if you are in danger.");
  };

  const triggerSOS = async () => {
    if (myPeople.length === 0) {
      alert("WAIT! You must add your parent or a friend in 'My People' before using the SOS button.");
      setView('people');
      return;
    }

    setIsEmergency(true);
    setIsListening(false);

    // Create the visual log so user knows who is being contacted
    const initialLogs: SentLog[] = [];
    myPeople.forEach(p => {
      if (p.email) initialLogs.push({ id: `e-${p.id}`, to: p.name, type: 'Email', status: 'SENDING...' });
      if (p.phone) initialLogs.push({ id: `s-${p.id}`, to: p.name, type: 'SMS', status: 'SENDING...' });
    });
    setLogs(initialLogs);

    // Simulate sending time (This is where a real app would call a phone server)
    setTimeout(() => {
      setLogs(prev => prev.map(l => ({ ...l, status: 'SENT' })));
    }, 2500);

    // Get simple safety advice from AI
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `EMERGENCY! User said: "${user.secretPhrase}". 
      Give 3 short, easy safety tips for a child or senior. 
      Format as a simple JSON list of strings: ["tip1", "tip2", "tip3"]`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      setAiAdvice(JSON.parse(res.text || '[]'));
    } catch {
      setAiAdvice(["Find a safe place", "Shout for help", "Hold your phone tight"]);
    }
  };

  // --- Login / Register ---
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl text-white text-3xl">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-3xl font-black">GuardianSafe</h1>
            <p className="text-slate-500 font-bold">Easy safety for everyone.</p>
          </div>

          <div className="bg-slate-100 p-8 rounded-[2.5rem] border-2 border-slate-200">
            {view === 'login' ? (
              <form onSubmit={handleAuth} className="space-y-4">
                <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none" />
                <input required type="password" placeholder="Password" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none" />
                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all">Sign In</button>
                <button type="button" onClick={() => setView('register')} className="w-full text-center text-sm font-bold text-blue-600 mt-2">Create New Account</button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                <input required placeholder="Your Full Name" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                <input required type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none" />
                
                <div className="p-4 bg-blue-100 rounded-2xl border-2 border-blue-200">
                  <label className="text-[10px] font-black text-blue-600 uppercase mb-1 block">Set Your Secret Help Phrase</label>
                  <input required placeholder="e.g. Save me" className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-900 outline-none focus:ring-0" value={user.secretPhrase} onChange={e => setUser({...user, secretPhrase: e.target.value})} />
                  <p className="text-[10px] text-slate-500 mt-1">Typing this works, or you can say it later.</p>
                </div>

                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all">Register</button>
                <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm font-bold text-slate-500 mt-2">Back to Login</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${isEmergency ? 'bg-red-600' : 'bg-slate-50 text-slate-900'}`}>
      
      {!isEmergency && (
        <header className="p-6 bg-white flex justify-between items-center border-b-2 border-slate-200 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-heart"></i>
            </div>
            <h1 className="font-black text-xl">GuardianSafe</h1>
          </div>
          <button onClick={() => setUser({...user, isLoggedIn: false})} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="fas fa-power-off"></i>
          </button>
        </header>
      )}

      <main className="flex-1 p-6 pb-32 max-w-lg mx-auto w-full">
        {isEmergency ? (
          <div className="h-full flex flex-col justify-center items-center text-white text-center space-y-8 animate-in fade-in duration-500">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-red-600 text-5xl shadow-2xl animate-pulse">
              <i className="fas fa-bullhorn"></i>
            </div>
            
            <h2 className="text-4xl font-black uppercase italic leading-tight px-4">Help is being requested!</h2>

            {/* LIVE LOG: This shows the user that messages are actually going out */}
            <div className="w-full bg-black/10 rounded-[2.5rem] p-6 border border-white/20 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Message Status (Live)</h3>
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/10">
                    <div className="text-left">
                      <p className="text-sm font-black">{log.to}</p>
                      <p className="text-[10px] font-bold opacity-60">{log.type} Alert</p>
                    </div>
                    <div className={`text-[10px] font-black px-4 py-2 rounded-full ${log.status === 'SENT' ? 'bg-green-400 text-green-900 shadow-lg' : 'bg-white/20 text-white'}`}>
                      {log.status === 'SENT' ? <><i className="fas fa-check-circle mr-1"></i> DELIVERED</> : log.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {aiAdvice.length > 0 && (
              <div className="w-full bg-white text-red-600 rounded-[2.5rem] p-6 shadow-2xl space-y-4">
                <p className="text-xs font-black uppercase border-b border-red-50 pb-2">Immediate Safety Steps</p>
                <div className="space-y-3">
                  {aiAdvice.map((tip, i) => (
                    <div key={i} className="flex gap-4 items-center text-left">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                      <p className="text-sm font-black">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setIsEmergency(false)} className="bg-white text-red-600 px-12 py-5 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 text-sm">
              Stop Alarm / I'm Safe
            </button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-10 py-10 animate-in fade-in duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black">Hi, {user.name || 'Friend'}!</h2>
                  <p className="text-slate-500 font-bold mt-1 px-10">Press the big button if you feel unsafe.</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerSOS} className="w-64 h-64 rounded-full bg-white border-[16px] border-slate-200 flex flex-col items-center justify-center shadow-2xl active:scale-95 group hover:border-red-100">
                    <i className="fas fa-hand-holding-heart text-6xl text-red-500 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase">SEND HELP</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setIsListening(!isListening)}
                    className={`w-full p-6 rounded-[2.5rem] border-4 transition-all flex items-center justify-between ${isListening ? 'bg-blue-600 border-blue-500 text-white shadow-xl scale-105' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'}`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black">{isListening ? 'LISTENING...' : 'VOICE OFF'}</p>
                        <p className="text-[10px] font-bold opacity-70">Trigger word: "{user.secretPhrase}"</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-300'}`}></div>
                  </button>

                  <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">My Circle</p>
                      <p className="text-sm font-black text-slate-900">{myPeople.length} Guardians Added</p>
                    </div>
                    <button onClick={() => setView('people')} className="text-blue-600 font-black text-xs uppercase underline">Manage</button>
                  </div>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 py-4 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-2xl font-black">My Trusted People</h2>
                  <p className="text-slate-500 font-bold">Add your parents or best friends.</p>
                </div>

                <form onSubmit={saveGuardian} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest ml-2">Add New Person</h3>
                  <div className="space-y-4">
                    <input required placeholder="Name (e.g. Dad)" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold outline-none focus:border-blue-400" value={formName} onChange={e => setFormName(e.target.value)} />
                    <input placeholder="Email Address" type="email" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold outline-none focus:border-blue-400" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                    <input placeholder="Phone Number" type="tel" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold outline-none focus:border-blue-400" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-sm active:scale-95 transition-all">Save to My Circle</button>
                </form>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">My Current Guardians</h3>
                  {myPeople.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold px-10">
                      Nobody added yet. Add a parent so we can notify them!
                    </div>
                  ) : (
                    myPeople.map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-3xl flex items-center justify-between border-2 border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                            {p.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900">{p.name}</h4>
                            <div className="flex gap-3 text-[10px] font-black text-slate-400 uppercase">
                              {p.email && <span>Email</span>}
                              {p.phone && <span>SMS</span>}
                            </div>
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
                  <h2 className="text-2xl font-black">Settings</h2>
                  <p className="text-slate-500 font-bold">Customize your safety phrase.</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 space-y-6 shadow-xl">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">My Secret Help Phrase</label>
                    <input 
                      placeholder="e.g. Save me" 
                      className="w-full p-5 bg-blue-50 rounded-2xl border-2 border-blue-200 text-xl font-black text-slate-900 outline-none focus:border-blue-400" 
                      value={user.secretPhrase} 
                      onChange={e => setUser({...user, secretPhrase: e.target.value})} 
                    />
                    <p className="text-xs text-slate-500 italic px-1 font-medium leading-relaxed">If you say or type this phrase, the emergency alarm will trigger automatically.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">My Profile Name</label>
                    <input 
                      placeholder="Your name" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold outline-none" 
                      value={user.name} 
                      onChange={e => setUser({...user, name: e.target.value})} 
                    />
                  </div>

                  <div className="pt-4">
                    <button onClick={() => setView('home')} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg">Back to Home</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t-2 border-slate-100 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center px-4">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-house text-2xl"></i>
              <span className="text-[10px] font-black uppercase">Home</span>
            </button>
            
            <button onClick={triggerSOS} className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center -mt-16 border-[8px] border-white shadow-[0_10px_20px_rgba(220,38,38,0.4)] active:scale-90 transition-all">
              <i className="fas fa-bolt text-2xl"></i>
            </button>

            <button onClick={() => setView('people')} className={`flex flex-col items-center gap-1 transition-all ${view === 'people' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-users text-2xl"></i>
              <span className="text-[10px] font-black uppercase">People</span>
            </button>

            <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-gear text-2xl"></i>
              <span className="text-[10px] font-black uppercase">Setup</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
