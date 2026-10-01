import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Check,
  Moon,
  Sun,
  Laptop,
  Store,
  School,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type LoginRoleType = 'Super Admin' | 'Admin' | 'Manager' | 'Staff/Partner';

export const NeumorphicLoginView: React.FC = () => {
  const { staff, loginUser, setIsLoginPageOpen, showToast, isLoading } = useApp();

  // Active role selector state
  const [selectedRole, setSelectedRole] = useState<LoginRoleType>('Super Admin');

  // Input states
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('vikram@vanguardbooks.com');
  const [password, setPassword] = useState<string>('vanguard@2024');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isDarkModeSim, setIsDarkModeSim] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Role details mapping for easy non-technical understanding
  const roleConfig: Record<
    LoginRoleType,
    {
      title: string;
      email: string;
      terminal: string;
      desc: string;
      icon: typeof Shield;
      badge: string;
    }
  > = {
    'Super Admin': {
      title: 'Super Admin',
      email: 'vikram@vanguardbooks.com',
      terminal: 'Central Admin Workstation 01',
      desc: 'Complete system authority, finance, publisher dues & reports',
      icon: Shield,
      badge: 'Full Access',
    },
    Admin: {
      title: 'Admin',
      email: 'admin@vanguardbooks.com',
      terminal: 'Central Admin Workstation 01',
      desc: 'Dealership configuration, catalogue setup & inventory control',
      icon: Store,
      badge: 'Core Admin',
    },
    Manager: {
      title: 'Manager',
      email: 'rajeev@vanguardbooks.com',
      terminal: 'Store Manager Terminal POS-01',
      desc: 'Warehouse stock receiving, purchase orders & order dispatch',
      icon: Laptop,
      badge: 'Operations',
    },
    'Staff/Partner': {
      title: 'Staff / Partner',
      email: 'sunil.stalls@gmail.com',
      terminal: 'School Stall Counter DPS01',
      desc: 'School campus stalls, retail counter POS & student orders',
      icon: School,
      badge: 'POS & Field',
    },
  };

  // Handler when user clicks a role pill
  const handleSelectRole = (role: LoginRoleType) => {
    setSelectedRole(role);
    const cfg = roleConfig[role];
    setUsernameOrEmail(cfg.email);
    setPassword('vanguard@2024');
  };

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail) {
      showToast('Please enter your username or email', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetTerminal = roleConfig[selectedRole].terminal;
      await loginUser(usernameOrEmail, targetTerminal, 'Password');
      setIsLoginPageOpen(false);
    } catch (err: any) {
      // Toast already shown in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCfg = roleConfig[selectedRole];

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden select-none ${
        isDarkModeSim ? 'bg-[#1a202c]' : 'bg-[#eef2f8]'
      }`}
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. Neumorphic Ambient Background Shapes (Inspired by Reference) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left curved neumorphic concentric arc */}
        <div
          className={`absolute -top-32 -left-32 w-96 h-96 rounded-full border-[18px] transition-all duration-300 ${
            isDarkModeSim
              ? 'border-[#2d3748]/40 shadow-[inset_15px_15px_30px_#141923,15px_15px_30px_#263042]'
              : 'border-white/80 shadow-[inset_12px_12px_24px_#caced4,14px_14px_28px_#ffffff]'
          }`}
        />

        {/* Top-right floating neumorphic orb */}
        <div
          className={`absolute top-24 -right-16 w-56 h-56 rounded-full transition-all duration-300 ${
            isDarkModeSim
              ? 'bg-[#1e2634] shadow-[10px_10px_20px_#131720,-10px_-10px_20px_#2b3548]'
              : 'bg-[#eef2f8] shadow-[12px_12px_24px_#cad4e4,-12px_-12px_24px_#ffffff]'
          }`}
        />

        {/* Bottom-right sweeping neumorphic wave shape */}
        <div
          className={`absolute -bottom-36 -right-24 w-[420px] h-[420px] rounded-full border-[22px] transition-all duration-300 ${
            isDarkModeSim
              ? 'border-[#263042]/50 shadow-[inset_15px_15px_30px_#121620,15px_15px_30px_#2c374b]'
              : 'border-white/90 shadow-[inset_14px_14px_28px_#c5d0e2,16px_16px_32px_#ffffff]'
          }`}
        />

        {/* Bottom-left soft neumorphic circle */}
        <div
          className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full transition-all duration-300 ${
            isDarkModeSim
              ? 'bg-[#1d2432] shadow-[10px_10px_20px_#121620,-10px_-10px_20px_#283244]'
              : 'bg-[#eef2f8] shadow-[10px_10px_20px_#cdd6e4,-10px_-10px_20px_#ffffff]'
          }`}
        />
      </div>

      {/* 2. Top Bar with Dark/Light Toggle & Quick Back to App */}
      <div className="absolute top-5 inset-x-5 sm:inset-x-8 flex items-center justify-between z-20">
        <button
          onClick={() => setIsLoginPageOpen(false)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isDarkModeSim
              ? 'bg-[#1e2634] text-slate-300 shadow-[4px_4px_8px_#131720,-4px_-4px_8px_#2b3548] hover:text-white'
              : 'bg-[#eef2f8] text-slate-600 shadow-[4px_4px_8px_#cad4e4,-4px_-4px_8px_#ffffff] hover:text-blue-600 active:shadow-[inset_2px_2px_4px_#cad4e4,inset_-2px_-2px_4px_#ffffff]'
          }`}
        >
          <span>←</span>
          <span>Back to App</span>
        </button>

        {/* Dark/Light mode toggle button inspired by reference icon */}
        <button
          onClick={() => setIsDarkModeSim(!isDarkModeSim)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDarkModeSim
              ? 'bg-[#1e2634] text-amber-300 shadow-[4px_4px_8px_#131720,-4px_-4px_8px_#2b3548] hover:bg-[#252f40]'
              : 'bg-[#eef2f8] text-slate-700 shadow-[5px_5px_10px_#cad4e4,-5px_-5px_10px_#ffffff] hover:text-blue-600 active:shadow-[inset_2px_2px_4px_#cad4e4,inset_-2px_-2px_4px_#ffffff]'
          }`}
          title="Toggle Neumorphic Theme Contrast"
          aria-label="Toggle Theme"
        >
          {isDarkModeSim ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 fill-slate-700" />}
        </button>
      </div>

      {/* 3. Central Login Container (Clean, Minimal, Mobile-Friendly) */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {/* 3A. Raised Neumorphic Card with 3D Glossy Emblem (Directly Matching Reference) */}
        <div
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 relative ${
            isDarkModeSim
              ? 'bg-[#1f2737] shadow-[12px_12px_24px_#121620,-12px_-12px_24px_#2c384e] border border-white/5'
              : 'bg-[#eef2f8] shadow-[14px_14px_28px_#cad4e4,-14px_-14px_28px_#ffffff] border border-white/80'
          }`}
        >
          {/* Subtle glossy rim inside container */}
          <div className="absolute inset-1.5 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none" />

          {/* 3D Flowing Flame/Ribbon Crest SVG */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-[0_8px_16px_rgba(37,99,235,0.35)]"
          >
            <defs>
              <linearGradient id="neu-flame-1" x1="16" y1="20" x2="36" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#93C5FD" />
                <stop offset="0.4" stopColor="#3B82F6" />
                <stop offset="1" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="neu-flame-2" x1="28" y1="12" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" />
                <stop offset="0.5" stopColor="#2563EB" />
                <stop offset="1" stopColor="#1E3A8A" />
              </linearGradient>
              <linearGradient id="neu-flame-3" x1="36" y1="6" x2="56" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.6" stopColor="#DBEAFE" />
                <stop offset="1" stopColor="#93C5FD" />
              </linearGradient>
              <linearGradient id="neu-specular" x1="20" y1="10" x2="30" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Bottom/Left Wave Ribbon */}
            <path
              d="M18 36C18 48 30 58 42 56C34 54 26 48 26 38C26 30 32 24 38 20C26 24 18 28 18 36Z"
              fill="url(#neu-flame-1)"
            />

            {/* Middle Wave Ribbon */}
            <path
              d="M26 28C26 40 38 50 50 48C42 46 34 40 34 30C34 22 40 16 46 12C34 16 26 20 26 28Z"
              fill="url(#neu-flame-2)"
            />

            {/* Top Glossy White/Ice Ribbon */}
            <path
              d="M34 20C34 32 46 42 58 40C50 38 42 32 42 22C42 14 48 8 54 4C42 8 34 12 34 20Z"
              fill="url(#neu-flame-3)"
            />

            {/* Specular Light Reflection */}
            <path
              d="M28 26C31 22 35 19 40 17C37 20 34 24 32 29C30 33 28 30 28 26Z"
              fill="url(#neu-specular)"
            />
          </svg>
        </div>

        {/* 3B. Title & Subtitle */}
        <div className="text-center mb-6">
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors ${
              isDarkModeSim ? 'text-white' : 'text-slate-900'
            }`}
          >
            Welcome Back
          </h1>
          <p
            className={`text-xs font-medium tracking-wide mt-1.5 transition-colors ${
              isDarkModeSim ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Sign in to Vanguard Dealer ERP
          </p>
        </div>

        {/* 3C. Role Selector (Neumorphic Segmented Control) */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between px-1 mb-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDarkModeSim ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Select Login Role
            </span>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              {currentCfg.badge}
            </span>
          </div>

          {/* 4 Soft Neumorphic Role Tabs */}
          <div
            className={`p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1.5 transition-all ${
              isDarkModeSim
                ? 'bg-[#181f2a] shadow-[inset_4px_4px_8px_#10151d,inset_-4px_-4px_8px_#202937]'
                : 'bg-[#e5ecf5] shadow-[inset_3px_3px_6px_#c3cde0,inset_-3px_-3px_6px_#ffffff]'
            }`}
          >
            {(['Super Admin', 'Admin', 'Manager', 'Staff/Partner'] as LoginRoleType[]).map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`py-2 px-2 text-center rounded-xl text-[11px] font-bold transition-all duration-200 truncate ${
                    isSelected
                      ? isDarkModeSim
                        ? 'bg-[#252f40] text-blue-400 shadow-[3px_3px_6px_#121620,-3px_-3px_6px_#2e3a50] ring-1 ring-blue-500/30'
                        : 'bg-[#edf2f8] text-blue-600 shadow-[3px_3px_6px_#c3cde0,-3px_-3px_6px_#ffffff] ring-1 ring-blue-500/20'
                      : isDarkModeSim
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>

          {/* Role contextual explanation */}
          <p
            className={`text-[11px] text-center mt-2 px-2 truncate font-medium ${
              isDarkModeSim ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {currentCfg.desc}
          </p>
        </div>

        {/* 3D. Login Form with Neumorphic Inset Inputs */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          {/* Username or Email Input Field */}
          <div className="relative">
            <div
              className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all ${
                isDarkModeSim
                  ? 'bg-[#181f2a] shadow-[inset_4px_4px_8px_#10151d,inset_-4px_-4px_8px_#202937] border border-white/5 focus-within:ring-2 focus-within:ring-blue-500/40'
                  : 'bg-[#eef2f8] shadow-[inset_3px_3px_7px_#cad4e4,inset_-3px_-3px_7px_#ffffff] border border-white/60 focus-within:ring-2 focus-within:ring-blue-400/50'
              }`}
            >
              <User
                className={`w-5 h-5 mr-3 shrink-0 ${
                  isDarkModeSim ? 'text-slate-500' : 'text-slate-400'
                }`}
              />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Username or Email"
                required
                className={`w-full bg-transparent text-xs font-semibold focus:outline-none transition-colors ${
                  isDarkModeSim
                    ? 'text-white placeholder:text-slate-500'
                    : 'text-slate-800 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Password Input Field with Show/Hide Toggle */}
          <div className="relative">
            <div
              className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all ${
                isDarkModeSim
                  ? 'bg-[#181f2a] shadow-[inset_4px_4px_8px_#10151d,inset_-4px_-4px_8px_#202937] border border-white/5 focus-within:ring-2 focus-within:ring-blue-500/40'
                  : 'bg-[#eef2f8] shadow-[inset_3px_3px_7px_#cad4e4,inset_-3px_-3px_7px_#ffffff] border border-white/60 focus-within:ring-2 focus-within:ring-blue-400/50'
              }`}
            >
              <Lock
                className={`w-5 h-5 mr-3 shrink-0 ${
                  isDarkModeSim ? 'text-slate-500' : 'text-slate-400'
                }`}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className={`w-full bg-transparent text-xs font-semibold focus:outline-none transition-colors ${
                  isDarkModeSim
                    ? 'text-white placeholder:text-slate-500'
                    : 'text-slate-800 placeholder:text-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`p-1 transition-colors ${
                  isDarkModeSim
                    ? 'text-slate-500 hover:text-slate-300'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between px-1 text-xs pt-0.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                  rememberMe
                    ? 'bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.4)] text-white'
                    : isDarkModeSim
                    ? 'bg-[#181f2a] shadow-[inset_2px_2px_4px_#10151d,inset_-2px_-2px_4px_#202937]'
                    : 'bg-[#eef2f8] shadow-[inset_2px_2px_4px_#cad4e4,inset_-2px_-2px_4px_#ffffff]'
                }`}
              >
                {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span
                className={`font-semibold text-xs ${
                  isDarkModeSim ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Remember Me
              </span>
            </label>

            <button
              type="button"
              onClick={() =>
                showToast(
                  `Password reset credentials sent to ${usernameOrEmail || 'authorized dealer email'}`,
                  'info'
                )
              }
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Glowing Blue Neumorphic Login Button (Inspired by Reference) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-[0_12px_28px_rgba(37,99,235,0.42),0_4px_10px_rgba(37,99,235,0.25)] hover:shadow-[0_16px_34px_rgba(37,99,235,0.55),0_6px_14px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all duration-200 flex items-center justify-between px-6 group"
            >
              <span className="w-8" />
              <span className="text-center font-bold text-sm">
                {isSubmitting ? 'Authenticating...' : 'Login'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-xs group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </button>
          </div>
        </form>

        {/* 3E. Divider */}
        <div className="w-full flex items-center gap-4 my-6">
          <div
            className={`flex-1 h-px ${isDarkModeSim ? 'bg-slate-700/60' : 'bg-slate-300/80'}`}
          />
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              isDarkModeSim ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Or Continue With
          </span>
          <div
            className={`flex-1 h-px ${isDarkModeSim ? 'bg-slate-700/60' : 'bg-slate-300/80'}`}
          />
        </div>

        {/* 3F. Three Neumorphic Quick-Action Buttons (Matching Reference) */}
        <div className="flex items-center justify-center gap-4 w-full">
          {/* Google SSO */}
          <button
            type="button"
            onClick={() => handleSelectRole('Super Admin')}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isDarkModeSim
                ? 'bg-[#1e2634] shadow-[6px_6px_12px_#121620,-6px_-6px_12px_#2a3548] hover:bg-[#252f40] active:shadow-[inset_2px_2px_4px_#121620,inset_-2px_-2px_4px_#2a3548]'
                : 'bg-[#eef2f8] shadow-[6px_6px_12px_#cad4e4,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#cad4e4,-8px_-8px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#cad4e4,inset_-3px_-3px_6px_#ffffff]'
            }`}
            title="Sign in with Google Workspace"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          </button>

          {/* Campus Stall Quick Auth */}
          <button
            type="button"
            onClick={() => handleSelectRole('Staff/Partner')}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 text-blue-600 ${
              isDarkModeSim
                ? 'bg-[#1e2634] shadow-[6px_6px_12px_#121620,-6px_-6px_12px_#2a3548] hover:bg-[#252f40] active:shadow-[inset_2px_2px_4px_#121620,inset_-2px_-2px_4px_#2a3548]'
                : 'bg-[#eef2f8] shadow-[6px_6px_12px_#cad4e4,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#cad4e4,-8px_-8px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#cad4e4,inset_-3px_-3px_6px_#ffffff]'
            }`}
            title="School Campus Stall Quick Login"
          >
            <School className="w-5 h-5 text-amber-600" />
          </button>

          {/* Store POS Terminal */}
          <button
            type="button"
            onClick={() => handleSelectRole('Manager')}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isDarkModeSim
                ? 'bg-[#1e2634] shadow-[6px_6px_12px_#121620,-6px_-6px_12px_#2a3548] hover:bg-[#252f40] active:shadow-[inset_2px_2px_4px_#121620,inset_-2px_-2px_4px_#2a3548]'
                : 'bg-[#eef2f8] shadow-[6px_6px_12px_#cad4e4,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#cad4e4,-8px_-8px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#cad4e4,inset_-3px_-3px_6px_#ffffff]'
            }`}
            title="Store Warehouse POS Terminal"
          >
            <Laptop className="w-5 h-5 text-indigo-600" />
          </button>
        </div>

        {/* 3G. Footer Brand Copy */}
        <div className="mt-8 text-center">
          <p
            className={`text-[10px] font-bold tracking-widest uppercase ${
              isDarkModeSim ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            VANGUARD ERP • ACADEMIC DEALERSHIP • SECURE PORTAL
          </p>
        </div>
      </div>
    </div>
  );
};
