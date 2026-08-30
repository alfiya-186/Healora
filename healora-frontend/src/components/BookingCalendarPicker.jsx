import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  AlertCircle, CheckCircle, Info, Ban, ShieldAlert, Sparkles 
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const isSecondSaturday = (dateObj) => {
  if (dateObj.getDay() !== 6) return false;
  const day = dateObj.getDate();
  return day >= 8 && day <= 14;
};

export const getHolidayOrOffReason = (dateStr, holidays = [], selectedNutritionistId = null) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);

  // 1. Sunday check
  if (d.getDay() === 0) {
    return {
      type: 'WEEKLY_OFF',
      label: 'Closed (Sunday)',
      reason: 'The clinic is closed on all Sundays.',
      isHoliday: true,
      canBook: false,
    };
  }

  // 2. 2nd Saturday check
  if (isSecondSaturday(d)) {
    return {
      type: 'WEEKLY_OFF',
      label: 'Closed (2nd Saturday)',
      reason: 'The clinic is closed on the 2nd Saturday of each month.',
      isHoliday: true,
      canBook: false,
    };
  }

  // 3. Full Clinic Holiday
  const clinicHoliday = holidays.find(
    h => h.date === dateStr && h.holiday_type === 'CLINIC_HOLIDAY'
  );
  if (clinicHoliday) {
    return {
      type: 'CLINIC_HOLIDAY',
      label: 'Clinic Holiday',
      reason: clinicHoliday.reason || 'Clinic closed for designated holiday.',
      isHoliday: true,
      canBook: false,
    };
  }

  // 4. Nutritionist Leave
  if (selectedNutritionistId && selectedNutritionistId !== 'AUTO') {
    const nutLeave = holidays.find(
      h => h.date === dateStr && 
           h.holiday_type === 'NUTRITIONIST_LEAVE' && 
           String(h.nutritionist) === String(selectedNutritionistId)
    );
    if (nutLeave) {
      const nutName = nutLeave.nutritionist_name || 'Assigned Nutritionist';
      return {
        type: 'NUTRITIONIST_LEAVE',
        label: 'Nutritionist On Leave',
        reason: `${nutName} is on leave (${nutLeave.reason || 'Personal / Medical Leave'}).`,
        isHoliday: true,
        canBook: false,
      };
    }
  } else {
    // If no specific nutritionist or AUTO, check if there's any leave
    const anyNutLeave = holidays.find(
      h => h.date === dateStr && h.holiday_type === 'NUTRITIONIST_LEAVE'
    );
    if (anyNutLeave) {
      const nutName = anyNutLeave.nutritionist_name || 'Doctor';
      return {
        type: 'NUTRITIONIST_LEAVE',
        label: 'Doctor On Leave',
        reason: `${nutName} is on leave on this date.`,
        isHoliday: false, // may still book other available doctors if AUTO
        canBook: true,
        noticeOnly: true,
      };
    }
  }

  return null;
};

