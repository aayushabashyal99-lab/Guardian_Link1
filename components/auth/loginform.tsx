
import React, { useState } from 'react';
import { User } from '../../types.ts';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onSuccess: (user: User) => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call with a shorter, more reliable timeout
    setTimeout(() => {
      const mockUser = { id: '1', email, name: email.split('@')[0] || 'User' };
      localStorage.setItem('guardian_user', JSON.stringify(mockUser));
      onSuccess(mockUser);
      // We don't need to setIsLoading(false) if the parent navigates away, but for safety:
      setIsLoading(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Email Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail size={18} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="block w-full pl-12 pr-4 py-4 bg-[#0A0D12] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-slate-200"
            placeholder="Email Address"
          />
        </div>

        {/* Password Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full pl-12 pr-12 py-4 bg-[#0A0D12] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-slate-200"
            placeholder="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-slate-400 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end -mt-2">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors py-1"
        >
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 py-4 px-6 primary-gradient rounded-full text-white font-bold tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70"
      >
        <span>{isLoading ? 'PROCESSING...' : 'LOGIN'}</span>
        {!isLoading && <ArrowRight size={18} className="ml-2" />}
      </button>
    </form>
  );
};

export default LoginForm;
