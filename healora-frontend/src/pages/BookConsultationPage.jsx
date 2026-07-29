import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Video, MapPin, ArrowLeft, 
  CreditCard, ShieldCheck, FileText, CheckCircle 
} from 'lucide-react';

const BookConsultationPage = () => {
  const navigate = useNavigate();
  
  // State for the form
  const [mode, setMode] = useState('online');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Dynamic pricing based on selection
  const rates = {
    online: 499,
    offline: 799
  };

  const handleBooking = (e) => {
    e.preventDefault();
    setIsSuccess(true);
    
    // Simulate saving to database, then redirect after 3 seconds
    setTimeout(() => {
      navigate('/patient-dashboard');
    }, 3000);
  };

  // SUCCESS SCREEN
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-teal-100/50 flex flex-col items-center text-center max-w-md w-full border border-gray-100">
          <div className="bg-green-100 p-4 rounded-full mb-6">
            <CheckCircle className="text-green-500 w-16 h-16" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-8">
            Your {mode === 'online' ? 'Online Video' : 'In-Clinic'} consultation is scheduled for <br/> 
            <span className="font-bold text-gray-800">{date} at {time}</span>.
          </p>
          <div className="w-full bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
            <p className="text-2xl font-bold text-[#0ba396]">₹{rates[mode]}</p>
          </div>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <ShieldCheck size={16} /> Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // BOOKING FORM SCREEN
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Navigation */}
        <button 
          onClick={() => navigate('/patient-dashboard')} 
          className="flex items-center gap-2 text-gray-500 hover:text-[#0ba396] font-medium mb-8 transition"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Book a Consultation</h1>
          <p className="text-gray-500 mt-2">Select your preferred mode, date, and time to meet with our certified nutritionists.</p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: The Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            <form id="booking-form" onSubmit={handleBooking} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-8">
              
              {/* Step 1: Mode Selection */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-[#0ba396] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span> 
                  Consultation Mode
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Online Option */}
                  <div 
                    onClick={() => setMode('online')}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${mode === 'online' ? 'border-[#0ba396] bg-teal-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className={`p-3 rounded-full ${mode === 'online' ? 'bg-[#0ba396] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Video size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Online Video Call</h4>
                      <p className="text-sm text-gray-500 mt-1">Consult from your home via Google Meet.</p>
                      <p className="text-[#0ba396] font-bold mt-2">₹{rates.online}</p>
                    </div>
                  </div>

                  {/* Offline Option */}
                  <div 
                    onClick={() => setMode('offline')}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${mode === 'offline' ? 'border-[#0ba396] bg-teal-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className={`p-3 rounded-full ${mode === 'offline' ? 'bg-[#0ba396] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">In-Clinic Visit</h4>
                      <p className="text-sm text-gray-500 mt-1">Visit our physical Healora clinic.</p>
                      <p className="text-[#0ba396] font-bold mt-2">₹{rates.offline}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Date & Time */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-[#0ba396] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span> 
                  Schedule Date & Time
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 text-gray-400" size={20} />
                      <input 
                        type="date" 
                        required 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#0ba396] focus:ring-1 focus:ring-[#0ba396] transition" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                      <input 
                        type="time" 
                        required 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#0ba396] focus:ring-1 focus:ring-[#0ba396] transition" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Additional Notes */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-[#0ba396] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span> 
                  Health Goals (Optional)
                </h3>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-gray-400" size={20} />
                  <textarea 
                    rows={3}
                    placeholder="E.g., Looking for a PCOS diet plan, wanting to lose weight..."
                    className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#0ba396] focus:ring-1 focus:ring-[#0ba396] transition resize-none" 
                  />
                </div>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: Order Summary & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-lg shadow-teal-100/40 border border-gray-100 p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Consultation Type</span>
                  <span className="font-bold text-gray-900">{mode === 'online' ? 'Online Video' : 'In-Clinic'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Date</span>
                  <span className="font-bold text-gray-900">{date || 'Not selected'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Time</span>
                  <span className="font-bold text-gray-900">{time || 'Not selected'}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-6 space-y-3">
                <div className="flex justify-between text-gray-500">
                  <span>Consultation Fee</span>
                  <span>₹{rates[mode]}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Platform Fee</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-lg font-bold text-gray-900">Total Rate</span>
                  <span className="text-2xl font-extrabold text-[#0ba396]">₹{rates[mode]}</span>
                </div>
              </div>

              {/* Connects to the form in the left column using form="booking-form" */}
              <button 
                type="submit" 
                form="booking-form"
                className="w-full flex justify-center items-center gap-2 py-4 rounded-2xl shadow-md text-white font-bold bg-[#0ba396] hover:bg-teal-700 hover:shadow-lg transition-all"
              >
                <CreditCard size={20} />
                Confirm & Pay ₹{rates[mode]}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck size={16} /> Secure, encrypted payment
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookConsultationPage;