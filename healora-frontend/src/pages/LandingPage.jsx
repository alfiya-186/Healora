import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusSquare, ArrowRight, ShieldCheck, TrendingUp, 
  HeartPulse, UserCheck, Leaf, Target, Eye 
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

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
      
      {/* 1. WORKING NAVBAR */}
      <header className="sticky top-0 bg-[#FDFCF8]/95 backdrop-blur-md z-50 border-b border-[#EBE9E0]">
        <nav className="flex justify-between items-center px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <div className="bg-[#456A50] text-white rounded-lg p-1.5"><Leaf size={22} /></div>
              <span className="text-2xl font-bold tracking-tight">Heal<span className="text-[#456A50]">ora</span></span>
            </div>
            {/* Smooth Scroll Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#5A6B60]">
              <a href="#about" className="hover:text-[#456A50] transition">About Us</a>
              <a href="#vision" className="hover:text-[#456A50] transition">Vision & Mission</a>
              <a href="#programs" className="hover:text-[#456A50] transition">Programs</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button onClick={handleDashboardRedirect} className="px-5 py-2 text-sm font-bold bg-[#456A50] text-white rounded-full hover:bg-[#35533E] transition">Go to Dashboard</button>
            ) : (
              <>
                <button onClick={() => navigate('/signin')} className="px-5 py-2 text-sm font-bold border border-[#EBE9E0] rounded-full hover:bg-white transition text-[#1C2C22]">Log In</button>
                <button onClick={() => navigate('/signup')} className="px-5 py-2 text-sm font-bold bg-[#456A50] text-white rounded-full hover:bg-[#35533E] transition">Get Started</button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF0EC] text-[#456A50] text-xs font-bold mb-6">
            <ShieldCheck size={14} /> CLINICAL PREVENTIVE HEALTHCARE
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight mb-6">
            Evidence-based wellness, <br /><span className="text-[#456A50] font-serif italic font-normal">tailored to your biology.</span>
          </h1>
          <p className="text-[#5A6B60] text-lg mb-10 max-w-md">
            Connect with certified nutritionists, receive individualized care plans, and monitor your clinical progress in one secure platform.
          </p>
          <button onClick={() => navigate('/signup')} className="px-8 py-3.5 bg-[#456A50] text-white font-bold rounded-full hover:bg-[#35533E] shadow-xl shadow-[#456A50]/20 transition flex items-center gap-2">
            Start Your Journey <ArrowRight size={18} />
          </button>
        </div>
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=80" alt="Healthy Food" className="rounded-t-full rounded-b-[3rem] object-cover h-[500px] w-full shadow-2xl border-8 border-white" />
        </div>
      </section>

      {/* 3. ABOUT US SECTION */}
      <section id="about" className="bg-[#EBE9E0]/30 py-20 border-y border-[#EBE9E0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center max-w-3xl">
          <h2 className="text-3xl font-extrabold text-[#1C2C22] mb-6">About Healora</h2>
          <p className="text-[#5A6B60] leading-relaxed text-lg">
            Healora is a comprehensive digital nutrition clinic management platform. We are digitizing the complete workflow of modern nutrition clinics—moving away from fragmented paper records into a unified, secure PostgreSQL-backed system. We combine patient profiling, document vaults, and clinical consultations into one seamless experience.
          </p>
        </div>
      </section>

      {/* 4. VISION & MISSION SECTION */}
      <section id="vision" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-[#EBE9E0] hover:shadow-lg transition">
          <div className="bg-[#EAF0EC] w-14 h-14 rounded-2xl flex items-center justify-center text-[#456A50] mb-6">
            <Eye size={28} />
          </div>
          <h3 className="text-2xl font-bold text-[#1C2C22] mb-4">Our Vision</h3>
          <p className="text-[#5A6B60] leading-relaxed">
            To revolutionize preventive healthcare globally by making clinical, evidence-based personalized nutrition accessible, intelligent, and completely digitized for both patients and healthcare providers.
          </p>
        </div>
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-[#EBE9E0] hover:shadow-lg transition">
          <div className="bg-[#EAF0EC] w-14 h-14 rounded-2xl flex items-center justify-center text-[#456A50] mb-6">
            <Target size={28} />
          </div>
          <h3 className="text-2xl font-bold text-[#1C2C22] mb-4">Our Mission</h3>
          <p className="text-[#5A6B60] leading-relaxed">
            To provide a secure, seamless platform that empowers certified nutritionists to deliver individualized care plans, while giving patients the tools to effortlessly track their wellness goals and manage their health records.
          </p>
        </div>
      </section>

      {/* 5. PROGRAM CARDS SECTION */}
      <section id="programs" className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-[#1C2C22]">Specialized Clinical Programs</h2>
          <p className="text-[#5A6B60] mt-2 text-sm">Select a program to start your tailored wellness journey.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((prog) => (
            <div key={prog.id} onClick={() => navigate(`/signup?program=${prog.id}`)} className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer h-72">
              <img src={prog.img} alt={prog.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C2C22] via-[#1C2C22]/40 to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h3 className="text-xl font-bold text-white mb-2">{prog.name}</h3>
                <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 group-hover:bg-[#456A50] group-hover:border-[#456A50] transition">
                  Register Now <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="py-8 text-center text-xs text-gray-500 border-t border-[#EBE9E0]">
        <p>© 2026 Healora Wellness. Secure, PostgreSQL-backed HIPAA compliant platform.</p>
      </footer>
    </div>
  );
};

export default LandingPage;