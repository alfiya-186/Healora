import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Video, MapPin, ArrowLeft, CreditCard, 
  ShieldCheck, FileText, CheckCircle, ShieldAlert, Sparkles, User 
} from 'lucide-react';
import BookingCalendarPicker, { getHolidayOrOffReason } from '../components/BookingCalendarPicker.jsx';
import TimeSlotPicker, { normalizeTimeTo24H, normalizeTimeToLabel } from '../components/TimeSlotPicker.jsx';

const BookConsultationPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('ONLINE');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [nutritionist, setNutritionist] = useState('AUTO');
  const [nutritionists, setNutritionists] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [healthNotes, setHealthNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rates = { ONLINE: 499, OFFLINE: 799 };

  useEffect(() => {
    // Fetch active holidays and nutritionists
    const fetchData = async () => {
      try {
        const [holidaysRes, nutRes] = await Promise.all([
          fetch('/api/clinic-holidays/').catch(() => ({ ok: false })),
          fetch('/api/nutritionists/').catch(() => ({ ok: false }))
        ]);

        if (holidaysRes.ok) {
          const hData = await holidaysRes.json();
          setHolidays(hData);
          localStorage.setItem('healora_clinic_holidays_db', JSON.stringify(hData));
        } else {
          const cached = JSON.parse(localStorage.getItem('healora_clinic_holidays_db')) || [];
          setHolidays(cached);
        }

        if (nutRes.ok) {
          setNutritionists(await nutRes.json());
        }
      } catch (err) {
        console.error("Failed to load booking meta:", err);
      }
    };
    fetchData();
  }, []);

  const handleDateSelect = (selectedDateStr, holidayInfo) => {
    if (holidayInfo && !holidayInfo.canBook) {
      setErrorMsg(`Cannot select this date: ${holidayInfo.reason}`);
      setDate('');
      return;
    }
    setErrorMsg('');
    setDate(selectedDateStr);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!date) {
      return setErrorMsg("Please select an available consultation date from the calendar.");
    }
    if (!time) {
      return setErrorMsg("Please select an available consultation time slot.");
    }

    // Collision check
    const allAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
    const isSlotTaken = allAppts.some(a => 
      a.status !== 'CANCELLED' && 
      a.date === date && 
      normalizeTimeTo24H(a.time) === normalizeTimeTo24H(time) &&
      (nutritionist === 'AUTO' || a.nutritionist === 'AUTO' || String(a.nutritionist) === String(nutritionist))
    );

    if (isSlotTaken) {
      return setErrorMsg(`The selected time slot (${normalizeTimeToLabel(time)}) is already booked by another patient. Please pick an open slot.`);
    }

    const holidayCheck = getHolidayOrOffReason(date, holidays, nutritionist);
    if (holidayCheck && !holidayCheck.canBook) {
      return setErrorMsg(`Cannot book on ${date}: ${holidayCheck.reason}`);
    }

    const selectedDate = new Date(date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return setErrorMsg("Cannot book in the past.");
    
    setIsSubmitting(true);
    const userId = localStorage.getItem('user_id') || 1; // Dynamically gets the logged-in patient

    try {
      const payload = {
        patient: userId,
        nutritionist: nutritionist === 'AUTO' ? null : nutritionist,
        date,
        time,
        mode,
        status: 'SCHEDULED',
        health_notes: healthNotes,
        amount_paid: rates[mode]
      };

      const response = await fetch(`/api/patient/${userId}/appointments/`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        // Also sync local storage appointments
        const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
        localAppts.unshift({ id: Date.now(), ...payload });
        localStorage.setItem('healora_all_appointments', JSON.stringify(localAppts));

        setIsSuccess(true);
        setTimeout(() => navigate('/patient-dashboard', { replace: true }), 3000);
      } else {
        setErrorMsg(resData.error || resData.detail || 'Database validation error. Check selected date and time.');
      }
    } catch {
      setErrorMsg('Server connection failed. Please verify your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-[#1C2C22]/5 flex flex-col items-center text-center max-w-md w-full border border-[#EBE9E0]">
        <div className="bg-[#EAF0EC] p-4 rounded-full mb-6"><CheckCircle className="text-[#456A50] w-12 h-12" /></div>
        <h2 className="text-3xl font-extrabold text-[#1C2C22] mb-2 font-serif">Confirmed.</h2>
        <p className="text-[#5A6B60] mb-8 text-sm">Your consultation is scheduled for <br /><span className="font-bold text-[#1C2C22]">{date} at {time}</span>.</p>
        <div className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl p-4 mb-6"><p className="text-xs text-[#5A6B60] mb-1 uppercase tracking-widest font-bold">Total Paid</p><p className="text-2xl font-bold text-[#456A50]">₹{rates[mode]}</p></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF8] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#1C2C22]">
      <div className="max-w-6xl mx-auto">
        
        <button onClick={() => navigate('/patient-dashboard')} className="flex items-center gap-2 text-[#5A6B60] hover:text-[#456A50] font-bold text-sm mb-8 w-max transition cursor-pointer">
          <ArrowLeft size={18} /> Return to Portal
        </button>
        
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Book Consultation</h1>
          <p className="text-[#5A6B60] mt-2 font-serif italic">Secure your clinical session with verified nutrition specialists.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form id="booking-form" onSubmit={handleBooking} className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-6 sm:p-8 space-y-8">
              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-900 text-sm font-bold rounded-2xl border-2 border-red-200 flex items-start gap-3 animate-in fade-in">
                  <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-red-800">Booking Notice</p>
                    <p className="font-medium text-xs text-red-700 mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              )}
              
              {/* Step 1: Mode & Nutritionist */}
              <div>
                <h3 className="text-sm font-bold text-[#5A6B60] uppercase tracking-wider mb-4 border-b border-[#EBE9E0] pb-2">1. Consultation Mode & Specialist</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div onClick={() => setMode('ONLINE')} className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${mode === 'ONLINE' ? 'border-[#456A50] bg-[#EAF0EC]' : 'border-[#EBE9E0] bg-white'}`}>
                    <div className={`p-3 rounded-full ${mode === 'ONLINE' ? 'bg-[#456A50] text-white' : 'bg-[#FDFCF8] text-[#5A6B60]'}`}><Video size={20} /></div>
                    <div><h4 className="font-bold">Telehealth (Video)</h4><p className="text-[#456A50] font-bold text-sm mt-1">₹{rates.ONLINE}</p></div>
                  </div>
                  <div onClick={() => setMode('OFFLINE')} className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${mode === 'OFFLINE' ? 'border-[#456A50] bg-[#EAF0EC]' : 'border-[#EBE9E0] bg-white'}`}>
                    <div className={`p-3 rounded-full ${mode === 'OFFLINE' ? 'bg-[#456A50] text-white' : 'bg-[#FDFCF8] text-[#5A6B60]'}`}><MapPin size={20} /></div>
                    <div><h4 className="font-bold">In-Clinic Visit</h4><p className="text-[#456A50] font-bold text-sm mt-1">₹{rates.OFFLINE}</p></div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Select Nutritionist</label>
                  <select 
                    value={nutritionist} 
                    onChange={(e) => {
                      setNutritionist(e.target.value);
                      setDate(''); // Reset date when nutritionist changes to re-evaluate leave availability
                    }} 
                    className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"
                  >
                    <option value="AUTO">Auto-Assign Best Available Specialist</option>
                    {nutritionists.map(n => (
                      <option key={n.id} value={n.id}>Dr. {n.first_name} {n.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Interactive Calendar Picker */}
              <div>
                <h3 className="text-sm font-bold text-[#5A6B60] uppercase tracking-wider mb-4 border-b border-[#EBE9E0] pb-2">2. Choose Consultation Date</h3>
                <BookingCalendarPicker 
                  selectedDate={date}
                  onSelectDate={handleDateSelect}
                  selectedNutritionistId={nutritionist}
                  holidays={holidays}
                />
              </div>

              {/* Step 3: Time Selection */}
              <div>
                <h3 className="text-sm font-bold text-[#5A6B60] uppercase tracking-wider mb-4 border-b border-[#EBE9E0] pb-2">3. Preferred Time Slot (20-25 Min Sessions)</h3>
                <TimeSlotPicker 
                  selectedDate={date}
                  selectedTime={time}
                  onSelectTime={(slotId) => {
                    setTime(slotId);
                    setErrorMsg('');
                  }}
                  selectedNutritionistId={nutritionist}
                />
              </div>

              {/* Step 4: Clinical Notes */}
              <div>
                <h3 className="text-sm font-bold text-[#5A6B60] uppercase tracking-wider mb-4 border-b border-[#EBE9E0] pb-2">4. Clinical Notes & Objectives</h3>
                <textarea 
                  rows={3} 
                  required 
                  value={healthNotes} 
                  onChange={(e) => setHealthNotes(e.target.value)} 
                  placeholder="Describe your primary reason for consultation, dietary goals, or symptoms..." 
                  className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-3 px-4 outline-none focus:border-[#456A50] text-sm" 
                />
              </div>
            </form>
          </div>

          {/* Right Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl shadow-[#1C2C22]/5 border border-[#EBE9E0] p-8 sticky top-8 space-y-6">
              <h3 className="text-xl font-extrabold text-[#1C2C22] border-b border-[#EBE9E0] pb-4">Consultation Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-[#5A6B60]">
                  <span>Mode</span>
                  <span className="font-bold text-[#1C2C22]">{mode === 'ONLINE' ? 'Telehealth (Video)' : 'In-Clinic'}</span>
                </div>
                <div className="flex justify-between text-[#5A6B60]">
                  <span>Doctor</span>
                  <span className="font-bold text-[#1C2C22]">
                    {nutritionist === 'AUTO' ? 'Auto-Assign' : `Dr. ${nutritionists.find(n => String(n.id) === String(nutritionist))?.first_name || 'Assigned'}`}
                  </span>
                </div>
                <div className="flex justify-between text-[#5A6B60]">
                  <span>Date</span>
                  <span className={`font-bold ${date ? 'text-[#456A50]' : 'text-gray-400 italic'}`}>
                    {date || 'Select from calendar'}
                  </span>
                </div>
                <div className="flex justify-between text-[#5A6B60]">
                  <span>Time</span>
                  <span className={`font-bold ${time ? 'text-[#1C2C22]' : 'text-gray-400 italic'}`}>
                    {time || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#EBE9E0] pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#5A6B60] uppercase tracking-wider">Total Due</span>
                  <span className="text-3xl font-black text-[#456A50]">₹{rates[mode]}</span>
                </div>
              </div>

              <button 
                type="submit" 
                form="booking-form" 
                disabled={isSubmitting || !date} 
                className="w-full flex justify-center items-center gap-2 py-4 rounded-xl shadow-lg shadow-[#456A50]/20 text-white font-bold bg-[#456A50] hover:bg-[#35533E] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : `Confirm & Secure Checkout`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookConsultationPage;