import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, Mail, Lock, PlusSquare, ArrowRight, ArrowLeft, Leaf, 
  ShieldCheck, Eye, EyeOff, Phone, CheckCircle2, Activity, 
  HeartPulse, Sparkles, Apple, Flame, Stethoscope, Droplets
} from 'lucide-react';

const DEFAULT_GOAL_PROGRAMS = [
  {
    id: 'weight-loss',
    name: 'Weight Loss',
    tagline: 'Sustainable Fat Loss & Caloric Deficit',
    icon: '🏃',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Personalized caloric deficit, metabolic boost & macro tracking.'
  },
  {
    id: 'weight-gain',
    name: 'Weight Gain',
    tagline: 'Hypertrophy & High-Protein Kerala Protocol',
    icon: '🥩',
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
    description: 'Clean caloric surplus, muscle hypertrophy & nutrient density.'
  },
  {
    id: 'pcos-care',
    name: 'PCOS Care',
    tagline: 'Hormonal Balance & Anti-Inflammatory Protocol',
    icon: '🌸',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Insulin-sensitizing meals, androgen control & cycle regulation.'
  },
  {
    id: 'diabetic-care',
    name: 'Diabetic Care',
    tagline: 'Glycemic Regulation & Low-GI Protocol',
    icon: '🩺',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Strict glycemic control, HbA1c stabilization & timed carbs.'
  },
  {
    id: 'pregnancy-nutrition',
    name: 'Pregnancy Nutrition',
    tagline: 'Maternal Micronutrients & Nourishment',
    icon: '🥑',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Trimester-calibrated nutrition, folate, iron & baby development.'
  },
  {
    id: 'kids-elderly',
    name: 'Kids & Elderly',
    tagline: 'Vitality, Growth & Longevity Nutrition',
    icon: '🍃',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    description: 'Growth support for children & bio-available nutrition for seniors.'
  }
];

const loadActivePrograms = () => {
  let list = [...DEFAULT_GOAL_PROGRAMS];
  try {
    const stored = JSON.parse(localStorage.getItem('healora_programs_v2')) || JSON.parse(localStorage.getItem('healora_programs'));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const active = stored.filter(p => p.status !== 'Inactive');
      active.forEach(p => {
        const slug = (p.name || '').toLowerCase().replace(/\s+/g, '-');
        const exists = list.some(item => item.id === slug || item.name.toLowerCase() === (p.name || '').toLowerCase());
        if (!exists) {
          list.push({
            id: slug,
            name: p.name,
            tagline: p.description || 'Clinical Precision Nutrition & Care',
            icon: '🩺',
            badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            description: p.description || 'Specialized clinical nutrition protocol.'
          });
        }
      });
    }
  } catch (e) {}
  return list;
};

const SignUpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [goalPrograms, setGoalPrograms] = useState(loadActivePrograms);

  // Determine if user came from a specific Goal Card on the Landing Page
  const paramGoal = searchParams.get('program') || searchParams.get('goal');
  
  const matchedGoal = goalPrograms.find(g => 
    g.id === paramGoal || 
    g.name.toLowerCase() === (paramGoal || '').toLowerCase().replace(/-/g, ' ') ||
    (paramGoal && (paramGoal.toLowerCase() === g.id || paramGoal.toLowerCase() === g.name.toLowerCase()))
  );

  const isPreselectedFromCard = Boolean(matchedGoal);

  // --- WIZARD STEP ---
  const [step, setStep] = useState(1); // 1: Account Credentials, 2: Health Profile & Goal Selection

  // --- STEP 1: ACCOUNT CREDENTIALS ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- STEP 2: HEALTH PROFILE & GOAL ---
  const [selectedGoal, setSelectedGoal] = useState(() => {
    if (matchedGoal) return matchedGoal.name;
    if (paramGoal) return paramGoal;
    return 'Weight Loss';
  });
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState('Female');
  const [heightCm, setHeightCm] = useState('165');
  const [weightKg, setWeightKg] = useState('65');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [foodPreference, setFoodPreference] = useState('No preference');
  const [foodAllergies, setFoodAllergies] = useState('None');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updated = loadActivePrograms();
    setGoalPrograms(updated);
  }, []);

  useEffect(() => {
    if (matchedGoal) {
      setSelectedGoal(matchedGoal.name);
    } else if (paramGoal) {
      setSelectedGoal(paramGoal);
    }
  }, [matchedGoal, paramGoal]);

  // Validate Step 1 before continuing
  const handleNextStep = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      return setErrorMsg("Please enter your full name.");
    }
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

    setStep(2);
  };

  // Final Registration Submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agreeTerms) {
      return setErrorMsg("Please agree to the Terms of Service and Privacy Policy.");
    }

    setIsLoading(true);

    try {
      // 1. Create account on Django Backend
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

      if (!response.ok) {
        if (response.status === 500) {
          throw new Error("Server Error (500). Please check Django terminal.");
        } else if (data && data.email) {
          throw new Error("This email is already registered. Please sign in.");
        } else {
          throw new Error("Registration failed: " + (data ? JSON.stringify(data) : "Unknown Error"));
        }
      }

      // 2. Automatically Log In to establish session
      let authUserId = String(data?.id || Date.now());
      let accessToken = 'session_token_' + Date.now();

      try {
        const loginRes = await fetch('/api/login/', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email.toLowerCase().trim(), password: password }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          authUserId = String(loginData.id || authUserId);
          accessToken = loginData.access || accessToken;
        }
      } catch (loginErr) {}

      // 3. Construct Full Patient Profile with Goal
      const profileData = {
        age: String(age || '24'),
        gender: gender || 'Female',
        height_cm: String(heightCm || '165'),
        weight_kg: String(weightKg || '65'),
        blood_group: bloodGroup || 'O+',
        food_preferences: foodPreference || 'No preference',
        food_allergies: foodAllergies || 'None',
        health_goals: selectedGoal,
        enrolled_program: selectedGoal,
        medical_history: 'None reported',
        lifestyle_habits: 'Active',
        created_at: new Date().toISOString()
      };

      // 4. Save Session & Profile to Local Storage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('user_role', 'PATIENT');
      localStorage.setItem('user_name', `${firstName.trim()} ${lastName.trim()}`);
      localStorage.setItem('user_id', authUserId);
      localStorage.setItem('user_email', email.toLowerCase().trim());
      localStorage.setItem(`healora_profile_${authUserId}`, JSON.stringify(profileData));

      // 5. Register in Global Local Users List (for instant Clinic Manager & Nutritionist sync)
      const globalUsers = JSON.parse(localStorage.getItem('healora_local_users')) || [];
      const updatedUsers = [
        ...globalUsers.filter(u => String(u.id) !== authUserId && u.email !== email.toLowerCase().trim()),
        {
          id: authUserId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.toLowerCase().trim(),
          role: 'PATIENT',
          enrolled_program: selectedGoal,
          health_goals: selectedGoal,
          ...profileData
        }
      ];
      localStorage.setItem('healora_local_users', JSON.stringify(updatedUsers));

      // 6. Update Profile on Backend API
      try {
        await fetch(`/api/profile/update/${authUserId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(profileData)
        });
      } catch (profErr) {}

      // 7. Add Welcome Notification
      const pNotifs = [
        {
          id: Date.now(),
          title: `Welcome to Healora ${selectedGoal} Protocol!`,
          message: `Your account is ready. Your health profile has been configured for ${selectedGoal}. Book your first consultation to receive your doctor's meal plan.`,
          date: new Date().toLocaleString(),
          read: false
        }
      ];
      localStorage.setItem(`healora_notifications_${authUserId}`, JSON.stringify(pNotifs));

      // 8. Direct to Personalized Patient Dashboard
      alert(`🎉 Welcome to Healora, ${firstName}! Your ${selectedGoal} profile is set up. Loading your personalized dashboard...`);
      navigate('/patient-dashboard', { replace: true });

    } catch (error) { 
      setErrorMsg(error.message || "Cannot connect to server. Is Django running?"); 
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

        <div className="relative z-10 space-y-4 my-auto max-w-sm">
          {isPreselectedFromCard ? (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={13} /> Selected Program
              </span>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <span>{matchedGoal?.icon}</span> {matchedGoal?.name}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {matchedGoal?.tagline}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight">Start your healing journey.</h1>
              <p className="text-[#A4B3A8] text-sm leading-relaxed font-serif italic">Expert clinical guidance, tailored strictly to your biology and goals.</p>
            </>
          )}

          {/* Stepper Indicator */}
          <div className="flex items-center gap-3 pt-4">
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-emerald-400 font-black' : 'text-gray-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-emerald-500 text-white font-black' : 'bg-gray-700 text-gray-300'}`}>1</span>
              Account Details
            </div>
            <div className="w-8 h-[2px] bg-gray-700"></div>
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-emerald-400 font-black' : 'text-gray-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-emerald-500 text-white font-black' : 'bg-gray-700 text-gray-300'}`}>2</span>
              Goal & Health Profile
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-gray-400 flex justify-between">
          <span>Personalized Clinical Care</span>
          <span>Encrypted Patient Vault</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Form Panel */}
      <div className="md:col-span-7 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 overflow-y-auto custom-scrollbar bg-[#FDFCF8]">
        
        <div className="flex justify-between items-center mb-4">
          <button 
            type="button" 
            onClick={() => {
              if (step === 2) setStep(1);
              else navigate('/');
            }} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B60] hover:text-[#456A50] transition w-max cursor-pointer"
          >
            <ArrowLeft size={16} /> {step === 2 ? 'Back to Credentials' : 'Back to Home'}
          </button>

          <span className="text-[11px] font-bold text-[#5A6B60] bg-white px-3 py-1 rounded-full border border-[#EBE9E0]">
            Step {step} of 2
          </span>
        </div>

        <div className="my-auto max-w-lg w-full mx-auto space-y-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C2C22]">
              {step === 1 ? 'Patient Registration' : 'Personalize Your Health Goal'}
            </h2>
            <p className="text-[#5A6B60] text-xs mt-1">
              {step === 1 
                ? 'Create your secure account credentials to get started.' 
                : 'Select your program and biometrics to personalize your care dashboard.'}
            </p>
          </div>

          {/* Goal Banner if arriving from card */}
          {isPreselectedFromCard && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{matchedGoal?.icon}</span>
                <div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Pre-selected Program</span>
                  <span className="text-xs font-black text-[#1C2C22]">{matchedGoal?.name}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg">
                ✓ Locked to Plan
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* ================= STEP 1: ACCOUNT CREDENTIALS ================= */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4" autoComplete="off">
              
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-[#1C2C22]">First Name</label>
                    {firstName.length > 0 && (
                      <span className={`text-[10px] font-bold ${firstName.trim().length >= 2 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {firstName.trim().length >= 2 ? '✓ Valid' : 'Min 2 letters'}
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={firstName} 
                    onChange={(e) => {
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) setFirstName(e.target.value);
                    }} 
                    placeholder="Jane" 
                    autoComplete="off" 
                    className={`w-full bg-white border rounded-xl py-2.5 px-4 outline-none text-sm shadow-sm transition ${
                      firstName.length === 0 
                        ? 'border-[#EBE9E0] focus:border-[#456A50]' 
                        : firstName.trim().length >= 2 
                          ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                          : 'border-amber-400 bg-amber-50/10 focus:border-amber-500'
                    }`} 
                  />
                  {firstName.length > 0 && firstName.trim().length < 2 && (
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">⚠️ First name must be at least 2 letters.</p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-[#1C2C22]">Last Name</label>
                    {lastName.length > 0 && (
                      <span className={`text-[10px] font-bold ${lastName.trim().length >= 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {lastName.trim().length >= 1 ? '✓ Valid' : 'Required'}
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={lastName} 
                    onChange={(e) => {
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) setLastName(e.target.value);
                    }} 
                    placeholder="Doe" 
                    autoComplete="off" 
                    className={`w-full bg-white border rounded-xl py-2.5 px-4 outline-none text-sm shadow-sm transition ${
                      lastName.length === 0 
                        ? 'border-[#EBE9E0] focus:border-[#456A50]' 
                        : lastName.trim().length >= 1 
                          ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                          : 'border-amber-400 bg-amber-50/10 focus:border-amber-500'
                    }`} 
                  />
                  {lastName.length > 0 && lastName.trim().length < 1 && (
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">⚠️ Last name cannot be empty.</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-[#1C2C22]">Email Address</label>
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
                    <Mail className={`absolute left-3.5 top-3 ${
                      email.length === 0 
                        ? 'text-[#5A6B60]' 
                        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) 
                          ? 'text-emerald-700' 
                          : !email.includes('@') 
                            ? 'text-red-600' 
                            : 'text-amber-700'
                    }`} size={16} />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="jane@example.com" 
                      autoComplete="off" 
                      className={`w-full bg-white border rounded-xl py-2.5 pl-10 pr-3.5 outline-none text-sm shadow-sm transition ${
                        email.length === 0 
                          ? 'border-[#EBE9E0] focus:border-[#456A50]' 
                          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) 
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600 text-[#1C2C22]' 
                            : !email.includes('@') 
                              ? 'border-red-400 bg-red-50/20 focus:border-red-500 text-red-900' 
                              : 'border-amber-400 bg-amber-50/20 focus:border-amber-500 text-amber-900'
                      }`} 
                    />
                  </div>
                  {/* Live Inline Email Feedback */}
                  {email.length > 0 && !email.includes('@') && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                      ⚠️ Must include an '@' (e.g. name@example.com)
                    </p>
                  )}
                  {email.length > 0 && email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                    <p className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                      ⚠️ Include domain (e.g. @gmail.com)
                    </p>
                  )}
                  {email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                    <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                      ✓ Valid email address
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-[#1C2C22]">Phone Number</label>
                    {phone.length > 0 && (
                      <span className={`text-[10px] font-bold ${phone.length === 10 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {phone.length === 10 ? '✓ 10 Digits' : `${phone.length}/10 digits`}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className={`absolute left-3.5 top-3 ${
                      phone.length === 0 ? 'text-[#5A6B60]' : phone.length === 10 ? 'text-emerald-700' : 'text-amber-700'
                    }`} size={16} />
                    <input 
                      type="tel" 
                      required 
                      maxLength="10"
                      value={phone} 
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value) && e.target.value.length <= 10) setPhone(e.target.value);
                      }} 
                      placeholder="10 Digits" 
                      autoComplete="off" 
                      className={`w-full bg-white border rounded-xl py-2.5 pl-10 pr-3.5 outline-none text-sm shadow-sm transition ${
                        phone.length === 0 
                          ? 'border-[#EBE9E0] focus:border-[#456A50]' 
                          : phone.length === 10 
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                            : 'border-amber-400 bg-amber-50/20 focus:border-amber-500'
                      }`} 
                    />
                  </div>
                  {/* Live Inline Phone Feedback */}
                  {phone.length > 0 && phone.length < 10 && (
                    <p className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                      ⚠️ {10 - phone.length} more digits needed (10 digits required)
                    </p>
                  )}
                  {phone.length === 10 && (
                    <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                      ✓ 10-digit number verified
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-[#1C2C22]">Password</label>
                  {password.length > 0 && (
                    <span className={`text-[10px] font-bold ${password.length >= 8 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {password.length >= 8 ? '✓ Strong' : `${password.length}/8 chars`}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-3 ${
                    password.length === 0 ? 'text-[#5A6B60]' : password.length >= 8 ? 'text-emerald-700' : 'text-red-600'
                  }`} size={16} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    autoComplete="new-password" 
                    className={`w-full bg-white border rounded-xl py-2.5 pl-10 pr-10 outline-none text-sm shadow-sm transition ${
                      password.length === 0 
                        ? 'border-[#EBE9E0] focus:border-[#456A50]' 
                        : password.length >= 8 
                          ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                          : 'border-red-400 bg-red-50/20 focus:border-red-500'
                    }`} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-[#5A6B60] cursor-pointer">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Live Inline Password Feedback */}
                {password.length === 0 && (
                  <p className="text-[11px] text-[#5A6B60] mt-1 font-medium">ⓘ Must be at least 8 characters.</p>
                )}
                {password.length > 0 && password.length < 8 && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                    ⚠️ {8 - password.length} more characters needed (Min 8 characters)
                  </p>
                )}
                {password.length >= 8 && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                    ✓ Strong password format ({password.length} characters)
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#456A50] hover:bg-[#35533E] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#456A50]/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                Continue to Health Profile & Goal <ArrowRight size={18} />
              </button>

              <p className="text-center text-xs text-[#5A6B60] pt-2">
                Already registered? <button type="button" onClick={() => navigate('/signin')} className="font-bold text-[#456A50] hover:underline cursor-pointer">Sign In</button>
              </p>
            </form>
          )}

          {/* ================= STEP 2: HEALTH PROFILE & GOAL SELECTION ================= */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
              
              {/* GOAL / PROGRAM SELECTION GRID */}
              <div>
                <label className="block text-xs font-black text-[#1C2C22] mb-1.5 uppercase tracking-wider">
                  Select Your Clinical Health Program
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {goalPrograms.map((goal) => {
                    const isSelected = selectedGoal === goal.name;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(goal.name)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected 
                            ? 'border-[#456A50] bg-[#EAF0EC] shadow-xs ring-2 ring-[#456A50]/30' 
                            : 'border-[#EBE9E0] bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xl">{goal.icon}</span>
                          {isSelected && <CheckCircle2 size={16} className="text-[#456A50]" />}
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-black text-[#1C2C22] leading-tight">{goal.name}</p>
                          <p className="text-[9px] text-[#5A6B60] line-clamp-1 mt-0.5">{goal.tagline}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BIOMETRICS GRID */}
              <div className="bg-white p-4 rounded-2xl border border-[#EBE9E0] space-y-3 shadow-2xs">
                <p className="text-[10px] font-black text-[#5A6B60] uppercase tracking-widest">Basic Biometrics</p>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1C2C22] mb-1">Age</label>
                    <input 
                      type="number" 
                      required 
                      min="10" 
                      max="120"
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-2 px-3 text-xs outline-none focus:border-[#456A50]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1C2C22] mb-1">Gender</label>
                    <select 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)} 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-2 px-2.5 text-xs outline-none focus:border-[#456A50]"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1C2C22] mb-1">Blood Group</label>
                    <select 
                      value={bloodGroup} 
                      onChange={(e) => setBloodGroup(e.target.value)} 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-2 px-2.5 text-xs outline-none focus:border-[#456A50]"
                    >
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                      <option value="O-">O-</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1C2C22] mb-1">Height (cm)</label>
                    <input 
                      type="number" 
                      required 
                      value={heightCm} 
                      onChange={(e) => setHeightCm(e.target.value)} 
                      placeholder="165" 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-2 px-3 text-xs outline-none focus:border-[#456A50]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1C2C22] mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      required 
                      value={weightKg} 
                      onChange={(e) => setWeightKg(e.target.value)} 
                      placeholder="65" 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-2 px-3 text-xs outline-none focus:border-[#456A50]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1C2C22] mb-1">Diet Preference</label>
                    <select 
                      value={foodPreference} 
                      onChange={(e) => setFoodPreference(e.target.value)} 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-2 px-2.5 text-xs outline-none focus:border-[#456A50]"
                    >
                      <option value="No preference">No preference</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                      <option value="Eggetarian">Eggetarian</option>
                      <option value="Vegan">Vegan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1C2C22] mb-1">Food Allergies</label>
                    <input 
                      type="text" 
                      value={foodAllergies} 
                      onChange={(e) => setFoodAllergies(e.target.value)} 
                      placeholder="None, Dairy, Peanuts..." 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-2 px-3 text-xs outline-none focus:border-[#456A50]" 
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Submit */}
              <div className="flex items-start gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="terms2" 
                  checked={agreeTerms} 
                  onChange={(e) => setAgreeTerms(e.target.checked)} 
                  className="mt-0.5 h-4 w-4 rounded border-[#EBE9E0] text-[#456A50] focus:ring-[#456A50] cursor-pointer" 
                />
                <label htmlFor="terms2" className="text-[11px] text-[#5A6B60] leading-tight">
                  I agree to the <span className="font-semibold text-[#456A50] cursor-pointer hover:underline">Terms of Service</span>, <span className="font-semibold text-[#456A50] cursor-pointer hover:underline">Privacy Policy</span>, and confirm my clinical profile details.
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-[#456A50] hover:bg-[#35533E] text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-[#456A50]/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>Setting Up Your {selectedGoal} Dashboard...</>
                ) : (
                  <>
                    <Sparkles size={18} /> Complete & Enter {selectedGoal} Dashboard <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-[10px] text-[#5A6B60] pt-3 border-t border-[#EBE9E0] flex justify-between items-center">
          <span>© 2026 Healora Wellness Systems</span>
          <span>HIPAA Compliant & Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;