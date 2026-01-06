
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { UserState, AIAdvice } from './types';

interface AIAssistantProps {
  isSOSActive: boolean;
  userState: UserState;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isSOSActive, userState }) => {
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  
  const generateEmergencyAdvice = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `SOS Beacon is ACTIVE. 
        User Status: Battery ${userState.batteryLevel}%, Signal Strength ${userState.signalStrength}/5.
        Location: ${userState.location ? `${userState.location.lat}, ${userState.location.lng}` : 'Unknown'}.
        Please provide immediate safety triage steps. Response must be JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              priority: { type: Type.STRING }
            },
            required: ['summary', 'steps', 'priority']
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAdvice(result);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSOSActive) generateEmergencyAdvice();
    else setAdvice(null);
  }, [isSOSActive]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({ model: 'gemini-3-flash-preview' });
      const response = await chat.sendMessage({ message: userMsg });
      setChatHistory(prev => [...prev, { role: 'assistant', text: response.text || '' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Error contacting command center.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">AI Safety Command</h2>
        {isSOSActive && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded animate-pulse">TRIAGE ACTIVE</span>}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {advice && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm font-bold text-red-400 mb-2">{advice.summary}</p>
            <ul className="text-xs space-y-1 text-slate-300">
              {advice.steps.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800'}`}>{msg.text}</div>
          </div>
        ))}
      </div>
      <div className="relative mt-4">
        <input 
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pr-10 text-sm focus:outline-none" 
          value={chatInput} 
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500"><i className="fas fa-paper-plane"></i></button>
      </div>
    </div>
  );
};

export default AIAssistant;
