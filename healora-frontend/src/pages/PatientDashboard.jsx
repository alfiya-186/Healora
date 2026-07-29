import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Activity, Apple, LogOut, PlusSquare, 
  TrendingUp, Clock, FileText, Droplets, Footprints, 
  Moon, CheckCircle2, ChevronRight, Upload, Video
} from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  
  // Interactive state for the water tracker!
  const [waterGlasses, setWaterGlasses] = useState(3);
  const [meals, setMeals] = useState([
    { id: 1, name: 'Breakfast', food: 'Oatmeal with berries & nuts', calories: 350, done: true },
    { id: 2, name: 'Mid-Morning', food: 'Green Tea & Almonds', calories: 120, done: true },
    { id: 3, name: 'Lunch', food: 'Grilled chicken salad', calories: 450, done: false },
    { id: 4, name: 'Dinner', food: 'Baked salmon with quinoa', calories: 500, done: false },
  ]);

  const toggleMeal = (id) => {
    setMeals(meals.map(meal => meal.id === id ? { ...meal, done: !meal.done } : meal));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col hidden lg:flex shadow-sm z-10">
        <div className="p-6 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-[#0ba396] text-white rounded-xl p-1.5 shadow-md shadow-teal-200">
            <PlusSquare size={26} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight">Heal<span className="text-[#0ba396]">ora</span></span>
        </div>
        
        <nav className="flex-1 px-4 mt-6 space-y-2 font-medium">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#0ba396] bg-teal-50 rounded-xl transition">
            <Activity size={20} /> Dashboard Overview
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition">
            <Apple size={20} /> My Diet Plan
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition">
            <TrendingUp size={20} /> Daily Tracking
          </button>
          
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-8">Clinic</p>
          <button onClick={() => navigate('/book-consultation')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition">
            <Calendar size={20} /> Consultations
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition">
            <FileText size={20} /> Health Vault
          </button>
        </nav>

        <div className="p-6 border-t border-gray-100">
          <button onClick={() => navigate('/signin')} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              
              <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Hello, Alfiya! 👋</h1>
              <p className="text-gray-500 mt-1">Track your daily wellness and manage your clinic appointments.</p>
            </div>
            <button 
              onClick={() => navigate('/book-consultation')}
              className="bg-[#0ba396] text-white px-6 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-teal-700 shadow-lg shadow-teal-200 transition transform hover:-translate-y-0.5"
            >
              <Calendar size={20} /> Book Consultation
            </button>
          </div>

          {/* Phase 1 Module 3: Daily Wellness Tracking (4 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Calories Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-100 p-3 rounded-2xl text-orange-500"><Apple size={24} /></div>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Goal: 1800</span>
              </div>
              <h3 className="text-gray-500 font-medium mb-1">Calories Consumed</h3>
              <p className="text-3xl font-extrabold text-gray-900">1,250 <span className="text-sm font-medium text-gray-400">kcal</span></p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
                <div className="bg-orange-400 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>

            {/* Water Interactive Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-500"><Droplets size={24} /></div>
                <button 
                  onClick={() => setWaterGlasses(w => w < 8 ? w + 1 : w)}
                  className="text-xs font-bold text-[#0ba396] bg-teal-50 px-3 py-1 rounded-lg hover:bg-teal-100 transition"
                >
                  + Add Glass
                </button>
              </div>
              <h3 className="text-gray-500 font-medium mb-1">Water Intake</h3>
              <p className="text-3xl font-extrabold text-gray-900">{waterGlasses} <span className="text-sm font-medium text-gray-400">/ 8 glasses</span></p>
              <div className="flex gap-1 mt-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i < waterGlasses ? 'bg-blue-400' : 'bg-gray-100'}`}></div>
                ))}
              </div>
            </div>

            {/* Steps Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-green-100 p-3 rounded-2xl text-green-600"><Footprints size={24} /></div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">On Track!</span>
              </div>
              <h3 className="text-gray-500 font-medium mb-1">Steps Walked</h3>
              <p className="text-3xl font-extrabold text-gray-900">6,430 <span className="text-sm font-medium text-gray-400">/ 10k</span></p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>

            {/* Sleep Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-100 p-3 rounded-2xl text-purple-600"><Moon size={24} /></div>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Goal: 8h</span>
              </div>
              <h3 className="text-gray-500 font-medium mb-1">Sleep Last Night</h3>
              <p className="text-3xl font-extrabold text-gray-900">7h 15m</p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>

          </div>

          {/* Middle Section: Diet Plan & Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Phase 1 Module 2: Diet Plan Tracker */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Today's Diet Plan</h2>
                  <p className="text-sm text-gray-500">PCOS Management Plan</p>
                </div>
                <div className="text-[#0ba396] bg-teal-50 px-3 py-1.5 rounded-xl font-bold text-sm">
                  {meals.filter(m => m.done).length} / 4 Meals
                </div>
              </div>

              <div className="space-y-3">
                {meals.map((meal) => (
                  <div 
                    key={meal.id} 
                    onClick={() => toggleMeal(meal.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${meal.done ? 'bg-teal-50/50 border-[#0ba396]' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={meal.done ? 'text-[#0ba396]' : 'text-gray-300'}>
                        <CheckCircle2 size={24} fill={meal.done ? '#0ba396' : 'none'} color={meal.done ? 'white' : 'currentColor'} />
                      </div>
                      <div>
                        <p className={`font-bold ${meal.done ? 'text-[#0ba396]' : 'text-gray-900'}`}>{meal.name}</p>
                        <p className="text-sm text-gray-500">{meal.food}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-400">{meal.calories} kcal</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Vault & Upcoming Appointment */}
            <div className="space-y-6 flex flex-col">
              
              {/* Upcoming Appointment Banner */}
              <div className="bg-gray-900 rounded-3xl shadow-lg p-6 sm:p-8 text-white relative overflow-hidden flex-1 flex flex-col justify-center">
                <div className="absolute -right-10 -top-10 opacity-10"><Calendar size={150} /></div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4 w-max backdrop-blur-sm">
                  <Video size={14} /> UPCOMING ONLINE CONSULTATION
                </div>
                <h2 className="text-2xl font-bold mb-1">Dr. Sarah Jenkins</h2>
                <p className="text-gray-400 text-sm mb-6">Senior Nutritionist • Tomorrow at 10:00 AM</p>
                <div className="flex gap-3">
                  <button className="bg-[#0ba396] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-teal-500 transition">
                    Join Video Call
                  </button>
                  <button className="bg-gray-800 border border-gray-700 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-gray-700 transition">
                    Reschedule
                  </button>
                </div>
              </div>

              {/* Phase 1 Module 1: Health Document Vault */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">Health Vault</h2>
                    <p className="text-sm text-gray-500">2 Lab reports • 1 Prescription</p>
                  </div>
                </div>
                <button className="text-[#0ba396] bg-teal-50 p-3 rounded-full hover:bg-teal-100 transition">
                  <Upload size={20} />
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;