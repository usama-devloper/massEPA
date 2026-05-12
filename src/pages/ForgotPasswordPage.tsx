// src/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordPage = ({ onBackToLogin }: ForgotPasswordPageProps) => {
  const [email, setEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const { toast, showToast } = useToast();

  const handleSendReset = () => {
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }
    setResetSent(true);
    showToast('Reset link sent to your email!', 'success');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface px-6 py-4 flex justify-between items-center">
        <img src="/logo.png" alt="BuildingID" className="h-10 w-auto" onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=B';
        }} />
        <button 
          onClick={onBackToLogin}
          className="text-primary font-bold text-sm hover:underline"
        >
          Back to Login
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          {!resetSent ? (
            <>
              <div className="text-center mb-4">
                <h1 className="font-display text-2xl font-black">Reset Password</h1>
                <p className="text-on-surface-variant text-sm mt-2">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              <div>
                <input 
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button 
                onClick={handleSendReset}
                disabled={!email}
                className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50"
              >
                Send Reset Link
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="font-display text-xl font-black mb-2">Check Your Email</h2>
              <p className="text-on-surface-variant text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <button 
                onClick={onBackToLogin}
                className="text-primary font-bold hover:underline"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </main>
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => {}}} /></AnimatePresence>
    </div>
  );
};