import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#03070F' }}>
      {/* Background with Ken Burns animation */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          alt="Bioluminescent background" 
          className="w-full h-full object-cover ken-burns-bg opacity-70 mix-blend-screen" 
          src="/bio-fusion.jpg"
        />
      </div>
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#03070F] via-transparent to-[#03070F]/50 pointer-events-none"></div>
      
      {/* Login Card */}
      <div className="w-full max-w-md mx-auto px-margin-mobile md:px-0 relative z-10 py-12">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
          <h1 className="font-headline-md text-headline-md tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#E8960C] to-[#18C96A]">
            Aushnexa BioLumina
          </h1>
          <p className="font-technical-sm text-technical-sm text-on-surface-variant mt-2">Core Intelligence Portal</p>
        </div>

        <div className="auth-card rounded-xl p-8 shadow-2xl">
          {/* Error Message */}
          {loginMutation.isError && (
            <div className="mb-6 p-3 rounded-lg bg-error-container/20 border border-error-red/30 text-error-red font-technical-sm text-technical-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {loginMutation.error?.response?.data?.error || 'Invalid credentials. Please try again.'}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block font-technical-sm text-technical-sm text-on-surface-variant mb-2" htmlFor="email">Secure Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline-variant text-sm">mail</span>
                </div>
                <input 
                  className="input-field w-full pl-10 pr-4 py-3 rounded-lg font-body-md text-body-md" 
                  id="email" 
                  name="email" 
                  placeholder="user@institute.edu" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-technical-sm text-technical-sm text-on-surface-variant mb-2" htmlFor="password">Passphrase</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline-variant text-sm">lock</span>
                </div>
                <input 
                  className="input-field w-full pl-10 pr-4 py-3 rounded-lg font-body-md text-body-md" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center">
                <input 
                  className="h-4 w-4 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary focus:ring-offset-surface-container-lowest" 
                  id="remember-me" 
                  name="remember-me" 
                  type="checkbox"
                />
                <label className="ml-2 block font-technical-sm text-technical-sm text-on-surface-variant" htmlFor="remember-me">
                  Retain Session
                </label>
              </div>
              <div className="text-sm">
                <a className="font-technical-sm text-technical-sm text-primary hover:text-surface-tint transition-colors" href="#">
                  Forgot Credentials?
                </a>
              </div>
            </div>

            <div>
              <button 
                className="gradient-btn w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg font-label-caps text-label-caps text-white uppercase tracking-widest mt-6 disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Authenticating...
                  </>
                ) : (
                  'Initialize Matrix'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-on-surface-variant font-technical-sm text-technical-sm">Or</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link 
                className="w-full flex items-center justify-center px-4 py-3 border border-outline-variant rounded-lg shadow-sm bg-surface-container-low/50 font-technical-sm text-technical-sm text-on-surface hover:bg-surface-container/70 transition-colors" 
                to="/register"
              >
                <span className="material-symbols-outlined mr-2 text-sm">account_balance</span>
                Institutional Access
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="font-technical-sm text-technical-sm text-outline">v4.2.1-stable • Connection Secure</p>
        </div>
      </div>
    </main>
  );
}
