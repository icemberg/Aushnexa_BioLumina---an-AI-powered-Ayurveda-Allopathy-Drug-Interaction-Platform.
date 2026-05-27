import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [role, setRole] = useState('PATIENT');
  const registerMutation = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate({ email, password, fullName, role });
  };

  return (
    <main className="bg-surface-lowest h-screen w-full overflow-hidden flex font-body-md text-body-md text-on-surface">
      {/* Left Side Registration Form */}
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 py-8 bg-surface/90 backdrop-blur-2xl z-10 relative border-r border-outline-variant/30 shadow-2xl overflow-y-auto">
        <div className="mb-6">
          <span className="font-label-caps text-label-caps text-surface-tint tracking-widest uppercase mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>biotech</span>
            Aushnexa BioLumina
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface mt-4">
            Join the Intelligence Network
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4 max-w-md">
            Initialize your researcher profile to access precision matrices and clinical-grade intelligence.
          </p>
        </div>

        {/* Error/Success Messages */}
        {registerMutation.isError && (
          <div className="mb-6 p-3 rounded-lg bg-error-container/20 border border-error-red/30 text-error-red font-technical-sm text-technical-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {registerMutation.error?.response?.data?.error || 'Registration failed. Please try again.'}
          </div>
        )}
        {registerMutation.isSuccess && (
          <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-technical-sm text-technical-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Account created! Redirecting to login...
          </div>
        )}

        <form className="flex flex-col gap-3 w-full max-w-md" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label className="font-technical-sm text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="fullName">Full Name</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">person</span>
              <input
                className="w-full bg-surface-container border border-outline-variant rounded-lg py-2 pl-9 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline/50 font-body-md text-sm"
                id="fullName"
                placeholder="Dr. Jane Doe"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-technical-sm text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="email">Secure Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">mail</span>
              <input
                className="w-full bg-surface-container border border-outline-variant rounded-lg py-2 pl-9 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline/50 font-body-md text-sm"
                id="email"
                placeholder="user@institute.edu"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-technical-sm text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="password">Passphrase</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock</span>
              <input
                className="w-full bg-surface-container border border-outline-variant rounded-lg py-2 pl-9 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline/50 font-body-md text-sm"
                id="password"
                placeholder="Minimum 8 characters"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-technical-sm text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="affiliation">Clinical Affiliation</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">account_balance</span>
              <input
                className="w-full bg-surface-container border border-outline-variant rounded-lg py-2 pl-9 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline/50 font-body-md text-sm"
                id="affiliation"
                placeholder="e.g. Genesis Labs"
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-technical-sm text-xs text-on-surface-variant uppercase tracking-wider">Classification Role</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { id: 'PATIENT', label: 'Patient', icon: 'person' },
                { id: 'CLINICIAN', label: 'Clinician', icon: 'stethoscope' },
                { id: 'PHARMACIST', label: 'Pharmacist', icon: 'local_pharmacy' },
                { id: 'RESEARCHER', label: 'Researcher', icon: 'science' },
              ].map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${role === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/50 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.id}
                    checked={role === r.id}
                    onChange={() => setRole(r.id)}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-sm">{r.icon}</span>
                  <span className="font-technical-sm text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            className="mt-4 w-full bg-primary text-on-primary font-headline-md text-sm font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-fixed transition-colors shadow-lg hover:shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Creating Account...
              </>
            ) : (
              <>
                Continue Sequence
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </>
            )}
          </button>

          <p className="text-center mt-4 font-technical-sm text-technical-sm text-on-surface-variant">
            Already registered? <Link className="text-primary hover:text-surface-tint underline underline-offset-4 transition-colors" to="/login">Authenticate</Link>
          </p>
        </form>
      </div>

      {/* Right Side Background */}
      <div className="hidden lg:block lg:w-[55%] h-full relative overflow-hidden animate-slide-in-right opacity-0" style={{ backgroundColor: '#03070F' }}>
        <img
          alt="High-resolution, cinematic 3D medical illustration of a glowing bioluminescent molecular structure"
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns mix-blend-screen"
          src="/bio-fusion.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-lowest via-transparent to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#03070F] via-transparent to-transparent opacity-70"></div>
        <div className="absolute inset-0 bg-[#0ECFB8] mix-blend-overlay opacity-20 animate-pulse-glow"></div>

        <div className="particle bg-[#E8960C] w-1 h-1 shadow-[0_0_8px_2px_rgba(232,150,12,0.6)]" style={{ top: '30%', left: '40%', animation: 'particleFloat 6s ease-in infinite', animationDelay: '0s' }}></div>
        <div className="particle bg-[#18C96A] w-1.5 h-1.5 shadow-[0_0_10px_3px_rgba(24,201,106,0.5)]" style={{ top: '60%', left: '70%', animation: 'particleFloat 8s ease-in infinite', animationDelay: '2s' }}></div>
        <div className="particle bg-[#E8960C] w-0.5 h-0.5 shadow-[0_0_5px_1px_rgba(232,150,12,0.8)]" style={{ top: '45%', left: '20%', animation: 'particleFloat 5s ease-in infinite', animationDelay: '1.5s' }}></div>
        <div className="particle bg-[#0ECFB8] w-2 h-2 shadow-[0_0_12px_4px_rgba(14,207,184,0.4)]" style={{ top: '80%', left: '30%', animation: 'particleFloat 9s ease-in infinite', animationDelay: '3s' }}></div>

        <div className="absolute bottom-12 right-12 text-right pointer-events-none z-10">
          <div className="font-technical-sm text-technical-sm text-surface-tint/70 mb-1 drop-shadow-md">SYSTEM_STATUS: NOMINAL</div>
          <div className="font-technical-sm text-technical-sm text-surface-tint/50 drop-shadow-md">NODE_AUTH: PENDING_VERIFICATION</div>
        </div>
      </div>
    </main>
  );
}
