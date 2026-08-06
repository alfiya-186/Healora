import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, LogOut, PlusSquare, ArrowLeft, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

const ClinicManagerDashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || 'Manager';

  return (
    <div className="min-h-screen flex bg-[#FDFCF8] font-sans text-[#1C2C22]">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-[#EBE9E0] flex flex-col hidden lg:flex shadow-sm z-10">
        <div className="p-8 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-[#456A50] text-white rounded-lg p-1.5"><PlusSquare size={24} /></div>
          <span className="text-2xl font-bold tracking-tight">Heal<span className="text-[#456A50]">ora</span></span>
        </div>
        <nav className="flex-1 px-6 mt-4 space-y-2 font-medium">
          <p className="text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-3">Administration</p>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#456A50] bg-[#EAF0EC] rounded-xl font-bold"><Calendar size={18} /> Today's Appointments</button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#5A6B60] hover:bg-[#FDFCF8] rounded-xl"><Users size={18} /> Manage Patients</button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#5A6B60] hover:bg-[#FDFCF8] rounded-xl"><FileText size={18} /> Billing & Invoices</button>
        </nav>
        <div className="p-6 border-t border-[#EBE9E0]">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-700 hover:bg-red-50 rounded-xl font-bold transition"><LogOut size={18} /> Log Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto space-y-8">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B60] hover:text-[#456A50] transition"><ArrowLeft size={16} /> Home</button>
        
        <div className="flex justify-between items-end border-b border-[#EBE9E0] pb-6">
          <div>
            <p className="text-[#456A50] font-bold text-xs tracking-wider uppercase flex items-center gap-1.5"><ShieldCheck size={14} /> Clinic Manager Portal</p>
            <h1 className="text-4xl font-extrabold tracking-tight mt-1">Hello, {userName}.</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm"><p className="text-sm font-bold text-[#5A6B60]">Today's Appointments</p><p className="text-3xl font-extrabold mt-2">12</p></div>
          <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm"><p className="text-sm font-bold text-[#5A6B60]">Active Patients</p><p className="text-3xl font-extrabold mt-2">145</p></div>
          <div className="bg-[#456A50] text-white p-6 rounded-3xl shadow-lg shadow-[#456A50]/20"><p className="text-sm font-bold text-[#A4B3A8]">Daily Revenue</p><p className="text-3xl font-extrabold mt-2">₹12,500</p></div>
        </div>

        <div className="bg-white rounded-3xl border border-[#EBE9E0] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#EBE9E0]"><h2 className="text-xl font-bold">Upcoming Appointments (Today)</h2></div>
          <table className="w-full text-left text-sm text-[#5A6B60]">
            <thead className="bg-[#FDFCF8] text-xs uppercase font-bold"><tr><th className="py-4 px-6">Patient</th><th className="py-4 px-6">Time</th><th className="py-4 px-6">Nutritionist</th><th className="py-4 px-6">Status</th></tr></thead>
            <tbody className="divide-y divide-[#EBE9E0]">
              <tr className="hover:bg-[#FDFCF8]">
                <td className="py-4 px-6 font-bold text-[#1C2C22]">Sneha Sharma</td><td className="py-4 px-6 font-bold">10:00 AM</td><td className="py-4 px-6">Dr. Sarah</td>
                <td className="py-4 px-6"><span className="bg-[#EAF0EC] text-[#456A50] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Confirmed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
export default ClinicManagerDashboard;