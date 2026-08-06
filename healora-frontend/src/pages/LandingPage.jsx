import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusSquare, ArrowRight, ShieldCheck, HeartPulse, UserCheck, 
  Leaf, Target, Eye, Activity, Apple, BarChart3, Bot, Calendar, Bell 
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const isLoggedIn = !!localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardRedirect = () => {
    navigate(userRole === 'NUTRITIONIST' ? '/nutritionist-dashboard' : '/patient-dashboard');
  };

  const programs = [
    { id: 'weight-loss', name: 'Weight Management', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80' },
    { id: 'pcos', name: 'PCOS Care', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80' },
    { id: 'diabetes', name: 'Diabetes Reversal', img: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=500&q=80' },
    { id: 'pregnancy', name: 'Pregnancy Nutrition', img: 'https://images.unsplash.com/photo-1555243896-c709bfa0b564?auto=format&fit=crop&w=500&q=80' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-[#1C2C22] scroll-smooth">
      
      {/* 1. FIXED NAVBAR (Hovering on top) */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#FDFCF8]/95 backdrop-blur-md shadow-sm py-3 border-b border-[#EBE9E0]' : 'bg-transparent py-4'}`}>
        <nav className="flex justify-between items-center px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <div className="bg-[#456A50] text-white rounded-lg p-1.5 shadow-md"><Leaf size={20} /></div>
              <span className="text-xl font-bold tracking-tight">Heal<span className="text-[#456A50]">ora</span></span>
            </div>
            {/* Smooth Scroll Links */}
            <div className="hidden md:flex items-center gap-6 text-[13px] font-bold text-[#5A6B60]">
              <a href="#about" className="hover:text-[#456A50] transition">About Us</a>
              <a href="#features" className="hover:text-[#456A50] transition">Features</a>
              <a href="#how-it-works" className="hover:text-[#456A50] transition">How it Works</a>
              <a href="#programs" className="hover:text-[#456A50] transition">Programs</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button onClick={handleDashboardRedirect} className="px-5 py-2 text-sm font-bold bg-[#456A50] text-white rounded-full hover:bg-[#35533E] shadow-md transition">Go to Dashboard</button>
            ) : (
              <>
                <button onClick={() => navigate('/signin')} className="px-5 py-2 text-sm font-bold border border-[#EBE9E0] rounded-full hover:bg-white transition text-[#1C2C22]">Log In</button>
                <button onClick={() => navigate('/signup')} className="px-6 py-2 text-sm font-bold bg-[#456A50] text-white rounded-full hover:bg-[#35533E] shadow-md transition transform hover:-translate-y-0.5">Get Started</button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* 2. HERO SECTION - FITS PERFECTLY IN ONE VIEW (100vh) */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 h-screen min-h-[600px] flex items-center pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
          
          {/* Left Text Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF0EC] text-[#456A50] text-[10px] font-extrabold tracking-widest uppercase">
              <ShieldCheck size={14} /> Clinical Preventive Healthcare
            </div>
            
            <h1 className="text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#1C2C22]">
              Evidence-based wellness, <br />
              <span className="text-[#456A50] font-serif italic font-normal">tailored to your biology.</span>
            </h1>
            
            <p className="text-[#5A6B60] text-base lg:text-lg max-w-md leading-relaxed">
              Connect with certified nutritionists, receive individualized care plans, and monitor your clinical progress in one secure platform.
            </p>
            
            <div className="pt-2">
              <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-[#1C2C22] text-white font-bold rounded-full hover:bg-[#456A50] shadow-xl shadow-[#1C2C22]/20 transition flex items-center gap-2 group w-max">
                Start Your Journey <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Image Content - SCALED TO FIT SCREEN */}
          <div className="relative h-[55vh] lg:h-[75vh] w-full hidden md:block mt-8 lg:mt-0">
            <img 
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=80" 
              alt="Healthy Food" 
              className="absolute inset-0 w-full h-full object-cover rounded-t-[10rem] rounded-b-[2.5rem] shadow-2xl shadow-[#1C2C22]/10 border-8 border-white" 
            />
          </div>
          
        </div>
      </section>

      {/* 3. ABOUT US & VISION */}
      <section id="about" className="bg-[#EBE9E0]/30 py-24 border-y border-[#EBE9E0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-4xl font-extrabold text-[#1C2C22] mb-6">Digitizing clinics for <br/>preventive healthcare.</h2>
            <p className="text-[#5A6B60] leading-relaxed text-lg mb-6">
              Healora is a comprehensive digital nutrition clinic management platform. We are digitizing the complete workflow of modern nutrition clinics—moving away from fragmented paper records into a unified, secure PostgreSQL-backed system.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EBE9E0] hover:shadow-md transition">
              <div className="bg-[#EAF0EC] w-14 h-14 rounded-2xl flex items-center justify-center text-[#456A50] mb-6"><Eye size={28} /></div>
              <h3 className="text-xl font-bold text-[#1C2C22] mb-3">Our Vision</h3>
              <p className="text-[#5A6B60] text-sm leading-relaxed">Making clinical, evidence-based personalized nutrition accessible, intelligent, and completely digitized.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EBE9E0] hover:shadow-md transition">
              <div className="bg-[#EAF0EC] w-14 h-14 rounded-2xl flex items-center justify-center text-[#456A50] mb-6"><Target size={28} /></div>
              <h3 className="text-xl font-bold text-[#1C2C22] mb-3">Our Mission</h3>
              <p className="text-[#5A6B60] text-sm leading-relaxed">Empowering certified nutritionists to deliver individualized care plans securely and efficiently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES 6-GRID */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-[#1C2C22] mb-4">A holistic approach to your health</h2>
          <p className="text-[#5A6B60]">Everything you need for lasting, evidence-based results.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {[
            { icon: <Activity />, title: "Clinical Assessment", desc: "Comprehensive dietary evaluation and metabolic profiling." },
            { icon: <Apple />, title: "Bespoke Nutrition", desc: "No generic templates. 100% personalized meal strategies." },
            { icon: <BarChart3 />, title: "Progress Analytics", desc: "Intuitive dashboards mapping your exact biometric progress." },
            { icon: <Bot />, title: "AI Assistant", desc: "LLM-powered chatbot for recipe ideas and wellness tips." },
            { icon: <Calendar />, title: "Easy Scheduling", desc: "Book online or in-person clinical consultations instantly." },
            { icon: <Bell />, title: "Smart Reminders", desc: "Never miss a follow-up with automated appointment alerts." }
          ].map((feat, i) => (
            <div key={i} className="bg-white border border-[#EBE9E0] p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="bg-[#EAF0EC] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-[#456A50]">{feat.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-[#1C2C22]">{feat.title}</h3>
              <p className="text-sm text-[#5A6B60] leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#1C2C22] text-white py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">How Healora Works</h2>
            <p className="text-[#A4B3A8]">Four simple steps to transform your health with clinical guidance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center relative">
            <div className="space-y-4 relative z-10">
              <div className="bg-[#456A50] text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto font-bold text-xl shadow-lg border-4 border-[#1C2C22]">1</div>
              <h3 className="font-bold text-lg">Create Account</h3>
              <p className="text-sm text-[#A4B3A8] leading-relaxed">Sign up and build your clinical health profile securely.</p>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="bg-[#456A50] text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto font-bold text-xl shadow-lg border-4 border-[#1C2C22]">2</div>
              <h3 className="font-bold text-lg">Book Consultation</h3>
              <p className="text-sm text-[#A4B3A8] leading-relaxed">Schedule an Online Video Call or In-Clinic visit.</p>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="bg-[#456A50] text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto font-bold text-xl shadow-lg border-4 border-[#1C2C22]">3</div>
              <h3 className="font-bold text-lg">Receive Diet Plan</h3>
              <p className="text-sm text-[#A4B3A8] leading-relaxed">Get a customized meal and lifestyle plan from your doctor.</p>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="bg-[#456A50] text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto font-bold text-xl shadow-lg border-4 border-[#1C2C22]">4</div>
              <h3 className="font-bold text-lg">Track & Achieve</h3>
              <p className="text-sm text-[#A4B3A8] leading-relaxed">Log your daily progress and upload lab reports to your vault.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PROGRAM CARDS SECTION */}
      <section id="programs" className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-[#1C2C22]">Specialized Clinical Programs</h2>
          <p className="text-[#5A6B60] mt-3">Select a program to start your tailored wellness journey.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((prog) => (
            <div key={prog.id} onClick={() => navigate(`/signup?program=${prog.id}`)} className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer h-80">
              <img src={prog.img} alt={prog.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C2C22] via-[#1C2C22]/40 to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h3 className="text-xl font-bold text-white mb-3">{prog.name}</h3>
                <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold py-2.5 px-4 rounded-full w-max flex items-center gap-2 group-hover:bg-[#456A50] group-hover:border-[#456A50] transition">
                  Register Now <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* 7. MASSIVE FOOTER */}
      <footer className="bg-[#1C2C22] text-white pt-20 pb-10 border-t border-[#1C2C22]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-[#456A50] rounded-lg p-1.5"><Leaf size={24} /></div>
                <span className="text-3xl font-extrabold tracking-tight">Healora</span>
              </div>
              <p className="text-[#A4B3A8] max-w-sm leading-relaxed text-sm">
                Digitizing preventive healthcare. A comprehensive clinic management platform bringing expert nutritionists and patients together securely.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Platform</h4>
              <ul className="space-y-4 text-[#A4B3A8] font-medium text-sm">
                <li className="hover:text-white cursor-pointer transition">Patient Portal</li>
                <li className="hover:text-white cursor-pointer transition">Nutritionist Login</li>
                <li className="hover:text-white cursor-pointer transition">Clinic Manager</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Legal</h4>
              <ul className="space-y-4 text-[#A4B3A8] font-medium text-sm">
                <li className="hover:text-white cursor-pointer transition">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition">Terms of Service</li>
                <li className="hover:text-white cursor-pointer transition">HIPAA Compliance</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-[#A4B3A8]">
            <p>© 2026 Healora Wellness. Secure, PostgreSQL-backed platform.</p>
            <p className="mt-4 md:mt-0 flex items-center gap-2"><ShieldCheck size={16}/> Developed for MCA Project Phase 1.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;