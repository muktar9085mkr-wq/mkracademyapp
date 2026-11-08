import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PolicyType } from '../common/PolicyModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onOpenPolicy?: (type: PolicyType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onOpenPolicy
}) => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    authError,
    clearError
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const validatePhone = (p: string) => {
    const cleaned = p.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (e.g. 9864012345)');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        if (!validatePhone(phoneNumber)) {
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, name, phoneNumber);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 py-3 sm:py-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-md p-4 sm:p-7 shadow-2xl border border-stone-200 relative my-auto max-h-[calc(100dvh-24px)] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-800 to-red-600 text-white flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-stone-900 font-sans">
            {mode === 'login' && 'Welcome to MKR Academy'}
            {mode === 'register' && 'Create Student Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-stone-500 text-xs">
            {mode === 'login' && 'Log in to view purchased notes and download PDFs'}
            {mode === 'register' && 'Join thousands of students preparing for HSLC 2027'}
            {mode === 'forgot' && "Enter your email address to receive password reset link"}
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="flex bg-stone-100 p-1 rounded-xl mb-5 text-xs font-bold">
            <button
              onClick={() => {
                setMode('login');
                clearError();
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                clearError();
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error message */}
        {authError && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-1.5 animate-in fade-in">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-semibold leading-relaxed">{authError}</span>
            </div>
            {authError.includes('Authorized domains') && (
              <p className="text-[11px] text-stone-600 pl-6">
                Tip: Go to Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains and add <code className="bg-red-100 text-red-900 px-1 py-0.5 rounded font-mono font-bold">{window.location.hostname}</code>.
              </p>
            )}
          </div>
        )}

        {/* Reset Email Sent Message */}
        {resetSent && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>Password reset email sent! Check your inbox to set a new password.</span>
          </div>
        )}

        {/* 1-Click Google Sign In / Sign Up (Primary fast action) */}
        {mode !== 'forgot' && (
          <div className="mb-5 space-y-3.5">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border-2 border-stone-200 hover:border-red-600 hover:bg-red-50/30 bg-white text-stone-800 font-bold text-xs flex items-center justify-center space-x-2.5 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {mode === 'register' ? 'Sign Up with Google' : 'Sign In with Google'}
              </span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2.5 text-stone-400 font-bold tracking-wider">
                  Or with email & password
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Student's name"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Mobile Number (Compulsory for receipts) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-mono text-xs">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (phoneError) validatePhone(e.target.value);
                  }}
                  placeholder="10-digit number (e.g. 9864012345)"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-3 py-2.5 font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                />
              </div>
              {phoneError && <p className="text-[11px] text-red-600 mt-1">{phoneError}</p>}
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-stone-700 font-semibold">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      clearError();
                    }}
                    className="text-red-700 hover:text-red-800 text-[11px] font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <span>Sign In</span>
            ) : mode === 'register' ? (
              <span>Create Account</span>
            ) : (
              <span>Send Reset Email</span>
            )}
          </button>

          {mode === 'register' && (
            <p className="text-[10px] text-stone-500 text-center leading-relaxed mt-2.5">
              By creating an account, you agree to MKR Academy's{' '}
              <button
                type="button"
                onClick={() => onOpenPolicy?.('terms')}
                className="text-red-700 underline font-medium hover:text-red-800"
              >
                Terms & Conditions
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => onOpenPolicy?.('privacy')}
                className="text-red-700 underline font-medium hover:text-red-800"
              >
                Privacy Policy
              </button>
              . If under 18 years, you confirm that your parent/guardian has permitted registration.
            </p>
          )}
        </form>



        {/* Back to Login from Forgot */}
        {mode === 'forgot' && (
          <div className="text-center mt-4 pt-4 border-t border-stone-100">
            <button
              onClick={() => {
                setMode('login');
                setResetSent(false);
                clearError();
              }}
              className="text-stone-600 hover:text-stone-900 text-xs font-semibold"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
