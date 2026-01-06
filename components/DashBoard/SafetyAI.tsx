
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserState } from '../types';

const data = [
  { name: '12 AM', safety: 98 },
  { name: '4 AM', safety: 95 },
  { name: '8 AM', safety: 85 },
  { name: '12 PM', safety: 90 },
  { name: '4 PM', safety: 92 },
  { name: '8 PM', safety: 88 },
  { name: 'NOW', safety: 94 },
];

interface SafetyStatsProps {
  userState: UserState;
}

const SafetyStats: React.FC<SafetyStatsProps> = ({ userState }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Battery</div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{Math.round(userState.batteryLevel)}%</span>
            <span className={`text-[10px] mb-1 px-1.5 rounded ${userState.batteryLevel > 20 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
              {userState.batteryLevel > 20 ? 'Optimal' : 'Low'}
            </span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Signal</div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{userState.signalStrength}G</span>
            <span className="text-[10px] mb-1 px-1.5 rounded text-blue-400 bg-blue-400/10">Active</span>
          </div>
        </div>
      </div>

      <div className="h-40 w-full mt-4">
        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Area Safety Rating</div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSafety" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="name" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Area type="monotone" dataKey="safety" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSafety)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-300">Safe Perimeter</div>
            <div className="text-[10px] text-blue-400/70">Secure connection verified. AI monitoring active.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyStats;
