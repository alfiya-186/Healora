import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Leaf, Target, Eye, Activity, Apple, BarChart3, Bot, Calendar, Bell,
  Star, CheckCircle2, Mail, Phone, MapPin, Globe, Share2, MessageCircle
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  
  const isLoggedIn = !!localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  const clinicName = localStorage.getItem('clinic_name') || 'Healora';
  const clinicPhone = '+91 484 298 0000';
  const clinicEmail = localStorage.getItem('clinic_email') || 'support@healora.com';
  const clinicAddress = 'Healora Clinical Tech Park, InfoPark Phase 2, Kakkanad, Kochi, Kerala 682042';

  // --- SCROLL ANIMATION OBSERVER ---
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleDashboardRedirect = () => {
    if (userRole === 'ADMIN') navigate('/admin-dashboard');
    else if (userRole === 'MANAGER') navigate('/manager-dashboard');
    else if (userRole === 'NUTRITIONIST') navigate('/nutritionist-dashboard');
    else navigate('/patient-dashboard');
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  const PROGRAM_IMAGE_MAP = {
    'weight-loss': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    'weight-gain': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    'pcos-care': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    'diabetic-care': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'pregnancy-nutrition': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    'kids-elderly': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    'hypertension': 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80',
    'cardiac': 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80',
    'thyroid': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  };

  const getProgramImage = (name, slug) => {
    const s = `${slug || ''} ${name || ''}`.toLowerCase();
    for (const [key, url] of Object.entries(PROGRAM_IMAGE_MAP)) {
      if (s.includes(key.replace(/-/g, ' ')) || s.includes(key)) return url;
    }
    // High quality clinical wellness image fallback
    return 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80';
  };

  const DEFAULT_PROGRAMS = [
    { id: 'weight-loss', name: 'Weight Loss', img: PROGRAM_IMAGE_MAP['weight-loss'] },
    { id: 'weight-gain', name: 'Weight Gain', img: PROGRAM_IMAGE_MAP['weight-gain'] },
    { id: 'pcos-care', name: 'PCOS Care', img: PROGRAM_IMAGE_MAP['pcos-care'] },
    { id: 'diabetic-care', name: 'Diabetic Care', img: PROGRAM_IMAGE_MAP['diabetic-care'] },
    { id: 'pregnancy-nutrition', name: 'Pregnancy Nutrition', img: PROGRAM_IMAGE_MAP['pregnancy-nutrition'] },
    { id: 'kids-elderly', name: 'Kids & Elderly', img: PROGRAM_IMAGE_MAP['kids-elderly'] },
  ];

  const [programs, setPrograms] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('healora_programs_v2')) || JSON.parse(localStorage.getItem('healora_programs'));
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored.filter(p => p.status !== 'Inactive').map(p => ({
          id: p.id ? String(p.id) : (p.name || '').toLowerCase().replace(/\s+/g, '-'),
          slug: (p.name || '').toLowerCase().replace(/\s+/g, '-'),
          name: p.name,
          description: p.description,
          img: getProgramImage(p.name, (p.name || '').toLowerCase().replace(/\s+/g, '-'))
        }));
      }
    } catch (e) {}
    return DEFAULT_PROGRAMS;
  });

  useEffect(() => {
    const syncPrograms = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('healora_programs_v2')) || JSON.parse(localStorage.getItem('healora_programs'));
        if (stored && Array.isArray(stored) && stored.length > 0) {
          const activeList = stored.filter(p => p.status !== 'Inactive').map(p => ({
            id: p.id ? String(p.id) : (p.name || '').toLowerCase().replace(/\s+/g, '-'),
            slug: (p.name || '').toLowerCase().replace(/\s+/g, '-'),
            name: p.name,
            description: p.description,
            img: getProgramImage(p.name, (p.name || '').toLowerCase().replace(/\s+/g, '-'))
          }));
          setPrograms(activeList);
        }
      } catch (e) {}
    };

    window.addEventListener('storage', syncPrograms);
    const interval = setInterval(syncPrograms, 2000);
    return () => {
      window.removeEventListener('storage', syncPrograms);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f9faf7] font-sans text-[#1a241d] scroll-smooth selection:bg-[#3A5A40] selection:text-white overflow-x-hidden">
      
      {/* 1. FIXED NAVBAR */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#f9faf7]/95 backdrop-blur-md shadow-sm py-4 border-b border-[#e1e6e2]' : 'bg-transparent py-5 lg:py-6'}`}>
        <nav className="flex justify-between items-center px-6 lg:px-12 max-w-[90rem] mx-auto">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2.5 cursor-pointer transform hover:scale-105 transition-transform duration-300" onClick={() => window.scrollTo(0, 0)}>
              <div className="bg-[#3A5A40] text-white rounded-xl p-2 shadow-md shadow-[#3A5A40]/30"><Leaf size={24} strokeWidth={2.5}/></div>
              <span className="text-2xl font-black tracking-tighter text-[#1a241d]">Heal<span className="text-[#3A5A40]">ora</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-[15px] font-bold text-[#5C7362]">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#3A5A40] transition-colors">Home</button>
              <a href="#about" className="hover:text-[#3A5A40] transition-colors">Our Approach</a>
              <a href="#programs" className="hover:text-[#3A5A40] transition-colors">Clinical Programs</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button onClick={handleDashboardRedirect} className="px-7 py-2.5 lg:py-3 text-sm font-bold bg-[#1a241d] text-white rounded-full hover:bg-[#3A5A40] shadow-xl shadow-[#1a241d]/20 transition-all hover:-translate-y-0.5 tracking-wide">Go to Portal</button>
            ) : (
              <>
                <button onClick={() => navigate('/signin')} className="hidden sm:block px-5 py-3 text-[15px] font-bold text-[#1a241d] hover:text-[#3A5A40] transition-colors">Log In</button>
                <button onClick={() => navigate('/signup')} className="px-7 py-2.5 lg:py-3.5 text-[15px] font-bold bg-[#3A5A40] text-white rounded-full hover:bg-[#2C4430] shadow-lg shadow-[#3A5A40]/30 transition-all transform hover:-translate-y-1 tracking-wide">Get Started</button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* 2. CREATIVE HERO SECTION - ENLARGED TOP, AVATARS REMOVED */}
      <section className="relative w-full pt-28 lg:pt-36 pb-20 overflow-hidden bg-gradient-to-b from-[#f9faf7] to-[#f0f2eb]">
        
        {/* Soft Background Globs */}
        <div className="absolute top-10 left-0 w-[600px] h-[600px] bg-[#E4EBE6] rounded-full mix-blend-multiply filter blur-3xl opacity-60 z-0 animate-blob"></div>

        <div className="w-full max-w-[90rem] mx-auto px-6 lg:px-12 relative z-10 flex flex-col lg:flex-row items-center h-full">
          
          <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-center">
            
            {/* 🌟 THIS WRAPPER CONTROLS THE EXACT IMAGE HEIGHT 🌟 */}
            <div className="relative w-full">
              
              {/* Top Badge safely distanced below Navbar */}
              <div className="animate-slide-up-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F0EA] border border-[#CFDACF] text-[#3A5A40] text-[10px] lg:text-[11px] font-black tracking-widest uppercase mb-6 shadow-sm w-max">
                <ShieldCheck size={14} className="text-[#3A5A40]"/> DATA-DRIVEN CLINICAL CARE
              </div>
              
              {/* Heading */}
              <h1 className="animate-slide-up-2 text-[2.5rem] sm:text-5xl lg:text-[3.5rem] xl:text-[4.2rem] font-black leading-[1.05] tracking-tighter mb-5 text-[#1a241d]">
                Modern medicine for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A5A40] to-[#608768] font-serif italic font-medium pr-1">metabolism.</span>
              </h1>
              
              {/* Paragraph */}
              <p className="animate-slide-up-3 text-[#5C7362] text-[15px] sm:text-base mb-10 max-w-[420px] leading-relaxed font-medium">
                {clinicName} connects you with top clinical dietitians. Receive continuous monitoring, personalized plans, and lab-grade results.
              </p>
              
              {/* Buttons */}
              <div className="animate-slide-up-4 flex flex-col sm:flex-row gap-3 sm:gap-4 pb-2">
                <button onClick={() => navigate('/signup')} className="px-7 py-3.5 bg-[#3A5A40] text-white font-bold rounded-full hover:bg-[#2C4430] shadow-[0_8px_20px_rgba(58,90,64,0.3)] transition-all flex items-center justify-center gap-2 group transform hover:-translate-y-1 text-sm tracking-wide">
                  Start Your Journey <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => document.getElementById('programs').scrollIntoView({ behavior: 'smooth' })} className="px-7 py-3.5 bg-white backdrop-blur-sm border border-[#CFDACF] text-[#1a241d] font-bold rounded-full hover:bg-[#f0f2eb] hover:border-[#3A5A40] shadow-sm transition-all flex items-center justify-center transform hover:-translate-y-1 text-sm tracking-wide">
                  View Programs
                </button>
              </div>

              {/* 🌟 THE EXACTLY ALIGNED DESKTOP IMAGE 🌟 */}
              {/* top-[-1.5rem] enlarges it upwards above the badge. bottom-[-3rem] stretches it below the buttons. */}
              <div className="hidden lg:block absolute top-[-1.5rem] bottom-[-3rem] left-full ml-8 xl:ml-12 w-[55vw] max-w-[780px] min-h-[420px] animate-slide-in-right z-0">
                <div className="w-full h-full relative">
                  <img 
                    src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80" 
                    alt="Healthy Lifestyle" 
                    className="w-full h-full object-cover rounded-l-[3rem] shadow-[-15px_15px_30px_rgba(58,90,64,0.1)] border-y-[6px] border-l-[6px] border-white/60 backdrop-blur-sm" 
                  />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-[12%] -left-6 bg-white/95 backdrop-blur-md p-3.5 rounded-3xl shadow-xl border border-[#e1e6e2] flex items-center gap-3 animate-float">
                    <div className="bg-[#E8F0EA] p-2 rounded-2xl text-[#3A5A40]"><CheckCircle2 size={18} strokeWidth={2.5} /></div>
                    <div><p className="text-[13px] font-black text-[#1a241d] tracking-tight">Clinical Protocol</p></div>
                  </div>
                  
                  <div className="absolute bottom-[15%] -left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-3xl shadow-xl border border-[#e1e6e2] flex items-center gap-3 animate-floatSlow">
                    <div className="bg-orange-50 p-2 rounded-2xl text-[#d48c3d]"><Star size={18} fill="currentColor" /></div>
                    <div><p className="text-[13px] font-black text-[#1a241d] tracking-tight">4.9/5 Rating</p></div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Reduced Mobile Image (Hidden on Desktop) */}
          <div className="w-full lg:hidden relative mt-12 pb-12 animate-slide-up-5">
            <div className="relative group mx-auto w-full max-w-[450px]">
              <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80" alt="Healthy Lifestyle" className="rounded-[2rem] object-cover h-[35vh] min-h-[300px] w-full shadow-2xl border-[6px] border-white/80" />
              <div className="absolute top-4 -left-2 bg-white/95 p-2.5 rounded-2xl shadow-lg border border-[#e1e6e2] flex items-center gap-2">
                <div className="bg-[#E8F0EA] p-1.5 rounded-xl text-[#3A5A40]"><CheckCircle2 size={16} strokeWidth={2.5} /></div>
                <div><p className="text-[11px] font-black text-[#1a241d]">Clinical Protocol</p></div>
              </div>
              <div className="absolute bottom-6 -right-2 bg-white/95 p-2.5 rounded-2xl shadow-lg border border-[#e1e6e2] flex items-center gap-2">
                <div className="bg-orange-50 p-1.5 rounded-xl text-orange-500"><Star size={16} fill="currentColor" /></div>
                <div><p className="text-[11px] font-black text-[#1a241d]">4.9/5 Rating</p></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. TRUST BANNER */}
      <div className="border-y border-[#d1dcd5] bg-[#f2f4ef] py-10 animate-on-scroll">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between opacity-80 grayscale hover:grayscale-0 transition-all duration-700 gap-6 md:gap-0">
          <p className="font-black text-sm tracking-widest uppercase text-[#5C7362]">Trusted Clinic Partners:</p>
          <div className="flex flex-wrap justify-center gap-14 font-serif font-bold text-2xl text-[#8d9e92]">
            <span className="hover:text-[#3A5A40] transition-colors cursor-default">Apollo Health</span>
            <span className="hover:text-[#3A5A40] transition-colors cursor-default">CareFit</span>
            <span className="hover:text-[#3A5A40] transition-colors cursor-default">Medanta</span>
            <span className="hover:text-[#3A5A40] transition-colors cursor-default">NutriGen</span>
          </div>
        </div>
      </div>

      {/* 4. ABOUT US & VISION */}
      <section id="about" className="py-32 border-b border-[#EBE9E0] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#E4EBE6]/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 animate-on-scroll">
            <h2 className="text-5xl font-black text-[#1a241d] mb-6 leading-[1.1] tracking-tighter">Digitizing clinics for <br/><span className="text-[#3A5A40]">preventive healthcare.</span></h2>
            <p className="text-[#5C7362] leading-relaxed text-lg mb-6 font-medium">
              {clinicName} is a comprehensive digital nutrition clinic management platform. We are digitizing the complete workflow of modern nutrition clinics—moving away from fragmented paper records into a unified, secure system.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-10 rounded-[2rem] shadow-sm border border-[#CFDACF] hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 animate-on-scroll" style={{ transitionDelay: '100ms' }}>
              <div className="bg-[#E8F0EA] w-16 h-16 rounded-2xl flex items-center justify-center text-[#3A5A40] mb-8 shadow-sm"><Eye size={32} strokeWidth={2.5} /></div>
              <h3 className="text-2xl font-black text-[#1a241d] mb-3 tracking-tight">Our Vision</h3>
              <p className="text-[#5C7362] leading-relaxed font-medium">Making clinical, evidence-based personalized nutrition accessible, intelligent, and completely digitized.</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-10 rounded-[2rem] shadow-sm border border-[#CFDACF] hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 animate-on-scroll" style={{ transitionDelay: '200ms' }}>
              <div className="bg-[#E8F0EA] w-16 h-16 rounded-2xl flex items-center justify-center text-[#3A5A40] mb-8 shadow-sm"><Target size={32} strokeWidth={2.5} /></div>
              <h3 className="text-2xl font-black text-[#1a241d] mb-3 tracking-tight">Our Mission</h3>
              <p className="text-[#5C7362] leading-relaxed font-medium">Empowering certified nutritionists to deliver individualized care plans securely and efficiently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURES 6-GRID */}
      <section id="features" className="py-32 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20 animate-on-scroll">
          <h2 className="text-5xl font-black text-[#1a241d] mb-5 tracking-tighter">A holistic approach to health</h2>
          <p className="text-[#5C7362] text-xl font-medium">Everything you need for lasting, evidence-based results.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {[
            { icon: <Activity size={28} strokeWidth={2.5}/>, title: "Clinical Assessment", desc: "Comprehensive dietary evaluation and metabolic profiling." },
            { icon: <Apple size={28} strokeWidth={2.5}/>, title: "Bespoke Nutrition", desc: "No generic templates. 100% personalized meal strategies." },
            { icon: <BarChart3 size={28} strokeWidth={2.5}/>, title: "Progress Analytics", desc: "Intuitive dashboards mapping your exact biometric progress." },
            { icon: <Bot size={28} strokeWidth={2.5}/>, title: "AI Assistant", desc: "LLM-powered chatbot for recipe ideas and wellness tips." },
            { icon: <Calendar size={28} strokeWidth={2.5}/>, title: "Easy Scheduling", desc: "Book online or in-person clinical consultations instantly." },
            { icon: <Bell size={28} strokeWidth={2.5}/>, title: "Smart Reminders", desc: "Never miss a follow-up with automated appointment alerts." }
          ].map((feat, i) => (
            <div key={i} className="bg-white border border-[#CFDACF] p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-on-scroll" style={{ transitionDelay: `${(i % 3) * 100}ms` }}>
              <div className="bg-[#E8F0EA] w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-[#3A5A40] shadow-sm">{feat.icon}</div>
              <h3 className="text-xl font-black mb-3 text-[#1a241d] tracking-tight">{feat.title}</h3>
              <p className="text-[#5C7362] leading-relaxed font-medium">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. HOW IT WORKS (4 Steps) */}
      <section id="how-it-works" className="bg-[#162219] text-white py-32 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#3A5A40]/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24 animate-on-scroll">
            <h2 className="text-5xl font-black mb-5 text-white tracking-tighter">How Healora Works</h2>
            <p className="text-[#899c8f] text-xl font-medium">Four simple steps to transform your health with clinical guidance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-10 left-1/2 -translate-x-1/2 w-[70%] h-[3px] bg-gradient-to-r from-transparent via-[#3A5A40] to-transparent z-0 opacity-40"></div>

            {[
              { step: 1, title: 'Create Account', desc: 'Sign up and build your clinical health profile securely.' },
              { step: 2, title: 'Book Consultation', desc: 'Schedule an Online Video Call or In-Clinic visit.' },
              { step: 3, title: 'Receive Diet Plan', desc: 'Get a customized meal and lifestyle plan from your doctor.' },
              { step: 4, title: 'Track & Achieve', desc: 'Log your daily progress and upload lab reports to your vault.' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-6 relative z-10 animate-on-scroll" style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="bg-[#3A5A40] text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto font-black text-3xl shadow-[0_0_30px_rgba(58,90,64,0.4)] border-[6px] border-[#162219] transform transition-transform duration-300 hover:scale-110">
                  {item.step}
                </div>
                <h3 className="font-black text-xl text-white tracking-tight">{item.title}</h3>
                <p className="text-[15px] text-[#899c8f] leading-relaxed max-w-[220px] mx-auto font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🌟 7. EXPANDED 6-PROGRAM CARDS (3-COLUMN GRID) 🌟 */}
      <section id="programs" className="py-20 bg-[#f0f2eb] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4 animate-on-scroll">
            <div className="max-w-2xl">
              <h2 className="text-3xl lg:text-4xl font-black text-[#1a241d] tracking-tighter leading-tight">Specialized Care Plans.</h2>
              <p className="text-[#5C7362] mt-3 text-base font-medium">Select a dedicated protocol managed by clinical specialists to start your tailored wellness journey.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((prog, idx) => (
              <div 
                key={prog.id} 
                onClick={() => navigate(isLoggedIn ? '/book-consultation' : `/signup?program=${prog.id}`)} 
                className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer h-[320px] sm:h-[340px] animate-on-scroll transform hover:-translate-y-1.5"
                style={{ transitionDelay: `${(idx % 3) * 100}ms` }}
              >
                {/* Background Image with Zoom on Hover */}
                <img 
                  src={prog.img} 
                  alt={prog.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" 
                />
                
                {/* Dark Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111a14]/90 via-[#111a14]/30 to-transparent transition-opacity duration-500" />
                
                {/* Content Container */}
                <div className="absolute bottom-0 left-0 p-6 w-full flex flex-col items-start z-10">
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-4 leading-tight tracking-tight drop-shadow-md">
                    {prog.name.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
                  </h3>
                  
                  {/* Gray Translucent Button matching the exact aesthetic */}
                  <button className="bg-[#4d5746]/75 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold py-2 px-5 rounded-full flex items-center gap-2 group-hover:bg-white group-hover:text-[#1a241d] transition-colors duration-300 shadow-md">
                    {isLoggedIn ? 'Book' : 'Register'} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
      
      {/* 🌟 8. MASSIVE FOOTER WITH POLISHED NEWSLETTER 🌟 */}
      <footer className="bg-[#162219] text-white pt-28 pb-12 border-t border-[#162219]">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12 animate-on-scroll">
          
          {/* Polished Newsletter Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-24 border-b border-white/10 pb-20">
            <div className="max-w-2xl">
              <h3 className="text-4xl font-black mb-5 tracking-tight text-white">Subscribe to our wellness newsletter</h3>
              <p className="text-[#899c8f] text-lg leading-relaxed font-medium">Get the latest evidence-based nutrition tips and clinical insights delivered directly to your inbox.</p>
            </div>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full lg:w-auto gap-4 relative">
              <input 
                type="email" 
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address" 
                className="bg-[#1D2B21] border border-[#2B4031] text-white rounded-full px-7 py-4 outline-none focus:border-[#3A5A40] focus:ring-1 focus:ring-[#3A5A40] transition-all text-base w-full sm:w-[360px] shadow-inner placeholder:text-[#5a6e60] font-medium" 
              />
              <button type="submit" className="bg-[#3A5A40] hover:bg-[#2C4430] text-white px-9 py-4 rounded-full font-bold text-base transition-all shadow-[0_0_25px_rgba(58,90,64,0.3)] shrink-0 transform hover:-translate-y-0.5 tracking-wide">
                {subscribed ? 'Subscribed!' : 'Subscribe Today'}
              </button>
            </form>
          </div>

          {/* Main Footer Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="bg-[#3A5A40] rounded-xl p-2.5 shadow-sm"><Leaf size={28} strokeWidth={2.5}/></div>
                <span className="text-4xl font-black tracking-tighter">{clinicName}</span>
              </div>
              <p className="text-[#899c8f] max-w-sm leading-relaxed text-[15px] mb-10 font-medium">
                Taking the guesswork out of nutrition. A complete digital clinic platform bringing expert guidance and wellness tracking tools together securely.
              </p>
              <div className="flex gap-8 font-bold text-[15px] text-[#899c8f]">
                <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-2"><Globe size={18} /> Global Site</span>
                <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-2"><Share2 size={18} /> Social Hub</span>
                <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-2"><MessageCircle size={18} /> Community</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-black text-lg mb-8 text-white tracking-wide">Company</h4>
              <ul className="space-y-5 text-[#899c8f] font-semibold text-[15px]">
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform inline-block">About Us</li>
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform inline-block">Our Experts</li>
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform inline-block">Careers</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-lg mb-8 text-white tracking-wide">Platform</h4>
              <ul className="space-y-5 text-[#899c8f] font-semibold text-[15px]">
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform inline-block" onClick={() => navigate('/signin')}>Patient Portal</li>
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform inline-block" onClick={() => navigate('/signin')}>Nutritionist Login</li>
                <li className="hover:text-white cursor-pointer transition-colors hover:translate-x-1 transform inline-block" onClick={() => navigate('/signin')}>Clinic Manager</li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-lg mb-8 text-white tracking-wide">Contact</h4>
              <ul className="space-y-5 text-[#899c8f] font-semibold text-[15px]">
                <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer"><Mail size={18} className="text-[#3A5A40]" /> {clinicEmail}</li>
                <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer"><Phone size={18} className="text-[#3A5A40]" /> {clinicPhone}</li>
                <li className="flex items-start gap-3 leading-relaxed hover:text-white transition-colors cursor-pointer">
                  <MapPin size={20} className="text-[#3A5A40] shrink-0 mt-0.5" /> 
                  {clinicAddress}
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center text-sm font-bold text-[#899c8f]">
            <p>© 2026 {clinicName}. Built for your health.</p>
            <div className="flex gap-10 mt-6 md:mt-0">
              <span className="hover:text-white cursor-pointer transition-colors flex items-center gap-2"><ShieldCheck size={16}/> Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 🌟 CUSTOM ANIMATION STYLES 🌟 */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Advanced Staggered Fade Up */
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-slide-up-1 { opacity: 0; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; }
        .animate-slide-up-2 { opacity: 0; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; }
        .animate-slide-up-3 { opacity: 0; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; }
        .animate-slide-up-4 { opacity: 0; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; }
        .animate-slide-up-5 { opacity: 0; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards; }
        .animate-slide-up-6 { opacity: 0; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; }
        
        /* Desktop Bleed Image Slide In */
        @keyframes slideInRight { from { opacity: 0; transform: translateX(15%); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-right { opacity: 0; animation: slideInRight 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; }

        /* Continuous Floating Animations */
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
        @keyframes floatSlow { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-floatSlow { animation: floatSlow 6s ease-in-out infinite; }
        
        /* Slow Pulse for badges */
        @keyframes pulseSlow { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        .animate-pulse-slow { animation: pulseSlow 3s ease-in-out infinite; }

        /* Dynamic Background Blobs */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }

        /* Scroll-Triggered Observer Classes */
        .animate-on-scroll { 
          opacity: 0; 
          transform: translateY(40px); 
          transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
        }
        .animate-on-scroll.is-visible { 
          opacity: 1; 
          transform: translateY(0); 
        }
      `}} />
    </div>
  );
};

export default LandingPage;