
import React, { useState, useEffect } from 'react';
import { User, EmergencyContact } from '../types.ts';
import { 
  Shield, MapPin, Users, Settings, MessageSquare, AlertTriangle, 
  Menu, X, Bell, LogOut, Navigation, Star, Plus, Lock, ShieldCheck
} from 'lucide-react';
import SOSButton from './dashboard/SOSButton.tsx';
import SafetyAI from './dashboard/SafetyAI.tsx';
import EmergencyContactCard from './dashboard/EmergencyContactCard.tsx';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: '1', name: 'Mom', phone: '+1 234 567 8900', relation: 'Parent' },
    { id: '2', name: 'Alex', phone: '+1 987 654 3210', relation: 'Friend' }
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(pos),
        (err) => console.warn("Location access denied", err)
      );
    }
  }, []);

  const navItems = [
    { id: 'home', icon: Shield, label: 'Safety Hub' },
    { id: 'map', icon: MapPin, label: 'Safe Map' },
    { id: 'contacts', icon: Users, label: 'Guardians' },
    { id: 'security', icon: Lock, label: 'Security' },
    { id: 'ai', icon: MessageSquare, label: 'Safety AI' },
  ];

  return (
    <div className="flex h-screen bg-[#05070A] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-card border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">GuardianLink</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-600/10 text-blue-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500 font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">Pro Member</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 z-40 bg-[#05070A]/80 backdrop-blur-md">
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="hidden lg:block text-slate-500 font-medium">
            Welcome back, <span className="text-white">{user.name.split(' ')[0]}</span>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/5 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#05070A]"></span>
            </button>
            <button className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/5 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 scroll-smooth pb-24 lg:pb-8">
          {activeTab === 'home' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Emergency Section */}
              <div className="flex flex-col items-center justify-center py-10">
                <SOSButton />
              </div>

              {/* Quick Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-3xl border border-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                      <Navigation size={24} />
                    </div>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase">Live</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Live Tracking</h3>
                  <p className="text-sm text-slate-400 mb-4">Tracking active for Mom and Alex</p>
                  <button className="w-full py-2 bg-blue-600/10 text-blue-500 rounded-xl font-bold text-sm hover:bg-blue-600/20 transition-colors">
                    Manage Sharing
                  </button>
                </div>

                <div className="glass-card p-6 rounded-3xl border border-amber-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                      <AlertTriangle size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Safety Check-in</h3>
                  <p className="text-sm text-slate-400 mb-4">Automated check-in set for 11:30 PM</p>
                  <button className="w-full py-2 bg-amber-600/10 text-amber-500 rounded-xl font-bold text-sm hover:bg-amber-600/20 transition-colors">
                    Edit Schedule
                  </button>
                </div>

                <div className="glass-card p-6 rounded-3xl border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/5 rounded-2xl text-slate-300">
                      <Star size={24} />
                    </div>
                    <span className="text-sm font-bold text-white">88/100</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Trust Score</h3>
                  <p className="text-sm text-slate-400 mb-4">Your current route is verified safe</p>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[88%] shadow-glow"></div>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Emergency Guardians</h2>
                  <button className="p-2 text-blue-500 hover:bg-blue-600/10 rounded-xl transition-all">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map(contact => (
                    <EmergencyContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-3xl border border-white/5">
              <MapPin size={64} className="text-blue-500 mb-6 animate-bounce" />
              <h2 className="text-2xl font-bold text-white mb-2">Safe Map Navigation</h2>
              <p className="text-slate-400 max-w-md">
                Find the safest, most well-lit walking routes powered by community data and street lighting analysis.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="p-4 bg-[#0A0D12] rounded-2xl border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Nearby Safepoints</p>
                  <p className="text-lg font-bold text-white">12 Locations</p>
                </div>
                <div className="p-4 bg-[#0A0D12] rounded-2xl border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Active Guardians</p>
                  <p className="text-lg font-bold text-white">4 Online</p>
                </div>
                <div className="p-4 bg-[#0A0D12] rounded-2xl border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Heatmap Accuracy</p>
                  <p className="text-lg font-bold text-white">99%</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="h-full max-w-2xl mx-auto flex flex-col">
              <SafetyAI />
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Account Security</h2>
                  <p className="text-slate-400 text-sm">Update your password and manage security settings.</p>
                </div>
              </div>

              <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                <h3 className="text-lg font-bold text-white">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full bg-[#0A0D12] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full bg-[#0A0D12] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => alert("Success: Your password has been updated!")}
                  className="w-full py-4 primary-gradient rounded-2xl text-white font-bold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20"
                >
                  UPDATE PASSWORD
                </button>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Secure your account with a secondary code.</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-slate-800 rounded-full relative cursor-pointer p-1">
                  <div className="w-4 h-4 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
             <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold text-white">Manage Guardians</h2>
                <p className="text-slate-400">People who will be notified instantly in case of an emergency.</p>
                <div className="space-y-4">
                  {contacts.map(contact => (
                    <div key={contact.id} className="glass-card p-6 rounded-3xl flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 primary-gradient rounded-full flex items-center justify-center text-white font-bold">
                          {contact.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{contact.name}</p>
                          <p className="text-sm text-slate-500">{contact.relation} • {contact.phone}</p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                  <button className="w-full py-4 border-2 border-dashed border-white/10 rounded-3xl text-slate-500 hover:text-white hover:border-blue-500/50 transition-all flex items-center justify-center space-x-2">
                    <Plus size={20} />
                    <span className="font-bold">Add New Guardian</span>
                  </button>
                </div>
             </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full glass-card border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center space-y-1 ${
                activeTab === item.id ? 'text-blue-500' : 'text-slate-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
