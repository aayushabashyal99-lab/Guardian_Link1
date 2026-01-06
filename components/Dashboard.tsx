
import React from 'react';
import SOSButton from './SOSButton';
import GeminiAssistant from './GeminiAssistant';
import SafetyStats from './SafetyStats';
import { UserState, SafetyAlert } from '../types';

interface DashboardProps {
  userState: UserState;
  alerts: SafetyAlert[];
  onToggleSOS: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, alerts, onToggleSOS }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Controls & Stats */}
      <div className="lg:col-span-4 space-y-8">
        <section className="glass-card rounded-3xl p-4 overflow-hidden shadow-2xl">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-4 pt-4 mb-2">Emergency Hub</h2>
          <SOSButton isActive={userState.isSOSActive} onToggle={onToggleSOS} />
        </section>

        <section className="glass-card rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Device Status</h2>
          <SafetyStats userState={userState} />
        </section>
      </div>

      {/* Middle/Right Column: AI & Alerts */}
      <div className="lg:col-span-8 space-y-8">
        <section className="glass-card rounded-3xl p-6 min-h-[400px]">
          <GeminiAssistant isSOSActive={userState.isSOSActive} userState={userState} />
        </section>

        <section className="glass-card rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-200">Recent Activity</h2>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">Real-time update</span>
          </div>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic">
                No recent incidents reported. Safe environment confirmed.
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="flex gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.type === 'emergency' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    <i className={`fas ${alert.type === 'emergency' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-slate-200">{alert.message}</h4>
                      <span className="text-xs text-slate-500">{alert.timestamp.toLocaleTimeString()}</span>
                    </div>
                    {alert.location && (
                      <p className="text-xs text-slate-500 mt-1">
                        Location: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
