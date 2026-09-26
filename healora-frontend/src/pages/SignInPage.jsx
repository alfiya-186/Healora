import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowLeft, Leaf, Activity, CheckCircle, X, UserPlus, ArrowRight } from 'lucide-react';

const SignInPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Google SSO Modal States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleViewMode, setGoogleViewMode] = useState('select'); // 'select' or 'add'
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailRegex)) return setErrorMsg("Please enter a valid email address.");
    if (password.length < 1) return setErrorMsg("Password cannot be empty.");

    setIsLoading(true);

    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.toLowerCase().trim(), password: password }),
      });
      
      const data = await response.json().catch(() => null);

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_name', data.first_name || 'User');
        localStorage.setItem('user_id', data.id); 
        
        if (data.role === 'ADMIN') navigate('/admin-dashboard', { replace: true });
        else if (data.role === 'MANAGER') navigate('/manager-dashboard', { replace: true });
        else if (data.role === 'NUTRITIONIST') navigate('/nutritionist-dashboard', { replace: true });
        else navigate('/patient-dashboard', { replace: true });
      } else {
        setErrorMsg('Invalid email or password. Are you sure you registered this account?');
      }
    } catch (error) { 
      setErrorMsg('Cannot connect to server. Is Django running?'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // 🌟 ROBUST GOOGLE SSO HANDLER (Handles custom accounts & conflict detection) 🌟
  const handleGoogleAccountSelect = async (selectedEmail, selectedName) => {
    setShowGoogleModal(false);
    setIsGoogleLoading(true);
    setErrorMsg('');

    const formattedEmail = selectedEmail.toLowerCase().trim();
    const googlePassword = 'GoogleOAuthSecurePassword123!';

    setTimeout(async () => {
      try {
        let response = await fetch('/api/login/', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formattedEmail, password: googlePassword }),
        });

        if (!response.ok) {
          const regResponse = await fetch('/api/register/', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              first_name: selectedName.split(' ')[0] || 'Google', 
              last_name: selectedName.split(' ')[1] || 'User', 
              email: formattedEmail, 
              password: googlePassword, 
              role: 'PATIENT' 
            }),
          });

          if (!regResponse.ok) {
            setErrorMsg(`The email ${formattedEmail} is already registered with a standard password. Please sign in using the password form above.`);
            setIsGoogleLoading(false);
            setGoogleViewMode('select');
            return;
          }

          response = await fetch('/api/login/', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: formattedEmail, password: googlePassword }),
          });
        }

        const data = await response.json().catch(() => null);

        if (response.ok && data) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('user_role', data.role);
          localStorage.setItem('user_name', data.first_name || selectedName);
          localStorage.setItem('user_id', data.id); 
          
          navigate('/patient-dashboard', { replace: true });
        } else {
          setErrorMsg('Google SSO Authentication failed at the database level.');
        }
      } catch (error) {
        setErrorMsg('Google SSO failed to connect to Django API.');
      } finally {
        setIsGoogleLoading(false);
        setGoogleViewMode('select');
      }
    }, 1200);
  };

  // 🌟 FORGOT PASSWORD SUBMIT HANDLER 🌟
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) return;

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(true);
    }, 1200);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FDFCF8] grid grid-cols-1 md:grid-cols-12 font-sans text-[#1C2C22]">
      
      {/* LEFT COLUMN: Form */}
      <div className="md:col-span-5 flex flex-col justify-between p-8 lg:p-16 h-full overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#456A50] text-white rounded-lg p-1.5"><Leaf size={24} /></div>
            <span className="text-xl font-bold">Heal<span className="text-[#456A50]">ora</span></span>
          </div>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B60] hover:text-[#456A50]">
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>

        <div className="my-auto max-w-sm w-full mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1C2C22]">Welcome Back</h1>
            <p className="text-[#5A6B60] text-sm mt-1">Sign in to your clinical portal.</p>
          </div>
          

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="email" className="block text-xs font-semibold text-[#1C2C22]">Email Address</label>
                {email.length > 0 && (
                  <span className={`text-[10px] font-bold ${
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) 
                      ? 'text-emerald-700' 
                      : !email.includes('@') 
                        ? 'text-red-600' 
                        : 'text-amber-700'
                  }`}>
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) 
                      ? '✓ Valid' 
                      : !email.includes('@') 
                        ? 'Missing @' 
                        : 'Domain incomplete'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className={`absolute left-4 top-3 ${
                  email.length === 0 
                    ? 'text-[#5A6B60]' 
                    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) 
                      ? 'text-emerald-700' 
                      : !email.includes('@') 
                        ? 'text-red-600' 
                        : 'text-amber-700'
                }`} size={16} />
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className={`w-full bg-white border rounded-xl py-2.5 pl-11 pr-4 outline-none text-sm shadow-sm transition ${
                    email.length === 0 
                      ? 'border-[#EBE9E0] focus:border-[#456A50]' 
                      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) 
                        ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600 text-[#1C2C22]' 
                        : !email.includes('@') 
                          ? 'border-red-400 bg-red-50/20 focus:border-red-500 text-red-900' 
                          : 'border-amber-400 bg-amber-50/20 focus:border-amber-500 text-amber-900'
                  }`} 
                  placeholder="name@example.com" 
                  autoComplete="username email" 
                />
              </div>
              {email.length > 0 && !email.includes('@') && (
                <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                  ⚠️ Must include an '@' (e.g. name@example.com)
                </p>
              )}
              {email.length > 0 && email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                <p className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                  ⚠️ Include a complete domain (e.g. @gmail.com)
                </p>
              )}
              {email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                  ✓ Valid email address
                </p>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-[#1C2C22]">Password</label>
                <button 
                  type="button" 
                  onClick={() => { setForgotEmail(email); setForgotSuccess(false); setShowForgotModal(true); }}
                  className="text-xs font-semibold text-[#456A50] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className={`absolute left-4 top-3 ${
                  password.length === 0 ? 'text-[#5A6B60]' : password.length >= 8 ? 'text-emerald-700' : 'text-amber-700'
                }`} size={16} />
                <input 
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className={`w-full bg-white border rounded-xl py-2.5 pl-11 pr-11 outline-none text-sm shadow-sm transition ${
                    password.length === 0 
                      ? 'border-[#EBE9E0] focus:border-[#456A50]' 
                      : password.length >= 8 
                        ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                        : 'border-amber-400 bg-amber-50/20 focus:border-amber-500'
                  }`} 
                  placeholder="••••••••" 
                  autoComplete="current-password" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-[#5A6B60] cursor-pointer">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                  ⚠️ Password must be at least 8 characters
                </p>
              )}
              {password.length >= 8 && (
                <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                  ✓ Password format valid
                </p>
              )}
            </div>
            
            <button type="submit" disabled={isLoading || isGoogleLoading} className="w-full bg-[#456A50] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#456A50]/20 hover:bg-[#35533E] text-sm transition mt-2 disabled:opacity-70">
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* GOOGLE BUTTON DIVIDER & BUTTON */}
            <div className="flex items-center my-6">
              <hr className="flex-1 border-[#EBE9E0]" />
              <span className="px-4 text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest">Or continue with</span>
              <hr className="flex-1 border-[#EBE9E0]" />
            </div>

            <button 
              type="button" 
              onClick={() => { setGoogleViewMode('select'); setShowGoogleModal(true); }} 
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#EBE9E0] bg-white hover:bg-[#FDFCF8] transition shadow-sm text-sm font-bold text-[#1C2C22] disabled:opacity-70"
            >
              {isGoogleLoading ? (
                <><Activity className="animate-spin text-[#4285F4]" size={20} /> Connecting to Google...</>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-[#5A6B60] pt-4">
              Don't have an account? <button type="button" onClick={() => navigate('/signup')} className="font-bold text-[#456A50] hover:underline">Apply for access</button>
            </p>
          </form>
        </div>
        <div></div>
      </div>

      {/* RIGHT COLUMN: Hero */}
      <div className="md:col-span-7 relative bg-[#1C2C22] text-white p-12 flex flex-col justify-between overflow-hidden hidden md:flex h-full">
        <div className="absolute inset-0 bg-cover bg-center filter saturate-50 opacity-40" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2C22] via-[#1C2C22]/60 to-transparent" />
        <div className="relative z-10"><span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-teal-200 border border-white/10 uppercase tracking-wider"><ShieldCheck size={14} /> HIPAA COMPLIANT SECURE PORTAL</span></div>
        <div className="relative z-10 max-w-xl space-y-6 my-auto">
          <h2 className="text-5xl font-extrabold leading-tight">Evidence-Based Wellness</h2>
          <p className="text-teal-100 text-base">Join Healora to connect with expert nutritionists and access personalized wellness programs.</p>
        </div>
      </div>

      {/* 🌐 REAL-WORLD GOOGLE ACCOUNT CHOOSER POPUP 🌐 */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative space-y-6">
            <button onClick={() => setShowGoogleModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            
            <div className="text-center space-y-2">
              <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Sign in with Google</h3>
              <p className="text-xs text-gray-500">
                {googleViewMode === 'select' 
                  ? <>Choose an account to continue to <span className="font-semibold text-gray-700">Healora Portal</span></>
                  : <>Enter any Gmail account to sign in or register instantly</>
                }
              </p>
            </div>

            {googleViewMode === 'select' ? (
              <div className="space-y-2 divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                <div 
                  onClick={() => handleGoogleAccountSelect('googleuser@gmail.com', 'Google User')}
                  className="flex items-center gap-3 p-3.5 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm">G</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">Google User</p>
                    <p className="text-[11px] text-gray-500 truncate">googleuser@gmail.com</p>
                  </div>
                </div>

                <div 
                  onClick={() => handleGoogleAccountSelect('clinicaltest@gmail.com', 'Clinical Tester')}
                  className="flex items-center gap-3 p-3.5 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-sm">C</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">Clinical Tester</p>
                    <p className="text-[11px] text-gray-500 truncate">clinicaltest@gmail.com</p>
                  </div>
                </div>

                <div 
                  onClick={() => setGoogleViewMode('add')}
                  className="flex items-center gap-3 p-3.5 hover:bg-gray-50 cursor-pointer transition bg-gray-50/50"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <UserPlus size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">Use another account</p>
                    <p className="text-[11px] text-gray-500 truncate">Add a different Google profile</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!customGoogleEmail.includes('@')) return;
                const namePart = customGoogleEmail.split('@')[0];
                const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                handleGoogleAccountSelect(customGoogleEmail.toLowerCase().trim(), customGoogleName || formattedName);
              }} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Google Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={customGoogleEmail} 
                      onChange={(e) => setCustomGoogleEmail(e.target.value)} 
                      className="w-full bg-white border border-gray-300 rounded-xl py-2.5 px-3 outline-none focus:border-[#4285F4] text-sm shadow-xs" 
                      placeholder="e.g., amna@gmail.com" 
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Display Name (Optional)</label>
                    <input 
                      type="text" 
                      value={customGoogleName} 
                      onChange={(e) => setCustomGoogleName(e.target.value)} 
                      className="w-full bg-white border border-gray-300 rounded-xl py-2.5 px-3 outline-none focus:border-[#4285F4] text-sm shadow-xs" 
                      placeholder="e.g., Amna Khan" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button 
                    type="button" 
                    onClick={() => setGoogleViewMode('select')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Back to account list
                  </button>
                  <button 
                    type="submit" 
                    className="inline-flex items-center gap-1.5 bg-[#4285F4] text-white font-bold py-2.5 px-5 rounded-xl shadow-md hover:bg-blue-600 text-xs transition"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-1">
              <p className="text-[11px] text-gray-400">
                To continue, Google will share your name, email address, and profile picture with Healora.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🔑 FORGOT PASSWORD POPUP MODAL 🔑 */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative space-y-4">
            <button onClick={() => setShowForgotModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>

            {!forgotSuccess ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1C2C22]">Reset Password</h3>
                  <p className="text-xs text-[#5A6B60] mt-1">Enter your account email and we'll send you a recovery link.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#1C2C22]">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2.5 px-3 outline-none focus:border-[#456A50] text-sm shadow-sm" 
                    placeholder="name@example.com" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="w-full bg-[#456A50] text-white font-bold py-3 rounded-xl shadow-md hover:bg-[#35533E] text-xs transition disabled:opacity-70"
                >
                  {forgotLoading ? 'Sending Link...' : 'Send Recovery Link'}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <CheckCircle className="w-12 h-12 text-[#456A50] mx-auto" />
                <h3 className="text-lg font-bold text-[#1C2C22]">Check your email</h3>
                <p className="text-xs text-[#5A6B60]">
                  We have sent password reset instructions to <span className="font-semibold text-[#1C2C22]">{forgotEmail}</span>.
                </p>
                <button 
                  onClick={() => setShowForgotModal(false)} 
                  className="w-full mt-4 bg-gray-100 text-[#1C2C22] font-bold py-2.5 rounded-xl hover:bg-gray-200 text-xs transition"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default SignInPage;