const BookingCalendarPicker = ({
  selectedDate,
  onSelectDate,
  selectedNutritionistId = null,
  holidays = [],
  minDate = new Date().toISOString().split('T')[0]
}) => {
  const today = new Date();
  const initialDate = selectedDate ? new Date(selectedDate) : today;
  
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-11
  const [activeAlert, setActiveAlert] = useState(null);

  const minDateObj = useMemo(() => {
    if (!minDate) return new Date();
    const [y, m, d] = minDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [minDate]);

  // Generate days in month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isPast: true,
        dateObj: prevMonthDate,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      dateObj.setHours(0, 0, 0, 0);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const isPast = dateObj < minDateObj;
      const holidayInfo = getHolidayOrOffReason(dateStr, holidays, selectedNutritionistId);

      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isPast,
        dateObj,
        holidayInfo,
      });
    }

    // Next month padding to complete 35 or 42 grid
    const totalSlots = days.length > 35 ? 42 : 35;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
      const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: false,
        isPast: false,
        dateObj: nextMonthDate,
      });
    }

    return days;
  }, [currentYear, currentMonth, minDateObj, holidays, selectedNutritionistId]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDateClick = (dayItem) => {
    if (!dayItem.isCurrentMonth || dayItem.isPast) return;

    const holidayInfo = dayItem.holidayInfo;

    if (holidayInfo && !holidayInfo.canBook) {
      setActiveAlert({
        date: dayItem.dateStr,
        formattedDate: new Date(dayItem.dateStr).toLocaleDateString('en-US', {
          weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
        }),
        title: holidayInfo.label,
        reason: holidayInfo.reason,
        type: holidayInfo.type,
      });
      return;
    }

    // Clear alert on valid selection
    setActiveAlert(null);
    if (onSelectDate) {
      onSelectDate(dayItem.dateStr, holidayInfo);
    }
  };

  return (
    <div className="w-full bg-[#FDFCF8] rounded-3xl border border-[#EBE9E0] p-5 sm:p-6 shadow-sm">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#EBE9E0] pb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-[#1C2C22] flex items-center gap-2 font-serif">
            <CalendarIcon size={20} className="text-[#456A50]" />
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <p className="text-xs text-[#5A6B60] mt-0.5">Click any open date to select your consultation.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-white border border-[#EBE9E0] text-[#1C2C22] hover:bg-[#EAF0EC] hover:text-[#456A50] transition shadow-sm cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentYear(today.getFullYear());
              setCurrentMonth(today.getMonth());
            }}
            className="px-3 py-2 text-xs font-bold text-[#456A50] bg-[#EAF0EC] hover:bg-[#456A50] hover:text-white rounded-xl transition shadow-sm cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-white border border-[#EBE9E0] text-[#1C2C22] hover:bg-[#EAF0EC] hover:text-[#456A50] transition shadow-sm cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
        {DAY_NAMES.map((d, idx) => (
          <div 
            key={d} 
            className={`text-[11px] font-black uppercase tracking-widest py-1.5 ${
              idx === 0 ? 'text-red-500 font-extrabold' : idx === 6 ? 'text-amber-700' : 'text-[#5A6B60]'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarDays.map((item, idx) => {
          if (!item.isCurrentMonth) {
            return (
              <div 
                key={idx} 
                className="h-16 sm:h-20 rounded-2xl p-1.5 text-gray-300 bg-transparent flex flex-col justify-between opacity-30 select-none pointer-events-none"
              >
                <span className="text-xs font-medium">{item.dayNum}</span>
              </div>
            );
          }

          const isSelected = selectedDate === item.dateStr;
          const holidayInfo = item.holidayInfo;
          const isClosed = holidayInfo && !holidayInfo.canBook;
          const isPast = item.isPast;

          let cellClass = "bg-white border-[#EBE9E0] text-[#1C2C22] hover:border-[#456A50] hover:shadow-md hover:bg-[#F4F7F4] cursor-pointer";
          let badge = null;

          if (isPast) {
            cellClass = "bg-gray-50/70 border-gray-100 text-gray-300 cursor-not-allowed opacity-60";
          } else if (isSelected) {
            cellClass = "bg-[#456A50] border-[#35533E] text-white shadow-lg shadow-[#456A50]/25 ring-2 ring-[#456A50] cursor-pointer";
          } else if (isClosed) {
            if (holidayInfo.type === 'CLINIC_HOLIDAY') {
              cellClass = "bg-red-50/90 border-red-200 text-red-900 hover:bg-red-100/80 cursor-pointer";
              badge = <span className="text-[9px] font-extrabold text-red-700 bg-red-100/90 border border-red-300/60 px-1.5 py-0.5 rounded-md truncate max-w-full block leading-tight">Holiday</span>;
            } else if (holidayInfo.type === 'NUTRITIONIST_LEAVE') {
              cellClass = "bg-amber-50/90 border-amber-200 text-amber-900 hover:bg-amber-100/80 cursor-pointer";
              badge = <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100/90 border border-amber-300/60 px-1.5 py-0.5 rounded-md truncate max-w-full block leading-tight">On Leave</span>;
            } else {
              // Sunday or 2nd Saturday
              cellClass = "bg-rose-50/60 border-rose-150 text-rose-800 hover:bg-rose-100/70 cursor-pointer";
              badge = <span className="text-[9px] font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md truncate max-w-full block leading-tight">Closed</span>;
            }
          }

          return (
            <div
              key={item.dateStr}
              onClick={() => handleDateClick(item)}
              className={`h-16 sm:h-20 rounded-2xl p-2 border transition-all flex flex-col justify-between text-left relative overflow-hidden group ${cellClass}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : ''}`}>
                  {item.dayNum}
                </span>
                {isSelected && (
                  <CheckCircle size={14} className="text-white shrink-0" />
                )}
                {isClosed && !isSelected && (
                  <Ban size={12} className="text-red-500 shrink-0 opacity-80" />
                )}
              </div>

              <div className="mt-auto">
                {badge}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prominent Holiday / Off-Day Warning Alert Box */}
      {activeAlert && (
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-red-50 border-2 border-red-200 text-red-950 animate-in fade-in zoom-in-95 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert size={22} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-black text-red-900 tracking-tight">
                  🚫 No Bookings Available: {activeAlert.title}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveAlert(null)}
                  className="text-xs text-red-400 hover:text-red-800 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs font-bold text-red-700 mt-1">
                Date: <span className="underline">{activeAlert.formattedDate}</span>
              </p>
              <p className="text-xs text-red-800/90 mt-1.5 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-red-200/50">
                {activeAlert.reason}
              </p>
              <p className="text-[11px] text-red-600 font-semibold mt-2">
                💡 Please select another highlighted open date from the calendar to schedule your consultation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-[#EBE9E0] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#5A6B60]">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-[#456A50] border border-[#35533E]"></span>
          <span>Selected Date</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-white border border-[#EBE9E0]"></span>
          <span>Open for Booking</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-red-100 border border-red-300"></span>
          <span>Clinic Holiday</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300"></span>
          <span>Doctor On Leave</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-rose-100/70 border border-rose-200"></span>
          <span>Closed (Sun / 2nd Sat)</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendarPicker;

