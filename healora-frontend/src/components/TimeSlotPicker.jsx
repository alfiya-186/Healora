import React, { useMemo } from 'react';
import { Clock, CheckCircle2, Lock, AlertCircle, Sun, Moon } from 'lucide-react';

// Standard 20-25 min consultation slots (scheduled in 30-min clinical windows)
export const CLINIC_TIME_SLOTS = [
  { id: '09:00', label: '09:00 AM', period: 'morning', hour24: 9, min: 0 },
  { id: '09:30', label: '09:30 AM', period: 'morning', hour24: 9, min: 30 },
  { id: '10:00', label: '10:00 AM', period: 'morning', hour24: 10, min: 0 },
  { id: '10:30', label: '10:30 AM', period: 'morning', hour24: 10, min: 30 },
  { id: '11:00', label: '11:00 AM', period: 'morning', hour24: 11, min: 0 },
  { id: '11:30', label: '11:30 AM', period: 'morning', hour24: 11, min: 30 },
  { id: '12:00', label: '12:00 PM', period: 'morning', hour24: 12, min: 0 },
  { id: '12:30', label: '12:30 PM', period: 'morning', hour24: 12, min: 30 },

  { id: '14:00', label: '02:00 PM', period: 'afternoon', hour24: 14, min: 0 },
  { id: '14:30', label: '02:30 PM', period: 'afternoon', hour24: 14, min: 30 },
  { id: '15:00', label: '03:00 PM', period: 'afternoon', hour24: 15, min: 0 },
  { id: '15:30', label: '03:30 PM', period: 'afternoon', hour24: 15, min: 30 },
  { id: '16:00', label: '04:00 PM', period: 'afternoon', hour24: 16, min: 0 },
  { id: '16:30', label: '04:30 PM', period: 'afternoon', hour24: 16, min: 30 },
  { id: '17:00', label: '05:00 PM', period: 'afternoon', hour24: 17, min: 0 },
  { id: '17:30', label: '05:30 PM', period: 'afternoon', hour24: 17, min: 30 },
];

/**
 * Normalizes any time string (e.g., '09:00', '09:00:00', '9:00 AM', '09:00 AM', '14:30', '2:30 PM')
 * to standard 'HH:MM' (24-hour) format.
 */
