import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, PlusSquare, ShieldCheck, Eye, EyeOff, ArrowLeft, Leaf } from 'lucide-react';

const SignInPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        // ⚠️ THIS IS THE PERMANENT FIX: Django requires the key to be named 'username'
        body: JSON.stringify({ username: email, password: password }),
      });
      
      const data = await response.json().catch(() => null);

      if (response.ok) {
        // Save security tokens and user details
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_name', data.first_name || 'User');
        
        // Redirect based on role!
        navigate(data.role === 'NUTRITIONIST' ? '/nutritionist-dashboard' : '/patient-dashboard');
      } else {
        setErrorMsg('Invalid email or password. Are you sure you registered this account?');
      }
    } catch (error) { 
      setErrorMsg('Cannot connect to server. Is Django running?'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FDFCF8] grid grid-cols-1 md:grid-cols-12 font-sans text-[#1C2C22]">
      
      {/* LEFT COLUMN: Form */}
      <div className="md:col-span-5 flex flex-col justify-between p-8 lg:p-16 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#456A50] text-white rounded-lg p-1.5"><Leaf size={24} /></div>
            <span className="text-xl font-bold">Heal<span className="text-[#456A50]">ora</span></span>
          </div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B60] hover:text-[#456A50]">
            <ArrowLeft size={16} /> Back
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
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#1C2C22]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 text-[#5A6B60]" size={16} />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-[#456A50] text-sm shadow-sm" 
                  placeholder="name@example.com" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#1C2C22]">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 text-[#5A6B60]" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2.5 pl-11 pr-11 outline-none focus:border-[#456A50] text-sm shadow-sm" 
                  placeholder="••••••••" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-[#5A6B60]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={isLoading} className="w-full bg-[#456A50] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#456A50]/20 hover:bg-[#35533E] text-sm transition mt-4 disabled:opacity-70">
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
            
            <p className="text-center text-xs text-[#5A6B60] pt-4">
              Don't have an account? <button type="button" onClick={() => navigate('/signup')} className="font-bold text-[#456A50] hover:underline">Apply for access</button>
            </p>
          </form>
        </div>
        <div></div> {/* Spacer */}
      </div>

      {/* RIGHT COLUMN: Hero */}
      <div className="md:col-span-7 relative bg-[#1C2C22] text-white p-12 flex flex-col justify-between overflow-hidden hidden md:flex h-full">
        <div className="absolute inset-0 bg-cover bg-center filter saturate-50 opacity-40" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2C22] via-[#1C2C22]/60 to-transparent" />
        <div className="relative z-10"><span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-200 border border-white/10 uppercase tracking-wider"><ShieldCheck size={14} /> HIPAA COMPLIANT SECURE PORTAL</span></div>
        <div className="relative z-10 max-w-xl space-y-6 my-auto">
          <h2 className="text-5xl font-extrabold leading-tight">Evidence-Based Wellness</h2>
          <p className="text-teal-100 text-base">Join Healora to connect with expert nutritionists and access personalized wellness programs.</p>
        </div>
      </div>
    </div>
  );
};
export default SignInPage;