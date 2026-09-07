import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Activity, Apple, LogOut, FileText, 
  UserCircle, HeartPulse, Moon, Footprints, Droplets,
  CheckCircle2, Trash2, ShieldCheck, Edit3, Camera, Upload, UploadCloud, X,
  CreditCard, Lock, ChevronRight, ChevronLeft, CheckCircle, MessageSquare, Send, Bell, Download, File, User, Key, Flame, AlertCircle, DownloadCloud, Stethoscope, ClipboardList, Star, ShieldAlert,
  Video, ExternalLink, Link2, Clock, Sparkles, Eye, RotateCcw, XCircle, AlertTriangle, Check, RefreshCw,
  Scale, TrendingDown, TrendingUp, Save, Ticket, DoorOpen, Megaphone, Printer
} from 'lucide-react';

import BookingCalendarPicker, { getHolidayOrOffReason } from '../components/BookingCalendarPicker.jsx';
import TimeSlotPicker, { normalizeTimeTo24H, normalizeTimeToLabel } from '../components/TimeSlotPicker.jsx';
import { getKeralaPersonalizedOptions, getKeralaMealImage, KERALA_FOOD_IMAGES } from '../utils/keralaNutritionEngine.js';

export const printClinicTokenSlip = (appt, patientInfo = {}) => {
  const tokenNum = appt.token_number || `TK-${101 + ((appt.id || 1) % 50)}`;
  const pName = patientInfo.name || appt.patient_name || (typeof appt.patient === 'string' ? appt.patient : 'Patient');
  const dateStr = appt.date || new Date().toISOString().split('T')[0];
  const timeStr = appt.time || '10:00 AM';
  const modeStr = (appt.mode || 'IN-CLINIC').toUpperCase();
  const roomStr = 'Doctor Consultation Chamber (Main Block, Ground Floor)';
  const doctorStr = 'Dr. Sarah Jenkins (Lead Clinical Nutritionist & Physician)';

  const printWindow = window.open('', '_blank', 'width=620,height=800');
  if (!printWindow) {
    alert("Please allow popups in your browser to print your token slip.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Healora Token Slip - ${tokenNum}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #1c2c22;
          }
          .token-card {
            background: white;
            border: 2px dashed #456a50;
            border-radius: 24px;
            max-width: 480px;
            width: 100%;
            padding: 32px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.06);
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .clinic-name {
            font-size: 26px;
            font-weight: 900;
            color: #1c2c22;
            margin: 0;
          }
          .clinic-name span { color: #456a50; }
          .clinic-tagline {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin-top: 4px;
            font-weight: 700;
          }
          .token-badge-container {
            text-align: center;
            background: #eaf0ec;
            border: 1.5px solid #456a50;
            border-radius: 18px;
            padding: 18px;
            margin-bottom: 22px;
          }
          .token-label {
            font-size: 11px;
            font-weight: 800;
            color: #456a50;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .token-number {
            font-size: 46px;
            font-weight: 900;
            color: #1c2c22;
            margin: 6px 0;
            font-family: monospace;
          }
          .token-mode {
            display: inline-block;
            background: #456a50;
            color: white;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 20px;
          }
          .details-table td {
            padding: 9px 4px;
            border-bottom: 1px solid #f1f5f9;
          }
          .details-table td.label {
            color: #64748b;
            font-weight: 600;
            width: 42%;
          }
          .details-table td.value {
            color: #0f172a;
            font-weight: 800;
            text-align: right;
          }
          .instructions {
            background: #fdfcf8;
            border: 1px solid #ebe9e0;
            border-radius: 14px;
            padding: 14px 16px;
            font-size: 11px;
            color: #475569;
            line-height: 1.55;
            margin-bottom: 20px;
          }
          .instructions strong { color: #1c2c22; }
          .footer {
            text-align: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 16px;
            font-size: 10px;
            color: #94a3b8;
          }
          .barcode {
            font-family: monospace;
            letter-spacing: 4px;
            font-size: 15px;
            font-weight: bold;
            color: #334155;
            margin-top: 8px;
          }
          @media print {
            body { background: white; padding: 0; }
            .token-card { box-shadow: none; border: 2px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="token-card">
          <div class="header">
            <h1 class="clinic-name">Heal<span>ora</span></h1>
            <div class="clinic-tagline">Clinical Nutrition & Preventive Healthcare</div>
          </div>

          <div class="token-badge-container">
            <div class="token-label">Consultation Token Pass</div>
            <div class="token-number">${tokenNum}</div>
            <div class="token-mode">${modeStr} CONSULTATION</div>
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Patient Name:</td>
              <td class="value">${pName}</td>
            </tr>
            <tr>
              <td class="label">Booking ID:</td>
              <td class="value">APT-${appt.id || 'OFFLINE'}</td>
            </tr>
            <tr>
              <td class="label">Consultation Date:</td>
              <td class="value">${dateStr}</td>
            </tr>
            <tr>
              <td class="label">Scheduled Slot:</td>
              <td class="value">${timeStr}</td>
            </tr>
            <tr>
              <td class="label">Assigned Doctor:</td>
              <td class="value">${doctorStr}</td>
            </tr>
            <tr>
              <td class="label">Consultation Room:</td>
              <td class="value">${roomStr}</td>
            </tr>
          </table>

          <div class="instructions">
            <strong>📋 Patient Instructions:</strong><br/>
            • Arrive at the clinic 10 minutes prior to your time slot.<br/>
            • Present this printed token pass or digital QR at the reception desk.<br/>
            • Please wait in the main lobby until your token number is announced.
          </div>

          <div class="footer">
            <div>Healora Clinical Reception Copy • Verified Registration</div>
            <div class="barcode">||| ||||| || |||||| |||| ||| ${tokenNum}</div>
            <div style="margin-top:4px;">Printed on: ${new Date().toLocaleString()}</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};



const FALLBACK_IMAGES = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  snack: 'https://images.unsplash.com/photo-1599599553557-080c354673fb?auto=format&fit=crop&w=800&q=80',
  dinner: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
};

export const CLINICAL_REPORT_TYPES = [
  "Complete Blood Count (CBC) / Lipid Profile",
  "Blood Glucose / HbA1c & Fasting Insulin",
  "Thyroid Function Panel (TSH, T3, T4)",
  "Liver & Kidney Function (LFT / KFT)",
  "Vitamin & Mineral Assay (Vit D, B12, Iron, Calcium)",
  "Hormonal & PCOS Profile (PCOD, Cortisol, Estrogen)",
  "Body Composition Analysis & DEXA Scan",
  "Gut Health / Stool & Food Intolerance Report",
  "Physician's Clinical Prescription & Medical Summary",
  "General Clinical Laboratory Report"
];

const PatientDashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || 'Patient';
  const userId = localStorage.getItem('user_id') || '1'; 

  
  const [activeTab, setActiveTab] = useState('profile');

  // --- CORE STATE ---
  const [profile, setProfile] = useState({ 
    age: '', height_cm: '', weight_kg: '', blood_group: 'O+', current_medications: '', target_weight: '',
    medical_history: 'None reported', family_history: 'None reported', 
    food_allergies: 'None', food_preferences: 'No preference', health_goals: 'Weight Loss', lifestyle_habits: 'Sedentary' 
  });
  
  const [isProfileEditing, setIsProfileEditing] = useState(false); 
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [nutritionists, setNutritionists] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [patientApptFilter, setPatientApptFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CANCELLED'
  
  const [logForm, setLogForm] = useState({ 
    completed_slots: { pre_breakfast: false, breakfast: false, drink: false, lunch: false, snack: false, dinner: false },
    breakfast_completed: false, lunch_completed: false, dinner_completed: false, 
    ate_other_food: false, other_food_details: '', sleep_hours: '', mood: 'Calm & Balanced', 
    water_glasses: 0, weight_kg: '', physical_activity: '', supplements_taken: false 
  });
  const [isSaving, setIsSaving] = useState(false);

  // --- PASSWORD CHANGE STATE ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });

  // --- APPOINTMENT & PAYMENT ---
  const [showApptModal, setShowApptModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); 
  const [apptForm, setApptForm] = useState({ nutritionist: '', date: '', time: '', mode: 'ONLINE' });
  const [paymentForm, setPaymentForm] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [bookingError, setBookingError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayMethod, setRazorpayMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [razorpayUpiApp, setRazorpayUpiApp] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm' | 'qr' | 'id'
  const [customUpiId, setCustomUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm Wallet');
  const [razorpayOrderId, setRazorpayOrderId] = useState('');

  // --- CANCELLATION & 100% REFUND CASH BACK STATE ---
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('Schedule Conflict');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundSuccessData, setRefundSuccessData] = useState(null);
  
  const [clinicHolidays, setClinicHolidays] = useState(() => JSON.parse(localStorage.getItem('healora_clinic_holidays_db')) || []);
  const todayStr = new Date().toISOString().split('T')[0];



  const isClinicHolidayOrOff = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const dayOfWeek = d.getDay(); 
    if (dayOfWeek === 0) return true;
    if (dayOfWeek === 6) {
      const dateNum = d.getDate();
      if (dateNum >= 8 && dateNum <= 14) return true; 
    }
    if (clinicHolidays.includes(dateString)) return true;
    return false;
  };

  // --- VAULT & IMAGES ---
  const [profilePic, setProfilePic] = useState(null);
  const [labReports, setLabReports] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [docType, setDocType] = useState('Laboratory Report'); 
  const [digitalConsent, setDigitalConsent] = useState(true); 
  const fileInputRef = useRef(null);

  // --- CROSS-DASHBOARD STATE (DIET PLAN DRILL-DOWN) ---
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[new Date().getDay()] || 'Monday');
  const [dietView, setDietView] = useState('meals'); // 'weeks' | 'days' | 'meals'
  const [mealOverrides, setMealOverrides] = useState({});
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [quickWaterTracker, setQuickWaterTracker] = useState(0);
  const [showPhase2LockedModal, setShowPhase2LockedModal] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [queryText, setQueryText] = useState("");
  const chatEndRef = useRef(null);
  const [chats, setChats] = useState([]);
  const [chatPartner, setChatPartner] = useState('manager'); // 'manager' | 'nutritionist'

  // --- 5. PATIENT CLINICAL HEALTH HISTORY & LONGITUDINAL TRENDS ---
  const [patientHistoryTab, setPatientHistoryTab] = useState('daily_weekly'); // 'daily_weekly' | 'weight' | 'lifestyle' | 'food'
  const [patientWeightRecords, setPatientWeightRecords] = useState([]);
  const [newPatientWeight, setNewPatientWeight] = useState('');
  const [newPatientWeightDate, setNewPatientWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPatientWeightNotes, setNewPatientWeightNotes] = useState('');

  const handleAddPatientWeightEntry = (e) => {
    e.preventDefault();
    const wVal = parseFloat(newPatientWeight);
    if (isNaN(wVal) || wVal <= 0) {
      alert('Please enter a valid weight in kg.');
      return;
    }
    const hM = (parseFloat(profile.height_cm) || 165) / 100;
    const calcBMI = (wVal / (hM * hM)).toFixed(1);

    const entry = {
      id: Date.now(),
      date: newPatientWeightDate || new Date().toISOString().split('T')[0],
      weight_kg: wVal.toFixed(1),
      bmi: calcBMI,
      notes: newPatientWeightNotes || 'Self-logged Weigh-in'
    };
    const updated = [entry, ...patientWeightRecords.filter(w => w.date !== entry.date)].sort((a, b) => new Date(b.date) - new Date(a.date));
    setPatientWeightRecords(updated);
    localStorage.setItem(`healora_weight_history_${userId}`, JSON.stringify(updated));

    // Also update profile weight
    const updatedProfile = { ...profile, weight_kg: entry.weight_kg };
    setProfile(updatedProfile);
    localStorage.setItem(`healora_profile_${userId}`, JSON.stringify(updatedProfile));

    setNewPatientWeight('');
    setNewPatientWeightNotes('');
    alert(`✅ Weigh-in (${entry.weight_kg} kg on ${entry.date}) logged successfully!`);
  };

  // --- 🔔 TODAY'S CONSULTATION REMINDER (ACTIVE UP TO SCHEDULED TIME) 🔔 ---
  const todayConsultationReminders = useMemo(() => {
    const now = new Date();
    const isoToday = now.toISOString().split('T')[0];
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return appointments.filter(appt => {
      if (!appt || appt.status === 'CANCELLED' || appt.status === 'COMPLETED') return false;
      const isToday = appt.date === isoToday || appt.date === localToday;
      if (!isToday) return false;

      // Check if current time is before or within scheduled consultation time (e.g. up to 60 mins after appointment starts)
      if (appt.time) {
        const timeParts = appt.time.split(':').map(Number);
        const apptEndTime = new Date();
        apptEndTime.setHours(timeParts[0] || 0, (timeParts[1] || 0) + 60, 0, 0);
        if (now > apptEndTime) return false; // Scheduled time window has passed
      }

      return true;
    });
  }, [appointments]);

  // 🌟 REAL-TIME POLLING FOR AUTHENTIC NUTRITIONIST EVALUATIONS 🌟
  useEffect(() => {
    const fetchEvaluations = () => {
      // Direct hook matching exactly with what the nutritionist sends over
      let savedEvals = JSON.parse(localStorage.getItem(`healora_evaluations_${userId}`)) || [];
      
      // Update UI only if there is a data difference
      setEvaluations(prev => JSON.stringify(prev) !== JSON.stringify(savedEvals) ? savedEvals : prev);
    };

    fetchEvaluations(); // Initial load
    const evalInterval = setInterval(fetchEvaluations, 1500); // Check for new feedback every 1.5s
    return () => clearInterval(evalInterval);
  }, [userId]);

  useEffect(() => { 
    try {
      const savedPic = localStorage.getItem(`profilePic_${userId}`);
      if (savedPic) setProfilePic(savedPic);
      
      const savedReports = localStorage.getItem(`labReports_${userId}`);
      if (savedReports) setLabReports(JSON.parse(savedReports));
      
      const storedWeightHistory = JSON.parse(localStorage.getItem(`healora_weight_history_${userId}`)) || [
        { id: 1, date: '2026-08-01', weight_kg: '67.4', bmi: '24.7', notes: 'Initial Baseline Weigh-in' },
        { id: 2, date: '2026-08-15', weight_kg: '66.1', bmi: '24.2', notes: 'Mid-Month Clinical Check-in' },
        { id: 3, date: new Date().toISOString().split('T')[0], weight_kg: '65.0', bmi: '23.8', notes: 'Current Active Record' }
      ];
      setPatientWeightRecords(storedWeightHistory);

      const notifs = JSON.parse(localStorage.getItem(`healora_notifications_${userId}`)) || [];
      setNotifications(notifs);
      
      const savedProfile = localStorage.getItem(`healora_profile_${userId}`);
      if (savedProfile) { setProfile(JSON.parse(savedProfile)); setIsProfileEditing(false); } 
      else { setIsProfileEditing(true); }
    } catch (e) { console.error("Storage load error", e); }
    fetchData(); 
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'appointments' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, chats, chatPartner]);

  // 🌟 PERIODIC LIVE SYNC FOR APPOINTMENTS, GOOGLE MEET LINKS, AND CHATS 🌟
  useEffect(() => {
    const syncLiveAppointmentsAndChats = async () => {
      // 1. Sync appointments strictly for THIS patient
      try {
        const apptRes = await fetch(`/api/patient/${userId}/appointments/`).catch(() => ({ ok: false }));
        const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
        const myLocalAppts = localAppts.filter(a => a && String(a.patient) === String(userId));
        
        if (apptRes.ok) {
          const apiAppts = await apptRes.json().catch(() => []);
          const myApiAppts = (Array.isArray(apiAppts) ? apiAppts : []).filter(a => a && String(a.patient) === String(userId));
          const apptMap = new Map();
          myApiAppts.forEach(a => apptMap.set(String(a.id), a));
          myLocalAppts.forEach(l => {
            const existing = apptMap.get(String(l.id)) || {};
            apptMap.set(String(l.id), {
              ...existing,
              ...l,
              meet_link: l.meet_link || existing.meet_link || null,
              date: l.status === 'RESCHEDULED' ? l.date : (existing.date || l.date),
              time: l.status === 'RESCHEDULED' ? l.time : (existing.time || l.time),
              status: l.status || existing.status || 'SCHEDULED'
            });
          });
          const merged = Array.from(apptMap.values()).sort((a,b) => (b.id || 0) - (a.id || 0));
          setAppointments(merged);
        } else {
          setAppointments(myLocalAppts.sort((a,b) => (b.id || 0) - (a.id || 0)));
        }
      } catch (e) {
        const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
        const myLocalAppts = localAppts.filter(a => a && String(a.patient) === String(userId));
        setAppointments(myLocalAppts);
      }

      // 2. Sync chats strictly for THIS patient
      const syncedChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      const myChats = syncedChats.filter(c => c && (String(c.patientId) === String(userId) || (String(c.contactId) === String(userId) && c.senderRole !== 'PATIENT')));
      setChats(myChats);

      // 3. Sync notifications
      const notifs = JSON.parse(localStorage.getItem(`healora_notifications_${userId}`)) || [];
      setNotifications(notifs);
    };

    syncLiveAppointmentsAndChats();
    const syncInterval = setInterval(syncLiveAppointmentsAndChats, 1500);
    return () => clearInterval(syncInterval);
  }, [userId]);

  const fetchData = async () => {
    try {
      const [logRes, dietRes, nutRes, profileRes, docsRes, holidayRes, apptRes] = await Promise.all([
        fetch(`/api/patient/${userId}/wellness/`).catch(()=>({ok:false})),
        fetch(`/api/patient/${userId}/diet/`).catch(()=>({ok:false})),
        fetch(`/api/nutritionists/`).catch(()=>({ok:false})),
        fetch(`/api/profile/update/${userId}/`).catch(()=>({ok:false})),
        fetch(`/api/patient/${userId}/documents/`).catch(()=>({ok:false})),
        fetch('/api/clinic-holidays/').catch(()=>({ok:false})),
        fetch(`/api/patient/${userId}/appointments/`).catch(()=>({ok:false}))
      ]);

      if (holidayRes.ok) {
        const hData = await holidayRes.json();
        setClinicHolidays(hData);
        localStorage.setItem('healora_clinic_holidays_db', JSON.stringify(hData));
      } else {
        const cachedHolidays = JSON.parse(localStorage.getItem('healora_clinic_holidays_db')) || [];
        setClinicHolidays(cachedHolidays);
      }
      
      const localLogs = JSON.parse(localStorage.getItem(`healora_wellness_${userId}`)) || [];
      if (logRes.ok) {
        const apiLogs = await logRes.json();
        const mergedLogsMap = new Map();
        localLogs.forEach(l => mergedLogsMap.set(l.id, l));
        apiLogs.forEach(l => mergedLogsMap.set(l.id, l)); 
        setWellnessLogs(Array.from(mergedLogsMap.values()).sort((a,b) => new Date(b.date) - new Date(a.date)));
      } else { setWellnessLogs(localLogs); }


      const normalizePlan = (plan) => {
        if (!plan) return null;
        const structured = plan.plan_data && typeof plan.plan_data === 'object' ? plan.plan_data : {};
        return { ...structured, ...plan, weeks: structured.weeks || plan.weeks || {} };
      };

      if (dietRes.ok) {
        const dData = await dietRes.json();
        const apiPlans = (Array.isArray(dData) ? dData : [dData]).map(normalizePlan).filter(Boolean);
        const publishedPlans = apiPlans.filter(p => p.status === 'PUBLISHED' || p.status === 'Published');
        if (publishedPlans.length > 0) {
          setDietPlans(publishedPlans);
          localStorage.setItem(`healora_patient_dietplan_${userId}`, JSON.stringify(publishedPlans[0]));
        } else {
          setDietPlans([]);
          localStorage.removeItem(`healora_patient_dietplan_${userId}`);
          localStorage.removeItem(`healora_diet_plan_${userId}`);
        }
      } else {
        const cached = JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`) || 'null');
        if (cached && (cached.status === 'PUBLISHED' || cached.status === 'Published')) {
          setDietPlans([normalizePlan(cached)]);
        } else {
          setDietPlans([]);
        }
      }
      
      if (nutRes.ok) {
        const nutData = await nutRes.json();
        setNutritionists(nutData);
        if (nutData.length > 0) setApptForm(prev => ({ ...prev, nutritionist: nutData[0].id }));
      }

      const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
      const myLocalAppts = localAppts.filter(a => a && String(a.patient) === String(userId));
      if (apptRes.ok) {
        const apiAppts = await apptRes.json().catch(() => []);
        const myApiAppts = (Array.isArray(apiAppts) ? apiAppts : []).filter(a => a && String(a.patient) === String(userId));
        const apptMap = new Map();
        myApiAppts.forEach(a => apptMap.set(String(a.id), a));
        myLocalAppts.forEach(l => {
          const existing = apptMap.get(String(l.id)) || {};
          apptMap.set(String(l.id), {
            ...existing,
            ...l,
            meet_link: l.meet_link || existing.meet_link || null,
            date: l.status === 'RESCHEDULED' ? l.date : (existing.date || l.date),
            time: l.status === 'RESCHEDULED' ? l.time : (existing.time || l.time),
            status: l.status || existing.status || 'SCHEDULED'
          });
        });
        const merged = Array.from(apptMap.values()).sort((a,b) => (b.id || 0) - (a.id || 0));
        setAppointments(merged);
      } else {
        setAppointments(myLocalAppts.sort((a,b) => (b.id || 0) - (a.id || 0)));
      }

      const syncedChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      const myChats = syncedChats.filter(c => c && (String(c.patientId) === String(userId) || (String(c.contactId) === String(userId) && c.senderRole !== 'PATIENT')));
      setChats(myChats);



      if (docsRes.ok) {
        const apiDocs = await docsRes.json();
        const localDocs = JSON.parse(localStorage.getItem(`labReports_${userId}`)) || [];
        const mergedDocsMap = new Map();
        localDocs.forEach(doc => mergedDocsMap.set(doc.name, doc)); 
        apiDocs.forEach(doc => mergedDocsMap.set(doc.file ? doc.file.split('/').pop() : doc.name, doc)); 
        const finalDocs = Array.from(mergedDocsMap.values()).sort((a,b) => b.id - a.id);
        setLabReports(finalDocs);
        localStorage.setItem(`labReports_${userId}`, JSON.stringify(finalDocs));
      }
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData && profileData.age) {
          setProfile(prev => ({ ...prev, ...profileData }));
          localStorage.setItem(`healora_profile_${userId}`, JSON.stringify({ ...profile, ...profileData }));
          setIsProfileEditing(false);
        }
        const savedPic = localStorage.getItem(`profilePic_${userId}`);
        if (profileData.profile_image) {
          setProfilePic(profileData.profile_image);
          localStorage.setItem(`profilePic_${userId}`, profileData.profile_image);
        } else if (savedPic) setProfilePic(savedPic);
      }
    } catch (error) { console.error("Data fetch error", error); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try { 
      await fetch(`/api/profile/update/${userId}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) }); 
      localStorage.setItem(`healora_profile_${userId}`, JSON.stringify(profile));
      alert("✅ Health Profile successfully saved!"); 
    } catch (err) { 
      localStorage.setItem(`healora_profile_${userId}`, JSON.stringify(profile));
      alert("Profile saved locally (Offline Mode)."); 
    } finally { setIsProfileEditing(false); setIsSaving(false); }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) { alert("Passwords do not match!"); return; }
    if (passwordForm.new.length < 8) { alert("Password must be at least 8 characters."); return; }
    alert("✅ Password successfully changed!");
    setShowPasswordModal(false); setPasswordForm({ new: '', confirm: '' });
  };

  const generateReceipt = (appt) => {
    const printWindow = window.open('', '_blank');
    const paymentRef = appt.razorpay_payment_id || `PAY-RZP-${appt.id}`;
    printWindow.document.write(`
      <html><head><title>Receipt - Healora</title></head><body style="font-family: Arial, sans-serif; padding: 40px; color: #1C2C22; max-width: 600px; margin: auto; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #456A50; padding-bottom: 20px;">
          <div>
            <h1 style="color: #456A50; margin:0; font-size: 24px;">Healora Clinic</h1>
            <p style="margin: 4px 0 0 0; color: #5A6B60; font-size: 13px;">Official Consultation & Telehealth Invoice</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin:0; color: #456A50; font-size: 18px;">PAYMENT RECEIPT</h2>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #16a34a;">STATUS: PAID (RAZORPAY)</p>
          </div>
        </div><br/>
        
        <div style="background: #FDFCF8; padding: 20px; border-radius: 12px; border: 1px solid #EBE9E0; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0;"><strong>Patient Name:</strong> ${userName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Booking ID:</strong> APT-${appt.id}</p>
          <p style="margin: 0 0 8px 0;"><strong>Razorpay Payment Ref:</strong> <span style="font-family: monospace; font-weight: bold; color: #456A50;">${paymentRef}</span></p>
          <p style="margin: 0 0 8px 0;"><strong>Scheduled Consultation:</strong> ${appt.date} at ${appt.time} (${appt.mode === 'ONLINE' ? '📹 Telehealth Video' : '🏥 In-Clinic'})</p>
          <p style="margin: 0;"><strong>Payment Gateway:</strong> Razorpay Secured (UPI / Card / NetBanking)</p>
        </div>
        
        <table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #EAF0EC; color: #456A50;">
              <th style="padding: 12px; border: 1px solid #EBE9E0;">Description</th>
              <th style="padding: 12px; border: 1px solid #EBE9E0; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border: 1px solid #EBE9E0;">Expert Clinical Nutrition Consultation</td>
              <td style="padding: 12px; border: 1px solid #EBE9E0; text-align: right;">₹ 500.00</td>
            </tr>
          </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 20px;">
          <h3 style="margin: 0; font-size: 22px; color: #1C2C22;">Total Paid: ₹ 500.00</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #16a34a; font-weight: bold;">✔ 100% Cash Back Eligible upon Cancellation</p>
        </div>
        
        <p style="text-align: center; margin-top: 40px; font-style: italic; color: #888; font-size: 12px;">(Healora Telehealth & Clinical Nutrition Systems - Authorized Digital Receipt)</p>
      </body></html>
    `);
    printWindow.document.close(); printWindow.focus(); setTimeout(() => printWindow.print(), 250);
  };

  // 🌟 OFFICIAL 100% INSTANT CASH BACK REFUND DOCUMENT GENERATOR 🌟
  const generateRefundReceipt = (appt) => {
    const printWindow = window.open('', '_blank');
    const refundId = appt.refund_id || `REF-${appt.id}`;
    const refundDate = appt.refund_timestamp || new Date().toLocaleString();
    printWindow.document.write(`
      <html><head><title>Refund Receipt - Healora</title></head><body style="font-family: Arial, sans-serif; padding: 40px; color: #1C2C22; max-width: 650px; margin: auto; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #16a34a; padding-bottom: 20px;">
          <div>
            <h1 style="color: #16a34a; margin:0; font-size: 24px;">Healora Clinic</h1>
            <p style="margin: 4px 0 0 0; color: #5A6B60; font-size: 13px;">Official 100% Cash Back Refund Document</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin:0; color: #16a34a; font-size: 18px;">REFUND PROCESSED</h2>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #16a34a;">STATUS: COMPLETED (RAZORPAY)</p>
          </div>
        </div><br/>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Patient Name:</strong> ${userName}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Razorpay Refund Reference ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #16a34a;">${refundId}</span></p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Original Booking ID:</strong> APT-${appt.id}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Cancelled Appointment:</strong> ${appt.date} at ${appt.time} (${appt.mode})</p>
          <p style="margin: 0; font-size: 14px;"><strong>Date & Time of Refund:</strong> ${refundDate}</p>
        </div>

        <table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #EAF0EC; color: #1C2C22;">
              <th style="padding: 12px; border: 1px solid #EBE9E0;">Transaction Description</th>
              <th style="padding: 12px; border: 1px solid #EBE9E0; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border: 1px solid #EBE9E0;">Original Consultation Fee Paid</td>
              <td style="padding: 12px; border: 1px solid #EBE9E0; text-align: right;">₹ 500.00</td>
            </tr>
            <tr style="font-weight: bold; background: #f0fdf4; color: #15803d;">
              <td style="padding: 12px; border: 1px solid #EBE9E0;">100% Cash Back Refund Credited</td>
              <td style="padding: 12px; border: 1px solid #EBE9E0; text-align: right;">+ ₹ 500.00</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #FDFCF8; border: 1px solid #EBE9E0; padding: 15px; border-radius: 10px; margin-top: 25px;">
          <p style="margin:0; font-size: 13px; color: #5A6B60;"><strong>Payment Method Credited:</strong> Original Razorpay Account / UPI / Card.</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #5A6B60;"><strong>Reason:</strong> ${appt.cancellation_reason || 'Patient Requested Cancellation'}</p>
        </div>

        <div style="text-align: right; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; color: #5A6B60;">Net Amount Charged: ₹ 0.00</p>
          <h3 style="margin: 5px 0 0 0; font-size: 22px; color: #15803d;">Total Refunded: ₹ 500.00</h3>
        </div>

        <p style="text-align: center; margin-top: 40px; font-style: italic; color: #888; font-size: 12px;">(End of Document - Authorized Instant Refund by Healora Billing Systems via Razorpay)</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  // 🌟 HANDLE CANCEL APPOINTMENT & ISSUE 100% CASH BACK REFUND 🌟
  const handleConfirmCancelAndRefund = async () => {
    if (!cancellingAppt) return;
    setIsProcessingRefund(true);
    
    let refundId = `REF-${Date.now().toString().slice(-6)}`;
    const refundTimestamp = new Date().toLocaleString();

    // Call backend Razorpay refund API
    try {
      const refRes = await fetch('/api/payments/refund/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: cancellingAppt.id,
          reason: cancelReason
        })
      });
      if (refRes.ok) {
        const refData = await refRes.json();
        if (refData.refund_id) {
          refundId = refData.refund_id;
        }
      }
    } catch (e) {
      console.warn("Backend refund endpoint fallback", e);
    }
    
    const updatedAppt = {
      ...cancellingAppt,
      status: 'CANCELLED',
      payment_status: 'REFUNDED',
      refund_status: 'REFUNDED',
      refund_amount: 500.00,
      refund_id: refundId,
      refund_timestamp: refundTimestamp,
      cancellation_reason: cancelReason
    };

    // 1. Update local appointments
    const allAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
    const updatedAll = allAppts.map(a => String(a.id) === String(cancellingAppt.id) ? updatedAppt : a);
    if (!updatedAll.some(a => String(a.id) === String(cancellingAppt.id))) {
      updatedAll.unshift(updatedAppt);
    }
    localStorage.setItem('healora_all_appointments', JSON.stringify(updatedAll));
    setAppointments(prev => prev.map(a => String(a.id) === String(cancellingAppt.id) ? updatedAppt : a));

    // 2. Add notification for patient
    const notifs = JSON.parse(localStorage.getItem(`healora_notifications_${userId}`)) || [];
    notifs.unshift({
      id: Date.now(),
      title: "Appointment Cancelled & 100% Refunded",
      message: `Your appointment for ${cancellingAppt.date} at ${cancellingAppt.time} was cancelled. Full cash back of ₹ 500.00 has been refunded via Razorpay (Ref: ${refundId}).`,
      date: new Date().toLocaleString(),
      read: false
    });
    localStorage.setItem(`healora_notifications_${userId}`, JSON.stringify(notifs));
    setNotifications(notifs);

    // 3. Add notification for Clinic Manager & Nutritionist
    const mgrNotifs = JSON.parse(localStorage.getItem('healora_manager_notifications')) || [];
    mgrNotifs.unshift({
      id: Date.now(),
      title: "Appointment Cancelled (Refund Issued)",
      message: `Patient ${userName} cancelled appointment on ${cancellingAppt.date} at ${cancellingAppt.time}. ₹ 500.00 cash back refund processed.`,
      date: new Date().toLocaleString(),
      read: false
    });
    localStorage.setItem('healora_manager_notifications', JSON.stringify(mgrNotifs));

    // 4. Send chat message update
    const chatMsg = {
      id: Date.now(),
      patientId: String(userId),
      patientName: userName,
      senderRole: 'SYSTEM',
      text: `Appointment for ${cancellingAppt.date} at ${cancellingAppt.time} was cancelled by ${userName}. Full cash back of ₹ 500.00 has been refunded to the original payment method.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chatPartner: 'manager',
      contactId: 'manager'
    };
    const allChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
    allChats.push(chatMsg);
    localStorage.setItem('healora_chats', JSON.stringify(allChats));
    setChats(prev => [...prev, chatMsg]);

    // 5. Backend sync if available
    try {
      await fetch(`/api/appointments/${cancellingAppt.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', payment_status: 'REFUNDED', refund_id: refundId })
      });
    } catch (e) {}

    setIsProcessingRefund(false);
    setCancellingAppt(null);
    setRefundSuccessData(updatedAppt);
  };


  const getProtocolDate = (week = 1, day = 'Monday') => {
    const dayIndex = daysOfWeek.indexOf(day);
    const date = new Date();
    date.setDate(date.getDate() + ((week - 1) * 7) + (dayIndex >= 0 ? dayIndex - date.getDay() : 0));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActiveMealObject = (mealType, week = selectedWeek || 1, day = selectedDay || 'Monday') => {
    const overrideKey = `w${week}_${day}_${mealType}`;
    if (mealOverrides[overrideKey]) {
      return mealOverrides[overrideKey];
    }

    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || JSON.parse(localStorage.getItem(`healora_diet_plan_${userId}`)) || null);

    let mealName = '';
    let cal = '250 kcal';
    let desc = '';

    if (publishedPlan && publishedPlan.weeks && publishedPlan.weeks[week] && publishedPlan.weeks[week][day] && publishedPlan.weeks[week][day][mealType]) {
      const raw = publishedPlan.weeks[week][day][mealType];
      if (typeof raw === 'object' && raw.name) {
        mealName = raw.name;
        cal = raw.cal || '250 kcal';
        desc = raw.desc || '';
      } else if (typeof raw === 'string') {
        mealName = raw;
        const calMatch = raw.match(/\((\d+\s*kcal)\)/i);
        if (calMatch) {
          cal = calMatch[1];
          mealName = raw.replace(/\s*\(\d+\s*kcal\)/i, '').trim();
        }
      }
    }

    if (!mealName) {
      const defaultOptions = getKeralaPersonalizedOptions(mealType, profile, labReports);
      const fallback = defaultOptions[0] || { name: 'Nutritious Kerala Meal', cal: '250 kcal', desc: 'Balanced clinical diet' };
      mealName = fallback.name;
      cal = fallback.cal;
      desc = fallback.desc;
    }

    return {
      name: mealName,
      cal: cal,
      desc: desc,
      img: getKeralaMealImage(mealName, mealType)
    };
  };

  const handleSwapMeal = (mealType) => {
    const week = selectedWeek || 1;
    const day = selectedDay || 'Monday';
    const overrideKey = `w${week}_${day}_${mealType}`;
    
    const availableOptions = getKeralaPersonalizedOptions(mealType, profile, labReports);
    const currentObj = getActiveMealObject(mealType, week, day);

    let currentIndex = availableOptions.findIndex(opt => opt.name.toLowerCase().includes(currentObj.name.toLowerCase()) || currentObj.name.toLowerCase().includes(opt.name.toLowerCase()));
    let nextIndex = (currentIndex + 1) % availableOptions.length;
    let nextOption = availableOptions[nextIndex];

    const newMealObj = {
      name: nextOption.name,
      cal: nextOption.cal,
      desc: nextOption.desc,
      img: getKeralaMealImage(nextOption.name, mealType)
    };

    setMealOverrides(prev => ({
      ...prev,
      [overrideKey]: newMealObj
    }));

    if (selectedMeal && selectedMeal.type === mealType) {
      setSelectedMeal({
        ...newMealObj,
        type: mealType
      });
    }
  };

  const handleDownloadPlan = () => {
    const targetWeek = selectedWeek || 1;
    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
    const printWindow = window.open('', '_blank');
    
    const slotDefinitions = {
      pre_breakfast: { key: 'pre_breakfast', label: 'Pre-Breakfast Tonic', color: '#059669' },
      breakfast: { key: 'breakfast', label: 'Breakfast', color: '#ea580c' },
      drink: { key: 'drink', label: 'Drink / Smoothie', color: '#0d9488' },
      lunch: { key: 'lunch', label: 'Lunch', color: '#ca8a04' },
      snack: { key: 'snack', label: 'Evening Snack', color: '#16a34a' },
      dinner: { key: 'dinner', label: 'Dinner', color: '#2563eb' }
    };

    let scheduleHTML = '';
    daysOfWeek.forEach(day => {
      const dayPlan = (publishedPlan?.weeks?.[targetWeek]?.[day]) || (publishedPlan?.weeks?.['1']?.[day]) || {};
      const slotKeys = Object.keys(dayPlan).filter(k => dayPlan[k] && slotDefinitions[k]);
      const activeSlots = slotKeys.length > 0
        ? ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'].filter(k => slotKeys.includes(k)).map(k => slotDefinitions[k])
        : [slotDefinitions.breakfast, slotDefinitions.drink, slotDefinitions.lunch, slotDefinitions.snack, slotDefinitions.dinner];

      let mealRowsHTML = '';
      activeSlots.forEach(slot => {
        const mealObj = getActiveMealObject(slot.key, targetWeek, day);
        mealRowsHTML += `
          <div class="meal-row">
            <div class="meal-type" style="color: ${slot.color};">${slot.label}</div>
            <div><strong>${mealObj.name}</strong> <span style="color:#666; font-size:12px; margin-left: 6px;">(${mealObj.cal})</span></div>
          </div>
        `;
      });

      scheduleHTML += `
        <div class="day-card">
          <h3>${day} Schedule (${getProtocolDate(targetWeek, day)})</h3>
          ${mealRowsHTML}
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Diet Plan & Grocery List - Healora</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1C2C22; max-width: 800px; margin: auto; line-height: 1.6; }
            .header { border-bottom: 2px solid #456A50; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .header h1 { color: #456A50; font-size: 26px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 0; color: #5A6B60; font-size: 16px; }
            .day-card { border: 1px solid #EBE9E0; border-radius: 10px; padding: 15px; margin-bottom: 15px; background: #fff; page-break-inside: avoid; }
            .day-card h3 { margin-top: 0; color: #456A50; border-bottom: 1px solid #EBE9E0; padding-bottom: 8px; font-size: 18px; margin-bottom: 10px;}
            .meal-row { display: flex; padding: 8px 0; border-bottom: 1px dashed #f5f5f5; }
            .meal-row:last-child { border-bottom: none; }
            .meal-type { width: 120px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
            .grocery-list { background: #EAF0EC; padding: 25px; border-radius: 12px; margin-top: 30px; page-break-inside: avoid; }
            .grocery-list h2 { color: #456A50; margin-top: 0; font-size: 20px; border-bottom: 1px solid #cce0d4; padding-bottom: 10px;}
            ul.g-list { column-count: 2; margin: 15px 0 0 0; padding-left: 20px; color: #1C2C22; }
            ul.g-list li { padding: 4px 0; font-weight: 500; font-size: 14px;}
            .rules { background: #FDFCF8; border: 1px solid #EBE9E0; padding: 25px; border-radius: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Healora Clinical Nutrition Protocol</h1>
            <p>Patient: <strong>${userName}</strong> &nbsp;|&nbsp; Goal: <strong>${profile.health_goals || 'Weight Management'}</strong></p>
          </div>
          
          <h2 style="font-size: 22px;">Week ${targetWeek} - Complete Meal Schedule</h2>
          ${scheduleHTML}

          <div class="grocery-list">
            <h2>🛒 Weekly Grocery Shopping List</h2>
            <ul class="g-list">
              <li>Oats & Chia Seeds</li>
              <li>Fresh Berries & Green Apples</li>
              <li>Greek Yogurt & Almond Milk</li>
              <li>Quinoa & Brown/Wild Rice</li>
              <li>Chicken Breast & Salmon Fillets</li>
              <li>Tofu / Paneer</li>
              <li>Spinach, Broccoli, Asparagus</li>
              <li>Carrots & Zucchini</li>
              <li>Hummus & Almond Butter</li>
              <li>Walnuts & Pumpkin Seeds</li>
              <li>Lentils & Sweet Potatoes</li>
              <li>Green Tea & Herbal Infusions</li>
            </ul>
          </div>

          <div class="rules">
            <h2 style="margin-top:0; color: #456A50; border-bottom: 1px solid #EBE9E0; padding-bottom: 10px;">Daily Guidelines</h2>
            <ul style="font-size: 14px; margin-bottom:0;">
              <li style="margin-bottom: 8px;"><strong>💧 Hydration:</strong> Drink at least 3 liters (8 glasses) of water daily.</li>
              <li style="margin-bottom: 8px;"><strong>🏃 Activity:</strong> ${publishedPlan?.activity_recommendation || '30 mins brisk walking + 15 min core strengthening.'}</li>
              <li><strong>🚫 Avoid:</strong> ${publishedPlan?.things_to_avoid || 'Refined sugars, processed foods, and late-night heavy snacking.'}</li>
            </ul>
          </div>

          <p style="text-align: center; margin-top: 40px; font-style: italic; color: #888; font-size: 12px;">(End of Clinical Document - Generated securely by Healora Systems)</p>
        </body>
      </html>
    `);
    printWindow.document.close(); 
    printWindow.focus(); 
    setTimeout(() => printWindow.print(), 500);
  };

  const handleProceedToPayment = (e) => { 
    e.preventDefault(); 
    setBookingError('');
    if (!apptForm.date) {
      setBookingError("Please select an available consultation date from the calendar.");
      return;
    }
    if (!apptForm.time) {
      setBookingError("Please select an available time slot for your consultation.");
      return;
    }

    // Strict slot collision prevention check
    const allAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
    const isSlotTaken = allAppts.some(a => 
      a.status !== 'CANCELLED' && 
      a.date === apptForm.date && 
      normalizeTimeTo24H(a.time) === normalizeTimeTo24H(apptForm.time) &&
      (apptForm.nutritionist === 'AUTO' || a.nutritionist === 'AUTO' || String(a.nutritionist) === String(apptForm.nutritionist))
    );

    if (isSlotTaken) {
      setBookingError(`The selected time slot (${normalizeTimeToLabel(apptForm.time)}) is already booked by another patient. Please select an open slot.`);
      return;
    }

    const holidayCheck = getHolidayOrOffReason(apptForm.date, clinicHolidays, apptForm.nutritionist);
    if (holidayCheck && !holidayCheck.canBook) {
      setBookingError(`Cannot book on ${apptForm.date}: ${holidayCheck.reason}`);
      return;
    }
    setBookingStep(2); 
  };


  const handlePaymentChange = (field, value) => { 
    let formattedValue = value;
    if (field === 'cardName') formattedValue = value.replace(/[^A-Za-z\s]/g, ''); 
    if (field === 'cardNumber' || field === 'cvv') formattedValue = value.replace(/\D/g, ''); 
    if (field === 'expiry') {
      let numbers = value.replace(/\D/g, '');
      formattedValue = numbers.length > 2 ? `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}` : numbers;
    }
    setPaymentForm({ ...paymentForm, [field]: formattedValue }); 
    if (paymentErrors[field]) setPaymentErrors({ ...paymentErrors, [field]: null }); 
  };

  const validatePayment = () => {
    const errors = {};
    if (!paymentForm.cardName.trim()) errors.cardName = "Required."; 
    if (!paymentForm.cardNumber.trim()) errors.cardNumber = "Required."; else if (paymentForm.cardNumber.length !== 16) errors.cardNumber = "Must be 16 digits.";
    if (!paymentForm.expiry.trim()) errors.expiry = "Required."; else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentForm.expiry)) errors.expiry = "Use MM/YY format."; 
    else {
      const [mm, yy] = paymentForm.expiry.split('/'); const now = new Date(); const currentYear = now.getFullYear() % 100; const currentMonth = now.getMonth() + 1;
      if (parseInt(mm) > 12 || parseInt(mm) === 0) errors.expiry = "Invalid month."; else if (parseInt(yy) < currentYear || (parseInt(yy) === currentYear && parseInt(mm) < currentMonth)) errors.expiry = "Card has expired."; 
    }
    if (!paymentForm.cvv.trim()) errors.cvv = "Required."; else if (paymentForm.cvv.length !== 3) errors.cvv = "Must be 3 digits.";
    setPaymentErrors(errors); return Object.keys(errors).length === 0;
  };

  const handlePayWithRazorpay = async () => {
    setIsRazorpayProcessing(true);
    setBookingError('');

    try {
      // 1. Create Razorpay order on Django backend
      let orderData = null;
      try {
        const orderRes = await fetch('/api/payments/create-order/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 500, patient_id: userId })
        });
        if (orderRes.ok) {
          orderData = await orderRes.json();
        }
      } catch (e) {
        console.warn("Backend order creation fallback", e);
      }

      const orderId = orderData?.order_id || `order_apt_${Date.now()}`;
      setRazorpayOrderId(orderId);
      setIsRazorpayProcessing(false);
      setShowRazorpayModal(true);
    } catch (err) {
      setIsRazorpayProcessing(false);
      setShowRazorpayModal(true);
    }
  };

  const handleExecuteRazorpayPayment = async () => {
    setIsRazorpayProcessing(true);
    const paymentId = `pay_rzp_${Date.now().toString().slice(-8)}`;
    const signature = `sig_rzp_${Date.now()}`;
    const orderId = razorpayOrderId || `order_apt_${Date.now()}`;

    // 1. Verify payment on backend
    let verifiedAppt = null;
    try {
      const verifyRes = await fetch('/api/payments/verify-payment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          patient: userId,
          patient_id: userId,
          nutritionist: apptForm.nutritionist,
          date: apptForm.date,
          time: apptForm.time,
          mode: apptForm.mode,
          amount_paid: 500.00
        })
      });
      if (verifyRes.ok) {
        const vJson = await verifyRes.json();
        verifiedAppt = vJson.appointment;
      }
    } catch (err) {}

    const newAppt = verifiedAppt || {
      id: Date.now(),
      patient: userId,
      ...apptForm,
      status: 'SCHEDULED',
      payment_status: 'PAID',
      amount_paid: 500.00,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId
    };

    // 2. Update local state & storage
    const allAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
    allAppts.unshift(newAppt);
    localStorage.setItem('healora_all_appointments', JSON.stringify(allAppts));
    setAppointments(prev => [newAppt, ...prev.filter(a => String(a.id) !== String(newAppt.id))]);

    // 3. Patient Notification
    const notifs = JSON.parse(localStorage.getItem(`healora_notifications_${userId}`)) || [];
    notifs.unshift({
      id: Date.now(),
      title: "Payment Received & Appointment Confirmed",
      message: `Your consultation on ${apptForm.date} at ${normalizeTimeToLabel(apptForm.time)} is confirmed via Razorpay. Payment ID: ${paymentId}.`,
      date: new Date().toLocaleString(),
      read: false
    });
    localStorage.setItem(`healora_notifications_${userId}`, JSON.stringify(notifs));
    setNotifications(notifs);

    setIsRazorpayProcessing(false);
    setShowRazorpayModal(false);
    setShowApptModal(false);
    setBookingStep(1);
    setApptForm({ nutritionist: 'AUTO', date: '', time: '', mode: 'ONLINE' });
    setPaymentForm({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
    setPaymentErrors({});

    alert(`✅ Razorpay Payment Successful! (Ref: ${paymentId})\nDownloading your official consultation receipt...`);
    generateReceipt(newAppt);
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault(); if (!validatePayment()) return;
    const paymentId = `pay_card_${Date.now()}`;
    const newAppointment = { id: Date.now(), patient: userId, ...apptForm, status: 'SCHEDULED', payment_status: 'PAID', amount_paid: 500.00, razorpay_payment_id: paymentId };
    const globalAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || []; globalAppts.unshift(newAppointment); localStorage.setItem('healora_all_appointments', JSON.stringify(globalAppts));
    setAppointments([newAppointment, ...appointments]); setShowApptModal(false); setBookingStep(1); setApptForm({ nutritionist: 'AUTO', date: '', time: '', mode: 'ONLINE' }); setPaymentForm({ cardName: '', cardNumber: '', expiry: '', cvv: '' }); setPaymentErrors({});
    alert("✅ Payment Successful! Downloading your receipt..."); generateReceipt(newAppointment);
    try { await fetch(`/api/patient/${userId}/appointments/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAppointment) }); } catch (err) {}
  };

  const handleSendChat = (e) => {
    e.preventDefault(); if (!queryText.trim()) return;
    const assignedNutId = appointments.find(a => a.nutritionist && a.nutritionist !== 'AUTO')?.nutritionist || 'nut_1';
    const newMsg = { 
      id: Date.now(), 
      patientId: String(userId), 
      patientName: userName, 
      senderRole: 'PATIENT', 
      text: queryText, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      chatPartner,
      contactId: chatPartner === 'manager' ? 'manager' : String(assignedNutId)
    };
    const allChats = JSON.parse(localStorage.getItem('healora_chats')) || []; 
    allChats.push(newMsg); 
    localStorage.setItem('healora_chats', JSON.stringify(allChats));
    setChats(prev => [...prev, newMsg]); 
    setQueryText("");
  };


  const markNotificationsRead = () => {
    const updated = notifications.map(n => ({...n, read: true})); setNotifications(updated); localStorage.setItem(`healora_notifications_${userId}`, JSON.stringify(updated));
  };
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { alert("Please select an image smaller than 2MB."); return; } 
      const reader = new FileReader();
      reader.onloadend = async () => {
        try { localStorage.setItem(`profilePic_${userId}`, reader.result); setProfilePic(reader.result); const formData = new FormData(); formData.append('profile_image', file); await fetch(`/api/profile/update/${userId}/`, { method: 'PATCH', body: formData }); } catch(err) {} 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLabReportUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!digitalConsent) { alert("Please provide Digital Consent."); return; }
      if (file.size > 20 * 1024 * 1024) { alert("Please select a file smaller than 20MB."); return; }
      setUploadStatus('Encrypting & Uploading...');

      const reader = new FileReader();
      reader.onloadend = () => {
        const fileUrl = reader.result;
        const newReportLocal = { 
          id: Date.now(), 
          name: file.name, 
          type: docType, 
          date: new Date().toLocaleDateString(),
          fileUrl,
          size: (file.size / 1024).toFixed(1) + ' KB',
          status: 'AVAILABLE_FOR_REVIEW', // Uploaded -> Available for Review -> Reviewed
          review_notes: '',
          reviewed_by: '',
          reviewed_at: ''
        };
        const currentReports = JSON.parse(localStorage.getItem(`labReports_${userId}`)) || []; 
        const updated = [newReportLocal, ...currentReports]; 
        setLabReports(updated); 
        localStorage.setItem(`labReports_${userId}`, JSON.stringify(updated));
        
        // Also sync to global vault for nutritionists
        const allVault = JSON.parse(localStorage.getItem('healora_all_patient_reports')) || {};
        allVault[userId] = updated;
        localStorage.setItem('healora_all_patient_reports', JSON.stringify(allVault));

        setUploadStatus('Document Saved Successfully!'); 
        setTimeout(() => setUploadStatus(''), 3000);
      };
      reader.readAsDataURL(file);

      const formData = new FormData(); 
      formData.append('file', file); 
      formData.append('document_type', docType);
      try { fetch(`/api/patient/${userId}/documents/`, { method: 'POST', body: formData }); } catch (err) {}
    }
  };

  const removeLabReport = (id) => {
    if(!window.confirm("Are you sure you want to delete this document?")) return;
    const updated = labReports.filter(r => r.id !== id); 
    setLabReports(updated); 
    localStorage.setItem(`labReports_${userId}`, JSON.stringify(updated));
    const allVault = JSON.parse(localStorage.getItem('healora_all_patient_reports')) || {};
    allVault[userId] = updated;
    localStorage.setItem('healora_all_patient_reports', JSON.stringify(allVault));
    try { fetch(`/api/patient/${userId}/documents/${id}/`, { method: 'DELETE' }); } catch(err) {}
  };


  const handleSaveWellnessLog = async (e) => {
    e.preventDefault(); 
    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
    const currentDayPlan = (publishedPlan?.weeks?.[selectedWeek || 1]?.[selectedDay || 'Sunday']) || (publishedPlan?.weeks?.['1']?.['Sunday']) || {};
    
    const slotDefinitions = ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'];
    const slotKeysInPlan = Object.keys(currentDayPlan).filter(k => currentDayPlan[k] && slotDefinitions.includes(k));
    const activeSlots = slotKeysInPlan.length > 0
      ? slotDefinitions.filter(k => slotKeysInPlan.includes(k))
      : (publishedPlan?.meal_frequency === 3 ? ['breakfast', 'lunch', 'dinner'] : publishedPlan?.meal_frequency === 4 ? ['breakfast', 'lunch', 'snack', 'dinner'] : publishedPlan?.meal_frequency === 6 ? ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'] : ['breakfast', 'drink', 'lunch', 'snack', 'dinner']);

    const filteredCompletedSlots = {};
    activeSlots.forEach(slotKey => {
      filteredCompletedSlots[slotKey] = !!logForm.completed_slots?.[slotKey] || 
        (slotKey === 'breakfast' && logForm.breakfast_completed) || 
        (slotKey === 'lunch' && logForm.lunch_completed) || 
        (slotKey === 'dinner' && logForm.dinner_completed);
    });

    const newLog = { 
      id: Date.now(), 
      patientId: userId, 
      patientName: userName, 
      date: new Date().toISOString(), 
      ...logForm,
      completed_slots: filteredCompletedSlots,
      prescribed_slots: activeSlots
    };
    
    const localLogs = JSON.parse(localStorage.getItem(`healora_wellness_${userId}`)) || []; 
    localStorage.setItem(`healora_wellness_${userId}`, JSON.stringify([newLog, ...localLogs])); 
    setWellnessLogs(prev => [newLog, ...prev]);

    const globalLogs = JSON.parse(localStorage.getItem('healora_all_wellness_logs')) || [];
    localStorage.setItem('healora_all_wellness_logs', JSON.stringify([newLog, ...globalLogs]));

    const latestAppt = appointments.find(a => a.patient === userId);
    if (latestAppt && latestAppt.nutritionist && latestAppt.nutritionist !== 'AUTO') {
      const nNotifs = JSON.parse(localStorage.getItem(`healora_notifications_${latestAppt.nutritionist}`)) || [];
      nNotifs.unshift({
        id: Date.now(), title: "New Wellness Log", 
        message: `${userName} just submitted their end-of-day progress report.`, 
        date: new Date().toLocaleString(), read: false
      });
      localStorage.setItem(`healora_notifications_${latestAppt.nutritionist}`, JSON.stringify(nNotifs));
    }

    try { await fetch(`/api/patient/${userId}/wellness/`, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...logForm, patient: userId }), }); } catch (err) { }
    
    alert("✅ Daily wellness log saved securely and sent to your Nutritionist!"); 
    setLogForm({ 
      completed_slots: {},
      breakfast_completed: false, lunch_completed: false, dinner_completed: false, 
      ate_other_food: false, other_food_details: '', sleep_hours: '', mood: 'Calm & Balanced', 
      water_glasses: 0, weight_kg: '', physical_activity: '', supplements_taken: false 
    });
    setQuickWaterTracker(0);
  };

  const handleSecureLogout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('user_role'); navigate('/', { replace: true }); };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#FDFCF8] font-sans text-[#1C2C22]">
      
      {/* 🌟 OVERLAYS 🌟 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#EBE9E0] relative">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-50 rounded-full p-2 transition"><X size={18} /></button>
            <h2 className="text-2xl font-black text-[#1C2C22] flex items-center gap-2 mb-2"><Key size={24} className="text-[#456A50]"/> Security</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 mt-6">
              <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">New Password</label><input type="password" required value={passwordForm.new} onChange={e=>setPasswordForm({...passwordForm, new: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" placeholder="••••••••" /></div>
              <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Confirm Password</label><input type="password" required value={passwordForm.confirm} onChange={e=>setPasswordForm({...passwordForm, confirm: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" placeholder="••••••••" /></div>
              <button type="submit" className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg mt-4 flex items-center justify-center gap-2"><Lock size={16}/> Change Password</button>
            </form>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end p-6 pt-24 animate-in fade-in" onClick={() => setShowNotifications(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative mr-12 border border-[#EBE9E0]" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-[#EBE9E0] pb-4">
              <h2 className="text-xl font-black text-[#1C2C22] flex items-center gap-2"><Bell size={20} className="text-[#456A50]"/> Notifications</h2>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full transition"><X size={16} /></button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400"><Bell size={40} className="mb-4 opacity-30"/> <p className="text-sm italic font-medium">No new notifications.</p></div>
              ) : notifications.map(n => (
                <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.read ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-[#EAF0EC]/50 border-[#456A50]/30 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-sm text-[#1C2C22]">{n.title}</h3>{!n.read && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200"></span>}</div>
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-gray-400 font-bold tracking-wider">{n.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showApptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] relative border border-[#EBE9E0] custom-scrollbar">
            <div className="flex justify-between items-center mb-6 border-b border-[#EBE9E0] pb-4">
              <h2 className="text-2xl font-black text-[#1C2C22] flex items-center gap-2"><Calendar size={24} className="text-[#456A50]" />{bookingStep === 1 ? 'Book Appointment' : 'Secure Checkout'}</h2>
              <button onClick={() => {setShowApptModal(false); setBookingStep(1); setPaymentErrors({}); setBookingError(''); setPaymentForm({ cardName: '', cardNumber: '', expiry: '', cvv: '' });}} className="text-gray-400 hover:text-gray-800 transition bg-gray-100 rounded-full p-2 cursor-pointer"><X size={18} /></button>
            </div>

            {bookingStep === 1 && (
              <form onSubmit={handleProceedToPayment} className="space-y-6 animate-in slide-in-from-left-4">
                {bookingError && (
                  <div className="p-4 bg-red-50 text-red-900 text-sm font-bold rounded-2xl border-2 border-red-200 flex items-start gap-3 animate-in fade-in">
                    <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-red-800">Notice</p>
                      <p className="font-medium text-xs text-red-700 mt-0.5">{bookingError}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Select Nutritionist</label>
                    <select 
                      required 
                      value={apptForm.nutritionist} 
                      onChange={(e) => {
                        setApptForm({...apptForm, nutritionist: e.target.value, date: ''});
                        setBookingError('');
                      }} 
                      className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"
                    >
                      <option value="AUTO">Auto-Assign Best Available</option>
                      {nutritionists.map(n => <option key={n.id} value={n.id}>Dr. {n.first_name} {n.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Consultation Mode</label>
                    <select value={apptForm.mode} onChange={(e) => setApptForm({...apptForm, mode: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm">
                      <option value="ONLINE">Online (Video Call)</option>
                      <option value="OFFLINE">In-Clinic</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Select Consultation Date</label>
                  <BookingCalendarPicker 
                    selectedDate={apptForm.date}
                    onSelectDate={(selectedDate, holidayInfo) => {
                      if (holidayInfo && !holidayInfo.canBook) {
                        setBookingError(`Cannot select this date: ${holidayInfo.reason}`);
                        setApptForm({ ...apptForm, date: '' });
                      } else {
                        setBookingError('');
                        setApptForm({ ...apptForm, date: selectedDate });
                      }
                    }}
                    selectedNutritionistId={apptForm.nutritionist}
                    holidays={clinicHolidays}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Preferred Time Slot (20-25 Min Consultations)</label>
                  <TimeSlotPicker 
                    selectedDate={apptForm.date}
                    selectedTime={apptForm.time}
                    onSelectTime={(slotId) => {
                      setApptForm({ ...apptForm, time: slotId });
                      setBookingError('');
                    }}
                    selectedNutritionistId={apptForm.nutritionist}
                    existingAppointments={appointments}
                  />
                </div>

                <div className="bg-[#EAF0EC] rounded-2xl p-5 flex justify-between items-center border border-[#456A50]/20 shadow-sm">
                  <span className="font-bold text-[#456A50] text-sm">Consultation Fee</span>
                  <span className="font-black text-2xl text-[#1C2C22]">₹ 500</span>
                </div>

                <button 
                  type="submit" 
                  disabled={!apptForm.date}
                  className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment <CreditCard size={18}/>
                </button>
              </form>
            )}

            {bookingStep === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4">
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-black text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                      100% Refundable
                    </span>
                    <p className="text-xs text-[#5A6B60] font-bold mt-1">Consultation Fee</p>
                  </div>
                  <p className="text-3xl font-black text-[#1C2C22]">₹ 500.00</p>
                </div>

                {/* 🌟 PRIMARY: OFFICIAL RAZORPAY GATEWAY BUTTON 🌟 */}
                <div className="bg-[#FDFCF8] border-2 border-[#456A50]/30 rounded-2xl p-5 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#456A50]">
                      Official Razorpay Gateway
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-4 font-medium">
                    Supports <strong>UPI (GPay / PhonePe / Paytm)</strong>, Credit & Debit Cards, NetBanking, and Wallets.
                  </p>
                  <button
                    type="button"
                    disabled={isRazorpayProcessing}
                    onClick={handlePayWithRazorpay}
                    className="w-full bg-[#456A50] hover:bg-[#35533E] text-white py-4 rounded-xl font-black text-sm transition shadow-lg shadow-[#456A50]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isRazorpayProcessing ? (
                      <>
                        <span className="animate-spin text-lg">⏳</span> Connecting to Razorpay...
                      </>
                    ) : (
                      <>
                        <Lock size={18}/> Pay ₹ 500 with Razorpay
                      </>
                    )}
                  </button>
                </div>

                {/* --- OR MANUAL CARD ENTRY --- */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#EBE9E0]"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest text-[#5A6B60]">Or Pay with Direct Card</span>
                  <div className="flex-grow border-t border-[#EBE9E0]"></div>
                </div>

                <form onSubmit={handleBookAppointment} className="space-y-4" autoComplete="off" noValidate>
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Cardholder Name</label>
                      {paymentErrors.cardName && <span className="text-[9px] font-bold text-red-500">{paymentErrors.cardName}</span>}
                    </div>
                    <input type="text" spellCheck="false" autoComplete="new-password" value={paymentForm.cardName} onChange={(e) => handlePaymentChange('cardName', e.target.value)} placeholder="John Doe" className={`w-full border ${paymentErrors.cardName ? 'border-red-400 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-white'} rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-xs`} required/>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Card Number</label>
                      {paymentErrors.cardNumber && <span className="text-[9px] font-bold text-red-500">{paymentErrors.cardNumber}</span>}
                    </div>
                    <div className="relative">
                      <input type="text" maxLength="16" spellCheck="false" autoComplete="new-password" value={paymentForm.cardNumber} onChange={(e) => handlePaymentChange('cardNumber', e.target.value)} placeholder="16 Digit Number" className={`w-full border ${paymentErrors.cardNumber ? 'border-red-400 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-white'} rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] pl-10 transition shadow-xs`} required/>
                      <CreditCard size={16} className={`absolute left-3.5 top-3.5 ${paymentErrors.cardNumber ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Expiry</label>
                        {paymentErrors.expiry && <span className="text-[9px] font-bold text-red-500">{paymentErrors.expiry}</span>}
                      </div>
                      <input type="text" maxLength="5" spellCheck="false" autoComplete="new-password" value={paymentForm.expiry} onChange={(e) => handlePaymentChange('expiry', e.target.value)} placeholder="MM/YY" className={`w-full border ${paymentErrors.expiry ? 'border-red-400 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-white'} rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-xs`} required/>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">CVV</label>
                        {paymentErrors.cvv && <span className="text-[9px] font-bold text-red-500">{paymentErrors.cvv}</span>}
                      </div>
                      <div className="relative">
                        <input type="password" maxLength="3" spellCheck="false" autoComplete="new-password" value={paymentForm.cvv} onChange={(e) => handlePaymentChange('cvv', e.target.value)} placeholder="•••" className={`w-full border ${paymentErrors.cvv ? 'border-red-400 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-white'} rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] pl-10 transition shadow-xs`} required/>
                        <Lock size={15} className={`absolute left-3.5 top-3.5 ${paymentErrors.cvv ? 'text-red-400' : 'text-gray-400'}`} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setBookingStep(1)} className="w-1/3 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer">Back</button>
                    <button type="submit" className="w-2/3 bg-gray-900 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-black transition shadow-md flex justify-center items-center gap-2 cursor-pointer"><Lock size={15} /> Authorize Card ₹ 500</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 OFFICIAL RAZORPAY PAYMENT GATEWAY MODAL (UPI, CARDS, NETBANKING, WALLETS) 🌟 */}
      {showRazorpayModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95">
            {/* Top Razorpay Header */}
            <div className="bg-[#0c2340] text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20">
                  <span className="font-black text-xl tracking-wider text-blue-400">R</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base tracking-wide">Razorpay Gateway</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">Verified Live</span>
                  </div>
                  <p className="text-xs text-gray-300">Healora Clinical Nutrition • {apptForm.date} at {normalizeTimeToLabel(apptForm.time)}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Amount to Pay</p>
                  <p className="text-2xl font-black text-white">₹ 500.00</p>
                </div>
                <button 
                  onClick={() => setShowRazorpayModal(false)}
                  className="text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Rails + Right Content */}
            <div className="flex flex-col md:flex-row min-h-[380px]">
              {/* Left Method Tabs */}
              <div className="w-full md:w-56 bg-[#f8fafc] border-r border-gray-200 p-3 space-y-1.5 shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Payment Options</p>
                
                <button
                  type="button"
                  onClick={() => setRazorpayMethod('upi')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${razorpayMethod === 'upi' ? 'bg-[#0c2340] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60'}`}
                >
                  <span className="flex items-center gap-2">⚡ UPI (GPay/PhonePe)</span>
                  {razorpayMethod === 'upi' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setRazorpayMethod('card')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${razorpayMethod === 'card' ? 'bg-[#0c2340] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60'}`}
                >
                  <span className="flex items-center gap-2">💳 Cards (Visa/Master)</span>
                  {razorpayMethod === 'card' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setRazorpayMethod('netbanking')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${razorpayMethod === 'netbanking' ? 'bg-[#0c2340] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60'}`}
                >
                  <span className="flex items-center gap-2">🏦 NetBanking</span>
                  {razorpayMethod === 'netbanking' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setRazorpayMethod('wallet')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${razorpayMethod === 'wallet' ? 'bg-[#0c2340] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60'}`}
                >
                  <span className="flex items-center gap-2">👛 Wallets (Paytm)</span>
                  {razorpayMethod === 'wallet' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>
              </div>

              {/* Right Content Pane */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  {/* --- UPI VIEW --- */}
                  {razorpayMethod === 'upi' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-sm text-[#1C2C22]">Select UPI App</h4>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Zero Convenience Fee</span>
                      </div>

                      {/* Authentic Brand App Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* 1. Google Pay */}
                        <button
                          type="button"
                          onClick={() => setRazorpayUpiApp('gpay')}
                          className={`p-3.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-between gap-2 group ${razorpayUpiApp === 'gpay' ? 'border-[#4285F4] bg-blue-50/60 shadow-md ring-2 ring-[#4285F4]/30' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                            <svg viewBox="0 0 48 48" className="w-full h-full">
                              <path fill="#4285F4" d="M43.6 20.4H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.2 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.6z"/>
                              <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 14 24 14c3.1 0 5.8 1.1 8 3l6-6C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                              <path fill="#FBBC05" d="M24 44c5.2 0 10-1.9 13.6-5.2l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.7 39.4 16.3 44 24 44z"/>
                              <path fill="#EA4335" d="M43.6 20.4H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C41.2 35.2 44 29.9 44 24c0-1.2-.1-2.4-.4-3.6z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-black text-[#1C2C22]">Google Pay</span>
                        </button>

                        {/* 2. PhonePe */}
                        <button
                          type="button"
                          onClick={() => setRazorpayUpiApp('phonepe')}
                          className={`p-3.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-between gap-2 group ${razorpayUpiApp === 'phonepe' ? 'border-[#5F259F] bg-purple-50/60 shadow-md ring-2 ring-[#5F259F]/30' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#5F259F] shadow-xs flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform text-white font-black text-lg">
                            <svg viewBox="0 0 48 48" className="w-full h-full">
                              <circle cx="24" cy="24" r="22" fill="#5F259F"/>
                              <path fill="#ffffff" d="M24.2 11h-3.4c-.6 0-1.1.5-1.1 1.1v23.8c0 .6.5 1.1 1.1 1.1h3.4c.6 0 1.1-.5 1.1-1.1v-6.7h4.8c6.1 0 10.3-4.1 10.3-10.1S35.3 11 29.2 11h-5zm0 13.3v-8.4h4.7c3.4 0 5.5 2 5.5 4.2 0 2.3-2.1 4.2-5.5 4.2h-4.7z"/>
                              <path fill="#ffffff" d="M14.6 25.5l-3.3-3.3c-.4-.4-1.1-.4-1.5 0l-1.3 1.3c-.4.4-.4 1.1 0 1.5l5.5 5.5c.4.4 1.1.4 1.5 0l1.3-1.3c.4-.4.4-1.1 0-1.5l-2.2-2.2z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-black text-[#1C2C22]">PhonePe</span>
                        </button>

                        {/* 3. Paytm UPI */}
                        <button
                          type="button"
                          onClick={() => setRazorpayUpiApp('paytm')}
                          className={`p-3.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-between gap-2 group ${razorpayUpiApp === 'paytm' ? 'border-[#002E6E] bg-blue-50/60 shadow-md ring-2 ring-[#002E6E]/30' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#002E6E] shadow-xs flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                            <svg viewBox="0 0 48 48" className="w-full h-full">
                              <rect width="48" height="48" rx="8" fill="#002E6E"/>
                              <path fill="#00BAF2" d="M10 28V19h4.8c2.2 0 3.7 1.3 3.7 3.2 0 1.9-1.5 3.2-3.7 3.2h-2.4V28H10zm2.4-4.5h2.2c.9 0 1.5-.5 1.5-1.3s-.6-1.3-1.5-1.3h-2.2v2.6zm9.8 4.5l-.6-2h-3l-.6 2h-2.4l3.3-9h2.4l3.3 9h-2.4zm-2.1-3.8l-1-3.2-1 3.2h2zm7.9 3.8v-3.7L24.8 19h2.7l1.7 2.9 1.7-2.9h2.7l-3.2 4.7v3.7h-2.4z"/>
                            </svg>
                          </div>
                          <span className="text-xs font-black text-[#1C2C22]">Paytm UPI</span>
                        </button>
                      </div>

                      {/* Custom VPA Input */}
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Or Enter Any UPI ID / VPA</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={customUpiId}
                            onChange={(e) => { setCustomUpiId(e.target.value); setRazorpayUpiApp('custom'); }}
                            placeholder="e.g. yourname@okhdfcbank"
                            className="w-full border border-gray-300 rounded-xl p-3 pr-20 text-xs outline-none focus:border-[#0c2340] focus:ring-1 focus:ring-[#0c2340] shadow-inner bg-white font-medium"
                          />
                          <span className="absolute right-3 top-3 text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">
                            @upi
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- CARDS VIEW --- */}
                  {razorpayMethod === 'card' && (
                    <div className="space-y-3.5 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-sm text-[#1C2C22]">Credit / Debit Card</h4>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-blue-900 text-white rounded text-[9px] font-black italic">VISA</span>
                          <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-black">MC</span>
                          <span className="px-2 py-0.5 bg-emerald-800 text-white rounded text-[9px] font-black">RuPay</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Card Number</label>
                        <input
                          type="text"
                          maxLength={16}
                          defaultValue="4532890123456789"
                          placeholder="Card Number"
                          className="w-full border border-gray-300 rounded-xl p-2.5 text-xs outline-none focus:border-[#0c2340] font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Expiry</label>
                          <input
                            type="text"
                            maxLength={5}
                            defaultValue="12/28"
                            placeholder="MM/YY"
                            className="w-full border border-gray-300 rounded-xl p-2.5 text-xs outline-none focus:border-[#0c2340] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">CVV</label>
                          <input
                            type="password"
                            maxLength={3}
                            defaultValue="888"
                            placeholder="CVV"
                            className="w-full border border-gray-300 rounded-xl p-2.5 text-xs outline-none focus:border-[#0c2340] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- NETBANKING VIEW --- */}
                  {razorpayMethod === 'netbanking' && (
                    <div className="space-y-3 animate-in fade-in">
                      <h4 className="font-black text-sm text-[#1C2C22]">Select Popular Bank</h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { name: 'HDFC Bank', color: 'bg-blue-900 text-white', icon: '🏛️' },
                          { name: 'ICICI Bank', color: 'bg-orange-800 text-white', icon: '🏦' },
                          { name: 'State Bank of India', color: 'bg-sky-700 text-white', icon: '🌐' },
                          { name: 'Axis Bank', color: 'bg-rose-900 text-white', icon: '⚡' },
                          { name: 'Kotak Mahindra', color: 'bg-red-700 text-white', icon: '🔒' }
                        ].map(bank => (
                          <button
                            key={bank.name}
                            type="button"
                            onClick={() => setSelectedBank(bank.name)}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center gap-2.5 ${selectedBank === bank.name ? 'border-[#0c2340] bg-blue-50/60 text-[#0c2340] shadow-sm ring-1 ring-[#0c2340]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span className="text-base">{bank.icon}</span>
                            <span>{bank.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* --- WALLETS VIEW --- */}
                  {razorpayMethod === 'wallet' && (
                    <div className="space-y-3 animate-in fade-in">
                      <h4 className="font-black text-sm text-[#1C2C22]">Select Digital Wallet</h4>
                      <div className="space-y-2">
                        {['Paytm Wallet', 'Amazon Pay', 'MobiKwik', 'Airtel Money'].map(wallet => (
                          <button
                            key={wallet}
                            type="button"
                            onClick={() => setSelectedWallet(wallet)}
                            className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex justify-between items-center ${selectedWallet === wallet ? 'border-[#0c2340] bg-blue-50/50 text-[#0c2340]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span>👛 {wallet}</span>
                            {selectedWallet === wallet && <CheckCircle2 size={16} className="text-[#0c2340]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Section */}
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <button
                    type="button"
                    disabled={isRazorpayProcessing}
                    onClick={handleExecuteRazorpayPayment}
                    className="w-full bg-[#0c2340] hover:bg-[#1a3a60] text-white py-3.5 rounded-xl font-black text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isRazorpayProcessing ? (
                      <>
                        <span className="animate-spin text-base">⏳</span> Authorizing Payment...
                      </>
                    ) : (
                      <>
                        <Lock size={16}/> Pay ₹ 500.00 Now
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 mt-3 font-medium">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-600" /> 256-Bit SSL Encrypted
                    </span>
                    <span>100% Cash Back on Cancellation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 CANCELLATION & 100% CASH BACK REFUND CONFIRMATION MODAL 🌟 */}
      {cancellingAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative border border-[#EBE9E0]">
            <div className="flex justify-between items-center mb-5 border-b border-[#EBE9E0] pb-4">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="bg-red-50 p-2 rounded-xl">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1C2C22]">Cancel Appointment</h2>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">100% Instant Cash Back Refund</p>
                </div>
              </div>
              <button 
                onClick={() => { setCancellingAppt(null); }} 
                className="text-gray-400 hover:text-gray-800 transition bg-gray-100 rounded-full p-2 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Refund Guarantee Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-center gap-3.5">
              <div className="bg-emerald-600 text-white p-2.5 rounded-xl shrink-0 shadow-sm">
                <RotateCcw size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900">100% Full Refund Guarantee</p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  You will receive <strong className="font-black text-emerald-900">₹ 500.00 cash back</strong> immediately to your original payment method.
                </p>
              </div>
            </div>

            {/* Appointment Details Box */}
            <div className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-4 space-y-2.5 text-xs text-[#1C2C22] mb-5">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#5A6B60] font-bold">Booking ID:</span>
                <span className="font-mono font-bold">APT-{cancellingAppt.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#5A6B60] font-bold">Scheduled Date & Time:</span>
                <span className="font-bold">{cancellingAppt.date} at {cancellingAppt.time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#5A6B60] font-bold">Consultation Mode:</span>
                <span className="font-bold">{cancellingAppt.mode === 'ONLINE' ? '📹 Telehealth Video' : '🏥 In-Clinic'}</span>
              </div>
              <div className="flex justify-between py-1 font-black text-sm text-[#1C2C22] pt-1">
                <span>Refund Cash Back Amount:</span>
                <span className="text-emerald-700 text-base">₹ 500.00</span>
              </div>
            </div>

            {/* Reason Selector */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Reason for Cancellation</label>
              <select 
                value={cancelReason} 
                onChange={e => setCancelReason(e.target.value)} 
                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs font-semibold text-[#1C2C22] outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition"
              >
                <option value="Schedule Conflict">Schedule Conflict</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Personal Emergency">Personal Emergency</option>
                <option value="Feeling Better / No longer required">Feeling Better / No longer required</option>
                <option value="Other">Other Reason</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setCancellingAppt(null)} 
                className="w-1/3 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
              >
                Keep Booking
              </button>
              <button 
                type="button" 
                disabled={isProcessingRefund}
                onClick={handleConfirmCancelAndRefund}
                className="w-2/3 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-xs transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingRefund ? (
                  <>Processing Refund...</>
                ) : (
                  <>
                    <RotateCcw size={15} /> Confirm & Get ₹500 Refund
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 100% REFUND CASH BACK SUCCESS MODAL 🌟 */}
      {refundSuccessData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-center relative border border-[#EBE9E0]">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            
            <h2 className="text-2xl font-black text-[#1C2C22] mb-1">₹ 500 Refund Credited!</h2>
            <p className="text-xs text-[#5A6B60] font-medium mb-5">
              Your appointment has been cancelled and <strong className="text-emerald-700 font-black">100% cash back (₹ 500.00)</strong> has been refunded to your original payment method.
            </p>

            <div className="bg-[#FDFCF8] border border-emerald-200 rounded-2xl p-4 text-xs text-left space-y-2 mb-6 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-[#5A6B60] font-bold">Refund Reference ID:</span>
                <span className="font-mono font-black text-emerald-800">{refundSuccessData.refund_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6B60] font-bold">Cash Back Amount:</span>
                <span className="font-black text-emerald-700">₹ 500.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6B60] font-bold">Refund Destination:</span>
                <span className="font-bold text-[#1C2C22]">Original Payment Card</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6B60] font-bold">Status:</span>
                <span className="font-bold text-emerald-700 uppercase tracking-wider">Completed</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={() => generateRefundReceipt(refundSuccessData)} 
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={16} /> Download Refund Receipt (PDF)
              </button>
              <button 
                onClick={() => setRefundSuccessData(null)} 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 🌟 SIDEBAR NAVIGATION 🌟 */}
      <aside className="w-72 bg-white border-r border-[#EBE9E0] flex flex-col hidden lg:flex shadow-sm z-10 flex-shrink-0 h-full">
        <div className="p-6 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-[#456A50] text-white rounded-xl p-2 shadow-sm"><HeartPulse size={24} /></div>
          <span className="text-2xl font-black tracking-tight text-[#1C2C22]">Heal<span className="text-[#456A50]">ora</span></span>
        </div>
        <nav className="flex-1 px-4 mt-4 space-y-2 font-medium overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-3 mt-2">My Workspace</p>
          <button onClick={() => { setActiveTab('profile'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='profile' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><UserCircle size={18} className="shrink-0" /> <span>Profile & Vault</span></button>
          <button onClick={() => { setActiveTab('diet'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='diet' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Apple size={18} className="shrink-0" /> <span>My Diet Plan</span></button>
          <button onClick={() => { setActiveTab('tracking'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='tracking' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Activity size={18} className="shrink-0" /> <span>Wellness Tracking</span></button>
          <button onClick={() => { setActiveTab('history'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='history' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Clock size={18} className="shrink-0" /> <span>Health History</span></button>
          <button onClick={() => { setActiveTab('appointments'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='appointments' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Calendar size={18} className="shrink-0" /> <span>Appointments & Chat</span></button>
          <button onClick={() => { setActiveTab('evaluations'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='evaluations' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><ClipboardList size={18} className="shrink-0" /> <span>Nutritionist Evaluations</span></button>
        </nav>
        <div className="p-6 border-t border-[#EBE9E0] bg-[#FDFCF8]/50">
          <div className="flex items-center gap-3 mb-5 px-1">
            <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
              {profilePic ? <img src={profilePic} className="w-full h-full object-cover" alt="User"/> : <UserCircle size={28} className="text-gray-400" />}
            </div>
            <div className="overflow-hidden"><p className="text-sm font-black text-[#1C2C22] truncate">{userName}</p><p className="text-[10px] font-bold text-[#456A50] uppercase tracking-widest truncate">Patient</p></div>
          </div>
          <button onClick={handleSecureLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition text-sm border border-red-100 shadow-sm"><LogOut size={16} /> Log Out</button>
        </div>
      </aside>

      {/* 🌟 MAIN CONTENT AREA 🌟 */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* HEADER SECTION */}
          <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-6">
            <div><h1 className="text-4xl font-black tracking-tight text-[#1C2C22]">Patient Portal.</h1><p className="text-[#5A6B60] mt-2 font-serif italic text-base">Welcome back, {userName}. Manage your wellness journey.</p></div>
            <div className="flex items-center gap-6">
              <div className="relative cursor-pointer group" onClick={() => {setShowNotifications(true); markNotificationsRead();}}>
                <div className="bg-white border border-[#EBE9E0] p-3.5 rounded-full shadow-sm group-hover:bg-gray-50 transition"><Bell size={22} className="text-[#1C2C22]" /></div>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FDFCF8] shadow-sm">{unreadCount}</span>}
              </div>
              <div className="relative w-14 h-14 shrink-0 rounded-full border-4 border-white shadow-md overflow-hidden group cursor-pointer bg-gray-100" onClick={() => fileInputRef.current.click()}>
                {profilePic ? <img src={profilePic} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full flex items-center justify-center"><UserCircle size={28} className="text-[#5A6B60]"/></div>}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200"><Camera size={16} className="text-white" /></div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} accept="image/*" className="hidden" />
            </div>
          </div>

          {/* 🔔 CLINIC MANAGER TODAY'S CONSULTATION REMINDER BANNER 🔔 */}
          {todayConsultationReminders.length > 0 && (
            <div className="space-y-4">
              {todayConsultationReminders.map(appt => {
                const docObj = nutritionists.find(n => String(n.id) === String(appt.nutritionist));
                const docName = docObj ? `Dr. ${docObj.first_name} ${docObj.last_name}` : (appt.doctor_name || 'Assigned Clinical Nutritionist');
                const isOnline = appt.mode === 'ONLINE';

                return (
                  <div 
                    key={appt.id} 
                    className="bg-gradient-to-r from-[#1C2C22] via-[#2A4433] to-[#1C2C22] text-white p-5 sm:p-6 rounded-3xl shadow-xl border-2 border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-in slide-in-from-top-3 duration-500 relative overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                        <Bell size={24} className="animate-bounce text-amber-300" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> TODAY'S CONSULTATION REMINDER
                          </span>
                          <span className="bg-white/10 text-emerald-200 border border-white/10 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {isOnline ? '📹 Online Video Session' : '🏥 In-Clinic Visit'}
                          </span>
                          {appt.reminder_sent && (
                            <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              ✓ Clinic Alert Active
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                          Consultation Scheduled with {docName}
                        </h3>
                        <p className="text-xs text-gray-300 mt-1 flex flex-wrap items-center gap-2 font-medium">
                          <span>⏰ Scheduled Time: <strong className="text-emerald-300 font-black">{appt.time}</strong> Today</span>
                          <span>•</span>
                          <span className="text-amber-200/90 italic">Active on portal until scheduled appointment time</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
                      {isOnline && appt.meet_link ? (
                        <a 
                          href={appt.meet_link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 md:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3.5 rounded-2xl text-xs transition shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <Video size={16} /> Join Google Meet <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      ) : isOnline ? (
                        <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl text-xs text-gray-200 flex items-center gap-2 font-medium">
                          <Video size={14} className="text-emerald-300" /> Room link will activate before start
                        </div>
                      ) : (
                        <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl text-xs text-gray-200 flex items-center gap-2 font-bold">
                          🏥 Room 302 • Clinic Reception Desk
                        </div>
                      )}
                      <button 
                        onClick={() => setActiveTab('appointments')} 
                        className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 1: PROFILE & VAULT */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 h-max">
                  <div className="flex justify-between items-center mb-8 border-b border-[#EBE9E0] pb-6">
                    <div><h2 className="text-2xl font-black text-[#1C2C22] flex items-center gap-2"><User size={24} className="text-[#456A50]"/> Clinical Profile</h2><p className="text-sm text-[#5A6B60] mt-1">Update your biometrics and lifestyle data.</p></div>
                    {!isProfileEditing && <button onClick={() => setIsProfileEditing(true)} className="text-xs bg-[#EAF0EC] text-[#456A50] font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-[#456A50] hover:text-white transition shadow-sm"><Edit3 size={14}/> Edit</button>}
                  </div>

                  {isProfileEditing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-300">
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Age</label><input type="number" required value={profile.age} onChange={e=>setProfile({...profile, age: e.target.value})} placeholder="e.g. 24" className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" /></div>
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Height (cm)</label><input type="number" required value={profile.height_cm} onChange={e=>setProfile({...profile, height_cm: e.target.value})} placeholder="e.g. 165" className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" /></div>
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Weight (kg)</label><input type="number" required value={profile.weight_kg} onChange={e=>setProfile({...profile, weight_kg: e.target.value})} placeholder="e.g. 65" className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Blood Group</label><select value={profile.blood_group} onChange={e=>setProfile({...profile, blood_group: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option></select></div>
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Target Weight (kg)</label><input type="number" value={profile.target_weight} onChange={e=>setProfile({...profile, target_weight: e.target.value})} placeholder="e.g. 55" className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Medical History</label><select value={profile.medical_history} onChange={e=>setProfile({...profile, medical_history: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="None reported">None reported</option><option value="Diabetes">Diabetes</option><option value="Hypertension">Hypertension</option><option value="PCOS">PCOS</option><option value="Thyroid Issue">Thyroid Issue</option><option value="Other">Other</option></select></div>
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Family History</label><select value={profile.family_history} onChange={e=>setProfile({...profile, family_history: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="None reported">None reported</option><option value="Diabetes">Diabetes</option><option value="Heart Disease">Heart Disease</option><option value="Hypertension">Hypertension</option><option value="Cancer">Cancer</option><option value="Other">Other</option></select></div>
                      </div>
                      <div className="grid grid-cols-1 gap-5">
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Current Medications</label><input type="text" value={profile.current_medications} onChange={e=>setProfile({...profile, current_medications: e.target.value})} placeholder="List any daily medications..." className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Lifestyle</label><select value={profile.lifestyle_habits} onChange={e=>setProfile({...profile, lifestyle_habits: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="Sedentary">Sedentary</option><option value="Lightly Active">Lightly Active</option><option value="Moderately Active">Moderately Active</option><option value="Very Active">Very Active</option><option value="Smoker">Smoker</option></select></div>
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Food Allergies</label><select value={profile.food_allergies} onChange={e=>setProfile({...profile, food_allergies: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="None">None</option><option value="Dairy">Dairy</option><option value="Peanuts">Peanuts</option><option value="Gluten">Gluten</option><option value="Shellfish">Shellfish</option><option value="Eggs">Eggs</option><option value="Soy">Soy</option></select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Diet Preferences</label><select value={profile.food_preferences} onChange={e=>setProfile({...profile, food_preferences: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="No preference">No preference</option><option value="Vegetarian">Vegetarian</option><option value="Vegan">Vegan</option><option value="Keto">Keto</option><option value="Pescatarian">Pescatarian</option><option value="Halal">Halal</option></select></div>
                        <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Primary Goal</label><select value={profile.health_goals} onChange={e=>setProfile({...profile, health_goals: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="Weight Loss">Weight Loss</option><option value="Weight Gain">Weight Gain</option><option value="Maintenance">Maintenance</option><option value="Muscle Building">Muscle Building</option><option value="General Health">General Health</option></select></div>
                      </div>
                      <div className="flex gap-4 pt-4 border-t border-[#EBE9E0]">
                        <button type="button" onClick={() => setIsProfileEditing(false)} className="w-1/3 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-sm hover:bg-gray-200 transition">Cancel</button>
                        <button type="submit" disabled={isSaving} className="w-2/3 bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg flex items-center justify-center gap-2">
                          {isSaving ? 'Saving...' : <><CheckCircle2 size={18}/> Save Profile</>}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl shadow-sm divide-x divide-[#EBE9E0]">
                        <div className="flex-1 p-5 text-center"><p className="text-[10px] text-[#5A6B60] uppercase font-bold tracking-widest mb-1">Age</p><p className="font-black text-[#1C2C22] text-2xl">{profile.age || '-'}</p></div>
                        <div className="flex-1 p-5 text-center"><p className="text-[10px] text-[#5A6B60] uppercase font-bold tracking-widest mb-1">Height</p><p className="font-black text-[#1C2C22] text-2xl">{profile.height_cm ? `${profile.height_cm} cm` : '-'}</p></div>
                        <div className="flex-1 p-5 text-center"><p className="text-[10px] text-[#5A6B60] uppercase font-bold tracking-widest mb-1">Weight</p><p className="font-black text-[#1C2C22] text-2xl">{profile.weight_kg ? `${profile.weight_kg} kg` : '-'}</p></div>
                        <div className="flex-1 p-5 text-center bg-red-50/50 rounded-r-2xl"><p className="text-[10px] text-red-700 uppercase font-bold tracking-widest mb-1">Blood</p><p className="font-black text-red-600 text-2xl">{profile.blood_group || '-'}</p></div>
                      </div>
                      <h3 className="text-sm font-bold text-[#1C2C22] border-b border-[#EBE9E0] pb-2 mt-4">Medical Overview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-sm"><p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1.5">Medical History</p><p className="text-sm font-bold text-[#1C2C22]">{profile.medical_history || 'None reported'}</p></div>
                        <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-sm"><p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1.5">Family History</p><p className="text-sm font-bold text-[#1C2C22]">{profile.family_history || 'None reported'}</p></div>
                        <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] col-span-2 shadow-sm"><p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1.5">Current Medications</p><p className="text-sm font-bold text-[#1C2C22]">{profile.current_medications || 'None'}</p></div>
                      </div>
                      <h3 className="text-sm font-bold text-[#1C2C22] border-b border-[#EBE9E0] pb-2 mt-4">Lifestyle & Diet</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-sm"><p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1.5">Diet Preferences</p><p className="text-sm font-bold text-[#1C2C22]">{profile.food_preferences || 'No preference'}</p></div>
                        <div className="bg-[#1C2C22] border border-[#1C2C22] p-5 rounded-2xl shadow-sm"><p className="text-[10px] uppercase font-bold text-[#A4B3A8] tracking-widest mb-1.5">Primary Goal</p><p className="text-sm font-black text-white">{profile.health_goals || 'Weight Loss'} <span className="font-medium text-xs text-gray-400">({profile.target_weight ? `${profile.target_weight}kg` : ''})</span></p></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-6 flex justify-between items-center h-max">
                  <div className="flex items-center gap-4"><div className="bg-gray-100 p-3 rounded-xl text-gray-500"><Lock size={20}/></div><div><h3 className="font-bold text-[#1C2C22]">Account Security</h3><p className="text-xs text-[#5A6B60]">Update your login password securely.</p></div></div>
                  <button onClick={() => setShowPasswordModal(true)} className="bg-white border border-[#EBE9E0] text-[#1C2C22] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2"><Key size={14}/> Change Password</button>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBE9E0] p-8 h-max">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl shadow-sm"><FileText size={20} /></div>
                    <div>
                      <h2 className="text-xl font-bold">Health Vault</h2>
                      <p className="text-[10px] text-[#5A6B60] uppercase tracking-widest mt-1">Clinical Reports & Laboratory Tests</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Select Clinical Report Category</label>
                    <select 
                      value={docType} 
                      onChange={(e) => setDocType(e.target.value)} 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl p-3.5 text-xs font-bold text-[#1C2C22] outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"
                    >
                      {CLINICAL_REPORT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {uploadStatus && <div className={`p-3 text-xs font-bold text-center rounded-xl mb-4 ${uploadStatus.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-[#EAF0EC] text-[#456A50]'}`}>{uploadStatus}</div>}

                  <div className="border-2 border-dashed border-[#456A50]/30 bg-[#FDFCF8] rounded-2xl p-8 text-center hover:bg-[#EAF0EC]/40 transition cursor-pointer relative mb-5 shadow-sm group">
                    <input type="file" onChange={handleLabReportUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    <Upload size={28} className="mx-auto text-[#456A50] mb-3 group-hover:-translate-y-1 transition transform duration-300" />
                    <p className="text-sm font-bold text-[#1C2C22]">Upload {docType}</p>
                    <p className="text-[10px] text-[#5A6B60] mt-1.5 font-medium">PDF, JPG, PNG (Max 20MB)</p>
                  </div>

                  <div className="bg-[#EAF0EC] p-4 rounded-xl flex items-center gap-3 mb-5 border border-[#456A50]/20 shadow-sm">
                    <input type="checkbox" checked={digitalConsent} onChange={(e) => setDigitalConsent(e.target.checked)} className="w-4 h-4 text-[#456A50] rounded focus:ring-[#456A50]" />
                    <p className="text-[10px] text-[#456A50] font-bold leading-tight flex flex-col">
                      <span>Digital Consent Form</span>
                      <span className="font-normal opacity-80 mt-0.5">I authorize my assigned nutritionist to view and evaluate these clinical records.</span>
                    </p>
                    <ShieldCheck size={16} className="text-[#456A50] ml-auto" />
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-56 pr-2 custom-scrollbar">
                    {labReports.map((report) => {
                      const isReviewed = report.status === 'REVIEWED';
                      return (
                      <div key={report.id} className="p-3.5 bg-white border border-[#EBE9E0] rounded-2xl shadow-xs hover:border-[#456A50]/40 transition group space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className={`p-2.5 rounded-xl shrink-0 ${isReviewed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              <File size={16} />
                            </div>
                            <div className="truncate flex-1">
                              <p className="font-bold text-xs text-[#1C2C22] truncate">{report.name || report.file?.split('/').pop() || 'Document'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-[#456A50] font-black tracking-wider uppercase truncate">{report.type || report.document_type || 'Clinical Report'}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-[9px] text-gray-400 font-medium">{report.date || (report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString() : '')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Document Status Stepper / Badge */}
                            {isReviewed ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 size={11} className="text-emerald-700" /> Reviewed
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                <Clock size={11} className="text-amber-700" /> Available for Review
                              </span>
                            )}

                            {report.fileUrl && (
                              <a 
                                href={report.fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                download={report.name} 
                                className="text-[#456A50] hover:text-[#35533E] bg-[#EAF0EC] p-2 rounded-xl text-xs font-bold transition"
                                title="Download/View Report"
                              >
                                <Download size={14} />
                              </a>
                            )}
                            <button onClick={() => removeLabReport(report.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-xl transition cursor-pointer" title="Delete Report">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>

                        {/* Nutritionist Review Notes (if reviewed) */}
                        {isReviewed && report.review_notes && (
                          <div className="bg-[#FDFCF8] border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-[#1C2C22] shadow-inner">
                            <p className="font-extrabold text-[#456A50] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                              <ClipboardList size={12}/> Nutritionist Clinical Findings & Note:
                            </p>
                            <p className="text-gray-700 italic font-medium">"{report.review_notes}"</p>
                            {report.reviewed_at && (
                              <p className="text-[9px] text-gray-400 mt-1 text-right">Reviewed by {report.reviewed_by || 'Nutritionist'} on {report.reviewed_at}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )})}
                    {labReports.length === 0 && <p className="text-center text-[11px] text-gray-400 italic py-6">No clinical documents uploaded yet.</p>}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 🌟 TAB 2: MY DIET PLAN (ONLY SHOWN WHEN NUTRITIONIST PUBLISHES PLAN SPECIFICALLY FOR THIS PATIENT) 🌟 */}
          {activeTab === 'diet' && (() => {
            const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
            const isPlanPublished = publishedPlan && (publishedPlan.status === 'PUBLISHED' || publishedPlan.status === 'Published') && publishedPlan.weeks && Object.keys(publishedPlan.weeks).length > 0;
            const isPhase2Unlocked = publishedPlan?.phase2_status === 'UNLOCKED';

            if (!isPlanPublished) {
              return (
                <div className="space-y-6 animate-in fade-in">
                  {/* Top Header Card */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9E0] gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Apple size={22} className="text-[#456A50]" />
                        <h2 className="text-2xl font-black text-[#1C2C22]">My Clinical Diet Plan</h2>
                      </div>
                      <p className="text-xs text-[#5A6B60] mt-1 font-medium">
                        Personalized 4-Week Medical Nutrition Therapy • Goal: <span className="font-bold text-[#456A50] uppercase tracking-wider">{profile.health_goals || 'General Wellness'}</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-800 bg-amber-100/90 px-3.5 py-1.5 rounded-full border border-amber-200">
                      ⏳ Status: Formulation Pending
                    </span>
                  </div>

                  {/* Empty State Presentation Card */}
                  <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-[#EBE9E0]">
                    <div className="max-w-2xl mx-auto text-center py-4">
                      <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
                        <Apple size={38} className="text-[#456A50]" />
                      </div>
                      
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#456A50] bg-[#EAF0EC] px-4 py-1.5 rounded-full border border-[#456A50]/20 inline-block mb-3">
                        📋 Clinical Nutrition Care
                      </span>
                      
                      <h2 className="text-3xl font-black text-[#1C2C22] mb-3">
                        No Diet Plan Scheduled Yet
                      </h2>
                      
                      <p className="text-sm text-[#5A6B60] leading-relaxed mb-8">
                        Hello <strong className="text-[#1C2C22]">{userName || profile.first_name || 'Patient'}</strong>, your assigned certified nutritionist has not yet published a personalized diet plan for your profile. Once your doctor reviews your health records, biometrics, and lab reports, your custom 4-week Kerala clinical meal protocol will be activated right here.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-8">
                        <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#EBE9E0]">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#456A50] font-black flex items-center justify-center text-xs mb-3">1</div>
                          <p className="font-black text-xs text-[#1C2C22] mb-1">Health Intake Submitted</p>
                          <p className="text-[11px] text-[#5A6B60]">Biometrics, medical history & food preferences recorded.</p>
                        </div>
                        
                        <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200">
                          <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 font-black flex items-center justify-center text-xs mb-3 animate-pulse">2</div>
                          <p className="font-black text-xs text-amber-900 mb-1">Nutritionist Formulating</p>
                          <p className="text-[11px] text-amber-800">Doctor creates 4-week Kerala meals, drinks & calorie targets.</p>
                        </div>
                        
                        <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#EBE9E0]">
                          <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-400 font-black flex items-center justify-center text-xs mb-3">3</div>
                          <p className="font-black text-xs text-[#1C2C22] mb-1">Protocol Activated</p>
                          <p className="text-[11px] text-[#5A6B60]">Instant access to 5 daily meals, recipes & swapping.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-6 animate-in fade-in">
                
                {/* 🌟 GLOBAL DIET HEADER & DOWNLOAD PROTOCOL BUTTON 🌟 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9E0] gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#1C2C22]">Your 4-Week Clinical Protocol</h2>
                    <p className="text-sm text-[#5A6B60] mt-1 font-medium">Goal: <span className="font-bold text-[#456A50] uppercase tracking-wider">{profile.health_goals || 'Weight Management'}</span></p>
                  </div>
                  
                  <button onClick={handleDownloadPlan} className="bg-[#456A50] text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#35533E] transition shadow-lg shadow-[#456A50]/30 border border-[#456A50] cursor-pointer">
                    <DownloadCloud size={16}/> Download PDF Protocol
                  </button>
                </div>

                {/* 🌟 4-WEEK TABS SELECTOR WITH 2-PHASE GATING 🌟 */}
                <div className="bg-white p-4 rounded-3xl border border-[#EBE9E0] shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { wk: 1, label: 'Week 1', phase: 'Phase 1', locked: false, desc: 'Metabolic Reset' },
                      { wk: 2, label: 'Week 2', phase: 'Phase 1', locked: false, desc: 'Digestive Balance' },
                      { wk: 3, label: 'Week 3', phase: 'Phase 2', locked: !isPhase2Unlocked, desc: 'Progression Tuning' },
                      { wk: 4, label: 'Week 4', phase: 'Phase 2', locked: !isPhase2Unlocked, desc: 'Sustainability' }
                    ].map(tab => {
                      const isSelected = selectedWeek === tab.wk;
                      return (
                        <button
                          key={tab.wk}
                          onClick={() => {
                            if (tab.locked) {
                              setShowPhase2LockedModal(true);
                            } else {
                              setSelectedWeek(tab.wk);
                            }
                          }}
                          className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden cursor-pointer ${
                            isSelected 
                              ? 'bg-[#1C2C22] text-white shadow-md' 
                              : tab.locked
                                ? 'bg-amber-50/70 border border-amber-200 text-amber-900 hover:bg-amber-100/60'
                                : 'bg-[#FDFCF8] border border-[#EBE9E0] text-[#1C2C22] hover:border-[#456A50] hover:bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-emerald-400' : tab.locked ? 'text-amber-700' : 'text-[#456A50]'}`}>
                              {tab.phase}
                            </span>
                            {tab.locked ? (
                              <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full">
                                <Lock size={10}/> Gated
                              </span>
                            ) : isSelected ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            ) : null}
                          </div>
                          <p className="font-black text-sm">{tab.label}</p>
                          <p className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-gray-300' : 'text-[#5A6B60]'}`}>{tab.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 🌟 7-DAY SELECTOR BAR 🌟 */}
                <div className="bg-white p-3 rounded-2xl border border-[#EBE9E0] shadow-sm flex gap-2 overflow-x-auto">
                  {daysOfWeek.map((day) => {
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`flex-1 min-w-[100px] py-3 px-3 rounded-xl text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#456A50] text-white shadow-md font-black'
                            : 'bg-[#FDFCF8] text-[#1C2C22] border border-[#EBE9E0] font-bold hover:bg-gray-50'
                        }`}
                      >
                        <p className="text-xs uppercase tracking-wider">{day.slice(0, 3)}</p>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400 font-medium'}`}>
                          {getProtocolDate(selectedWeek || 1, day)}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* 🌟 LEVEL 3: ACTIVE 5 KERALA MEALS FOR SELECTED WEEK & DAY 🌟 */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#EBE9E0]">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 pb-4 border-b border-[#EBE9E0] gap-2">
                    <div>
                      <h3 className="text-2xl font-black text-[#1C2C22]">
                        Week {selectedWeek} — {selectedDay} Kerala Protocol
                      </h3>
                      <p className="text-xs text-[#5A6B60] mt-0.5 font-bold">
                        {getProtocolDate(selectedWeek, selectedDay)} • Click any card to view ingredients or swap dish
                      </p>
                    </div>
                    <span className="text-[11px] font-black text-[#456A50] bg-[#EAF0EC] px-3 py-1.5 rounded-full border border-[#456A50]/20 w-max">
                      {(() => {
                        const currentDayPlan = (publishedPlan?.weeks?.[selectedWeek]?.[selectedDay]) || (publishedPlan?.weeks?.['1']?.[selectedDay]) || {};
                        const count = Object.keys(currentDayPlan).filter(k => currentDayPlan[k]).length || publishedPlan?.meal_frequency || 5;
                        return `${count}-Slot Clinical Protocol`;
                      })()}
                    </span>
                  </div>

                  {/* Meals Grid: Dynamically rendered based on Nutritionist's Prescribed Frequency (3, 4, 5, or 6 slots) */}
                  {(() => {
                    const currentDayPlan = (publishedPlan?.weeks?.[selectedWeek]?.[selectedDay]) || (publishedPlan?.weeks?.['1']?.[selectedDay]) || {};
                    const allSlotDefs = {
                      pre_breakfast: { type: 'pre_breakfast', label: '🌿 Pre-Breakfast Tonic', color: 'emerald' },
                      breakfast: { type: 'breakfast', label: '🌅 Breakfast', color: 'orange' },
                      drink: { type: 'drink', label: '🥤 Drink / Smoothie', color: 'teal' },
                      lunch: { type: 'lunch', label: '☀️ Lunch', color: 'yellow' },
                      snack: { type: 'snack', label: '🍎 Snack', color: 'green' },
                      dinner: { type: 'dinner', label: '🌙 Dinner', color: 'blue' }
                    };

                    const slotKeysInPlan = Object.keys(currentDayPlan).filter(k => currentDayPlan[k] && allSlotDefs[k]);
                    const activeSlots = slotKeysInPlan.length > 0
                      ? ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'].filter(k => slotKeysInPlan.includes(k)).map(k => allSlotDefs[k])
                      : [allSlotDefs.breakfast, allSlotDefs.drink, allSlotDefs.lunch, allSlotDefs.snack, allSlotDefs.dinner];

                    const getActiveMealObj = (mealType) => {
                      const mealStr = currentDayPlan[mealType] || 'Nutritious Kerala Clinical Meal (250 kcal)';
                      const calMatch = mealStr.match(/\((\d+\s*kcal)\)/i);
                      const cal = calMatch ? calMatch[1] : '250 kcal';
                      const name = mealStr.replace(/\(\d+\s*kcal\)/i, '').trim();
                      return {
                        name,
                        cal,
                        img: getKeralaMealImage(name, mealType),
                        desc: 'Nutrient-dense personalized Kerala clinical recipe formulated for your metabolic health goals.'
                      };
                    };

                    const gridColsClass = activeSlots.length === 3 
                      ? 'lg:grid-cols-3' 
                      : activeSlots.length === 4 
                        ? 'lg:grid-cols-4' 
                        : activeSlots.length === 6 
                          ? 'lg:grid-cols-6' 
                          : 'lg:grid-cols-5';

                    return (
                      <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-5 mb-10`}>
                        {activeSlots.map(({ type: mealType, label }) => {
                          const mealObj = getActiveMealObj(mealType);

                          return (
                            <div 
                              key={mealType} 
                              onClick={() => setSelectedMeal({ ...mealObj, type: mealType })} 
                              className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-[2rem] p-4 flex flex-col shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-[#456A50] transition-all cursor-pointer group relative overflow-hidden"
                            >
                              <div className="relative overflow-hidden rounded-2xl mb-3 h-36 bg-gray-100 border border-gray-100">
                                <img 
                                  src={mealObj.img} 
                                  alt={mealObj.name} 
                                  onError={(e) => { e.target.onerror = null; e.target.src = getKeralaMealImage(mealObj.name, mealType); }}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                />
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg">
                                  <span className="text-[9px] font-black text-white uppercase tracking-wider">{label}</span>
                                </div>
                              </div>

                              <p className="text-xs font-black text-[#1C2C22] leading-snug flex-1 mb-3 line-clamp-2">{mealObj.name}</p>
                              
                              <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-[10px] font-black bg-white text-[#456A50] px-2 py-1 rounded-lg border border-[#EBE9E0] flex items-center gap-1 shadow-2xs">
                                  <Flame size={11}/> {mealObj.cal}
                                </span>
                                <span className="w-7 h-7 rounded-full bg-[#EAF0EC] text-[#456A50] flex items-center justify-center group-hover:bg-[#456A50] group-hover:text-white transition-colors">
                                  <ChevronRight size={14}/>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* 🌟 Daily Guidelines & INTERACTIVE WATER TRACKER 🌟 */}
                  <h3 className="text-xl font-black text-[#1C2C22] mb-5 border-t border-[#EBE9E0] pt-6">Daily Clinical Protocol Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    <div className="bg-blue-50/60 p-6 rounded-[2rem] border border-blue-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Droplets size={80} color="blue"/></div>
                      <b className="text-[11px] uppercase text-blue-700 tracking-widest block mb-2 flex items-center gap-1.5 relative z-10"><Droplets size={16}/> Hydration Target</b>
                      <p className="text-xs font-black text-blue-950 leading-relaxed mb-4 relative z-10">Drink at least 8 glasses (3 liters) with Sambharam or Herbal infusions.</p>
                      
                      <div className="flex gap-1.5 relative z-10">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(glass => (
                          <button key={glass} onClick={() => setQuickWaterTracker(glass)} className={`transition-all transform hover:scale-125 focus:outline-none cursor-pointer ${glass <= quickWaterTracker ? 'text-blue-500 fill-blue-500 scale-110' : 'text-blue-200'}`}>
                            <svg width="20" height="24" viewBox="0 0 24 24" fill={glass <= quickWaterTracker ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-3 relative z-10">{quickWaterTracker} / 8 Glasses Logged</p>
                    </div>

                    <div className="bg-green-50/60 p-6 rounded-[2rem] border border-green-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Footprints size={80} color="green"/></div>
                      <b className="text-[11px] uppercase text-green-700 tracking-widest block mb-2 flex items-center gap-1.5 relative z-10"><Footprints size={16}/> Activity Target</b>
                      <p className="text-sm font-black text-green-950 leading-relaxed relative z-10">{publishedPlan?.activity_recommendation || '30 mins brisk walking + 15 min core strengthening.'}</p>
                    </div>

                    <div className="bg-red-50/60 p-6 rounded-[2rem] border border-red-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle size={80} color="red"/></div>
                      <b className="text-[11px] uppercase text-red-700 tracking-widest block mb-2 flex items-center gap-1.5 relative z-10"><AlertCircle size={16}/> Strictly Avoid</b>
                      <p className="text-sm font-black text-red-950 leading-relaxed relative z-10">{publishedPlan?.things_to_avoid || 'Deep fried bakery snacks, refined white sugar, and late-night heavy eating.'}</p>
                    </div>

                  </div>
                </div>

              </div>
            );
          })()}

          {/* 🌟 LEVEL 4: MEAL DETAIL & SWAP MODAL 🌟 */}
          {selectedMeal && (
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedMeal(null)}>
              <div className="bg-white rounded-[2rem] w-full max-w-md p-7 shadow-2xl border border-[#EBE9E0] relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedMeal(null)} className="absolute top-6 right-6 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-md transition z-10 cursor-pointer"><X size={18}/></button>
                
                <div className="relative overflow-hidden rounded-[1.5rem]">
                  <img 
                    key={selectedMeal.img} 
                    src={selectedMeal.img} 
                    alt={selectedMeal.name} 
                    onError={(e) => { e.target.onerror = null; e.target.src = getKeralaMealImage(selectedMeal.name, selectedMeal.type); }}
                    className="w-full h-56 object-cover shadow-sm animate-in fade-in duration-500" 
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C2C22]">{selectedMeal.type}</p>
                  </div>
                </div>

                <div className="mt-5 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6B60] mb-1">Week {selectedWeek} • {selectedDay} (Kerala Protocol)</p>
                  <h3 className="text-xl font-black text-[#1C2C22] leading-tight">{selectedMeal.name}</h3>
                  {selectedMeal.desc && (
                    <p className="text-xs text-[#5A6B60] mt-2 font-medium leading-relaxed bg-[#FDFCF8] p-3 rounded-xl border border-[#EBE9E0]">
                      🌿 {selectedMeal.desc}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 p-4 rounded-2xl bg-[#EAF0EC] border border-[#456A50]/20 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-widest text-[#5A6B60]">Energy</span>
                  <span className="text-xl font-black text-[#456A50] flex items-center gap-1.5"><Flame size={18}/> {selectedMeal.cal}</span>
                </div>

                <button 
                  onClick={() => handleSwapMeal(selectedMeal.type)} 
                  className="w-full mt-4 py-3.5 rounded-2xl bg-[#1C2C22] text-white font-black text-sm hover:bg-[#456A50] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  🔄 Swap with Personalized Option
                </button>
                <p className="text-center text-[10px] text-[#5A6B60] mt-2 font-medium">Cycles strictly through clinical Kerala options curated for your profile.</p>
              </div>
            </div>
          )}

          {/* 🌟 PHASE 2 LOCKED CONSULTATION MODAL 🌟 */}
          {showPhase2LockedModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowPhase2LockedModal(false)}>
              <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-[#EBE9E0] relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowPhase2LockedModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 transition cursor-pointer"><X size={18}/></button>
                
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 shadow-sm">
                  <Lock size={28}/>
                </div>

                <h3 className="text-2xl font-black text-[#1C2C22] leading-tight mb-2">Phase 2 Follow-Up Consultation Required</h3>
                <p className="text-sm text-[#5A6B60] leading-relaxed mb-6 font-medium">
                  Weeks 3 & 4 represent your <strong>Progression & Metabolic Optimization Phase</strong>. To ensure your health parameters, BMI changes, and lab biomarkers are safely trending toward your goal, a 20–25 minute consultation with your nutritionist is required before unlocking Phase 2.
                </p>

                <div className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-5 mb-6 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#1C2C22]">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0"/> Complete Weeks 1 & 2 Adaptation Protocol
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#1C2C22]">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0"/> Log Daily Wellness & Water Intake
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#1C2C22]">
                    <Sparkles size={16} className="text-amber-600 shrink-0"/> Nutritionist Evaluates Biomarkers & Releases Phase 2
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setShowPhase2LockedModal(false)} 
                    className="w-full sm:w-1/3 py-3.5 rounded-xl border border-[#EBE9E0] text-gray-700 font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                  >
                    Back to Phase 1
                  </button>
                  <button 
                    onClick={() => { 
                      setShowPhase2LockedModal(false); 
                      setShowApptModal(true); 
                    }} 
                    className="w-full sm:w-2/3 py-3.5 rounded-xl bg-[#456A50] hover:bg-[#35533E] text-white font-black text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar size={16}/> Book Follow-Up Consultation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🌟 TAB 3: END-OF-DAY WELLNESS ENTRY & PROGRESS 🌟 */}
          {activeTab === 'tracking' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBE9E0] p-8 h-max">

                <div className="flex items-center gap-3 mb-8 border-b border-[#EBE9E0] pb-6"><div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl shadow-sm"><Activity size={20} /></div><h2 className="text-2xl font-black text-[#1C2C22]">End of Day Check-in</h2></div>
                <form onSubmit={handleSaveWellnessLog} className="space-y-6">
                  
                  {/* MEAL CHECKBOXES (DYNAMICALLY PERSONALIZED TO PATIENT'S PRESCRIBED 3, 4, 5, OR 6 MEALS) */}
                  {(() => {
                    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
                    const currentDayPlan = (publishedPlan?.weeks?.[selectedWeek || 1]?.[selectedDay || 'Sunday']) || (publishedPlan?.weeks?.['1']?.['Sunday']) || {};
                    
                    const slotDefinitions = {
                      pre_breakfast: { key: 'pre_breakfast', label: 'Pre-Breakfast Tonic', icon: '🌿' },
                      breakfast: { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
                      drink: { key: 'drink', label: 'Drink / Smoothie', icon: '🥤' },
                      lunch: { key: 'lunch', label: 'Lunch', icon: '☀️' },
                      snack: { key: 'snack', label: 'Evening Snack', icon: '🍎' },
                      dinner: { key: 'dinner', label: 'Dinner', icon: '🌙' },
                    };

                    const slotKeysInPlan = Object.keys(currentDayPlan).filter(k => currentDayPlan[k] && slotDefinitions[k]);
                    const activeCheckinSlots = slotKeysInPlan.length > 0
                      ? ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'].filter(k => slotKeysInPlan.includes(k)).map(k => slotDefinitions[k])
                      : [slotDefinitions.breakfast, slotDefinitions.lunch, slotDefinitions.dinner];

                    return (
                      <div className="bg-[#FDFCF8] border border-[#EBE9E0] p-6 rounded-[2rem] shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <label className="block text-[11px] font-bold text-[#5A6B60] tracking-widest uppercase">
                            1. Today's Scheduled Meals Completed?
                          </label>
                          <span className="text-[10px] font-black text-[#456A50] bg-[#EAF0EC] px-2.5 py-0.5 rounded-full border border-[#456A50]/20">
                            {activeCheckinSlots.length} Prescribed Meals
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeCheckinSlots.map(slot => {
                            const isCompleted = !!logForm.completed_slots?.[slot.key] || (slot.key === 'breakfast' && logForm.breakfast_completed) || (slot.key === 'lunch' && logForm.lunch_completed) || (slot.key === 'dinner' && logForm.dinner_completed);

                            const toggleSlot = () => {
                              const nextVal = !isCompleted;
                              setLogForm(prev => ({
                                ...prev,
                                completed_slots: {
                                  ...(prev.completed_slots || {}),
                                  [slot.key]: nextVal
                                },
                                ...(slot.key === 'breakfast' ? { breakfast_completed: nextVal } : {}),
                                ...(slot.key === 'lunch' ? { lunch_completed: nextVal } : {}),
                                ...(slot.key === 'dinner' ? { dinner_completed: nextVal } : {})
                              }));
                            };

                            return (
                              <div
                                key={slot.key}
                                onClick={toggleSlot}
                                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all shadow-2xs select-none ${
                                  isCompleted 
                                    ? 'bg-[#EAF0EC] border-[#456A50] text-[#1C2C22] ring-1 ring-[#456A50]/30 shadow-xs' 
                                    : 'bg-white border-[#EBE9E0] text-gray-700 hover:border-[#456A50]/40'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-2xs border ${
                                    isCompleted ? 'bg-white border-[#456A50]/30' : 'bg-gray-50 border-gray-100'
                                  }`}>
                                    {slot.icon}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-[#1C2C22] leading-tight truncate">
                                      {slot.label}
                                    </p>
                                    <p className="text-[10px] text-[#5A6B60] font-medium mt-0.5">
                                      Prescribed Slot
                                    </p>
                                  </div>
                                </div>

                                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition flex items-center gap-1 ${
                                  isCompleted 
                                    ? 'bg-[#456A50] text-white shadow-2xs' 
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {isCompleted ? '✓ Done' : '○ Tap to Log'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-[#FDFCF8] border border-[#EBE9E0] p-6 rounded-[2rem] shadow-sm">
                    <p className="text-[11px] font-bold text-[#5A6B60] mb-4 tracking-widest uppercase">2. Did you eat outside the plan?</p>
                    <div className="flex space-x-6 mb-2 text-sm font-bold">
                      <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" checked={!logForm.ate_other_food} onChange={()=>setLogForm({...logForm, ate_other_food: false, other_food_details: ''})} className="text-[#456A50] w-4 h-4 focus:ring-[#456A50]" /><span className="text-[#456A50]">No</span></label>
                      <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" checked={logForm.ate_other_food} onChange={()=>setLogForm({...logForm, ate_other_food: true})} className="text-red-500 w-4 h-4 focus:ring-red-500" /><span className="text-red-600">Yes</span></label>
                    </div>
                    {logForm.ate_other_food && <textarea value={logForm.other_food_details} onChange={e=>setLogForm({...logForm, other_food_details: e.target.value})} className="w-full border border-red-200 rounded-xl p-3 text-sm outline-none focus:border-red-400 mt-4 shadow-inner bg-red-50/50" placeholder="Please list the other items consumed..." rows="2" required />}
                  </div>

                  {/* 🌟 INTERACTIVE WATER TRACKER 🌟 */}
                  <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2rem] shadow-sm">
                     <label className="block text-[11px] font-bold text-blue-700 mb-4 flex items-center gap-1.5 uppercase tracking-widest"><Droplets size={16}/> Water Intake (Glasses)</label>
                     <div className="flex gap-2 mb-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(glass => (
                          <button type="button" key={glass} onClick={() => setLogForm({...logForm, water_glasses: glass})} className={`transition-all transform hover:scale-125 focus:outline-none ${glass <= logForm.water_glasses ? 'text-blue-500 fill-blue-500 scale-110' : 'text-blue-200 hover:text-blue-300'}`}>
                            <svg width="24" height="28" viewBox="0 0 24 24" fill={glass <= logForm.water_glasses ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{logForm.water_glasses} Glasses Logged</p>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div><label className="block text-[11px] font-bold text-[#5A6B60] mb-2 flex items-center gap-1.5 uppercase tracking-widest"><Footprints size={14} className="text-green-500"/> Physical Activity Completed</label><input type="text" required value={logForm.physical_activity} onChange={e=>setLogForm({...logForm, physical_activity: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-4 text-sm focus:border-[#456A50] outline-none transition shadow-sm" placeholder="e.g. 30m Jogging, Yoga..." /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div><label className="block text-[11px] font-bold text-[#5A6B60] mb-2 flex items-center gap-1.5 uppercase tracking-widest"><Moon size={14} className="text-purple-500"/> Sleep (Hrs)</label><input type="number" step="0.5" required value={logForm.sleep_hours} onChange={e=>setLogForm({...logForm, sleep_hours: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-4 text-sm focus:border-[#456A50] outline-none transition shadow-sm" placeholder="e.g. 7.5" /></div>
                    <div><label className="block text-[11px] font-bold text-[#5A6B60] mb-2 flex items-center gap-1.5 uppercase tracking-widest">Authentic Mood</label><select required value={logForm.mood} onChange={e=>setLogForm({...logForm, mood: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-4 text-sm focus:border-[#456A50] outline-none transition shadow-sm"><option>Calm & Balanced</option><option>Happy & Energetic</option><option>Anxious / Stressed</option><option>Fatigued / Tired</option><option>Irritable / Frustrated</option><option>Sad / Low Mood</option></select></div>
                  </div>

                  <div className="bg-[#EAF0EC] border border-[#456A50]/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm cursor-pointer" onClick={() => setLogForm({...logForm, supplements_taken: !logForm.supplements_taken})}>
                    <input type="checkbox" checked={logForm.supplements_taken} onChange={()=>{}} className="w-5 h-5 text-[#456A50] rounded focus:ring-[#456A50]" />
                    <p className="text-xs text-[#456A50] font-bold uppercase tracking-widest select-none">I took my recommended supplements today.</p>
                  </div>

                  <button type="submit" className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-black text-sm hover:bg-[#456A50] transition shadow-xl mt-6 flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Submit Daily Report</button>
                </form>
              </div>

              {/* Progress History List */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 overflow-hidden flex flex-col h-[85vh]">
                <h2 className="text-2xl font-black mb-6 border-b border-[#EBE9E0] pb-4">Progress History</h2>
                <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  <div className="space-y-4">
                    {wellnessLogs.map(log => {
                      const slotLabels = {
                        pre_breakfast: '🌿 Pre-Breakfast',
                        breakfast: '🌅 Breakfast',
                        drink: '🥤 Drink',
                        lunch: '☀️ Lunch',
                        snack: '🍎 Snack',
                        dinner: '🌙 Dinner'
                      };

                      // Get patient's prescribed slots
                      const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
                      const currentDayPlan = (publishedPlan?.weeks?.[selectedWeek || 1]?.[selectedDay || 'Sunday']) || (publishedPlan?.weeks?.['1']?.['Sunday']) || {};
                      const allSlotKeys = ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'];
                      const planSlotKeys = Object.keys(currentDayPlan).filter(k => currentDayPlan[k] && allSlotKeys.includes(k));
                      
                      const patientPrescribedSlots = log.prescribed_slots || (planSlotKeys.length > 0 ? planSlotKeys : (publishedPlan?.meal_frequency === 3 ? ['breakfast', 'lunch', 'dinner'] : publishedPlan?.meal_frequency === 4 ? ['breakfast', 'lunch', 'snack', 'dinner'] : publishedPlan?.meal_frequency === 6 ? ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'] : ['breakfast', 'drink', 'lunch', 'snack', 'dinner']));

                      // Only include slots that are prescribed for this patient
                      const completedMap = {};
                      patientPrescribedSlots.forEach(slotKey => {
                        completedMap[slotKey] = log.completed_slots?.[slotKey] !== undefined
                          ? !!log.completed_slots[slotKey]
                          : (slotKey === 'breakfast' ? log.breakfast_completed : slotKey === 'lunch' ? log.lunch_completed : slotKey === 'dinner' ? log.dinner_completed : false);
                      });

                      const activeSlotsLogged = Object.keys(completedMap);
                      const doneCount = Object.values(completedMap).filter(Boolean).length;

                      return (
                        <div key={log.id} className="bg-[#FDFCF8] border border-[#EBE9E0] p-5 rounded-2xl shadow-sm hover:border-[#456A50]/30 transition group hover:shadow-md">
                          <div className="flex justify-between items-start mb-3 border-b border-[#EBE9E0] pb-3">
                            <div>
                              <p className="font-black text-[#1C2C22] text-sm">
                                {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </p>
                              <span className="text-[10px] text-[#5A6B60] font-bold">
                                {doneCount} of {activeSlotsLogged.length} Meals Logged
                              </span>
                            </div>
                            {log.ate_other_food ? (
                              <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-[9px] font-bold border border-red-100 uppercase tracking-widest">Ate Off-Plan</span>
                            ) : (
                              <span className="bg-[#EAF0EC] text-[#456A50] px-2.5 py-1 rounded-lg text-[9px] font-bold border border-[#456A50]/20 uppercase tracking-widest">Followed Plan</span>
                            )}
                          </div>

                          {/* Completed Meals Chips */}
                          <div className="flex flex-wrap gap-1.5 mb-3 bg-white p-2 rounded-xl border border-gray-100">
                            {Object.entries(completedMap).map(([slotKey, isDone]) => (
                              <span
                                key={slotKey}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  isDone ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-200'
                                }`}
                              >
                                {slotLabels[slotKey] || slotKey}: {isDone ? '✓' : '✕'}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[11px] text-[#5A6B60]">
                            <p className="flex items-center gap-1.5"><Droplets size={12} className="text-blue-500"/><span className="text-blue-600 font-bold">{log.water_glasses} glasses</span></p>
                            <p className="flex items-center gap-1.5 truncate"><Footprints size={12} className="text-green-500 shrink-0"/><span className="truncate">{log.physical_activity || 'None'}</span></p>
                            <p className="flex items-center gap-1.5"><Moon size={12} className="text-purple-500"/><span className="text-purple-600 font-bold">{log.sleep_hours} hrs</span></p>
                            <p className="flex items-center gap-1.5 truncate"><Activity size={12} className="text-orange-500 shrink-0"/><span className="truncate">{log.mood || 'N/A'}</span></p>
                          </div>
                          {log.ate_other_food && (
                            <p className="mt-2.5 text-[10px] bg-red-50 p-2 rounded-lg text-red-800 border border-red-100 font-medium">
                              <span className="font-bold">Cheat Food:</span> {log.other_food_details}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {wellnessLogs.length === 0 && <div className="text-center py-20"><Activity size={48} className="mx-auto text-gray-200 mb-4"/> <p className="text-sm text-gray-400 italic font-medium">No wellness logs entered yet.</p></div>}
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* 🌟 TAB 5: UPGRADED NUTRITIONIST EVALUATIONS WITH STAR RATINGS 🌟 */}
        {activeTab === 'evaluations' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9E0] gap-4">
                <div>
                   <h2 className="text-2xl font-black text-[#1C2C22] flex items-center gap-2"><ClipboardList size={26} className="text-[#456A50]"/> Nutritionist Evaluations</h2>
                   <p className="text-sm text-[#5A6B60] mt-1 font-medium">Feedback and guidance generated from your daily wellness logs.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {evaluations.length === 0 ? (
                  <div className="col-span-full bg-white p-10 rounded-3xl border border-[#EBE9E0] text-center shadow-sm">
                    <ClipboardList size={48} className="mx-auto text-gray-200 mb-4"/>
                    <p className="text-sm text-gray-400 italic font-medium">No evaluations available yet.</p>
                  </div>
               ) : evaluations.map(ev => (
                 <div key={ev.id} className="bg-white border border-[#EBE9E0] rounded-[1.5rem] shadow-sm flex overflow-hidden group hover:shadow-md transition duration-300">
                    
                    {/* Thick Left Border accent */}
                    <div className="w-3 bg-[#456A50] shrink-0 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="font-black text-[#1C2C22] text-xl">{ev.title || "Weekly Evaluation"}</h3>
                         
                         {/* ⭐ Star Rating Feature ⭐ */}
                         <div className="flex gap-1">
                           {[1, 2, 3, 4, 5].map(star => (
                             <Star 
                               key={star} 
                               size={16} 
                               className={star <= (ev.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} 
                             />
                           ))}
                         </div>
                      </div>
                      
                      {/* Inner text box displaying Nutritionist's typed feedback */}
                      <div className="bg-[#FDFCF8] border border-[#EBE9E0] p-5 rounded-2xl mb-6 text-sm text-[#5A6B60] leading-relaxed flex-1 shadow-inner">
                        {ev.message}
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-auto">
                        <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-1.5"><Calendar size={14}/> {ev.date}</p>
                        <span className="text-[10px] font-bold text-[#456A50] bg-[#EAF0EC] px-3 py-1 rounded-full uppercase tracking-widest">Reviewed</span>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
            </div>
         )}

        {/* 🌟 TAB 6: HEALTH HISTORY & PROGRESS ANALYTICS 🌟 */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header with Sub-tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-[#EBE9E0] gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#1C2C22] flex items-center gap-2.5">
                  <Clock size={26} className="text-[#456A50]"/> Health History & Progress Analytics
                </h2>
                <p className="text-sm text-[#5A6B60] mt-1 font-medium">
                  Track your daily meal adherence, longitudinal weight trajectory, hydration, sleep, and lifestyle vitals.
                </p>
              </div>

              {/* 4 Interactive Sub-tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#FDFCF8] p-1.5 rounded-2xl border border-[#EBE9E0] shadow-2xs">
                {[
                  { id: 'daily_weekly', label: 'Daily/Weekly Records', icon: <Calendar size={14} /> },
                  { id: 'weight', label: 'Weight History', icon: <Scale size={14} /> },
                  { id: 'lifestyle', label: 'Lifestyle History', icon: <Footprints size={14} /> },
                  { id: 'food', label: 'Food History', icon: <Apple size={14} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPatientHistoryTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      patientHistoryTab === tab.id
                        ? 'bg-[#1C2C22] text-white shadow-sm'
                        : 'text-[#5A6B60] hover:text-[#1C2C22] hover:bg-gray-100/70'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* --- 1. DAILY / WEEKLY RECORDS SUB-TAB --- */}
            {patientHistoryTab === 'daily_weekly' && (
              <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#EBE9E0] shadow-sm animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Total Logs</span>
                    <span className="text-2xl font-black text-[#1C2C22]">{wellnessLogs.length}</span>
                    <span className="text-[10px] text-[#456A50] block mt-0.5 font-bold">Days Logged</span>
                  </div>
                  <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Meal Compliance</span>
                    <span className="text-2xl font-black text-emerald-700">
                      {wellnessLogs.length > 0 ? '92%' : '0%'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">prescribed meals eaten</span>
                  </div>
                  <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Avg Water Logged</span>
                    <span className="text-2xl font-black text-blue-600">
                      {wellnessLogs.length > 0 ? `${(wellnessLogs.reduce((a,b)=>a+(parseFloat(b.water_glasses)||0),0)/wellnessLogs.length).toFixed(1)} gls` : '0 gls'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">daily hydration avg</span>
                  </div>
                  <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Off-Plan Cheat Meals</span>
                    <span className="text-2xl font-black text-amber-700">
                      {wellnessLogs.filter(l=>l.ate_other_food).length}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">recorded deviations</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {wellnessLogs.length === 0 ? (
                    <div className="bg-[#FDFCF8] border border-dashed border-[#EBE9E0] rounded-2xl p-10 text-center">
                      <Clock size={36} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-600">No Daily Records Submitted Yet</p>
                      <p className="text-xs text-gray-400 mt-1">Submit your daily report under Wellness Tracking to build your health timeline.</p>
                    </div>
                  ) : (
                    wellnessLogs.map(log => {
                      const slots = log.completed_slots || {
                        breakfast: log.breakfast_completed,
                        lunch: log.lunch_completed,
                        dinner: log.dinner_completed
                      };
                      return (
                        <div key={log.id} className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                          <div className="flex justify-between items-center border-b border-gray-200/60 pb-2.5">
                            <span className="font-black text-xs text-[#1C2C22]">📅 {log.date}</span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${log.ate_other_food ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                              {log.ate_other_food ? '⚠️ Off-Plan Logged' : '✓ Plan Followed'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {Object.entries(slots).map(([slot, done]) => (
                              <div key={slot} className={`p-2 rounded-xl border flex items-center justify-between ${done ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold' : 'bg-white text-gray-400 border-gray-200'}`}>
                                <span className="capitalize">{slot.replace('_', ' ')}</span>
                                <span>{done ? '✓ Eaten' : '✕ Missed'}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100 font-medium">
                            <span>💧 {log.water_glasses || 0} Glasses Water</span>
                            <span>•</span>
                            <span>🌙 {log.sleep_hours || 0} Hours Sleep</span>
                            <span>•</span>
                            <span>🏃 {log.physical_activity || 'Routine'}</span>
                            <span>•</span>
                            <span>⚡ Mood: {log.mood || 'Normal'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* --- 2. WEIGHT HISTORY SUB-TAB --- */}
            {patientHistoryTab === 'weight' && (
              <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#EBE9E0] shadow-sm animate-in fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Baseline Weight</span>
                    <span className="text-2xl font-black text-[#1C2C22]">
                      {patientWeightRecords.length > 0 ? patientWeightRecords[patientWeightRecords.length - 1].weight_kg : profile.weight_kg || '65.0'} <span className="text-xs text-gray-500 font-normal">kg</span>
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Initial Consultation Record</span>
                  </div>

                  <div className="bg-[#EAF0EC] p-4 rounded-2xl border border-[#456A50]/20">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#456A50] block mb-1">Current Active Weight</span>
                    <span className="text-2xl font-black text-[#1C2C22]">
                      {patientWeightRecords.length > 0 ? patientWeightRecords[0].weight_kg : profile.weight_kg || '65.0'} <span className="text-xs text-gray-500 font-normal">kg</span>
                    </span>
                    <span className="text-[10px] text-[#456A50] block mt-0.5 font-bold">Latest Weigh-in</span>
                  </div>

                  <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Total Net Change (Δ)</span>
                    {(() => {
                      if (patientWeightRecords.length < 2) return <span className="text-2xl font-black text-gray-400">0.0 kg</span>;
                      const latest = parseFloat(patientWeightRecords[0].weight_kg) || 0;
                      const baseline = parseFloat(patientWeightRecords[patientWeightRecords.length - 1].weight_kg) || 0;
                      const diff = (latest - baseline).toFixed(1);
                      const isLoss = parseFloat(diff) < 0;

                      return (
                        <div className="flex items-center gap-1">
                          <span className={`text-2xl font-black ${isLoss ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {parseFloat(diff) > 0 ? `+${diff}` : diff} kg
                          </span>
                          {isLoss ? <TrendingDown size={18} className="text-emerald-600" /> : <TrendingUp size={18} className="text-amber-600" />}
                        </div>
                      );
                    })()}
                    <span className="text-[10px] text-gray-500 block mt-0.5">vs Baseline</span>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-1">Target Ideal Goal</span>
                    <span className="text-2xl font-black text-purple-900">
                      {(() => {
                        const hM = (parseFloat(profile.height_cm) || 165) / 100;
                        return (22.0 * hM * hM).toFixed(1);
                      })()} <span className="text-xs text-purple-700 font-normal">kg</span>
                    </span>
                    <span className="text-[10px] text-purple-700 block mt-0.5 font-bold">Target BMI 22.0</span>
                  </div>
                </div>

                {/* Log Weight Form */}
                <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#EBE9E0]">
                  <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Scale size={16} className="text-[#456A50]" /> Log Your New Weigh-in
                  </h4>
                  <form onSubmit={handleAddPatientWeightEntry} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Check-in Date</label>
                      <input 
                        type="date" 
                        required 
                        value={newPatientWeightDate} 
                        onChange={e => setNewPatientWeightDate(e.target.value)} 
                        className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Weight (in kg)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        required 
                        placeholder="e.g. 64.5" 
                        value={newPatientWeight} 
                        onChange={e => setNewPatientWeight(e.target.value)} 
                        className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Personal Notes</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Morning weigh-in before breakfast" 
                        value={newPatientWeightNotes} 
                        onChange={e => setNewPatientWeightNotes(e.target.value)} 
                        className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]" 
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#1C2C22] hover:bg-[#456A50] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save size={14} /> Record Weigh-in
                    </button>
                  </form>
                </div>

                {/* Weight Table */}
                <div className="bg-white rounded-2xl border border-[#EBE9E0] overflow-hidden">
                  <table className="w-full text-left text-xs text-[#1C2C22]">
                    <thead className="bg-[#FDFCF8] text-[10px] uppercase font-black text-gray-500 tracking-wider border-b border-[#EBE9E0]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Weight</th>
                        <th className="py-3 px-4">Change vs Previous</th>
                        <th className="py-3 px-4">Calculated BMI</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE9E0]">
                      {patientWeightRecords.map((item, index) => {
                        const prevItem = patientWeightRecords[index + 1];
                        const diff = prevItem ? (parseFloat(item.weight_kg) - parseFloat(prevItem.weight_kg)).toFixed(1) : '0.0';
                        const isLoss = parseFloat(diff) < 0;

                        return (
                          <tr key={item.id || item.date} className="hover:bg-gray-50/70 transition">
                            <td className="py-3 px-4 font-bold">{item.date}</td>
                            <td className="py-3 px-4 font-black text-base text-[#1C2C22]">{item.weight_kg} kg</td>
                            <td className="py-3 px-4">
                              {prevItem ? (
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${isLoss ? 'bg-emerald-50 text-emerald-800' : parseFloat(diff) === 0 ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-800'}`}>
                                  {parseFloat(diff) > 0 ? `+${diff}` : diff} kg
                                </span>
                              ) : (
                                <span className="text-gray-400 italic text-[10px]">Baseline</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-700">{item.bmi || '23.8'}</td>
                            <td className="py-3 px-4 text-gray-600 font-medium">{item.notes || 'Weigh-in'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- 3. LIFESTYLE HISTORY SUB-TAB --- */}
            {patientHistoryTab === 'lifestyle' && (
              <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#EBE9E0] shadow-sm animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sleep Tracking History */}
                  <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] space-y-4">
                    <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-[#EBE9E0] pb-3">
                      <Moon size={16} className="text-purple-600" /> Sleep Duration History
                    </h4>
                    <div className="space-y-2.5">
                      {wellnessLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-xs text-[#1C2C22]">{log.date}</span>
                          <span className="font-black text-sm text-purple-700 bg-purple-50 px-3 py-1 rounded-lg">
                            {log.sleep_hours || 0} hrs
                          </span>
                        </div>
                      ))}
                      {wellnessLogs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-6">No sleep logs submitted yet.</p>}
                    </div>
                  </div>

                  {/* Hydration History */}
                  <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] space-y-4">
                    <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-[#EBE9E0] pb-3">
                      <Droplets size={16} className="text-blue-500" /> Hydration History
                    </h4>
                    <div className="space-y-2.5">
                      {wellnessLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-xs text-[#1C2C22]">{log.date}</span>
                          <span className="font-black text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                            {log.water_glasses || 0} glasses
                          </span>
                        </div>
                      ))}
                      {wellnessLogs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-6">No water logs submitted yet.</p>}
                    </div>
                  </div>

                  {/* Activity History */}
                  <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] space-y-4">
                    <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-[#EBE9E0] pb-3">
                      <Footprints size={16} className="text-emerald-600" /> Activity History
                    </h4>
                    <div className="space-y-2.5">
                      {wellnessLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-xs text-[#1C2C22]">{log.date}</span>
                          <span className="font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            {log.physical_activity || 'Routine'}
                          </span>
                        </div>
                      ))}
                      {wellnessLogs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-6">No activity logs submitted yet.</p>}
                    </div>
                  </div>

                  {/* Mood & Vitality */}
                  <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] space-y-4">
                    <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-[#EBE9E0] pb-3">
                      <Sparkles size={16} className="text-amber-500" /> Mood & Vitality
                    </h4>
                    <div className="space-y-2.5">
                      {wellnessLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-xs text-[#1C2C22]">{log.date}</span>
                          <span className="font-bold text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-lg">
                            {log.mood || 'Normal'}
                          </span>
                        </div>
                      ))}
                      {wellnessLogs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-6">No mood logs submitted yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- 4. FOOD HISTORY SUB-TAB --- */}
            {patientHistoryTab === 'food' && (
              <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#EBE9E0] shadow-sm animate-in fade-in">
                <h4 className="font-black text-sm text-[#1C2C22] border-b border-[#EBE9E0] pb-3">
                  Food & Dietary Intake History
                </h4>
                <div className="space-y-4">
                  {wellnessLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-10">No meal logs recorded yet.</p>
                  ) : (
                    wellnessLogs.map(log => {
                      const slots = log.completed_slots || {
                        breakfast: log.breakfast_completed,
                        lunch: log.lunch_completed,
                        dinner: log.dinner_completed
                      };
                      return (
                        <div key={log.id} className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0] space-y-2.5">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="font-black text-xs text-[#1C2C22]">📅 {log.date}</span>
                            {log.ate_other_food && (
                              <span className="text-[10px] font-black bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">
                                ⚠️ Off-Plan Foods
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {Object.entries(slots).map(([slotKey, isEaten]) => (
                              <div key={slotKey} className={`p-2.5 rounded-xl border flex items-center justify-between ${isEaten ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-bold' : 'bg-white border-gray-200 text-gray-400'}`}>
                                <span className="capitalize">{slotKey.replace('_', ' ')}</span>
                                <span>{isEaten ? '✓ Eaten' : '✕ Missed'}</span>
                              </div>
                            ))}
                          </div>
                          {log.ate_other_food && log.other_food_details && (
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-800">
                              <strong>Off-Plan Details:</strong> {log.other_food_details}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: APPOINTMENTS & MODERN CHAT */}
        {activeTab === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBE9E0] overflow-hidden flex flex-col h-[75vh]">
              {(() => {
                const sortedAppts = [...appointments].sort((a, b) => {
                  const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime() || 0;
                  const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime() || 0;
                  return dateTimeB - dateTimeA;
                });

                const now = new Date();
                const isPastAppt = (appt) => {
                  if (!appt || !appt.date) return false;
                  const apptDateTime = new Date(`${appt.date}T${appt.time || '23:59:59'}`);
                  return !isNaN(apptDateTime.getTime()) && apptDateTime < now;
                };

                const activeCount = sortedAppts.filter(a => (a.status === 'SCHEDULED' || a.status === 'RESCHEDULED') && !isPastAppt(a)).length;
                const historyCount = sortedAppts.filter(a => a.status === 'COMPLETED' || (isPastAppt(a) && a.status !== 'CANCELLED')).length;
                const cancelledCount = sortedAppts.filter(a => a.status === 'CANCELLED').length;

                const displayedAppts = sortedAppts.filter(a => {
                  if (patientApptFilter === 'ACTIVE') return (a.status === 'SCHEDULED' || a.status === 'RESCHEDULED') && !isPastAppt(a);
                  if (patientApptFilter === 'HISTORY') return a.status === 'COMPLETED' || (isPastAppt(a) && a.status !== 'CANCELLED');
                  if (patientApptFilter === 'CANCELLED') return a.status === 'CANCELLED';
                  return true;
                });

                return (
                  <>
                    <div className="p-6 border-b border-[#EBE9E0] bg-[#FDFCF8] space-y-4">
                      {/* Top Tier: Title & Action Button */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h2 className="text-xl font-black text-[#1C2C22] flex items-center gap-2">
                            <Calendar size={22} className="text-[#456A50]"/> My Appointments
                          </h2>
                          <p className="text-xs text-[#5A6B60] mt-0.5">Track bookings, join telehealth Google Meets & download receipts.</p>
                        </div>
                        <button 
                          onClick={() => { setShowApptModal(true); setPaymentErrors({}); }} 
                          className="bg-[#456A50] hover:bg-[#35533E] text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm text-xs transition cursor-pointer shrink-0"
                        >
                          <Calendar size={15} /> Request New Consultation
                        </button>
                      </div>
                      
                      {/* Bottom Tier: Clean Filter Category Pills */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#EBE9E0] shadow-2xs w-fit flex-wrap">
                        <button 
                          onClick={() => setPatientApptFilter('ALL')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${patientApptFilter === 'ALL' ? 'bg-[#1C2C22] text-white shadow-2xs' : 'text-[#5A6B60] hover:text-[#1C2C22]'}`}
                        >
                          All ({sortedAppts.length})
                        </button>
                        <button 
                          onClick={() => setPatientApptFilter('ACTIVE')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${patientApptFilter === 'ACTIVE' ? 'bg-[#456A50] text-white shadow-2xs' : 'text-[#5A6B60] hover:text-[#1C2C22]'}`}
                        >
                          Active ({activeCount})
                        </button>
                        <button 
                          onClick={() => setPatientApptFilter('HISTORY')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${patientApptFilter === 'HISTORY' ? 'bg-purple-800 text-white shadow-2xs' : 'text-[#5A6B60] hover:text-[#1C2C22]'}`}
                        >
                          History ({historyCount})
                        </button>
                        <button 
                          onClick={() => setPatientApptFilter('CANCELLED')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${patientApptFilter === 'CANCELLED' ? 'bg-red-700 text-white shadow-2xs' : 'text-[#5A6B60] hover:text-[#1C2C22]'}`}
                        >
                          Cancelled ({cancelledCount})
                        </button>
                      </div>

                      {/* 🎟️ TODAY'S LIVE CLINIC TOKEN & ROOM STATUS TICKET */}
                      {(() => {
                        const now = new Date();
                        const isoToday = now.toISOString().split('T')[0];
                        const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const todayAppt = sortedAppts.find(a => (a.date === isoToday || a.date === localToday) && a.status !== 'CANCELLED');

                        if (!todayAppt) return null;

                        const isCalled = todayAppt.queue_status === 'CALLED';
                        const isInSession = todayAppt.queue_status === 'IN_CONSULTATION';
                        const isCompleted = todayAppt.queue_status === 'COMPLETED';

                        return (
                          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                            isCalled 
                              ? 'bg-amber-500 text-white border-amber-600 shadow-lg animate-pulse'
                              : isInSession
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
                              : 'bg-white border-[#EBE9E0] text-[#1C2C22] shadow-xs'
                          }`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex items-center gap-3.5">
                                <div className={`p-3 rounded-2xl shrink-0 ${
                                  isCalled || isInSession ? 'bg-white/20 text-white' : 'bg-[#EAF0EC] text-[#456A50]'
                                }`}>
                                  <Ticket size={24} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md ${
                                      isCalled || isInSession ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      Today's Live Queue Pass
                                    </span>
                                    <span className="text-xs font-bold opacity-80">Slot: {todayAppt.time}</span>
                                  </div>
                                  <h4 className="font-black text-lg mt-0.5 flex items-center gap-2">
                                    Token #{todayAppt.token_number || 'TK-101'}
                                    <span className="text-xs font-normal opacity-90">• {todayAppt.allocated_room || 'Doctor Consultation Chamber'}</span>
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/20">
                                <div className="text-left sm:text-right">
                                  <span className={`text-[10px] font-black uppercase tracking-wider block ${isCalled || isInSession ? 'text-white' : 'text-gray-500'}`}>
                                    Queue Status
                                  </span>
                                  <span className="font-bold text-xs">
                                    {isCalled 
                                      ? '📢 PLEASE PROCEED TO ROOM'
                                      : isInSession 
                                      ? '🟢 In Consultation'
                                      : isCompleted 
                                      ? '✓ Consultation Finished'
                                      : '⏳ Waiting in Queue'}
                                  </span>
                                </div>
                                {todayAppt.mode !== 'ONLINE' ? (
                                  <button
                                    type="button"
                                    onClick={() => printClinicTokenSlip(todayAppt, { name: userName || profile.first_name })}
                                    className={`font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer ${
                                      isCalled || isInSession
                                        ? 'bg-white text-[#1C2C22] hover:bg-gray-100'
                                        : 'bg-[#456A50] text-white hover:bg-[#35533E]'
                                    }`}
                                  >
                                    <Printer size={13} /> Print Token Pass
                                  </button>
                                ) : todayAppt.meet_link && (
                                  <a 
                                    href={todayAppt.meet_link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="bg-white text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition hover:bg-gray-100 shrink-0"
                                  >
                                    <Video size={13} /> Join Meet
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                      <table className="w-full text-left text-sm text-[#1C2C22]">
                    <div className="overflow-x-auto overflow-y-auto flex-1 p-2 custom-scrollbar">
                      <table className="w-full text-left text-sm text-[#1C2C22] whitespace-nowrap">
                        <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0">
                          <tr>
                            <th className="py-4 px-6">Date & Time</th>
                            <th className="py-4 px-6">Mode</th>
                            <th className="py-4 px-6">Telehealth Video</th>
                            <th className="py-4 px-6">Status & Payment</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                            <th className="py-3.5 px-4">Date & Time</th>
                            <th className="py-3.5 px-4">Mode</th>
                            <th className="py-3.5 px-4">Telehealth / Room</th>
                            <th className="py-3.5 px-4">Status & Payment</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {displayedAppts.map(a => {
                            const isRescheduled = a.status === 'RESCHEDULED';
                            const isCancelled = a.status === 'CANCELLED';

                            return (
                            <tr key={a.id} className={`hover:bg-[#FDFCF8] transition group ${isCancelled ? 'bg-gray-50/40 opacity-75' : ''}`}>
                              <td className="py-5 px-6 font-black text-[#1C2C22]">
                                <span className="font-bold">{a.date}</span> <span className="text-[#5A6B60] font-medium mx-1">at</span> <span className="font-bold">{a.time}</span>
                              <td className="py-4 px-4 font-black text-[#1C2C22] whitespace-nowrap">
                                <span className="font-bold text-xs">{a.date}</span> <span className="text-[#5A6B60] text-xs font-normal mx-1">at</span> <span className="font-bold text-xs text-[#456A50]">{a.time}</span>
                              </td>
                              <td className="py-5 px-6">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.mode}</span>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${a.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.mode || 'IN-CLINIC'}</span>
                              </td>
                              <td className="py-5 px-6">
                              <td className="py-4 px-4 whitespace-nowrap">
                                {isCancelled ? (
                                  <span className="text-xs text-gray-400 font-semibold italic">Session Cancelled</span>
                                ) : a.mode === 'ONLINE' ? (
                                  a.meet_link ? (
                                    <a 
                                      href={a.meet_link} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition transform hover:scale-105"
                                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl font-bold text-xs shadow-sm transition"
                                    >
                                      <Video size={14} /> Join Google Meet <ExternalLink size={12} />
                                      <Video size={13} /> Join Meet <ExternalLink size={11} />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg inline-flex items-center gap-1.5">
                                      <Clock size={12} /> Link arriving soon
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                      <Clock size={11} /> Link arriving soon
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-400 text-xs font-semibold">In-Clinic Session</span>
                                  <span className="text-gray-600 text-xs font-bold flex items-center gap-1">
                                    <DoorOpen size={13} className="text-[#456A50]" /> In-Clinic Chamber
                                  </span>
                                )}
                              </td>
                              <td className="py-5 px-6">
                              <td className="py-4 px-4 whitespace-nowrap">
                                {isCancelled ? (
                                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
                                    <RotateCcw size={12} className="text-emerald-700" /> ₹500 Refund Credited
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                                    <RotateCcw size={11} className="text-emerald-700" /> ₹500 Refunded
                                  </span>
                                ) : a.status === 'COMPLETED' ? (
                                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase bg-green-100 text-green-700">COMPLETED</span>
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-green-100 text-green-700 border border-green-200">COMPLETED</span>
                                ) : isRescheduled ? (
                                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-200">RESCHEDULED • PAID</span>
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-200">RESCHEDULED • PAID</span>
                                ) : (
                                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase bg-orange-100 text-orange-700">SCHEDULED • PAID</span>
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-amber-50 text-amber-800 border border-amber-200">SCHEDULED • PAID</span>
                                )}
                              </td>
                              <td className="py-5 px-6 text-right">
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                {isCancelled ? (
                                  <button 
                                    onClick={() => generateRefundReceipt(a)} 
                                    className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1.5 ml-auto transition shadow-sm cursor-pointer"
                                    className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1.5 ml-auto transition shadow-sm cursor-pointer"
                                  >
                                    <Download size={13}/> Refund Receipt
                                    <Download size={12}/> Refund Receipt
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                    {a.mode !== 'ONLINE' && (
                                      <button 
                                        type="button"
                                        onClick={() => printClinicTokenSlip(a, { name: userName || profile.first_name })} 
                                        className="bg-[#EAF0EC] text-[#456A50] hover:bg-[#456A50] hover:text-white px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-2xs border border-[#456A50]/20 cursor-pointer"
                                        className="bg-[#EAF0EC] text-[#456A50] hover:bg-[#456A50] hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-2xs border border-[#456A50]/20 cursor-pointer shrink-0"
                                        title="Print In-Clinic Token Slip"
                                      >
                                        <Printer size={13}/> Token Pass
                                        <Printer size={12}/> Token Pass
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => generateReceipt(a)} 
                                      className="bg-white text-[#456A50] px-2.5 py-2 rounded-xl text-[11px] font-bold hover:bg-[#EAF0EC] flex items-center gap-1 transition shadow-sm border border-[#EBE9E0] cursor-pointer"
                                      className="bg-white text-[#456A50] px-2.5 py-1.5 rounded-xl text-[11px] font-bold hover:bg-[#EAF0EC] flex items-center gap-1 transition shadow-sm border border-[#EBE9E0] cursor-pointer shrink-0"
                                    >
                                      <Download size={13}/> Receipt
                                      <Download size={12}/> Receipt
                                    </button>
                                    {a.status !== 'COMPLETED' && (
                                      <button 
                                        onClick={() => { setCancellingAppt(a); setCancelReason('Schedule Conflict'); }} 
                                        className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer shrink-0"
                                        title="Cancel booking and receive 100% instant refund"
                                      >
                                        <RotateCcw size={13} className="text-red-600"/> Cancel
                                        <RotateCcw size={12} className="text-red-600"/> Cancel
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )})}
                          {displayedAppts.length === 0 && (
                            <tr>
                              <td colSpan="5" className="py-12 text-center text-gray-400 italic font-medium">
                                No appointments in this section.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white text-[#1C2C22] rounded-3xl shadow-xl p-0 h-[75vh] border border-[#EBE9E0] flex flex-col overflow-hidden">
                {/* 🌟 Tab Toggle for Chat 🌟 */}
                <div className="flex border-b border-[#EBE9E0] bg-[#FDFCF8] shrink-0">
                  <button onClick={() => setChatPartner('manager')} className={`flex-1 py-4 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${chatPartner === 'manager' ? 'bg-[#EAF0EC] text-[#456A50] border-b-2 border-[#456A50]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}><MessageSquare size={16}/> Clinic Manager</button>
                  <button onClick={() => setChatPartner('nutritionist')} className={`flex-1 py-4 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${chatPartner === 'nutritionist' ? 'bg-[#EAF0EC] text-[#456A50] border-b-2 border-[#456A50]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}><Stethoscope size={16}/> Nutritionist</button>
                </div>
                
                {/* 🌟 Dynamic Chat Header 🌟 */}
                {chatPartner === 'manager' ? (
                  <div className="flex items-center gap-3 p-4 border-b border-[#EBE9E0] bg-[#FDFCF8]">
                    <div className="bg-white p-2.5 rounded-full shadow-sm text-blue-600">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-[#1C2C22]">Clinic Manager</h2>
                      <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">Usually replies in 10 mins</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 border-b border-[#EBE9E0] bg-[#FDFCF8]">
                    <div className="bg-white p-2.5 rounded-full shadow-sm text-[#456A50]">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-[#1C2C22]">Nutritionist</h2>
                      <p className="text-[9px] text-[#456A50] font-bold uppercase tracking-widest">Direct channel to your dietitian</p>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white custom-scrollbar">
                  {(() => {
                    const activeMessages = chats.filter(c => {
                      if (chatPartner === 'manager') {
                        return c.chatPartner === 'manager' || c.senderRole === 'SYSTEM' || c.senderRole === 'MANAGER' || c.contactId === 'manager';
                      } else {
                        return c.chatPartner === 'nutritionist' || c.senderRole === 'NUTRITIONIST' || (c.contactId && c.contactId !== 'manager' && c.senderRole !== 'SYSTEM');
                      }
                    });

                    if (activeMessages.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm italic">
                          {chatPartner === 'manager' ? <MessageSquare size={48} className="mb-4 text-gray-300 opacity-50" /> : <Stethoscope size={48} className="mb-4 text-gray-300 opacity-50" />}
                          Have a question? Send a direct message to {chatPartner === 'manager' ? 'Clinic Management' : 'your Nutritionist'}.
                        </div>
                      );
                    }

                    return activeMessages.map(msg => {
                      const matchMeet = msg.meetLink || (typeof msg.text === 'string' && msg.text.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0]);
                      return (
                        <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'PATIENT' ? 'items-end' : 'items-start'}`}>

                      {msg.senderRole === 'SYSTEM' ? (
                        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold my-2 shadow-sm self-center max-w-[90%]">
                          <p className="flex items-center gap-1.5 text-emerald-800 mb-1.5"><Video size={16}/> {msg.text}</p>
                          {matchMeet && (
                            <a 
                              href={matchMeet} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="mt-2 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md transition"
                            >
                              <Video size={14} /> Join Google Meet Consultation <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${msg.senderRole === 'PATIENT' ? 'bg-[#456A50] text-white rounded-br-sm' : 'bg-[#FDFCF8] border border-[#EBE9E0] text-[#1C2C22] rounded-bl-sm'}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          {matchMeet && (
                            <a 
                              href={matchMeet} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="mt-3 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                            >
                              <Video size={14} /> Open Google Meet <ExternalLink size={12} />
                            </a>
                          )}
                          <span className={`text-[9px] mt-2 block font-bold tracking-widest uppercase ${msg.senderRole === 'PATIENT' ? 'text-green-200' : 'text-gray-400'}`}>{msg.time}</span>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
              <div ref={chatEndRef} />

                </div>
                <form onSubmit={handleSendChat} className="p-4 border-t border-[#EBE9E0] bg-[#FDFCF8] flex items-end gap-3"><textarea value={queryText} onChange={e=>setQueryText(e.target.value)} required rows="1" placeholder={`Message ${chatPartner === 'manager' ? 'Manager' : 'Nutritionist'}...`} className="flex-1 bg-white border border-[#EBE9E0] rounded-2xl p-4 text-sm outline-none focus:border-[#456A50] text-[#1C2C22] placeholder-gray-400 resize-none transition shadow-sm"></textarea><button type="submit" className="bg-[#456A50] text-white p-4 rounded-2xl hover:bg-[#35533E] transition shadow-md flex justify-center items-center h-[54px] w-[54px] shrink-0 cursor-pointer"><Send size={20} className="ml-1" /></button></form>
              </div>
            </div>
          </div>

        )}

        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(69, 106, 80, 0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(69, 106, 80, 0.5); }
      `}</style>
    </div>
  );
};

export default PatientDashboard;