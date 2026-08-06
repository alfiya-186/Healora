import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut, ShieldCheck, ArrowLeft, Database, Settings } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || 'Admin';

  return (
    <div className="min-h-screen flex bg-[#1C2C22] font-sans text-white">
      {/* SIDEBAR (Dark Theme for Admin) */}
      <aside className="w-72 bg-[#142018] border-r border-white/10 flex flex-col hidden lg:flex shadow-xl z-10">
        <div className="p-8 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-[#456A50] text-white rounded-lg p-1.5"><ShieldCheck size={24} /></div>
          <span className="text-2xl font-bold tracking-tight">Healora <span className="text-xs font-normal text-[#A4B3A8] uppercase tracking-widest ml-1">Admin</span></span>
        </div>
        <nav className="flex-1 px-6 mt-4 space-y-2 font-medium">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white bg-white/10 rounded-xl font-bold"><Database size={18} /> System Overview</button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A4B3A8] hover:bg-white/5 rounded-xl"><Users size={18} /> Manage Users</button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#A4B3A8] hover:bg-white/5 rounded-xl"><Settings size={18} /> System Config</button>
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition"><LogOut size={18} /> System Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto space-y-8">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A4B3A8] hover:text-white transition"><ArrowLeft size={16} /> Home</button>
        
        <div className="flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">System Administrator.</h1>
            <p className="text-[#A4B3A8] mt-2 font-serif italic text-lg">Manage PostgreSQL database users and overall system health.</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> SYSTEM ONLINE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#142018] p-6 rounded-3xl border border-white/10"><p className="text-sm font-bold text-[#A4B3A8]">Total Patients</p><p className="text-3xl font-extrabold mt-2">2,450</p></div>
          <div className="bg-[#142018] p-6 rounded-3xl border border-white/10"><p className="text-sm font-bold text-[#A4B3A8]">Total Nutritionists</p><p className="text-3xl font-extrabold mt-2">42</p></div>
          <div className="bg-[#142018] p-6 rounded-3xl border border-white/10"><p className="text-sm font-bold text-[#A4B3A8]">Clinic Managers</p><p className="text-3xl font-extrabold mt-2">5</p></div>
          <div className="bg-[#456A50] p-6 rounded-3xl shadow-lg shadow-[#456A50]/20"><p className="text-sm font-bold text-[#EBE9E0]">Database Load</p><p className="text-3xl font-extrabold mt-2">12%</p></div>
        </div>
      </main>
    </div>
  );
};
export default AdminDashboard;