export const normalizeTimeTo24H = (timeStr) => {
  if (!timeStr) return '';
  const clean = String(timeStr).trim();
  
  // If format like "09:00 AM" or "2:30 PM"
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const min = ampmMatch[2];
    const isPM = ampmMatch[3].toUpperCase() === 'PM';
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${min}`;
  }

  // If format like "09:00" or "09:00:00"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const min = match24[2];
    return `${String(hour).padStart(2, '0')}:${min}`;
  }

  return clean;
};

export const normalizeTimeToLabel = (timeStr) => {
  const norm24 = normalizeTimeTo24H(timeStr);
  const found = CLINIC_TIME_SLOTS.find(s => s.id === norm24);
  if (found) return found.label;
  return timeStr || '';
};

const TimeSlotPicker = ({
  selectedDate,
  selectedTime,
  onSelectTime,
  selectedNutritionistId = 'AUTO',
  existingAppointments = [],
  excludeAppointmentId = null, // useful during rescheduling
}) => {
  // 1. Gather all booked time slots on the selected date
  const bookedSlotsMap = useMemo(() => {
    if (!selectedDate) return {};

    const allAppts = existingAppointments && existingAppointments.length > 0 
      ? existingAppointments 
      : (JSON.parse(localStorage.getItem('healora_all_appointments')) || []);

    const map = {};

    allAppts.forEach(a => {
      // Ignore cancelled appointments
      if (a.status === 'CANCELLED') return;
      // Ignore current appointment if rescheduling
      if (excludeAppointmentId && String(a.id) === String(excludeAppointmentId)) return;
      // Check date match
      if (a.date !== selectedDate) return;

      // Check nutritionist match if specific nutritionist is selected
      if (
        selectedNutritionistId && 
        selectedNutritionistId !== 'AUTO' && 
        a.nutritionist && 
        a.nutritionist !== 'AUTO' &&
        String(a.nutritionist) !== String(selectedNutritionistId)
      ) {
        return; // Different doctor is booked, slot still open for this doctor
      }

      const slotKey = normalizeTimeTo24H(a.time);
      if (slotKey) {
        map[slotKey] = {
          booked: true,
          patientName: a.patient_name || a.patient,
          mode: a.mode,
        };
      }
    });

    return map;
  }, [selectedDate, selectedNutritionistId, existingAppointments, excludeAppointmentId]);

  // 2. Check if selected date is today to mark past time slots as expired
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = selectedDate === todayStr;
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  // 3. Process slots into status categories
  const processedSlots = useMemo(() => {
    return CLINIC_TIME_SLOTS.map(slot => {
      const isBooked = !!bookedSlotsMap[slot.id];
      let isPast = false;

      if (isToday) {
        if (slot.hour24 < currentHour || (slot.hour24 === currentHour && slot.min <= currentMin)) {
          isPast = true;
        }
      }

      const isAvailable = !isBooked && !isPast;
      const isSelected = normalizeTimeTo24H(selectedTime) === slot.id;

      return {
        ...slot,
        isBooked,
        isPast,
        isAvailable,
        isSelected,
      };
    });
  }, [bookedSlotsMap, isToday, currentHour, currentMin, selectedTime]);

  const morningSlots = processedSlots.filter(s => s.period === 'morning');
  const afternoonSlots = processedSlots.filter(s => s.period === 'afternoon');
  const totalAvailable = processedSlots.filter(s => s.isAvailable).length;

  if (!selectedDate) {
    return (
      <div className="bg-[#FDFCF8] rounded-2xl border border-dashed border-[#EBE9E0] p-6 text-center text-[#5A6B60]">
        <Clock size={28} className="mx-auto text-gray-400 mb-2 opacity-60" />
        <p className="text-xs font-bold uppercase tracking-wider text-[#1C2C22]">No Date Selected</p>
        <p className="text-[11px] text-gray-500 mt-1">Please select a consultation date from the calendar above to view available 20–25 min time slots.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header with availability status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#EBE9E0] pb-3">
        <div>
          <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={15} className="text-[#456A50]" />
            Available Time Slots (20–25 min sessions)
          </h4>
          <p className="text-[11px] text-[#5A6B60] mt-0.5">
            Select an open slot. No two patients can book the same slot.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            totalAvailable > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {totalAvailable > 0 ? `${totalAvailable} Slots Available` : 'Fully Booked'}
          </span>
        </div>
      </div>

      {totalAvailable === 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs font-bold flex items-center gap-2.5">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>All consultation time slots for this date are fully booked or have passed. Please select another date from the calendar.</span>
        </div>
      )}

      {/* Morning Slots Section */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#5A6B60] uppercase tracking-widest mb-2.5">
          <Sun size={13} className="text-amber-500" /> Morning Sessions (09:00 AM – 01:00 PM)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {morningSlots.map(slot => (
            <button
              key={slot.id}
              type="button"
              disabled={!slot.isAvailable}
              onClick={() => onSelectTime(slot.id)}
              className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                slot.isSelected
                  ? 'bg-[#456A50] text-white border-[#35533E] shadow-md shadow-[#456A50]/20 ring-2 ring-[#456A50]'
                  : slot.isBooked
                  ? 'bg-red-50/70 border-red-200 text-red-700 cursor-not-allowed opacity-75'
                  : slot.isPast
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-white border-[#EBE9E0] text-[#1C2C22] hover:border-[#456A50] hover:bg-[#EAF0EC] shadow-xs'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>{slot.label}</span>
                {slot.isSelected && <CheckCircle2 size={12} className="text-white" />}
                {slot.isBooked && <Lock size={11} className="text-red-500" />}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider ${
                slot.isSelected
                  ? 'text-emerald-100'
                  : slot.isBooked
                  ? 'text-red-600'
                  : slot.isPast
                  ? 'text-gray-400'
                  : 'text-emerald-700'
              }`}>
                {slot.isSelected ? 'Selected' : slot.isBooked ? 'Booked' : slot.isPast ? 'Passed' : 'Available'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Afternoon & Evening Slots Section */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#5A6B60] uppercase tracking-widest mb-2.5">
          <Moon size={13} className="text-indigo-500" /> Afternoon & Evening (02:00 PM – 06:00 PM)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {afternoonSlots.map(slot => (
            <button
              key={slot.id}
              type="button"
              disabled={!slot.isAvailable}
              onClick={() => onSelectTime(slot.id)}
              className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                slot.isSelected
                  ? 'bg-[#456A50] text-white border-[#35533E] shadow-md shadow-[#456A50]/20 ring-2 ring-[#456A50]'
                  : slot.isBooked
                  ? 'bg-red-50/70 border-red-200 text-red-700 cursor-not-allowed opacity-75'
                  : slot.isPast
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-white border-[#EBE9E0] text-[#1C2C22] hover:border-[#456A50] hover:bg-[#EAF0EC] shadow-xs'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>{slot.label}</span>
                {slot.isSelected && <CheckCircle2 size={12} className="text-white" />}
                {slot.isBooked && <Lock size={11} className="text-red-500" />}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider ${
                slot.isSelected
                  ? 'text-emerald-100'
                  : slot.isBooked
                  ? 'text-red-600'
                  : slot.isPast
                  ? 'text-gray-400'
                  : 'text-emerald-700'
              }`}>
                {slot.isSelected ? 'Selected' : slot.isBooked ? 'Booked' : slot.isPast ? 'Passed' : 'Available'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="pt-2 flex flex-wrap items-center gap-4 text-[10px] text-[#5A6B60] border-t border-[#EBE9E0]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#456A50]"></span>
          <span className="font-bold text-[#1C2C22]">Selected Slot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Open (20-25 mins)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
          <span>Booked (Unavailable)</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotPicker;
