
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { UserState, AIAdvice } from './types';

interface GeminiAssistantProps {
  isSOSActive: boolean;
  userState: UserState;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ isSOSActive, userState }) => {
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
        Please provide immediate safety triage steps and situational advice for someone in distress. 
        Keep it concise and critical. Respond in JSON format.`;

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
              priority: { type: Type.STRING, description: 'critical, high, medium, low' }
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
    if (isSOSActive) {
      generateEmergencyAdvice();
    } else {
      setAdvice(null);
    }
  }, [isSOSActive]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'You are an elite emergency safety dispatcher. Be calm, direct, and life-saving. Help the user with situational awareness and safety tips based on their current context.'
        }
      });
      
      const response = await chat.sendMessage({ message: userMsg });
      setChatHistory(prev => [...prev, { role: 'assistant', text: response.text || 'I am processing your situation.' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Error communicating with AI command. Please focus on your immediate safety.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <h2 className="text-lg font-semibold text-slate-200">AI Safety Command</h2>
        </div>
        {isSOSActive && (
          <span className="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20 font-bold animate-pulse">
            TRIAGE ACTIVE
          </span>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {isSOSActive && advice ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className={`p-4 rounded-xl border-l-4 ${
              advice.priority === 'critical' ? 'bg-red-500/10 border-red-500' : 'bg-orange-500/10 border-orange-500'
            }`}>
              <h3 className="font-bold text-red-400 mb-2">URGENT GUIDANCE</h3>
              <p className="text-slate-200 text-sm mb-4 leading-relaxed">{advice.summary}</p>
              <div className="space-y-2">
                {advice.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start text-sm">
                    <span className="bg-slate-800 text-slate-300 w-5 h-5 flex items-center justify-center rounded-full text-[10px] flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <i className="fas fa-brain text-slate-700 text-4xl mb-4"></i>
                <p className="text-slate-500 text-sm max-w-xs">
                  AI Safety Command is monitoring. Ask for safety advice or report a non-emergency concern here.
                </p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-slate-500 text-xs italic">AI is thinking...</div>}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Describe your situation or ask for advice..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            onClick={handleSendMessage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            <i className="fas fa-paper-plane text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;
