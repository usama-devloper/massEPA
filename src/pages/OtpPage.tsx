// src/pages/OtpPage.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCountdown } from '../hooks/useCountdown';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';

interface OtpPageProps {
  onVerify: () => void;
  phoneNumber?: string;
}

export const OtpPage = ({ onVerify, phoneNumber = 'your phone' }: OtpPageProps) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { seconds, formatTime, resetTimer, isExpired } = useCountdown(300);
  const { toast, showToast } = useToast();

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    setError('');
    
    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && i < 4; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      const lastIndex = Math.min(digits.length, 3);
      otpInputRefs.current[lastIndex]?.focus();
    }
  };

  const handleResend = () => {
    if (isExpired) {
      resetTimer();
      setOtp(['', '', '', '']);
      showToast('New code sent!', 'success');
      otpInputRefs.current[0]?.focus();
    }
  };

  // Auto-verify when all digits are entered
  useEffect(() => {
    const isComplete = otp.every(digit => digit !== '');
    if (isComplete) {
      const enteredCode = otp.join('');
      // For testing, any 4-digit code works
      if (enteredCode.length === 4) {
        setTimeout(() => {
          onVerify();
        }, 500);
      } else {
        setError('Invalid OTP. Please try again.');
        setOtp(['', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    }
  }, [otp, onVerify]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface px-6 py-4">
        <img src="/logo.png" alt="BuildingID" className="h-10 w-auto" onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=B';
        }} />
      </header>
      
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h1 className="font-display text-3xl font-black">Verify OTP</h1>
          <p className="text-on-surface-variant">
            Enter the 4-digit code sent to {phoneNumber}
          </p>
          
          <div className="flex justify-center gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { otpInputRefs.current[idx] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-14 h-14 text-center text-2xl font-bold bg-gray-100 rounded-xl border-2 focus:border-primary focus:outline-none transition-all"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              <span className="text-gray-600">Didn't receive code? </span>
              <button
                onClick={handleResend}
                disabled={!isExpired}
                className={`font-bold transition-all ${isExpired ? 'text-primary hover:underline cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
              >
                Resend
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Code expires in: <span className="font-mono font-bold">{formatTime()}</span>
            </p>
          </div>
        </div>
      </main>
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => {}}} /></AnimatePresence>
    </div>
  );
};