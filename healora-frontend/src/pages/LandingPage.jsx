import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Apple, BarChart3, Bot, Calendar, Bell, 
  ArrowRight, TrendingUp, Star, PlusSquare 
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      <nav className="flex justify-between items-center px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-teal-500 text-white rounded-md p-1">
            <PlusSquare size={24} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight">Heal<span className="text-teal-500">ora</span></span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/signin')} className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-50 transition">
            Sign In
          </button>
          <button onClick={() => navigate('/signup')} className="px-5 py-2 text-sm font-medium bg-teal-500 text-white rounded-full hover:bg-teal-600 transition">
            Get Started
          </button>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-8 pt-12 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs font-semibold mb-6">
            <span className="text-base">✨</span> AI-POWERED NUTRITION CARE
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-gray-900">
            Your Journey to <br />
            <span className="text-teal-500">Better Nutrition</span> <br />
            Starts Here
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-md">
            Healora connects you with certified nutritionists, personalized care plans, and intelligent wellness tracking — all in one platform.
          </p>
          
          <div className="flex gap-4 mb-12">
            <button onClick={() => navigate('/signup')} className="px-6 py-3 bg-teal-500 text-white font-medium rounded-full hover:bg-teal-600 transition">
              Get Started Free
            </button>
            <button onClick={() => navigate('/signin')} className="px-6 py-3 border border-gray-300 font-medium rounded-full hover:bg-gray-50 transition">
              Book Consultation
            </button>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div><h4 className="text-xl font-bold">2,400+</h4><p className="text-xs text-gray-500 mt-1">Patients Helped</p></div>
            <div><h4 className="text-xl font-bold">98%</h4><p className="text-xs text-gray-500 mt-1">Satisfaction Rate</p></div>
            <div><h4 className="text-xl font-bold">15+</h4><p className="text-xs text-gray-500 mt-1">Wellness Programs</p></div>
            <div>
              <h4 className="text-xl font-bold flex items-center gap-1">4.9<Star size={16} fill="currentColor" className="text-yellow-400" /></h4>
              <p className="text-xs text-gray-500 mt-1">Average Rating</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Healthy Bowl" className="rounded-[2rem] object-cover h-[450px] w-full shadow-lg" />
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-500"><TrendingUp size={24} /></div>
            <div><p className="text-sm font-bold">Wellness Score</p><p className="text-xs text-gray-500">Up 24% this month</p></div>
          </div>
        </div>
      </section>

      <div className="bg-teal-50 py-6 border-y border-teal-100">
        <div className="max-w-7xl mx-auto px-8 flex items-center gap-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <span className="text-sm font-bold text-gray-700 mr-2">Programs:</span>
          {['Weight Loss', 'Diabetes Care', 'PCOS Management', 'Hypertension', 'Pregnancy Nutrition', 'Sports Nutrition'].map((prog) => (
            <span key={prog} className="px-4 py-1.5 bg-white border border-teal-200 text-teal-700 text-sm rounded-full shadow-sm">{prog}</span>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-8 py-24 text-center">
        <h2 className="text-4xl font-extrabold mb-4">Everything you need for nutrition wellness</h2>
        <p className="text-gray-500 mb-16">From assessment to care plan to long-term tracking</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          <div className="border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="bg-teal-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-teal-600"><Activity size={24} /></div>
            <h3 className="text-lg font-bold mb-2">Nutrition Assessment</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Comprehensive BMI, BMR, and dietary assessment with personalized diagnosis.</p>
          </div>
          <div className="border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-green-600"><Apple size={24} /></div>
            <h3 className="text-lg font-bold mb-2">Custom Meal Plans</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Tailored weekly meal plans designed by certified nutritionists for your goals.</p>
          </div>
          <div className="border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-blue-600"><BarChart3 size={24} /></div>
            <h3 className="text-lg font-bold mb-2">Progress Tracking</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Monitor weight, mood, sleep, and compliance with intuitive wellness dashboards.</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 pb-24">
        <div className="bg-[#0ba396] rounded-3xl p-12 flex flex-col md:flex-row items-center justify-between shadow-lg">
          <div className="text-white mb-6 md:mb-0">
            <h2 className="text-3xl font-bold mb-2">Start your wellness journey today</h2>
            <p className="text-teal-100">Join 2,400+ patients already transforming their health with Healora.</p>
          </div>
          <button onClick={() => navigate('/signup')} className="bg-white text-[#0ba396] px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-50 transition whitespace-nowrap">
            Create Free Account <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};
export default LandingPage;