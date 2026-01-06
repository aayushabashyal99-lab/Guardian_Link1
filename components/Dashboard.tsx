
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
      <div className="lg:col-span-4 space-y-8">
        <section className="glass-card rounded-3xl p-4">
          <SOSButton isActive={userState.isSOSActive} onToggle={onToggleSOS} />
        </section>
        <section className="glass-card rounded-3xl p-6">
          <SafetyStats userState={userState} />
        </section>
      </div>
      <div className="lg:col-span-8 space-y-8">
        <section className="glass-card rounded-3xl p-6">
          <GeminiAssistant isSOSActive={userState.isSOSActive} userState={userState} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
