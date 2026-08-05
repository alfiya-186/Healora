import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, MapPin, ArrowLeft, CreditCard, ShieldCheck, FileText, CheckCircle } from 'lucide-react';

const BookConsultationPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('ONLINE');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rates = { ONLINE: 499, OFFLINE: 799 };

  const handleBooking = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const selectedDate = new Date(date);
    const today = new Date(); today.setHours(0,0,0,0);
    if (selectedDate < today) return setErrorMsg("Cannot book in the past.");
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/appointments/create/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: 1, date, time, mode, status: 'SCHEDULED', health_notes: healthNotes, amount_paid: rates[mode] }),
      });
      if (response.ok) { setIsSuccess(true); setTimeout(() => navigate('/patient-dashboard'), 3000); } 
      else setErrorMsg('Database error.');
    } catch { setErrorMsg('Server connection failed.'); } 
    finally { setIsSubmitting(false); }
  };

  if (isSuccess) return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-[#1C2C22]/5 flex flex-col items-center text-center max-w-md w-full border border-[#EBE9E0]">
        <div className="bg-[#EAF0EC] p-4 rounded-full mb-6"><CheckCircle className="text-[#456A50] w-12 h-12" /></div>
        <h2 className="text-3xl font-extrabold text-[#1C2C22] mb-2 font-serif">Confirmed.</h2>
        <p className="text-[#5A6B60] mb-8 text-sm">Your consultation is scheduled for <span className="font-bold text-[#1C2C22]">{date} at {time}</span>.</p>
        <div className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl p-4 mb-6"><p className="text-xs text-[#5A6B60] mb-1 uppercase tracking-widest font-bold">Total Paid</p><p className="text-2xl font-bold text-[#456A50]">₹{rates[mode]}</p></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF8] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#1C2C22]">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#5A6B60] hover:text-[#456A50] font-bold text-sm mb-8"><ArrowLeft size={18} /> Return to Portal</button>
        <div className="mb-10"><h1 className="text-4xl font-extrabold tracking-tight">Book Consultation</h1><p className="text-[#5A6B60] mt-2 font-serif italic">Secure your session with our clinical experts.</p></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form id="booking-form" onSubmit={handleBooking} className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 space-y-8">
              {errorMsg && <div className="p-4 bg-red-50 text-red-800 text-sm font-semibold rounded-xl border border-red-100">{errorMsg}</div>}
              
              <div>
                <h3 className="text-sm font-bold text-[#5A6B60] uppercase tracking-wider mb-4 border-b border-[#EBE9E0] pb-2">1. Consultation Mode</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div onClick={() => setMode('ONLINE')} className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${mode === 'ONLINE' ? 'border-[#456A50] bg-[#EAF0EC]' : 'border-[#EBE9E0] bg-white'}`}>
                    <div className={`p-3 rounded-full ${mode === 'ONLINE' ? 'bg-[#456A50] text-white' : 'bg-[#FDFCF8] text-[#5A6B60]'}`}><Video size={20} /></div>
                    <div><h4 className="font-bold">Telehealth (Video)</h4><p className="text-[#456A50] font-bold text-sm mt-1">₹{rates.ONLINE}</p></div>
                  </div>
                  <div onClick={() => setMode('OFFLINE')} className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${mode === 'OFFLINE' ? 'border-[#456A50] bg-[#EAF0EC]' : 'border-[#EBE9E0] bg-white'}`}>
                    <div className={`p-3 rounded-full ${mode === 'OFFLINE' ? 'bg-[#456A50] text-white' : 'bg-[#FDFCF8] text-[#5A6B60]'}`}><MapPin size={20} /></div>
                    <div><h4 className="font-bold">In-Clinic Visit</h4><p className="text-[#456A50] font-bold text-sm mt-1">₹{rates.OFFLINE}</p></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#5A6B60] uppercase tracking-wider mb-4 border-b border-[#EBE9E0] pb-2">2. Date & Time</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input type="date" required min={new Date().toISOString().split('T')[0]} value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-3 px-4 outline-none focus:border-[#456A50]" />
                  <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-3 px-4 outline-none focus:border-[#456A50]" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#5A6B60] uppercase tracking-wider mb-4 border-b border-[#EBE9E0] pb-2">3. Clinical Notes</h3>
                <textarea rows={3} required value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} placeholder="Primary reason for consultation..." className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-3 px-4 outline-none focus:border-[#456A50]" />
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl shadow-[#1C2C22]/5 border border-[#EBE9E0] p-8 sticky top-8">
              <h3 className="text-xl font-extrabold mb-6">Summary</h3>
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between text-[#5A6B60]"><span>Method</span><span className="font-bold text-[#1C2C22]">{mode}</span></div>
                <div className="flex justify-between text-[#5A6B60]"><span>Date</span><span className="font-bold text-[#1C2C22]">{date || 'Pending'}</span></div>
              </div>
              <div className="border-t border-[#EBE9E0] pt-4 mb-6">
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-[#5A6B60] uppercase">Total</span><span className="text-2xl font-extrabold text-[#456A50]">₹{rates[mode]}</span></div>
              </div>
              <button type="submit" form="booking-form" disabled={isSubmitting} className="w-full flex justify-center items-center gap-2 py-4 rounded-xl shadow-lg shadow-[#456A50]/20 text-white font-bold bg-[#456A50] hover:bg-[#35533E] transition">{isSubmitting ? 'Processing...' : `Secure Checkout`}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BookConsultationPage;