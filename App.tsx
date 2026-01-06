
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Simple Types ---
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

interface AlertStep {
  id: string;
  message: string;
  status: 'pending' | 'done';
}

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'home' | 'people'>('login');
  const [user, setUser] = useState<User>({ name: '', email: '', secretPhrase: 'Help me', isLoggedIn: false });
  const [myPeople, setMyPeople] = useState<TrustedPerson[]>([]); // Starts EMPTY
  const [isEmergency, setIsEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [alertSteps, setAlertSteps] = useState<AlertStep[]>([]);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [tempPerson, setTempPerson] = useState({ name: '', email: '', phone: '' });

  // --- Actions ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, isLoggedIn: true });
    setView('home');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, isLoggedIn: true });
    setView('home');
  };

  const addPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPerson.name || (!tempPerson.email && !tempPerson.phone)) {
      alert("Please enter a name and at least one way to contact them (Email or Phone).");
      return;
    }
    setMyPeople([...myPeople, { ...tempPerson, id: Date.now().toString() }]);
    setTempPerson({ name: '', email: '', phone: '' });
    alert("Added successfully!");
  };

  const startHelp = async () => {
    if (myPeople.length === 0) {
      alert("You haven't added any trusted people yet! Go to the 'My People' tab first.");
      setView('people');
      return;
    }

    setIsEmergency(true);
    setIsListening(false);

    // 1. Create the checklist of notifications
    const steps: AlertStep[] = [];
    myPeople.forEach(p => {
      if (p.email) steps.push({ id: `e-${p.id}`, message: `Emailing ${p.name}...`, status: 'pending' });
      if (p.phone) steps.push({ id: `s-${p.id}`, message: `Texting ${p.name}...`, status: 'pending' });
    });
    setAlertSteps(steps);

    // Simulate "Sending"
    setTimeout(() => {
      setAlertSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
    }, 2000);

    // 2. Get Simple AI Advice
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `User is in DANGER. They said: "${user.secretPhrase}". 
        Give 3 very simple, short safety tips for a child or elderly person. 
        Example: "Run to a safe place", "Call for help loudly".
        Return as JSON list: ["tip1", "tip2", "tip3"]`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      setAiTips(JSON.parse(response.text || '[]'));
    } catch (err) {
      setAiTips(["Stay calm", "Find a safe place", "Keep your phone close"]);
    } finally {
      setLoading(false);
    }
  };

  // --- Login / Register Views ---
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-6 flex flex-col justify-center font-sans">
        <div className="max-w-md mx-auto w-full space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <i className="fas fa-handshake-angle text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">GuardianSafe</h1>
            <p className="text-slate-500 mt-2">Helping you stay safe everywhere.</p>
          </div>

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <input required type="email" placeholder="Your Email" className="w-full p-4 border rounded-2xl bg-slate-50" />
              <input required type="password" placeholder="Your Password" className="w-full p-4 border rounded-2xl bg-slate-50" />
              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">Sign In</button>
              <div className="flex justify-between text-sm font-medium">
                <button type="button" onClick={() => setView('forgot')} className="text-blue-600">Forgot Password?</button>
                <button type="button" onClick={() => setView('register')} className="text-blue-600">New Account</button>
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <input required placeholder="Your Name" className="w-full p-4 border rounded-2xl bg-slate-50" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
              <input required type="email" placeholder="Your Email" className="w-full p-4 border rounded-2xl bg-slate-50" />
              <input required type="password" placeholder="Choose a Password" className="w-full p-4 border rounded-2xl bg-slate-50" />
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <label className="text-xs font-bold text-blue-800 mb-1 block">Your Secret "Help" Phrase</label>
                <input required placeholder="e.g. Save me" className="w-full bg-transparent font-bold text-lg outline-none" value={user.secretPhrase} onChange={e => setUser({...user, secretPhrase: e.target.value})} />
                <p className="text-[10px] text-blue-400 mt-1 italic">Say this phrase out loud to trigger the alarm.</p>
              </div>
              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">Create My Account</button>
              <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm font-bold text-slate-500">Back to Sign In</button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={(e) => {e.preventDefault(); alert("Sent!"); setView('login');}} className="space-y-4">
              <p className="text-sm text-slate-500 text-center">Enter your email and we will send a reset link.</p>
              <input required type="email" placeholder="Email Address" className="w-full p-4 border rounded-2xl bg-slate-50" />
              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">Reset Password</button>
              <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm font-bold text-slate-500">Back to Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- Main App Views ---
  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ${isEmergency ? 'bg-red-600' : 'bg-slate-50'}`}>
      
      {/* Top Header */}
      {!isEmergency && (
        <header className="p-6 bg-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-shield"></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none">GuardianSafe</h1>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Watching over you</span>
            </div>
          </div>
          <button onClick={() => setUser({...user, isLoggedIn: false})} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="fas fa-power-off text-xs"></i>
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto pb-32">
        
        {/* EMERGENCY MODE SCREEN */}
        {isEmergency ? (
          <div className="h-full flex flex-col justify-center items-center text-white text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-red-600 text-5xl shadow-2xl relative">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Help is coming</h2>
              <p className="text-red-100 font-medium opacity-90 px-8">We have sent your location to {myPeople.length} people.</p>
            </div>

            <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70">Sending Alerts...</h3>
              <div className="space-y-3">
                {alertSteps.map(step => (
                  <div key={step.id} className="flex items-center justify-between text-left">
                    <span className="text-sm font-medium">{step.message}</span>
                    <i className={`fas ${step.status === 'done' ? 'fa-circle-check text-green-300' : 'fa-spinner fa-spin opacity-50'}`}></i>
                  </div>
                ))}
              </div>
            </div>

            {aiTips.length > 0 && (
              <div className="w-full max-w-sm bg-white text-red-600 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-red-100 pb-2">
                  <i className="fas fa-bolt"></i>
                  <span className="text-xs font-black uppercase">Instant Safety Tips</span>
                </div>
                <div className="space-y-3">
                  {aiTips.map((tip, i) => (
                    <div key={i} className="flex gap-4 items-center text-left">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</div>
                      <p className="text-sm font-black leading-tight">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setIsEmergency(false)} className="bg-white text-red-600 px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm">
              I am safe now
            </button>
          </div>
        ) : (
          <>
            {/* HOME HUB */}
            {view === 'home' && (
              <div className="space-y-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900">Hello, {user.name}</h2>
                  <p className="text-slate-500 text-sm">Follow the phrase trigger or tap the button.</p>
                </div>

                <div className="flex justify-center relative">
                  <button onClick={startHelp} className="w-64 h-64 rounded-full bg-slate-900 border-[12px] border-slate-200 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all group hover:border-red-500/20">
                    <i className="fas fa-hand-holding-medical text-6xl text-slate-700 mb-4 group-hover:text-red-500 transition-colors"></i>
                    <span className="text-sm font-black text-slate-500 group-hover:text-white tracking-[0.2em] uppercase">HELP ME</span>
                  </button>
                  {isListening && <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping pointer-events-none"></div>}
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setIsListening(!isListening)}
                    className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between ${isListening ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{isListening ? 'LISTENING NOW' : 'TAP TO LISTEN'}</p>
                        <p className="text-[10px] opacity-80">Say your phrase: "{user.secretPhrase}"</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-white animate-pulse' : 'bg-slate-200'}`}></div>
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col items-center text-center gap-2">
                      <i className="fas fa-users text-blue-500"></i>
                      <p className="text-xl font-bold">{myPeople.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">My People</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col items-center text-center gap-2">
                      <i className="fas fa-lock text-green-500"></i>
                      <p className="text-xl font-bold italic">ON</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MY PEOPLE LIST */}
            {view === 'people' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-500 py-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">My Trusted People</h2>
                  <p className="text-sm text-slate-500">Who should we notify in danger?</p>
                </div>

                <form onSubmit={addPerson} className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest ml-2">Add New Person</h3>
                  <input required placeholder="Name (e.g. Dad)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-300" value={tempPerson.name} onChange={e => setTempPerson({...tempPerson, name: e.target.value})} />
                  <div className="grid grid-cols-1 gap-4">
                    <input placeholder="Email Address" type="email" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-300" value={tempPerson.email} onChange={e => setTempPerson({...tempPerson, email: e.target.value})} />
                    <input placeholder="Phone Number" type="tel" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-300" value={tempPerson.phone} onChange={e => setTempPerson({...tempPerson, phone: e.target.value})} />
                  </div>
                  <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm uppercase">Add to Circle</button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">My Safe Circle</h3>
                  {myPeople.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 italic text-sm">No people added yet. Add someone!</div>
                  ) : (
                    myPeople.map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-3xl flex items-center justify-between border border-slate-100 shadow-sm transition-all hover:border-blue-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-lg">
                            {p.name[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{p.name}</h4>
                            <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase">
                              {p.email && <span>Email</span>}
                              {p.phone && <span>SMS</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setMyPeople(myPeople.filter(x => x.id !== p.id))} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                          <i className="fas fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Simple Nav */}
      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center px-6">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
              <i className="fas fa-home-alt text-xl"></i>
              <span className="text-[10px] font-black tracking-widest">DASHBOARD</span>
            </button>
            
            <button 
              onClick={startHelp} 
              className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center -mt-16 border-[8px] border-slate-50 shadow-2xl active:scale-90 transition-all hover:scale-105"
            >
              <i className="fas fa-bolt text-2xl"></i>
            </button>

            <button onClick={() => setView('people')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'people' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
              <i className="fas fa-user-group text-xl"></i>
              <span className="text-[10px] font-black tracking-widest">MY PEOPLE</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
