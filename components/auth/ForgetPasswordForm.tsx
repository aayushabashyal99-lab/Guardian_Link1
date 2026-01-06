
import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Lock, RefreshCw } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Step = 'email' | 'otp' | 'reset';

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate sending OTP
    setTimeout(() => {
      setStep('otp');
      setIsLoading(false);
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setStep('reset');
      setIsLoading(false);
    }, 1000);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setIsLoading(true);
    // Simulate reset
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      // Auto focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">
          {step === 'email' && 'Reset Password'}
          {step === 'otp' && 'Verify Email'}
          {step === 'reset' && 'Create New Password'}
        </h2>
      </div>

      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <p className="text-sm text-slate-400 leading-relaxed">
            Enter your registered email address below. We'll send a 4-digit verification code to reset your password.
          </p>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={18} className="text-slate-500 group-focus-within:text-blue-500" />
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
          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 primary-gradient rounded-2xl text-white font-bold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin" /> : <span>SEND CODE</span>}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-8 text-center">
          <div className="flex flex-col items-center">
            <ShieldCheck size={48} className="text-blue-500 mb-4" />
            <p className="text-sm text-slate-400">
              Check your email at <strong>{email}</strong> for the verification code.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                className="w-14 h-16 text-center text-2xl font-bold bg-[#0A0D12] border border-white/5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white"
              />
            ))}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading || otp.some(d => !d)}
              className="w-full py-4 primary-gradient rounded-2xl text-white font-bold tracking-wider transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="animate-spin mx-auto" /> : 'VERIFY CODE'}
            </button>
            <button 
              type="button" 
              className="text-xs font-semibold text-slate-500 hover:text-white underline underline-offset-4"
              onClick={() => setOtp(['', '', '', ''])}
            >
              Resend Code
            </button>
          </div>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <p className="text-sm text-slate-400">
            Set a strong password for your security.
          </p>
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-500" />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="block w-full pl-12 pr-4 py-4 bg-[#0A0D12] border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                placeholder="New Password"
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-500" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full pl-12 pr-4 py-4 bg-[#0A0D12] border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                placeholder="Confirm Password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !newPassword}
            className="w-full py-4 primary-gradient rounded-2xl text-white font-bold tracking-wider transition-all disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin mx-auto" /> : 'RESET PASSWORD'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
