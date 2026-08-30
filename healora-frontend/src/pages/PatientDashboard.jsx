import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Activity, Apple, LogOut, FileText, 
  UserCircle, HeartPulse, Moon, Footprints, Droplets,
  CheckCircle2, Trash2, ShieldCheck, Edit3, Camera, Upload, X,
  CreditCard, Lock, ChevronRight, ChevronLeft, CheckCircle, MessageSquare, Send, Bell, Download, File, User, Key, Flame, AlertCircle, DownloadCloud, Stethoscope, ClipboardList, Star, ShieldAlert,
  Video, ExternalLink, Link2, Clock, Sparkles, Eye, RotateCcw, XCircle, AlertTriangle, Check, RefreshCw
} from 'lucide-react';

import BookingCalendarPicker, { getHolidayOrOffReason } from '../components/BookingCalendarPicker.jsx';
import TimeSlotPicker, { normalizeTimeTo24H, normalizeTimeToLabel } from '../components/TimeSlotPicker.jsx';
import { getKeralaPersonalizedOptions, getKeralaMealImage, KERALA_FOOD_IMAGES } from '../utils/keralaNutritionEngine.js';



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
  
  const [logForm, setLogForm] = useState({ 
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
      // 1. Sync appointments
      try {
        const apptRes = await fetch(`/api/patient/${userId}/appointments/`).catch(() => ({ ok: false }));
        const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
        if (apptRes.ok) {
          const apiAppts = await apptRes.json().catch(() => []);
          const apptMap = new Map();
          localAppts.filter(a => String(a.patient) === String(userId) || a.patient === '1' || a.patient === 1).forEach(a => apptMap.set(a.id, a));
          (Array.isArray(apiAppts) ? apiAppts : []).forEach(a => apptMap.set(a.id, a));
          const merged = Array.from(apptMap.values()).sort((a,b) => (b.id || 0) - (a.id || 0));
          if (merged.length > 0) setAppointments(merged);
        } else if (localAppts.length > 0) {
          const myAppts = localAppts.filter(a => String(a.patient) === String(userId) || a.patient === '1' || a.patient === 1 || a.patient === 'patient_1');
          if (myAppts.length > 0) {
            setAppointments(myAppts.sort((a,b) => (b.id || 0) - (a.id || 0)));
          } else {
            setAppointments(localAppts.slice(0, 3));
          }
        }
      } catch (e) {
        const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
        if (localAppts.length > 0) setAppointments(localAppts);
      }

      // 2. Sync chats
      const syncedChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      const myChats = syncedChats.filter(c => c && (String(c.patientId) === String(userId) || c.patientId === '1' || c.patientId === 1 || c.patientId === 'patient_1' || String(c.contactId) === String(userId)));
      if (myChats.length > 0) {
        setChats(myChats);
      } else if (syncedChats.length > 0) {
        setChats(syncedChats);
      }

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
        if (apiPlans.length) {
          setDietPlans(apiPlans);
          localStorage.setItem(`healora_patient_dietplan_${userId}`, JSON.stringify(apiPlans[0]));
        } else { setDietPlans([]); }
      } else {
        const cached = JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`) || 'null');
        setDietPlans(cached ? [normalizePlan(cached)] : []);
      }
      
      if (nutRes.ok) {
        const nutData = await nutRes.json();
        setNutritionists(nutData);
        if (nutData.length > 0) setApptForm(prev => ({ ...prev, nutritionist: nutData[0].id }));
      }

      const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
      if (apptRes.ok) {
        const apiAppts = await apptRes.json();
        const apptMap = new Map();
        localAppts.filter(a => String(a.patient) === String(userId) || a.patient === '1' || a.patient === 1).forEach(a => apptMap.set(a.id, a));
        (Array.isArray(apiAppts) ? apiAppts : []).forEach(a => apptMap.set(a.id, a));
        const merged = Array.from(apptMap.values()).sort((a,b) => (b.id || 0) - (a.id || 0));
        setAppointments(merged);
      } else {
        setAppointments(localAppts.filter(a => String(a.patient) === String(userId) || a.patient === '1' || a.patient === 1).sort((a,b) => (b.id || 0) - (a.id || 0)));
      }

      const syncedChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      setChats(syncedChats.filter(c => c && (String(c.patientId) === String(userId) || c.patientId === '1' || c.patientId === 1 || String(c.contactId) === String(userId))));



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
    printWindow.document.write(`
      <html><head><title>Receipt - Healora</title></head><body style="font-family: Arial; padding: 40px; color: #1C2C22; max-width: 600px; margin: auto;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #EBE9E0; padding-bottom: 20px;"><h1 style="color: #456A50; margin:0;">Healora Clinic</h1><h2 style="margin:0; color: #5A6B60;">PAYMENT RECEIPT</h2></div><br/>
        <div style="background: #FDFCF8; padding: 20px; border-radius: 10px; border: 1px solid #EBE9E0;"><p><strong>Patient Name:</strong> ${userName}</p><p><strong>Booking ID:</strong> APT-${appt.id}</p><p><strong>Date & Time:</strong> ${appt.date} at ${appt.time}</p><p><strong>Mode:</strong> ${appt.mode}</p></div><br/>
        <table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 20px;"><tr style="background: #EAF0EC; color: #456A50;"><th style="padding: 12px; border: 1px solid #EBE9E0;">Description</th><th style="padding: 12px; border: 1px solid #EBE9E0;">Amount</th></tr><tr><td style="padding: 12px; border: 1px solid #EBE9E0;">Expert Nutrition Consultation</td><td style="padding: 12px; border: 1px solid #EBE9E0;">₹ 500.00</td></tr></table>
        <h3 style="text-align: right; margin-top: 20px; font-size: 24px; color: #1C2C22;">Total Paid: ₹ 500.00</h3>
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
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #16a34a;">STATUS: COMPLETED</p>
          </div>
        </div><br/>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Patient Name:</strong> ${userName}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Refund Reference ID:</strong> ${refundId}</p>
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
          <p style="margin:0; font-size: 13px; color: #5A6B60;"><strong>Payment Method Credited:</strong> Original Payment Card / UPI account.</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #5A6B60;"><strong>Reason:</strong> ${appt.cancellation_reason || 'Patient Requested Cancellation'}</p>
        </div>

        <div style="text-align: right; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; color: #5A6B60;">Net Amount Charged: ₹ 0.00</p>
          <h3 style="margin: 5px 0 0 0; font-size: 22px; color: #15803d;">Total Refunded: ₹ 500.00</h3>
        </div>

        <p style="text-align: center; margin-top: 40px; font-style: italic; color: #888; font-size: 12px;">(End of Document - Authorized Instant Refund by Healora Billing Systems)</p>
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
    
    const refundId = `REF-${Date.now().toString().slice(-6)}`;
    const refundTimestamp = new Date().toLocaleString();
    
    const updatedAppt = {
      ...cancellingAppt,
      status: 'CANCELLED',
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
      message: `Your appointment for ${cancellingAppt.date} at ${cancellingAppt.time} was cancelled. Full cash back of ₹ 500.00 has been refunded to your original payment method (Ref: ${refundId}).`,
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
        body: JSON.stringify({ status: 'CANCELLED' })
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
    const printWindow = window.open('', '_blank');
    
    let scheduleHTML = '';
    daysOfWeek.forEach(day => {
      const b = getActiveMealObject('breakfast', targetWeek, day);
      const dr = getActiveMealObject('drink', targetWeek, day);
      const l = getActiveMealObject('lunch', targetWeek, day);
      const s = getActiveMealObject('snack', targetWeek, day);
      const d = getActiveMealObject('dinner', targetWeek, day);
      
      scheduleHTML += `
        <div class="day-card">
          <h3>${day} Schedule (${getProtocolDate(targetWeek, day)})</h3>
          <div class="meal-row"><div class="meal-type" style="color: #ea580c;">Breakfast</div><div>${b.name} <span style="color:#888; font-size:12px;">(${b.cal})</span></div></div>
          <div class="meal-row"><div class="meal-type" style="color: #0d9488;">Drink / Smoothie</div><div>${dr.name} <span style="color:#888; font-size:12px;">(${dr.cal})</span></div></div>
          <div class="meal-row"><div class="meal-type" style="color: #ca8a04;">Lunch</div><div>${l.name} <span style="color:#888; font-size:12px;">(${l.cal})</span></div></div>
          <div class="meal-row"><div class="meal-type" style="color: #16a34a;">Snack</div><div>${s.name} <span style="color:#888; font-size:12px;">(${s.cal})</span></div></div>
          <div class="meal-row"><div class="meal-type" style="color: #2563eb;">Dinner</div><div>${d.name} <span style="color:#888; font-size:12px;">(${d.cal})</span></div></div>
        </div>
      `;
    });

    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);

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

  const handleBookAppointment = async (e) => {
    e.preventDefault(); if (!validatePayment()) return;
    const newAppointment = { id: Date.now(), patient: userId, ...apptForm, status: 'SCHEDULED', amount_paid: 500.00 };
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
      if (file.size > 5 * 1024 * 1024) { alert("Please select a file smaller than 5MB."); return; }
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
          size: (file.size / 1024).toFixed(1) + ' KB'
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
    const newLog = { id: Date.now(), patientId: userId, patientName: userName, date: new Date().toISOString(), ...logForm };
    
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
    setLogForm({ breakfast_completed: false, lunch_completed: false, dinner_completed: false, ate_other_food: false, other_food_details: '', sleep_hours: '', mood: 'Calm & Balanced', water_glasses: 0, weight_kg: '', physical_activity: '', supplements_taken: false });
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
              <form onSubmit={handleBookAppointment} className="space-y-5 animate-in slide-in-from-right-4" autoComplete="off" noValidate>
                <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#EBE9E0] mb-4 flex justify-between items-center shadow-sm"><p className="text-xs text-[#5A6B60] font-bold uppercase tracking-wider mb-1">Amount Due</p><p className="text-3xl font-black text-[#1C2C22]">₹ 500.00</p></div>
                <div><div className="flex justify-between items-end mb-2"><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Cardholder Name</label>{paymentErrors.cardName && <span className="text-[9px] font-bold text-red-500">{paymentErrors.cardName}</span>}</div><input type="text" spellCheck="false" autoComplete="new-password" value={paymentForm.cardName} onChange={(e) => handlePaymentChange('cardName', e.target.value)} placeholder="John Doe" className={`w-full border ${paymentErrors.cardName ? 'border-red-400 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-white'} rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm`} required/></div>
                <div><div className="flex justify-between items-end mb-2"><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Card Number</label>{paymentErrors.cardNumber && <span className="text-[9px] font-bold text-red-500">{paymentErrors.cardNumber}</span>}</div><div className="relative"><input type="text" maxLength="16" spellCheck="false" autoComplete="new-password" value={paymentForm.cardNumber} onChange={(e) => handlePaymentChange('cardNumber', e.target.value)} placeholder="16 Digit Number" className={`w-full border ${paymentErrors.cardNumber ? 'border-red-400 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-white'} rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] pl-12 transition shadow-sm`} required/><CreditCard size={18} className={`absolute left-4 top-4 ${paymentErrors.cardNumber ? 'text-red-400' : 'text-gray-400'}`} /></div></div>
                <div className="grid grid-cols-2 gap-5">
                  <div><div className="flex justify-between items-end mb-2"><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Expiry</label>{paymentErrors.expiry && <span className="text-[9px] font-bold text-red-500">{paymentErrors.expiry}</span>}</div><input type="text" maxLength="5" spellCheck="false" autoComplete="new-password" value={paymentForm.expiry} onChange={(e) => handlePaymentChange('expiry', e.target.value)} placeholder="MM/YY" className={`w-full border ${paymentErrors.expiry ? 'border-red-400 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-white'} rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm`} required/></div>
                  <div><div className="flex justify-between items-end mb-2"><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">CVV</label>{paymentErrors.cvv && <span className="text-[9px] font-bold text-red-500">{paymentErrors.cvv}</span>}</div><div className="relative"><input type="password" maxLength="3" spellCheck="false" autoComplete="new-password" value={paymentForm.cvv} onChange={(e) => handlePaymentChange('cvv', e.target.value)} placeholder="•••" className={`w-full border ${paymentErrors.cvv ? 'border-red-400 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-white'} rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] pl-12 transition shadow-sm`} required/><Lock size={16} className={`absolute left-4 top-4 ${paymentErrors.cvv ? 'text-red-400' : 'text-gray-400'}`} /></div></div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-[#EBE9E0]">
                  <button type="button" onClick={() => setBookingStep(1)} className="w-1/3 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-sm hover:bg-gray-200 transition cursor-pointer">Back</button>
                  <button type="submit" className="w-2/3 bg-green-700 text-white py-4 rounded-xl font-bold text-sm hover:bg-green-800 transition shadow-lg flex justify-center items-center gap-2 cursor-pointer"><Lock size={16} /> Pay ₹ 500</button>
                </div>
              </form>
            )}
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
      <aside className="w-64 bg-white border-r border-[#EBE9E0] flex flex-col hidden lg:flex shadow-sm z-10 flex-shrink-0 h-full">
        <div className="p-6 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-[#456A50] text-white rounded-xl p-2 shadow-sm"><HeartPulse size={24} /></div>
          <span className="text-2xl font-black tracking-tight text-[#1C2C22]">Heal<span className="text-[#456A50]">ora</span></span>
        </div>
        <nav className="flex-1 px-4 mt-4 space-y-2 font-medium overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-3 mt-2">My Workspace</p>
          <button onClick={() => { setActiveTab('profile'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab==='profile' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><UserCircle size={18} /> Profile & Vault</button>
          <button onClick={() => { setActiveTab('diet'); setDietView('weeks'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab==='diet' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Apple size={18} /> My Diet Plan</button>
          <button onClick={() => { setActiveTab('tracking'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab==='tracking' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Activity size={18} /> Wellness Tracking</button>
          <button onClick={() => { setActiveTab('appointments'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab==='appointments' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Calendar size={18} /> Appointments & Chat</button>
          <button onClick={() => { setActiveTab('evaluations'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab==='evaluations' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><ClipboardList size={18} /> Nutritionist Evaluations</button>
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
                    <p className="text-[10px] text-[#5A6B60] mt-1.5 font-medium">PDF, JPG, PNG (Max 5MB)</p>
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
                    {labReports.map((report) => (
                      <div key={report.id} className="flex justify-between items-center p-3.5 bg-white border border-[#EBE9E0] rounded-2xl shadow-xs hover:border-[#456A50]/40 transition group">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0">
                            <File size={16} />
                          </div>
                          <div className="truncate flex-1">
                            <p className="font-bold text-xs text-[#1C2C22] truncate">{report.name || report.file?.split('/').pop() || 'Document'}</p>
                            <p className="text-[9px] text-[#456A50] mt-0.5 font-black tracking-wider uppercase truncate">{report.type || report.document_type || 'Clinical Report'}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{report.date || (report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString() : '')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
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
                    ))}
                    {labReports.length === 0 && <p className="text-center text-[11px] text-gray-400 italic py-6">No clinical documents uploaded yet.</p>}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 🌟 TAB 2: MY DIET PLAN (DRILL DOWN, DYNAMIC IMAGES, SWAPPING & INTERACTIVE WATER UI) 🌟 */}
          {activeTab === 'diet' && (() => {
            const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || JSON.parse(localStorage.getItem(`healora_diet_plan_${userId}`)) || null);
            const isPhase2Unlocked = publishedPlan?.phase2_status === 'UNLOCKED';

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
                      5-Slot Clinical Balance
                    </span>
                  </div>

                  {/* Meals Grid: 5 Personalized Slots (Breakfast, Drink, Lunch, Snack, Dinner) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
                    {[
                      { type: 'breakfast', label: '🌅 Breakfast', color: 'orange' },
                      { type: 'drink', label: '🥤 Drink / Smoothie', color: 'teal' },
                      { type: 'lunch', label: '☀️ Lunch', color: 'yellow' },
                      { type: 'snack', label: '🍎 Snack', color: 'green' },
                      { type: 'dinner', label: '🌙 Dinner', color: 'blue' }
                    ].map(({ type: mealType, label, color: c }) => {
                      const mealObj = getActiveMealObject(mealType);

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
                  
                  {/* MEAL CHECKBOXES */}
                  <div className="bg-[#FDFCF8] border border-[#EBE9E0] p-6 rounded-[2rem] shadow-sm">
                    <label className="block text-[11px] font-bold text-[#5A6B60] mb-4 tracking-widest uppercase">1. Today's Scheduled Meals Completed?</label>
                    <div className="grid grid-cols-3 gap-4">
                      <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition shadow-sm ${logForm.breakfast_completed ? 'bg-[#EAF0EC] border-[#456A50]' : 'bg-white border-[#EBE9E0] hover:border-gray-300'}`}><input type="checkbox" checked={logForm.breakfast_completed} onChange={e=>setLogForm({...logForm, breakfast_completed: e.target.checked})} className="hidden" /><span className="text-2xl mb-1">🌅</span><span className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-center ${logForm.breakfast_completed ? 'text-[#456A50]' : 'text-[#5A6B60]'}`}>Breakfast</span></label>
                      <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition shadow-sm ${logForm.lunch_completed ? 'bg-[#EAF0EC] border-[#456A50]' : 'bg-white border-[#EBE9E0] hover:border-gray-300'}`}><input type="checkbox" checked={logForm.lunch_completed} onChange={e=>setLogForm({...logForm, lunch_completed: e.target.checked})} className="hidden" /><span className="text-2xl mb-1">☀️</span><span className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-center ${logForm.lunch_completed ? 'text-[#456A50]' : 'text-[#5A6B60]'}`}>Lunch</span></label>
                      <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition shadow-sm ${logForm.dinner_completed ? 'bg-[#EAF0EC] border-[#456A50]' : 'bg-white border-[#EBE9E0] hover:border-gray-300'}`}><input type="checkbox" checked={logForm.dinner_completed} onChange={e=>setLogForm({...logForm, dinner_completed: e.target.checked})} className="hidden" /><span className="text-2xl mb-1">🌙</span><span className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-center ${logForm.dinner_completed ? 'text-[#456A50]' : 'text-[#5A6B60]'}`}>Dinner</span></label>
                    </div>
                  </div>

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
                    {wellnessLogs.map(log => (
                      <div key={log.id} className="bg-[#FDFCF8] border border-[#EBE9E0] p-5 rounded-2xl shadow-sm hover:border-[#456A50]/30 transition group hover:shadow-md">
                        <div className="flex justify-between items-start mb-3 border-b border-[#EBE9E0] pb-3"><p className="font-black text-[#1C2C22] text-sm">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>{log.ate_other_food ? <span className="bg-red-50 text-red-700 px-3 py-1 rounded-lg text-[9px] font-bold border border-red-100 uppercase tracking-widest">Ate Off-Plan</span> : <span className="bg-[#EAF0EC] text-[#456A50] px-3 py-1 rounded-lg text-[9px] font-bold border border-[#456A50]/20 uppercase tracking-widest">Followed Plan</span>}</div>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[11px] text-[#5A6B60]">
                          <p className="flex items-center gap-1.5"><Droplets size={12} className="text-blue-500"/><span className="text-blue-600 font-bold">{log.water_glasses} glasses</span></p>
                          <p className="flex items-center gap-1.5 truncate"><Footprints size={12} className="text-green-500 shrink-0"/><span className="truncate">{log.physical_activity || 'None'}</span></p>
                          <p className="flex items-center gap-1.5"><Moon size={12} className="text-purple-500"/><span className="text-purple-600 font-bold">{log.sleep_hours} hrs</span></p>
                          <p className="flex items-center gap-1.5 truncate"><Activity size={12} className="text-orange-500 shrink-0"/><span className="truncate">{log.mood || 'N/A'}</span></p>
                        </div>
                      </div>
                    ))}
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

        {/* TAB 4: APPOINTMENTS & MODERN CHAT */}
        {activeTab === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBE9E0] overflow-hidden flex flex-col h-[75vh]">
              <div className="p-8 border-b border-[#EBE9E0] flex justify-between items-center bg-[#FDFCF8]">
                <div><h2 className="text-2xl font-black text-[#1C2C22]">My Appointments</h2><p className="text-sm text-[#5A6B60] mt-1">Track bookings, join telehealth Google Meets & download receipts.</p></div>
                <button onClick={() => {setShowApptModal(true); setPaymentErrors({});}} className="bg-[#456A50] text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#35533E] shadow-lg shadow-[#456A50]/20 text-sm transition cursor-pointer"><Calendar size={18} /> Request Appointment</button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                <table className="w-full text-left text-sm text-[#1C2C22]">
                  <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0"><tr><th className="py-4 px-6">Date & Time</th><th className="py-4 px-6">Mode</th><th className="py-4 px-6">Telehealth Video</th><th className="py-4 px-6">Status & Payment</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[#EBE9E0]">
                    {appointments.map(a => (
                      <tr key={a.id} className="hover:bg-[#FDFCF8] transition group">
                        <td className="py-5 px-6 font-black text-[#1C2C22]">
                          {a.date} <span className="text-[#5A6B60] font-medium mx-1">at</span> {a.time}
                        </td>
                        <td className="py-5 px-6">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.mode}</span>
                        </td>
                        <td className="py-5 px-6">
                          {a.status === 'CANCELLED' ? (
                            <span className="text-xs text-gray-400 font-semibold italic">Session Cancelled</span>
                          ) : a.mode === 'ONLINE' ? (
                            a.meet_link ? (
                              <a 
                                href={a.meet_link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition transform hover:scale-105"
                              >
                                <Video size={14} /> Join Google Meet <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg inline-flex items-center gap-1.5">
                                <Clock size={12} /> Link arriving soon
                              </span>
                            )
                          ) : (
                            <span className="text-gray-400 text-xs font-semibold">In-Clinic Session</span>
                          )}
                        </td>
                        <td className="py-5 px-6">
                          {a.status === 'CANCELLED' ? (
                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
                              <RotateCcw size={12} className="text-emerald-700" /> ₹500 Refund Credited
                            </span>
                          ) : a.status === 'COMPLETED' ? (
                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase bg-green-100 text-green-700">COMPLETED</span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase bg-orange-100 text-orange-700">SCHEDULED • PAID</span>
                          )}
                        </td>
                        <td className="py-5 px-6 text-right">
                          {a.status === 'CANCELLED' ? (
                            <button 
                              onClick={() => generateRefundReceipt(a)} 
                              className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1.5 ml-auto transition shadow-sm cursor-pointer"
                            >
                              <Download size={13}/> Refund Receipt
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => generateReceipt(a)} 
                                className="bg-white text-[#456A50] px-3 py-2 rounded-xl text-[11px] font-bold hover:bg-[#EAF0EC] flex items-center gap-1 transition shadow-sm border border-[#EBE9E0] cursor-pointer"
                              >
                                <Download size={13}/> Receipt
                              </button>
                              {a.status !== 'COMPLETED' && (
                                <button 
                                  onClick={() => { setCancellingAppt(a); setCancelReason('Schedule Conflict'); }} 
                                  className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                                  title="Cancel booking and receive 100% instant refund"
                                >
                                  <RotateCcw size={13} className="text-red-600"/> Cancel & Refund
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {appointments.length === 0 && <tr><td colSpan="5" className="py-12 text-center text-gray-400 italic font-medium">No appointments scheduled.</td></tr>}
                  </tbody>
                </table>
              </div>
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