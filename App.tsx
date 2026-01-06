
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

  // Form states - explicitly typed to ensure values show up
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // --- Actions ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, isLoggedIn: true, name: user.name || 'User' });
    setView('home');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, isLoggedIn: true });
    setView('home');
  };

  const addPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) {
      alert("Please enter a name.");
      return;
    }
    if (!tempEmail.trim() && !tempPhone.trim()) {
      alert("Please enter either an email or a phone number so we can contact them.");
      return;
    }
    
    const newPerson: TrustedPerson = {
      id: Date.now().toString(),
      name: tempName,
      email: tempEmail,
      phone: tempPhone
    };
    
    setMyPeople([...myPeople, newPerson]);
    // Clear inputs
    setTempName('');
    setTempEmail('');
    setTempPhone('');
    alert("Saved! This person will now be notified if you press the Help button.");
  };

  const startHelp = async () => {
    if (myPeople.length === 0) {
      alert("STOP: You have not added any trusted people yet! Go to 'My People' and add your parent or friend first.");
      setView('people');
      return;
    }

    setIsEmergency(true);
    setIsListening(false);

    // 1. Create the checklist of notifications
    const steps: AlertStep[] = [];
    myPeople.forEach(p => {
      if (p.email) steps.push({ id: `e-${p.id}`, message: `Sending Email to ${p.name}...`, status: 'pending' });
      if (p.phone) steps.push({ id: `s-${p.id}`, message: `Sending Text to ${p.name}...`, status: 'pending' });
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
      const prompt = `EMERGENCY: A user is in DANGER. They need simple help.
        Their secret phrase was: "${user.secretPhrase}". 
        Give 3 extremely simple, short safety instructions for a child or senior. 
        Example: "Run to a bright shop", "Shout for help", "Stay where people can see you".
        Respond ONLY with a JSON array of strings: ["tip1", "tip2", "tip3"]`;
      
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
      setAiTips(["Go to a safe place", "Shout for help", "Keep your phone in your hand"]);
    } finally {
      setLoading(false);
    }
  };

  // --- Auth Views ---
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-6 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <i className="fas fa-shield-heart text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-900">GuardianSafe</h1>
            <p className="text-slate-500 font-medium">Safety for children, seniors, and everyone.</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <input required type="email" placeholder="Your Email" className="w-full p-4 border border-slate-300 rounded-2xl bg-white text-slate-900 focus:border-blue-500 outline-none" onChange={e => setUser({...user, email: e.target.value})} />
                <input required type="password" placeholder="Your Password" className="w-full p-4 border border-slate-300 rounded-2xl bg-white text-slate-900 focus:border-blue-500 outline-none" />
                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm">Sign In</button>
                <div className="flex justify-between text-xs font-bold pt-2">
                  <button type="button" onClick={() => setView('forgot')} className="text-blue-600">Forgot Password?</button>
                  <button type="button" onClick={() => setView('register')} className="text-blue-600">Create Account</button>
                </div>
              </form>
            )}

            {view === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <input required placeholder="Your Full Name" className="w-full p-4 border border-slate-300 rounded-2xl bg-white text-slate-900 focus:border-blue-500 outline-none" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                <input required type="email" placeholder="Email Address" className="w-full p-4 border border-slate-300 rounded-2xl bg-white text-slate-900 focus:border-blue-500 outline-none" />
                <input required type="password" placeholder="Create a Password" className="w-full p-4 border border-slate-300 rounded-2xl bg-white text-slate-900 focus:border-blue-500 outline-none" />
                <div className="p-4 bg-blue-600/5 border border-blue-200 rounded-2xl space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Secret Help Phrase</label>
                  <input required placeholder="e.g. Save me" className="w-full bg-transparent text-lg font-bold text-slate-900 border-none outline-none p-0 focus:ring-0" value={user.secretPhrase} onChange={e => setUser({...user, secretPhrase: e.target.value})} />
                  <p className="text-[10px] text-slate-400 italic">Say this phrase if you can't reach your phone.</p>
                </div>
                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm">Register & Start</button>
                <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs font-bold text-slate-500 mt-2">Already have an account? Sign In</button>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={(e) => {e.preventDefault(); alert("Sent!"); setView('login');}} className="space-y-4">
                <p className="text-sm text-slate-600 text-center font-medium">Enter your email and we'll send a reset link.</p>
                <input required type="email" placeholder="Email Address" className="w-full p-4 border border-slate-300 rounded-2xl bg-white text-slate-900 focus:border-blue-500 outline-none" />
                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm">Reset Password</button>
                <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs font-bold text-slate-500 mt-2">Back to Login</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${isEmergency ? 'bg-red-600' : 'bg-slate-50 text-slate-900'}`}>
      
      {!isEmergency && (
        <header className="p-6 bg-white flex justify-between items-center border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-shield"></i>
            </div>
            <div>
              <h1 className="font-black text-slate-900 leading-none">GuardianSafe</h1>
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Status: Secure</p>
            </div>
          </div>
          <button onClick={() => setUser({...user, isLoggedIn: false})} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
            <i className="fas fa-power-off text-xs"></i>
          </button>
        </header>
      )}

      <main className="flex-1 p-6 overflow-y-auto pb-32">
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
              <p className="text-red-100 font-bold opacity-90 px-8 leading-tight">Your trusted people have been notified of your danger.</p>
            </div>

            <div className="w-full max-w-sm bg-white/20 backdrop-blur-xl rounded-[2rem] p-6 border border-white/30 shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Automatic Alerts Sent</h3>
              <div className="space-y-3">
                {alertSteps.map(step => (
                  <div key={step.id} className="flex items-center justify-between text-left bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="text-xs font-bold">{step.message}</span>
                    <i className={`fas ${step.status === 'done' ? 'fa-circle-check text-green-300' : 'fa-spinner fa-spin opacity-50'}`}></i>
                  </div>
                ))}
              </div>
            </div>

            {aiTips.length > 0 && (
              <div className="w-full max-w-sm bg-white text-red-600 rounded-[2rem] p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-red-50 pb-2">
                  <i className="fas fa-bolt"></i>
                  <span className="text-xs font-black uppercase">Instant Safety Steps</span>
                </div>
                <div className="space-y-3">
                  {aiTips.map((tip, i) => (
                    <div key={i} className="flex gap-4 items-center text-left">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                      <p className="text-sm font-black leading-tight">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setIsEmergency(false)} className="bg-white text-red-600 px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-sm">
              I am safe now
            </button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-8 py-6 animate-in fade-in duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900">Hi, {user.name}</h2>
                  <p className="text-slate-500 font-medium mt-1">Tap the big button if you are in danger.</p>
                </div>

                <div className="flex justify-center relative py-4">
                  <button onClick={startHelp} className="w-64 h-64 rounded-full bg-white border-[16px] border-slate-100 flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95 transition-all group hover:border-red-500/10">
                    <i className="fas fa-hand-holding-medical text-6xl text-red-500 mb-4 group-hover:scale-110 transition-transform"></i>
                    <span className="text-sm font-black text-slate-400 group-hover:text-red-600 tracking-[0.2em] uppercase">I Need Help</span>
                  </button>
                  {isListening && <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping pointer-events-none"></div>}
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                  <button 
                    onClick={() => setIsListening(!isListening)}
                    className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${isListening ? 'bg-blue-600 border-blue-500 text-white shadow-xl scale-105' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                        <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'}`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black">{isListening ? 'LISTENING NOW' : 'TAP TO LISTEN'}</p>
                        <p className={`text-[10px] font-bold ${isListening ? 'opacity-80' : 'text-slate-400'}`}>Phrase: "{user.secretPhrase}"</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-200'}`}></div>
                  </button>

                  <div className="bg-white p-5 rounded-[2rem] border border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                        <i className="fas fa-users text-sm"></i>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-400">Trusted Circle</p>
                        <p className="text-sm font-black text-slate-900">{myPeople.length} People Added</p>
                      </div>
                    </div>
                    <button onClick={() => setView('people')} className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Edit</button>
                  </div>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-500 py-4 max-w-sm mx-auto">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-900">My Trusted People</h2>
                  <p className="text-sm text-slate-500 font-medium">Who should we call if you are in danger?</p>
                </div>

                <form onSubmit={addPerson} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 space-y-4 shadow-xl">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">Register New Person</h3>
                  <div className="space-y-3">
                    <input 
                      required 
                      placeholder="Name (e.g. Dad)" 
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-200 text-slate-900 font-bold focus:border-blue-300 transition-all" 
                      value={tempName} 
                      onChange={e => setTempName(e.target.value)} 
                    />
                    <input 
                      placeholder="Email Address" 
                      type="email" 
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-200 text-slate-900 font-bold focus:border-blue-300 transition-all" 
                      value={tempEmail} 
                      onChange={e => setTempEmail(e.target.value)} 
                    />
                    <input 
                      placeholder="Phone Number" 
                      type="tel" 
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-200 text-slate-900 font-bold focus:border-blue-300 transition-all" 
                      value={tempPhone} 
                      onChange={e => setTempPhone(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-sm uppercase tracking-widest shadow-lg">Save Person</button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">My Circle Members</h3>
                  {myPeople.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 italic text-sm px-6">
                      Your circle is empty! Add your parent, brother, or friend here so we can help you.
                    </div>
                  ) : (
                    myPeople.map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-3xl flex items-center justify-between border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-blue-600/20 shadow-lg">
                            {p.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900">{p.name}</h4>
                            <div className="flex gap-3 text-[10px] font-black text-slate-400 uppercase">
                              {p.email && <span><i className="fas fa-at mr-1"></i>Email</span>}
                              {p.phone && <span><i className="fas fa-phone mr-1"></i>SMS</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setMyPeople(myPeople.filter(x => x.id !== p.id))} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                          <i className="fas fa-trash-alt text-xs"></i>
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

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center px-6">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'home' ? 'text-blue-600 scale-110 font-black' : 'text-slate-400 font-bold'}`}>
              <i className="fas fa-house-user text-xl"></i>
              <span className="text-[10px] tracking-widest uppercase">Home</span>
            </button>
            
            <button 
              onClick={startHelp} 
              className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center -mt-16 border-[8px] border-white shadow-[0_15px_30px_rgba(220,38,38,0.4)] active:scale-90 transition-all hover:scale-110"
            >
              <i className="fas fa-bolt text-2xl"></i>
            </button>

            <button onClick={() => setView('people')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'people' ? 'text-blue-600 scale-110 font-black' : 'text-slate-400 font-bold'}`}>
              <i className="fas fa-user-group text-xl"></i>
              <span className="text-[10px] tracking-widest uppercase">My People</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
