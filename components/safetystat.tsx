
import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { UserState } from '../types';

const SafetyStats: React.FC<{ userState: UserState }> = ({ userState }) => {
  return (
    <div className="p-4">
      <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Device Status</h3>
      <div className="flex justify-between">
        <div>Battery: {Math.round(userState.batteryLevel)}%</div>
        <div>Signal: {userState.signalStrength}G</div>
      </div>
    </div>
  );
};

export default SafetyStats;
