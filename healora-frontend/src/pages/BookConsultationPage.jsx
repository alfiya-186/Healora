import { useState } from 'react';
import { Laptop, Building, CheckCircle2 } from 'lucide-react';

export default function BookConsultationPage() {
  const [type, setType] = useState('online');
  const [doctor, setDoctor] = useState('Priya');
  const [date, setDate] = useState('21');
  const [time, setTime] = useState('10:00 AM');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dates = [
    { day: 'Mon', num: '21' }, { day: 'Tue', num: '22' },
    { day: 'Wed', num: '23' }, { day: 'Thu', num: '24' },
    { day: 'Fri', num: '25' }, { day: 'Sat', num: '26' }
  ];

  const doctors = [
    { id: 'Priya', name: 'Dr. Priya Menon', spec: 'Diabetes & Obesity Care', rating: '4.9', exp: '12 yrs exp', img: '👩‍⚕️' },
    { id: 'Arjun', name: 'Dr. Arjun Sharma', spec: 'Sports Nutrition', rating: '4.8', exp: '8 yrs exp', img: '👨‍⚕️' },
    { id: 'Neha', name: 'Dr. Neha Kapoor', spec: 'PCOS & Thyroid', rating: '4.9', exp: '10 yrs exp', img: '👩‍⚕️' }
  ];

  // THIS FUNCTION SENDS THE DATA TO DJANGO!
  const handleBooking = async () => {
    setIsSubmitting(true);
    
    // Formatting the date to match Django's requirement (YYYY-MM-DD)
    const formattedDate = `2026-07-${date.padStart(2, '0')}`;
    
    const appointmentData = {
      patient: 1, // Using the ID of the superuser you just created
      nutritionist_name: doctors.find(d => d.id === doctor)?.name,
      consultation_type: type,
      date: formattedDate,
      time: time,
      reason: reason,
      status: 'Pending'
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        alert('🎉 Appointment Booked Successfully in Django!');
        setReason(''); // clear the form
      } else {
        const errorData = await response.json();
        console.error("Django Error:", errorData);
        alert('Failed to book appointment. Check console.');
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert('Cannot connect to Django server!');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
      
      {/* Left Form Area */}
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Consultation</h1>
          <p className="text-gray-500">Choose your nutritionist, preferred time, and consultation type.</p>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Consultation Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setType('online')} className={`flex flex-col items-center p-4 border rounded-xl ${type === 'online' ? 'border-[#0ba396] bg-[#e0f2f1]' : 'border-gray-200'}`}>
              <Laptop size={24} className={`mb-2 ${type === 'online' ? 'text-[#0ba396]' : 'text-gray-500'}`} />
              <span className={`font-semibold ${type === 'online' ? 'text-[#0ba396]' : 'text-gray-700'}`}>Online</span>
              <span className="text-xs text-gray-500">Google Meet</span>
            </button>
            <button onClick={() => setType('inperson')} className={`flex flex-col items-center p-4 border rounded-xl ${type === 'inperson' ? 'border-[#0ba396] bg-[#e0f2f1]' : 'border-gray-200'}`}>
              <Building size={24} className={`mb-2 ${type === 'inperson' ? 'text-[#0ba396]' : 'text-gray-500'}`} />
              <span className={`font-semibold ${type === 'inperson' ? 'text-[#0ba396]' : 'text-gray-700'}`}>In-Person</span>
              <span className="text-xs text-gray-500">Clinic Visit</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Choose Nutritionist</h3>
          <div className="space-y-3">
            {doctors.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => setDoctor(doc.id)}
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${doctor === doc.id ? 'border-[#0ba396] bg-[#e0f2f1]' : 'border-gray-200 hover:border-teal-300'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">{doc.img}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{doc.name}</h4>
                    <p className="text-sm text-gray-500">{doc.spec}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm">⭐ {doc.rating}</p>
                    <p className="text-xs text-gray-500">{doc.exp}</p>
                  </div>
                  {doctor === doc.id && <CheckCircle2 className="text-[#0ba396]" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Select Date <span className="text-gray-400 font-normal">— July 2026</span></h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {dates.map(d => (
              <button 
                key={d.num} 
                onClick={() => setDate(d.num)}
                className={`min-w-[70px] py-3 rounded-xl border flex flex-col items-center ${date === d.num ? 'border-[#0ba396] bg-[#e0f2f1] text-[#0ba396]' : 'border-gray-200 text-gray-600'}`}
              >
                <span className="text-xs mb-1">{d.day}</span>
                <span className="font-bold text-lg">{d.num}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Available Time Slots</h3>
          <div className="grid grid-cols-3 gap-3">
            {['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map(t => (
              <button 
                key={t}
                onClick={() => setTime(t)}
                className={`py-2 rounded-lg border text-sm font-medium ${time === t ? 'border-[#0ba396] bg-[#0ba396] text-white' : 'border-gray-200 text-gray-600 hover:border-[#0ba396]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div>
           <h3 className="font-semibold text-sm text-gray-700 mb-3">Reason for visit <span className="text-gray-400 font-normal">(optional)</span></h3>
           <textarea 
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             rows="3" 
             placeholder="Describe your health concern or wellness goal..." 
             className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0ba396] outline-none resize-none"
           ></textarea>
        </div>
      </div>

      {/* Right Summary Sidebar */}
      <div>
        <div className="border border-gray-200 rounded-2xl p-6 sticky top-8 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-6">Appointment Summary</h3>
          
          <div className="space-y-4 text-sm mb-6">
            <div className="flex justify-between border-b pb-4">
              <span className="text-gray-500">Type</span>
              <span className="font-semibold text-gray-900 flex items-center gap-1">
                {type === 'online' ? <Laptop size={14} /> : <Building size={14} />} 
                {type === 'online' ? 'Online' : 'In-Person'}
              </span>
            </div>
            <div className="flex justify-between border-b pb-4">
              <span className="text-gray-500">Doctor</span>
              <span className="font-semibold text-gray-900">{doctors.find(d => d.id === doctor)?.name}</span>
            </div>
            <div className="flex justify-between border-b pb-4">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold text-gray-900">{date ? `July ${date}, 2026` : '—'}</span>
            </div>
            <div className="flex justify-between border-b pb-4">
              <span className="text-gray-500">Time</span>
              <span className="font-semibold text-gray-900">{time || '—'}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-500">Consultation fee</span>
              <span className="font-bold text-lg text-gray-900">₹499</span>
            </div>
          </div>

          <button 
            onClick={handleBooking}
            disabled={isSubmitting}
            className="w-full bg-[#0ba396] text-white py-3 rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Booking...' : 'Confirm Booking'}
          </button>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Free cancellation up to 2 hours before your appointment
          </p>
        </div>
      </div>
    </div>
  );
}