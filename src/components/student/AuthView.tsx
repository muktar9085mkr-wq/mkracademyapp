import React, { useState } from 'react';
import {
  ArrowLeft,
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

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onBack: () => void;
  onSuccess?: () => void;
  onOpenPolicy?: (type: PolicyType) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onBack,
  onSuccess,
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
        if (onSuccess) onSuccess();
        else onBack();
      } else if (mode === 'register') {
        if (!validatePhone(phoneNumber)) {
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, name, phoneNumber);
        if (onSuccess) onSuccess();
        else onBack();
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
      if (onSuccess) onSuccess();
      else onBack();
    } catch {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-stone-50 py-8 sm:py-12 flex flex-col justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-stone-600 hover:text-stone-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>Back to Notes</span>
          </button>

          <span className="text-xs text-stone-500 font-medium">MKR Academy Student Portal</span>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-red-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-sans">
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'register'
                ? 'Join MKR Academy'
                : 'Reset Your Password'}
            </h1>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              {mode === 'login'
                ? 'Sign in to access your notes, downloads and exam materials.'
                : mode === 'register'
                ? 'Create a student account for seamless study notes access.'
                : 'Enter your registered email address to receive password reset instructions.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl text-xs font-bold text-stone-600">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearError();
                }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  clearError();
                }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'hover:text-stone-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Auth Error Banner */}
          {authError && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{authError}</span>
            </div>
          )}

          {/* Reset Sent Notice */}
          {resetSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">Reset Link Sent</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and spam folder.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetSent(false);
                  setMode('login');
                }}
                className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Field (Register Only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Student Full Name <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Number Field (Register Only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Mobile Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 font-mono text-xs">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (phoneError) validatePhone(e.target.value);
                      }}
                      placeholder="10-digit Indian mobile"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-11 pr-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[10px] text-red-600 mt-1">{phoneError}</p>
                  )}
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Password Field (Not for forgot mode) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-800">
                      Password <span className="text-red-600">*</span>
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          clearError();
                        }}
                        className="text-[11px] text-red-700 hover:text-red-800 font-semibold cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  {mode === 'register' && (
                    <p className="text-[10px] text-stone-400 mt-1">Must be at least 6 characters.</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-red-900/10 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {mode === 'login'
                    ? 'Sign In to Account'
                    : mode === 'register'
                    ? 'Create Student Account'
                    : 'Send Password Reset Link'}
                </span>
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearError();
                  }}
                  className="w-full text-center text-xs text-stone-600 hover:text-stone-900 font-semibold cursor-pointer pt-1"
                >
                  Back to Sign In
                </button>
              )}
            </form>
          )}

          {/* Google Sign In Divider */}
          {mode !== 'forgot' && (
            <div className="space-y-4 pt-2">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-stone-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 absolute">
                  Or continue with
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-2xl text-xs font-bold text-stone-700 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Google Account</span>
              </button>
            </div>
          )}

          {/* Terms and Privacy Footer Note */}
          <div className="text-center pt-2 border-t border-stone-100">
            <p className="text-[10px] text-stone-400">
              By continuing, you agree to MKR Academy's{' '}
              <button
                type="button"
                onClick={() => onOpenPolicy?.('terms')}
                className="underline hover:text-stone-700 cursor-pointer"
              >
                Terms of Use
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => onOpenPolicy?.('privacy')}
                className="underline hover:text-stone-700 cursor-pointer"
              >
                Privacy Policy
              </button>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
