// src/pages/SetPasswordPage.tsx
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';

interface SetPasswordPageProps {
  onComplete: () => void;
  onLogoClick?: () => void;
}

export const SetPasswordPage = ({ onComplete, onLogoClick }: SetPasswordPageProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast, setToast, showToast } = useToast();

  const handleComplete = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('Please enter password', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    onComplete();
    showToast('Password set successfully! Please login', 'success');
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-background">
      <TopBar onLogoClick={onLogoClick} />
      
      <main className="app-main-scroll w-full px-4 pb-16">
        <div className="mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-black">Set Password</h1>
          <p className="text-on-surface-variant mt-2">Create a secure password for your account</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <div className="relative">
            <input 
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary pr-12"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <input 
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {newPassword && confirmPassword && (
            <div className="text-sm">
              {passwordsMatch ? (
                <p className="text-green-600">✓ Passwords match</p>
              ) : (
                <p className="text-red-500">✗ Passwords do not match</p>
              )}
            </div>
          )}

          <button 
            onClick={handleComplete}
            disabled={isLoading || !passwordsMatch}
            className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Setting Password...' : 'Complete Setup'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </div>
        </div>
      </main>
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
};