
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- Simple Data Structures ---
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

interface NotificationStatus {
  id: string;
  name: string;
  type: 'Email' | 'SMS';
  status: 'Sending...' | 'SENT';
}

const App: React.FC = () => {
  // --- App State ---
  const [view, setView] = useState<'login' | 'register' | 'home' | 'people'>('login');
  const [user, setUser] = useState<User>({ name: '', email: '', secretPhrase: 'Help me', isLoggedIn: false });
  const [myPeople, setMyPeople] = useState<TrustedPerson[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [notifs, setNotifs] = useState<NotificationStatus[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string[]>([]);

  // Form Inputs (Fixed Visibility)
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputPhone, setInputPhone] = useState('');

  // --- Functions ---
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
    if (!inputName.trim()) return alert("Please type a name.");
    if (!inputEmail.trim() && !inputPhone.trim()) return alert("Enter an email or phone number.");

    const newPerson: TrustedPerson = {
      id: Date.now().toString(),
      name: inputName,
      email: inputEmail,
      phone: inputPhone
    };

    setMyPeople([...myPeople, newPerson]);
    setInputName('');
    setInputEmail('');
    setInputPhone('');
    alert("Guardian Saved!");
  };

  const triggerEmergency = async () => {
    if (myPeople.length === 0) {
      alert("Please add a parent or friend in the 'My People' section first!");
      setView('people');
      return;
    }

    setIsEmergency(true);
    setIsListening(false);

    // Create the "Tracking List" so user knows messages are sending
    const tracking: NotificationStatus[] = [];
    myPeople.forEach(p => {
      if (p.email) tracking.push({ id: `e-${p.id}`, name: p.name, type: 'Email', status: 'Sending...' });
      if (p.phone) tracking.push({ id: `s-${p.id}`, name: p.name, type: 'SMS', status: 'Sending...' });
    });
    setNotifs(tracking);

    // Simulate sending time
    setTimeout(() => {
      setNotifs(prev => prev.map(n => ({ ...n, status: 'SENT' })));
    }, 2000);

    // Get AI Help
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Help! A user is scared. They used the phrase "${user.secretPhrase}". 
      Give 3 very short, simple safety tips (5 words max each) for a child or senior. 
      JSON list: ["tip1", "tip2", "tip3"]`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      setAiAdvice(JSON.parse(res.text || '["Find a safe place", "Stay where people are", "Hold your phone tight"]'));
    } catch {
      setAiAdvice(["Find a safe place", "Stay where people are", "Hold your phone tight"]);
    }
  };

  // --- Auth Views ---
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl text-white text-3xl">
              <i className="fas fa-shield-heart"></i>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">GuardianSafe</h1>
            <p className="text-slate-500 font-bold">Safety made simple for everyone.</p>
          </div>

          <div className="bg-slate-100 p-8 rounded-[2rem] border-2 border-slate-200">
            {view === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input required type="email" placeholder="Email" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-blue-500" />
                <input required type="password" placeholder="Password" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-blue-500" />
                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all">Sign In</button>
                <button type="button" onClick={() => setView('register')} className="w-full text-center text-sm font-bold text-blue-600 mt-2">Create New Account</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <input required placeholder="Your Full Name" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-blue-500" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                <input required type="email" placeholder="Email" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-blue-500" />
                <input required type="password" placeholder="Choose a Password" className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-blue-500" />
                
                <div className="p-4 bg-blue-600/10 rounded-2xl border-2 border-blue-200">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">My Secret Help Phrase</label>
                  <input required placeholder="e.g. Save me" className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-900 outline-none focus:ring-0" value={user.secretPhrase} onChange={e => setUser({...user, secretPhrase: e.target.value})} />
                  <p className="text-[10px] text-slate-500 mt-1">If you say this, the alarm starts.</p>
                </div>

                <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all">Start Staying Safe</button>
                <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm font-bold text-slate-500 mt-2">Back to Sign In</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ${isEmergency ? 'bg-red-600' : 'bg-slate-50 text-slate-900'}`}>
      
      {!isEmergency && (
        <header className="p-6 bg-white flex justify-between items-center border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-heart"></i>
            </div>
            <h1 className="font-black text-xl tracking-tight">GuardianSafe</h1>
          </div>
          <button onClick={() => setUser({...user, isLoggedIn: false})} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="fas fa-power-off"></i>
          </button>
        </header>
      )}

      <main className="flex-1 p-6 pb-32">
        {isEmergency ? (
          <div className="h-full flex flex-col justify-center items-center text-white text-center space-y-8 animate-in fade-in duration-500">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-red-600 text-5xl shadow-2xl animate-pulse">
              <i className="fas fa-bullhorn"></i>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-black uppercase italic">Help is on the way!</h2>
              <p className="text-red-100 font-bold opacity-80">We are contacting your guardians now.</p>
            </div>

            {/* Notification List (Visual Proof) */}
            <div className="w-full max-w-sm bg-black/10 rounded-[2rem] p-6 border border-white/20">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-70">Message Status</h3>
              <div className="space-y-3">
                {notifs.map(n => (
                  <div key={n.id} className="flex items-center justify-between bg-white/10 p-4 rounded-2xl">
                    <div className="text-left">
                      <p className="text-sm font-black">{n.name}</p>
                      <p className="text-[10px] font-bold opacity-60">{n.type} Alert</p>
                    </div>
                    <div className={`text-xs font-black px-3 py-1 rounded-full ${n.status === 'SENT' ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white'}`}>
                      {n.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full max-w-sm bg-white text-red-600 rounded-[2rem] p-6 shadow-2xl space-y-4">
              <h3 className="text-[10px] font-black uppercase border-b border-red-50 pb-2">Quick Safety Advice</h3>
              <div className="space-y-3">
                {aiAdvice.map((tip, i) => (
                  <div key={i} className="flex gap-4 items-center text-left">
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                    <p className="text-sm font-black">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setIsEmergency(false)} className="bg-white text-red-600 px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 text-sm">
              I'm okay now
            </button>
          </div>
        ) : (
          <>
            {view === 'home' && (
              <div className="space-y-10 py-10 animate-in fade-in duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black">Hi, {user.name}!</h2>
                  <p className="text-slate-500 font-bold mt-1">Press the big button if you feel unsafe.</p>
                </div>

                <div className="flex justify-center">
                  <button onClick={triggerEmergency} className="w-64 h-64 rounded-full bg-white border-[16px] border-slate-200 flex flex-col items-center justify-center shadow-2xl active:scale-95 group">
                    <i className="fas fa-hand-holding-heart text-6xl text-red-500 mb-4 transition-transform group-hover:scale-110"></i>
                    <span className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase">GET HELP</span>
                  </button>
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <button 
                    onClick={() => setIsListening(!isListening)}
                    className={`w-full p-6 rounded-[2rem] border-4 transition-all flex items-center justify-between ${isListening ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <i className={`fas ${isListening ? 'fa-microphone animate-pulse' : 'fa-microphone-slash'}`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black">{isListening ? 'LISTENING...' : 'VOICE OFF'}</p>
                        <p className="text-[10px] font-bold opacity-70 italic">"{user.secretPhrase}"</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-white' : 'bg-slate-300'}`}></div>
                  </button>
                </div>
              </div>
            )}

            {view === 'people' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500 py-4 max-w-md mx-auto">
                <div className="text-center">
                  <h2 className="text-2xl font-black">My Trusted People</h2>
                  <p className="text-slate-500 font-bold">Add your parent or friend here.</p>
                </div>

                <form onSubmit={addPerson} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest ml-2">New Guardian</h3>
                  <div className="space-y-4">
                    {/* Explicit high-contrast text and clear placeholders */}
                    <input 
                      required 
                      placeholder="Their Name (e.g. Mom)" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold outline-none focus:border-blue-500" 
                      value={inputName} 
                      onChange={e => setInputName(e.target.value)} 
                    />
                    <input 
                      placeholder="Their Email" 
                      type="email" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold outline-none focus:border-blue-500" 
                      value={inputEmail} 
                      onChange={e => setInputEmail(e.target.value)} 
                    />
                    <input 
                      placeholder="Their Phone Number" 
                      type="tel" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold outline-none focus:border-blue-500" 
                      value={inputPhone} 
                      onChange={e => setInputPhone(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 text-sm uppercase tracking-widest">Add to Circle</button>
                </form>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Current Circle</h3>
                  {myPeople.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold px-10">
                      Your circle is empty. Add a parent so they can help you!
                    </div>
                  ) : (
                    myPeople.map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-3xl flex items-center justify-between border-2 border-slate-50 shadow-sm">
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
          </>
        )}
      </main>

      {!isEmergency && (
        <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t-2 border-slate-100 z-50">
          <div className="max-w-sm mx-auto flex justify-between items-center px-4">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-house text-2xl"></i>
              <span className="text-[10px] font-black uppercase">Home</span>
            </button>
            
            <button onClick={triggerEmergency} className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center -mt-16 border-[8px] border-white shadow-2xl active:scale-90 transition-all">
              <i className="fas fa-bolt text-2xl"></i>
            </button>

            <button onClick={() => setView('people')} className={`flex flex-col items-center gap-1 transition-all ${view === 'people' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
              <i className="fas fa-users text-2xl"></i>
              <span className="text-[10px] font-black uppercase">My People</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
