
import React, { useState } from 'react';
import { User } from '../../types';
import { User as UserIcon, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onSuccess: (user: User) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const mockUser = { id: '1', email, name };
      localStorage.setItem('guardian_user', JSON.stringify(mockUser));
      onSuccess(mockUser);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <UserIcon size={18} className="text-slate-500 group-focus-within:text-blue-500" />
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full pl-12 pr-4 py-3 bg-[#0A0D12] border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-slate-200"
          placeholder="Full Name"
        />
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Mail size={18} className="text-slate-500 group-focus-within:text-blue-500" />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="block w-full pl-12 pr-4 py-3 bg-[#0A0D12] border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-slate-200"
          placeholder="Email Address"
        />
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Phone size={18} className="text-slate-500 group-focus-within:text-blue-500" />
        </div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="block w-full pl-12 pr-4 py-3 bg-[#0A0D12] border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-slate-200"
          placeholder="Mobile Number"
        />
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Lock size={18} className="text-slate-500 group-focus-within:text-blue-500" />
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="block w-full pl-12 pr-4 py-3 bg-[#0A0D12] border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-slate-200"
          placeholder="Create Password"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 py-4 px-6 primary-gradient rounded-2xl text-white font-bold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 mt-4"
      >
        <span>{isLoading ? 'CREATING ACCOUNT...' : 'REGISTER'}</span>
        {!isLoading && <ArrowRight size={18} />}
      </button>
    </form>
  );
};

export default RegisterForm;
