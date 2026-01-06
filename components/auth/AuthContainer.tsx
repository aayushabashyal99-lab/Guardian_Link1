
import React, { useState } from 'react';
import { AuthMode, User } from '../../types';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

interface AuthContainerProps {
  onAuthSuccess: (user: User) => void;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 primary-gradient rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-500/30 transform hover:rotate-6 transition-transform">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">GuardianLink</h1>
          <p className="text-slate-400 italic">Safety & Security simplified.</p>
        </div>

        {/* Form Container */}
        <div className="w-full glass-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative">
          {mode !== 'forgot-password' && mode !== 'reset-password' && (
            <div className="flex bg-[#0A0D12] rounded-2xl p-1 mb-8 border border-white/5">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  mode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  mode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                REGISTER
              </button>
            </div>
          )}

          {mode === 'login' && (
            <LoginForm 
              onSuccess={onAuthSuccess} 
              onForgotPassword={() => setMode('forgot-password')} 
            />
          )}
          {mode === 'register' && (
            <RegisterForm onSuccess={onAuthSuccess} />
          )}
          {(mode === 'forgot-password' || mode === 'reset-password') && (
            <ForgotPasswordForm 
              onBack={() => setMode('login')}
              onSuccess={() => {
                alert("Password successfully reset! Please login.");
                setMode('login');
              }}
            />
          )}
        </div>

        <p className="mt-8 text-slate-500 text-sm">
          Protected by end-to-end encryption
        </p>
      </div>
    </div>
  );
};

export default AuthContainer;
