// src/pages/LoginPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Eye, EyeOff } from 'lucide-react';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';

interface LoginPageProps {
  onLogin: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

export const LoginPage = ({ onLogin, onRegisterClick, onForgotPasswordClick }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast, showToast } = useToast();

  const handleLogin = () => {
    if (email && password) {
      onLogin();
      showToast('Login successful!', 'success');
    } else {
      showToast('Please enter email and password', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface px-6 py-4 flex justify-between items-center">
        <img src="/logo.png" alt="BuildingID" className="h-10 w-auto" onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=B';
        }} />
        <button 
          onClick={onRegisterClick}
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/80 transition-all"
        >
          Registration
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <input 
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="text-right">
            <button 
              onClick={onForgotPasswordClick}
              className="text-primary text-sm font-bold hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button 
            onClick={handleLogin}
            disabled={!email || !password}
            className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 transition-all hover:brightness-110"
          >
            Sign In
          </button>
        </div>
      </main>
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => {}}} /></AnimatePresence>
    </div>
  );
};