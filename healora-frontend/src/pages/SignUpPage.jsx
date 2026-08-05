import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, PlusSquare, ArrowRight, ArrowLeft, Leaf, ShieldCheck, Eye, EyeOff, Briefcase, Phone } from 'lucide-react';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('PATIENT');
  
  // MATCHES POSTGRESQL DATABASE COLUMNS EXACTLY
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

    // Validations
    if (!agreeTerms) return setErrorMsg("Please agree to the Terms of Service.");
    if (password.length < 8) return setErrorMsg("Password must be at least 8 characters.");
    if (phone && !phone.match(/^\d{10}$/)) return setErrorMsg("Phone number must be exactly 10 digits.");

    setIsLoading(true);

    try {
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          first_name: firstName, 
          last_name: lastName, 
          email: email, 
          phone_number: phone,  // <--- NOW SAVING TO DATABASE
          password: password, 
          role: role 
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        alert("🎉 Account created successfully! Please sign in.");
        navigate('/signin');
      } else {
        // SMART ERROR HANDLING
        if (response.status === 500) {
          setErrorMsg("Server Error (500). Please check your Django terminal for the crash reason.");
        } else if (data && data.email) {
          setErrorMsg("This email is already registered.");
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C2C22]">Create an Account</h2>
            <p className="text-[#5A6B60] text-xs mt-1">Please fill in your details to get started.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            
            {/* Role Selection */}
            <div>
              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">I am registering as a:</label>
              <div className="grid grid-cols-2 gap-3">
                <div onClick={() => setRole('PATIENT')} className={`cursor-pointer p-2.5 rounded-xl border-2 transition-all flex items-center gap-2.5 ${role === 'PATIENT' ? 'border-[#456A50] bg-[#EAF0EC]' : 'border-[#EBE9E0] bg-white'}`}>
                  <div className={`p-1.5 rounded-lg ${role === 'PATIENT' ? 'bg-[#456A50] text-white' : 'bg-[#FDFCF8] text-[#5A6B60]'}`}><User size={16} /></div>
                  <h4 className="font-bold text-xs text-[#1C2C22]">Patient</h4>
                </div>
                <div onClick={() => setRole('NUTRITIONIST')} className={`cursor-pointer p-2.5 rounded-xl border-2 transition-all flex items-center gap-2.5 ${role === 'NUTRITIONIST' ? 'border-[#456A50] bg-[#EAF0EC]' : 'border-[#EBE9E0] bg-white'}`}>
                  <div className={`p-1.5 rounded-lg ${role === 'NUTRITIONIST' ? 'bg-[#456A50] text-white' : 'bg-[#FDFCF8] text-[#5A6B60]'}`}><Briefcase size={16} /></div>
                  <h4 className="font-bold text-xs text-[#1C2C22]">Nutritionist</h4>
                </div>
              </div>
            </div>

            {/* Row 1: First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#1C2C22] mb-1">First Name</label>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2 px-3 outline-none focus:border-[#456A50] text-xs shadow-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#1C2C22] mb-1">Last Name</label>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2 px-3 outline-none focus:border-[#456A50] text-xs shadow-sm" />
              </div>
            </div>

            {/* Row 2: Email & Phone Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#1C2C22] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-[#5A6B60]" size={14} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2 pl-9 pr-3 outline-none focus:border-[#456A50] text-xs shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#1C2C22] mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-[#5A6B60]" size={14} />
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10 Digits" className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2 pl-9 pr-3 outline-none focus:border-[#456A50] text-xs shadow-sm" />
                </div>
              </div>
            </div>

            {/* Row 3: Password */}
            <div>
              <label className="block text-[11px] font-semibold text-[#1C2C22] mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-[#5A6B60]" size={14} />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-[#EBE9E0] rounded-xl py-2 pl-9 pr-9 outline-none focus:border-[#456A50] text-xs shadow-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2 text-[#5A6B60]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-[#5A6B60] mt-0.5">ⓘ Must be at least 8 characters.</p>
            </div>

            {/* Terms & Submit */}
            <div className="flex items-start gap-2 pt-0.5">
              <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 rounded border-[#EBE9E0] text-[#456A50] focus:ring-[#456A50]" />
              <label htmlFor="terms" className="text-[11px] text-[#5A6B60]">I agree to the <span className="font-semibold text-[#456A50]">Terms</span> and <span className="font-semibold text-[#456A50]">Privacy Policy</span>.</label>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-[#456A50] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[#456A50]/20 hover:bg-[#35533E] transition flex items-center justify-center gap-2 text-sm disabled:opacity-70">
              {isLoading ? 'Creating...' : <>Apply <ArrowRight size={18} /></>}
            </button>

            <p className="text-center text-[11px] text-[#5A6B60] pt-1">
              Already registered? <button type="button" onClick={() => navigate('/signin')} className="font-bold text-[#456A50] hover:underline">Sign In</button>
            </p>

          </form>
        </div>

        <div className="text-center text-[10px] text-[#5A6B60] pt-2 border-t border-[#EBE9E0] flex justify-between items-center">
          <span>© 2026 Healora Wellness</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;