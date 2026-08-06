import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Activity, LogOut, Search, 
  CheckCircle2, ChevronRight, Leaf, ArrowLeft, 
  ClipboardList, Stethoscope 
} from 'lucide-react';

const NutritionistDashboard = () => {
  const navigate = useNavigate();
  const doctorName = localStorage.getItem('user_name') || 'Dr. Sarah';

  const [patients] = useState([
    { id: 1, name: 'Alfiya Ismail', condition: 'PCOS Management', status: 'Active Plan', lastVisit: 'Yesterday' },
    { id: 2, name: 'Sneha Sharma', condition: 'Type 2 Diabetes', status: 'Pending Review', lastVisit: '3 days ago' },
    { id: 3, name: 'Sama Verma', condition: 'Weight Management', status: 'Active Plan', lastVisit: '1 week ago' },
  ]);

  return (
    <div className="min-h-screen flex bg-[#FDFCF8] font-sans text-[#1C2C22]">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-[#EBE9E0] flex flex-col hidden lg:flex shadow-sm z-10">
        <div className="p-8 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-[#456A50] text-white rounded-lg p-1.5"><Leaf size={24} /></div>
          <span className="text-2xl font-bold tracking-tight">Heal<span className="text-[#456A50]">ora</span></span>
          <span className="text-[9px] bg-[#EAF0EC] text-[#456A50] px-2 py-1 rounded-full font-extrabold ml-auto tracking-widest">CLINICIAN</span>
        </div>
        
        <nav className="flex-1 px-6 mt-4 space-y-2 font-medium">
          <p className="text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-3">Clinical Portal</p>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#456A50] bg-[#EAF0EC] rounded-xl font-bold transition">
            <Users size={18} /> Patient Directory
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#5A6B60] hover:bg-[#FDFCF8] rounded-xl transition">
            <Calendar size={18} /> Today's Schedule
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#5A6B60] hover:bg-[#FDFCF8] rounded-xl transition">
            <ClipboardList size={18} /> Diet Plan Creator
          </button>
        </nav>

        <div className="p-6 border-t border-[#EBE9E0]">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-700/80 hover:bg-red-50 rounded-xl font-bold transition">
            <LogOut size={18} /> Secure Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8">
          
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B60] hover:text-[#456A50] transition"><ArrowLeft size={16} /> Home</button>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EBE9E0] pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAF0EC] text-[#456A50] rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3 border border-[#456A50]/20">
                <Stethoscope size={14} /> Certified Nutritionist
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#1C2C22]">Welcome, {doctorName}.</h1>
              <p className="text-[#5A6B60] text-lg font-serif italic mt-2">Manage patient cases and clinical nutrition plans.</p>
            </div>
            <div className="bg-white border border-[#EBE9E0] px-5 py-3 rounded-2xl text-sm font-bold text-[#1C2C22] shadow-sm flex items-center gap-3">
              <Calendar size={18} className="text-[#456A50]" /> Today: 4 Consultations
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-[#EBE9E0] shadow-sm flex items-center gap-5 hover:shadow-md transition">
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Users size={28} /></div>
              <div>
                <p className="text-[11px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Assigned Patients</p>
                <p className="text-3xl font-extrabold text-[#1C2C22] mt-1">18</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-[#EBE9E0] shadow-sm flex items-center gap-5 hover:shadow-md transition">
              <div className="bg-orange-50 p-4 rounded-2xl text-orange-500"><ClipboardList size={28} /></div>
              <div>
                <p className="text-[11px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Pending Plans</p>
                <p className="text-3xl font-extrabold text-[#1C2C22] mt-1">3</p>
              </div>
            </div>
            <div className="bg-[#456A50] p-8 rounded-3xl shadow-lg shadow-[#456A50]/20 flex items-center gap-5 transform hover:-translate-y-1 transition">
              <div className="bg-white/20 p-4 rounded-2xl text-white"><Activity size={28} /></div>
              <div>
                <p className="text-[11px] font-extrabold text-teal-100 uppercase tracking-widest">Avg Compliance</p>
                <p className="text-3xl font-extrabold text-white mt-1">89%</p>
              </div>
            </div>
          </div>

          {/* Patient Management Table */}
          <div className="bg-white rounded-3xl border border-[#EBE9E0] shadow-sm overflow-hidden mt-8">
            <div className="p-8 border-b border-[#EBE9E0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FDFCF8]/50">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1C2C22]">Active Patient Directory</h2>
                <p className="text-sm text-[#5A6B60] mt-1">Select a patient to prepare an individualized Nutrition Care Plan.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-3.5 text-[#5A6B60]" size={18} />
                <input type="text" placeholder="Search patient name..." className="w-full bg-white border border-[#EBE9E0] rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-[#456A50] shadow-sm transition" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#1C2C22]">
                <thead className="bg-white text-[11px] font-extrabold text-[#5A6B60] uppercase tracking-widest border-b border-[#EBE9E0]">
                  <tr>
                    <th className="py-5 px-8">Patient Name</th>
                    <th className="py-5 px-8">Health Condition</th>
                    <th className="py-5 px-8">Status</th>
                    <th className="py-5 px-8">Last Consulted</th>
                    <th className="py-5 px-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE9E0]">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FDFCF8] transition-colors duration-200">
                      <td className="py-5 px-8 font-bold flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#EAF0EC] text-[#456A50] font-extrabold flex items-center justify-center text-sm border border-[#456A50]/20">
                          {p.name.charAt(0)}
                        </div>
                        {p.name}
                      </td>
                      <td className="py-5 px-8 font-medium text-[#5A6B60]">{p.condition}</td>
                      <td className="py-5 px-8">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${p.status === 'Active Plan' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                          {p.status === 'Active Plan' && <CheckCircle2 size={14} />}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-xs font-semibold text-[#5A6B60]">{p.lastVisit}</td>
                      <td className="py-5 px-8 text-right">
                        <button className="text-[#456A50] font-bold text-sm hover:underline inline-flex items-center gap-1 bg-[#EAF0EC] px-4 py-2 rounded-lg hover:bg-[#456A50] hover:text-white transition">
                          View Case <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default NutritionistDashboard;