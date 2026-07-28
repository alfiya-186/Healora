import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center min-h-[calc(100vh-80px)]">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 bg-[#e0f2f1] text-[#0ba396] px-4 py-2 rounded-full text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#0ba396]"></span>
          AI-POWERED NUTRITION CARE
        </div>
        
        <h1 className="text-6xl font-extrabold text-gray-900 leading-tight">
          Your Journey to <br />
          <span className="text-[#0ba396]">Better Nutrition</span> <br />
          Starts Here
        </h1>
        
        <p className="text-xl text-gray-500 max-w-md">
          Healora connects you with certified nutritionists, personalized care plans, and intelligent wellness tracking — all in one platform.
        </p>
        
        <div className="flex gap-4 pt-4">
          <Link to="/signup" className="px-6 py-3 bg-[#0ba396] text-white rounded-md font-medium text-lg hover:bg-teal-600 transition">
            Get Started Free
          </Link>
          <Link to="/book" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium text-lg hover:bg-gray-50 transition">
            Book Consultation
          </Link>
        </div>
      </div>

      <div className="relative">
        <img 
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80" 
          alt="Healthy Food" 
          className="rounded-3xl shadow-xl w-full h-[500px] object-cover"
        />
        <div className="absolute -bottom-6 left-8 bg-white p-4 rounded-xl shadow-lg flex items-center gap-4">
          <div className="bg-[#e0f2f1] p-3 rounded-lg">
            <TrendingUp className="text-[#0ba396] w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Wellness Score</p>
            <p className="text-sm text-gray-500">Up 24% this month</p>
          </div>
        </div>
      </div>
    </div>
  );
}