// src/pages/LoginPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { suggestDevTestUsers } from '../data/devTestUsers';

interface LoginPageProps {
  initialEmail?: string;
  onLogin: (email?: string) => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
  onLogoClick?: () => void;
}

export function LoginPage({
  initialEmail,
  onLogin,
  onRegisterClick,
  onForgotPasswordClick,
  onLogoClick,
}: LoginPageProps) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const { toast, setToast, showToast } = useToast();

  const emailSuggestions = useMemo(() => suggestDevTestUsers(email), [email]);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleLogin = () => {
    if (email && password) {
      onLogin(email.trim());
      showToast('Login successful!', 'success');
    } else {
      showToast('Please enter email and password', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        onLogoClick={onLogoClick}
        rightButton={
          <button
            type="button"
            onClick={onRegisterClick}
            className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/80 transition-all"
          >
            Registration
          </button>
        }
      />

      <main className="app-main-scroll w-full px-4 pb-16">
        <div className="mx-auto max-w-md">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <div className="relative">
            <input
              type="email"
              placeholder="Email (try cli, beo, intern, bo, ins…)"
              value={email}
              autoComplete="off"
              onChange={(e) => {
                setEmail(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setSuggestOpen(false), 180);
              }}
              className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {suggestOpen && emailSuggestions.length > 0 && (
              <ul
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                role="listbox"
              >
                {emailSuggestions.map((u) => (
                  <li key={u.email}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setEmail(u.email);
                        setPassword(u.password);
                        setSuggestOpen(false);
                      }}
                    >
                      <span className="font-bold text-primary">{u.email}</span>
                      <span className="text-xs text-gray-500">
                        {u.displayName} · {u.role}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
        </div>
      </main>
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
}