import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, PlusSquare, ArrowRight, ArrowLeft, Leaf, ShieldCheck, Eye, EyeOff, Phone } from 'lucide-react';

const SignUpPage = () => {
  const navigate = useNavigate();
  
  // Form State (Role is permanently 'PATIENT' for this public page)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // --- SUBMIT VALIDATIONS ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailRegex)) {
      return setErrorMsg("Please enter a valid email address.");
    }
    if (phone.length < 10) {
      return setErrorMsg("Phone number must be exactly 10 digits.");
    }
    if (password.length < 8) {
      return setErrorMsg("Password must be at least 8 characters long.");
    }
    if (!agreeTerms) {
      return setErrorMsg("Please agree to the Terms of Service and Privacy Policy.");
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          first_name: firstName.trim(), 
          last_name: lastName.trim(), 
          email: email.toLowerCase().trim(), 
          phone_number: phone,
          password: password, 
          role: 'PATIENT' 
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        alert("🎉 Patient Account created successfully! Please sign in.");
        navigate('/signin');
      } else {
        if (response.status === 500) {
          setErrorMsg("Server Error (500). Please check Django terminal.");
        } else if (data && data.email) {
          setErrorMsg("This email is already registered. Please sign in.");
        } else {
          setErrorMsg("Registration failed: " + (data ? JSON.stringify(data) : "Unknown Error"));
        }
      }
    } catch (error) { 
      setErrorMsg("Cannot connect to server. Is Django running?"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FDFCF8] grid grid-cols-1 md:grid-cols-12 font-sans text-[#1C2C22]">
      
      {/* LEFT COLUMN: Hero Panel */}
      <div className="md:col-span-5 relative bg-[#1C2C22] text-white p-8 lg:p-12 flex flex-col justify-between overflow-hidden hidden md:flex h-full">
        <div className="absolute inset-0 bg-cover bg-center opacity-30 filter saturate-50" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2C22] via-[#1C2C22]/80 to-transparent" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#456A50] text-white rounded-lg p-1.5"><Leaf size={22} /></div>
            <span className="text-2xl font-bold tracking-tight">Heal<span className="text-[#456A50]">ora</span></span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md text-[11px] font-medium text-[#EBE9E0] border border-white/10 uppercase tracking-widest">
            <ShieldCheck size={14} /> HIPAA Compliant
          </span>
        </div>
        <div className="relative z-10 space-y-3 my-auto max-w-sm">
          <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight">Start your healing journey.</h1>
          <p className="text-[#A4B3A8] text-sm leading-relaxed font-serif italic">Expert clinical guidance, tailored strictly to your biology.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Form Panel */}
      <div className="md:col-span-7 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12 overflow-hidden bg-[#FDFCF8]">
        
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B60] hover:text-[#456A50] transition w-max mb-1">
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="my-auto max-w-lg w-full mx-auto space-y-3">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1C2C22]">Patient Registration</h2>
            <p className="text-[#5A6B60] text-sm mt-1">Please fill in your details to create your health profile.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
            
            {/* Row 1: First Name & Last Name (ONLY ALPHABETS ALLOWED) */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-[#1C2C22] mb-1.5">First Name</label>
                <input 
                  type="text" 
                  required 
                  value={firstName} 
                  onChange={(e) => {
                    // ONLY allows letters and spaces
                    if (/^[a-zA-Z\s]*$/.test(e.target.value)) setFirstName(e.target.value);
                  }} 
                  placeholder="Jane" 
                  autoComplete="off" 
                  className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2.5 px-4 outline-none focus:border-[#456A50] text-sm shadow-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2C22] mb-1.5">Last Name</label>
                <input 
                  type="text" 
                  required 
                  value={lastName} 
                  onChange={(e) => {
                    // ONLY allows letters and spaces
                    if (/^[a-zA-Z\s]*$/.test(e.target.value)) setLastName(e.target.value);
                  }} 
                  placeholder="Doe" 
                  autoComplete="off" 
                  className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2.5 px-4 outline-none focus:border-[#456A50] text-sm shadow-sm" 
                />
              </div>
            </div>

            {/* Row 2: Email & Phone Number (ONLY NUMBERS ALLOWED) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1C2C22] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-[#5A6B60]" size={16} />
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="jane@example.com" 
                    autoComplete="off" 
                    className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2.5 pl-10 pr-3.5 outline-none focus:border-[#456A50] text-sm shadow-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2C22] mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-[#5A6B60]" size={16} />
                  <input 
                    type="tel" 
                    required 
                    maxLength="10"
                    value={phone} 
                    onChange={(e) => {
                      // ONLY allows digits (0-9) and stops at 10 characters
                      if (/^\d*$/.test(e.target.value) && e.target.value.length <= 10) setPhone(e.target.value);
                    }} 
                    placeholder="10 Digits" 
                    autoComplete="off" 
                    className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2.5 pl-10 pr-3.5 outline-none focus:border-[#456A50] text-sm shadow-sm" 
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Password */}
            <div>
              <label className="block text-xs font-bold text-[#1C2C22] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-[#5A6B60]" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  autoComplete="new-password" 
                  className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2.5 pl-10 pr-10 outline-none focus:border-[#456A50] text-sm shadow-sm" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-[#5A6B60]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-[#5A6B60] mt-1">ⓘ Must be at least 8 characters.</p>
            </div>

            {/* Terms & Submit */}
            <div className="flex items-start gap-2 pt-2">
              <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#EBE9E0] text-[#456A50] focus:ring-[#456A50]" />
              <label htmlFor="terms" className="text-xs text-[#5A6B60] leading-tight">
                I agree to the <span className="font-semibold text-[#456A50] cursor-pointer hover:underline">Terms of Service</span>, <span className="font-semibold text-[#456A50] cursor-pointer hover:underline">Privacy Policy</span>, and acknowledge the <span className="font-semibold text-[#456A50] cursor-pointer hover:underline">HIPAA Notice</span>.
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-[#456A50] hover:bg-[#35533E] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#456A50]/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-70 mt-4">
              {isLoading ? 'Registering...' : <>Register as Patient <ArrowRight size={18} /></>}
            </button>

            <p className="text-center text-xs text-[#5A6B60] pt-4">
              Already registered? <button type="button" onClick={() => navigate('/signin')} className="font-bold text-[#456A50] hover:underline">Sign In</button>
            </p>

          </form>
        </div>

        <div className="text-center text-[10px] text-[#5A6B60] pt-2 border-t border-[#EBE9E0]">
          <span>© 2026 Healora Wellness</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;