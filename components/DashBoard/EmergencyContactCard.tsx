
import React from 'react';
import { EmergencyContact } from '../../types';
import { Phone, MessageCircle } from 'lucide-react';

interface EmergencyContactCardProps {
  contact: EmergencyContact;
}

const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({ contact }) => {
  return (
    <div className="glass-card p-5 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
            {contact.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-white leading-none">{contact.name}</h4>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{contact.relation}</span>
          </div>
        </div>
        <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#05070A] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center space-x-2 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all">
          <Phone size={14} />
          <span>CALL</span>
        </button>
        <button className="flex items-center justify-center space-x-2 py-2 bg-blue-500/10 text-blue-500 rounded-xl font-bold text-xs hover:bg-blue-500 hover:text-white transition-all">
          <MessageCircle size={14} />
          <span>ALERT</span>
        </button>
      </div>
    </div>
  );
};

export default EmergencyContactCard;
