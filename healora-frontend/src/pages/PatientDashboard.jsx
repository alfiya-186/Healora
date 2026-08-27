import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Activity, Apple, LogOut, FileText, 
  UserCircle, HeartPulse, Moon, Footprints, Droplets,
  CheckCircle2, Trash2, ShieldCheck, Edit3, Camera, Upload, X,
  CreditCard, Lock, ChevronRight, ChevronLeft, CheckCircle, MessageSquare, Send, Bell, Download, File, User, Key, Flame, AlertCircle, DownloadCloud, Stethoscope, ClipboardList, Star
} from 'lucide-react';

const FALLBACK_IMAGES = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  snack: 'https://images.unsplash.com/photo-1599599553557-080c354673fb?auto=format&fit=crop&w=800&q=80',
  dinner: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || 'Patient';
  const userId = localStorage.getItem('user_id') || 'patient_1'; 
  
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
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [clinicHolidays, setClinicHolidays] = useState(() => JSON.parse(localStorage.getItem('healora_clinic_holidays')) || ['2026-08-25', '2026-08-26', '2026-09-01']);
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
  const [dietView, setDietView] = useState('weeks'); // 'weeks' | 'days' | 'meals'
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [mealOverrides, setMealOverrides] = useState({});
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [quickWaterTracker, setQuickWaterTracker] = useState(0);

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

  const fetchData = async () => {
    try {
      const [logRes, dietRes, nutRes, profileRes, docsRes] = await Promise.all([
        fetch(`/api/patient/${userId}/wellness/`).catch(()=>({ok:false})),
        fetch(`/api/patient/${userId}/diet/`).catch(()=>({ok:false})),
        fetch(`/api/nutritionists/`).catch(()=>({ok:false})),
        fetch(`/api/profile/update/${userId}/`).catch(()=>({ok:false})),
        fetch(`/api/patient/${userId}/documents/`).catch(()=>({ok:false}))
      ]);
      
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

      const syncedAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
      setAppointments(syncedAppts.filter(a => String(a.patient) === String(userId)).sort((a,b) => b.id - a.id));

      const syncedChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      setChats(syncedChats.filter(c => String(c.patientId) === String(userId)).map(c => ({...c, chatPartner: c.chatPartner || 'manager'})));

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

  const handleDownloadPlan = () => {
    const getActiveMealObjectPrint = (mealType, week, day) => {
      const overrideKey = `w${week}_${day}_${mealType}`;
      if (mealOverrides[overrideKey]) return mealOverrides[overrideKey];

      const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
      let rawMealName = mealDatabase[mealType][0].name;
      let rawCal = mealDatabase[mealType][0].cal;

      if (publishedPlan && publishedPlan.weeks && publishedPlan.weeks[week]) {
        const dayData = publishedPlan.weeks[week][day];
        if (dayData && dayData[mealType]) {
          let assignedName = typeof dayData[mealType] === 'object' ? dayData[mealType].name : dayData[mealType];
          rawCal = typeof dayData[mealType] === 'object' && dayData[mealType].cal ? dayData[mealType].cal : (assignedName.match(/\((\d+\s*kcal)\)/i)?.[1] || rawCal);
          assignedName = assignedName.replace(/\s*\(\d+\s*kcal\)/i, '').trim();
          
          const found = mealDatabase[mealType].find(m => m.name.toLowerCase().includes(assignedName.toLowerCase()));
          if (found) { rawMealName = found.name; rawCal = found.cal; }
          else { rawMealName = assignedName; }
        }
      }
      return { name: rawMealName, cal: rawCal };
    };

    const printWindow = window.open('', '_blank');
    const targetWeek = selectedWeek || 1;
    
    let scheduleHTML = '';
    daysOfWeek.forEach(day => {
      const b = getActiveMealObjectPrint('breakfast', targetWeek, day);
      const l = getActiveMealObjectPrint('lunch', targetWeek, day);
      const s = getActiveMealObjectPrint('snack', targetWeek, day);
      const d = getActiveMealObjectPrint('dinner', targetWeek, day);
      
      scheduleHTML += `
        <div class="day-card">
          <h3>${day} Schedule</h3>
          <div class="meal-row"><div class="meal-type" style="color: #ea580c;">Breakfast</div><div>${b.name} <span style="color:#888; font-size:12px;">(${b.cal})</span></div></div>
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

  const handleProceedToPayment = (e) => { e.preventDefault(); setBookingStep(2); };
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
    const newMsg = { id: Date.now(), patientId: String(userId), patientName: userName, senderRole: 'PATIENT', text: queryText, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), chatPartner };
    const allChats = JSON.parse(localStorage.getItem('healora_chats')) || []; allChats.push(newMsg); localStorage.setItem('healora_chats', JSON.stringify(allChats));
    setChats([...chats, newMsg]); setQueryText("");
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
      setUploadStatus('Encrypting & Uploading...');
      const newReportLocal = { id: Date.now(), name: file.name, type: docType, date: new Date().toLocaleDateString() };
      const currentReports = JSON.parse(localStorage.getItem(`labReports_${userId}`)) || []; const updated = [newReportLocal, ...currentReports]; setLabReports(updated); localStorage.setItem(`labReports_${userId}`, JSON.stringify(updated));
      const formData = new FormData(); formData.append('file', file); formData.append('document_type', docType);
      try { fetch(`/api/patient/${userId}/documents/`, { method: 'POST', body: formData }); } catch (err) {}
      setTimeout(() => { setUploadStatus('Document Saved Successfully!'); setTimeout(() => setUploadStatus(''), 3000); }, 1000);
    }
  };

  const removeLabReport = (id) => {
    if(!window.confirm("Are you sure you want to delete this document?")) return;
    const updated = labReports.filter(r => r.id !== id); setLabReports(updated); localStorage.setItem(`labReports_${userId}`, JSON.stringify(updated));
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

  const getProtocolDate = (week, dayName) => {
    const start = new Date('2026-08-16T00:00:00'); 
    const dayIdx = daysOfWeek.indexOf(dayName);
    start.setDate(start.getDate() + ((week - 1) * 7) + dayIdx);
    return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // 🌟 ROBUST NUTRITION DATABASE: GUARANTEED HD FOOD PICTURES 🌟
  const getMealImage = (mealName, mealType) => {
    const name = (mealName || '').toLowerCase();
    
    // Breakfasts & Carbs
    if (name.includes('oat') || name.includes('porridge') || name.includes('muesli')) return 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=800&q=80';
    if (name.includes('poha')) return 'https://images.unsplash.com/photo-1604152002599-6e3e5220c302?auto=format&fit=crop&w=800&q=80';
    if (name.includes('dosa') || name.includes('idli')) return 'https://images.unsplash.com/photo-1589301760014-a929cdac610b?auto=format&fit=crop&w=800&q=80';
    if (name.includes('upma') || name.includes('chilla')) return 'https://images.unsplash.com/photo-1626074964464-f27be45b4d13?auto=format&fit=crop&w=800&q=80';
    if (name.includes('paratha')) return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80';
    if (name.includes('toast') || name.includes('bread') || name.includes('sandwich')) return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80';
    if (name.includes('pancake') || name.includes('waffle')) return 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80';
    
    // Indian Meals & Mains
    if (name.includes('dal') || name.includes('lentil') || name.includes('thali') || name.includes('rajma') || name.includes('chole')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
    if (name.includes('paneer') || name.includes('palak')) return 'https://images.unsplash.com/photo-1565557612140-54e1cbcae4dc?auto=format&fit=crop&w=800&q=80';
    if (name.includes('roti') || name.includes('chapati') || name.includes('sabzi') || name.includes('bhindi')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=800&q=80';
    if (name.includes('khichdi') || name.includes('pongal')) return 'https://images.unsplash.com/photo-1543339459-00f72a44d0f6?auto=format&fit=crop&w=800&q=80';
    if (name.includes('curry') || name.includes('masala') || name.includes('tikka')) return 'https://images.unsplash.com/photo-1565557612140-54e1cbcae4dc?auto=format&fit=crop&w=800&q=80';
    if (name.includes('rice') || name.includes('pulav') || name.includes('biryani') || name.includes('pulao')) return 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=800&q=80';
    
    // Proteins
    if (name.includes('chicken') || name.includes('poultry')) return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80';
    if (name.includes('salmon')) return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80';
    if (name.includes('cod') || name.includes('fish') || name.includes('tuna') || name.includes('shrimp') || name.includes('prawn')) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80';
    if (name.includes('egg') || name.includes('omelet') || name.includes('scramble') || name.includes('bhurji')) return 'https://images.unsplash.com/photo-1510693224876-4c2810a90965?auto=format&fit=crop&w=800&q=80';
    if (name.includes('tofu') || name.includes('soy')) return 'https://images.unsplash.com/photo-1548943487-a2e4f438da06?auto=format&fit=crop&w=800&q=80';
    if (name.includes('beef') || name.includes('steak') || name.includes('meatball') || name.includes('lamb') || name.includes('mutton')) return 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80';

    // Bowls, Salads, Soups, Wraps
    if (name.includes('salad') || name.includes('greens') || name.includes('lettuce')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80';
    if (name.includes('quinoa') || name.includes('bowl')) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
    if (name.includes('soup') || name.includes('broth') || name.includes('stew')) return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80';
    if (name.includes('pasta') || name.includes('noodle') || name.includes('spaghetti')) return 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80';
    if (name.includes('wrap') || name.includes('roll') || name.includes('burrito') || name.includes('taco')) return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80';

    // Snacks, Sweets, Fruits
    if (name.includes('smoothie') || name.includes('shake') || name.includes('juice')) return 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80';
    if (name.includes('yogurt') || name.includes('parfait') || name.includes('curd') || name.includes('raita')) return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80';
    if (name.includes('pudding')) return 'https://images.unsplash.com/photo-1556767576-5fa4439c279a?auto=format&fit=crop&w=800&q=80';
    if (name.includes('apple') || name.includes('berry') || name.includes('melon') || name.includes('banana') || name.includes('orange')) return 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=800&q=80';
    if (name.includes('papaya') || name.includes('fruit')) return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80';
    if (name.includes('walnut') || name.includes('tea')) return 'https://images.unsplash.com/photo-1564149504298-00c351fd7f16?auto=format&fit=crop&w=800&q=80';
    if (name.includes('nut') || name.includes('almond') || name.includes('makhana') || name.includes('seed') || name.includes('peanut')) return 'https://images.unsplash.com/photo-1599599553557-080c354673fb?auto=format&fit=crop&w=800&q=80';
    if (name.includes('hummus') || name.includes('carrot') || name.includes('cucumber') || name.includes('stick') || name.includes('celery') || name.includes('dip')) return 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=800&q=80';

    // Absolute verified food fallbacks to prevent missing/unrelated images
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
      lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      snack: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=800&q=80',
      dinner: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
    };
    return fallbacks[mealType] || fallbacks.breakfast;
  };

  const mealDatabase = {
    breakfast: [
      { name: 'Oatmeal with Berries & Chia Seeds', cal: '290 kcal', img: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=800&q=80' },
      { name: 'Greek Yogurt Parfait with Honey', cal: '260 kcal', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80' },
      { name: 'Spinach & Mushroom Omelet', cal: '210 kcal', img: 'https://images.unsplash.com/photo-1510693224876-4c2810a90965?auto=format&fit=crop&w=800&q=80' },
      { name: 'Almond Milk Chia Pudding', cal: '230 kcal', img: 'https://images.unsplash.com/photo-1556767576-5fa4439c279a?auto=format&fit=crop&w=800&q=80' },
      { name: 'Avocado Toast on Whole Wheat', cal: '250 kcal', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80' },
      { name: 'Vegetable Poha with Peanuts', cal: '280 kcal', img: 'https://images.unsplash.com/photo-1604152002599-6e3e5220c302?auto=format&fit=crop&w=800&q=80' }
    ],
    lunch: [
      { name: 'Quinoa & Grilled Chicken Salad', cal: '410 kcal', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
      { name: 'Brown Rice, Lentil Dal & Greens', cal: '380 kcal', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80' },
      { name: 'Grilled Paneer Salad with Olive Oil', cal: '430 kcal', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
      { name: 'Zucchini Noodles with Turkey Meatballs', cal: '390 kcal', img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80' },
      { name: 'Multigrain Roti with Mixed Veg Sabzi', cal: '360 kcal', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=800&q=80' },
      { name: 'Baked Salmon Bowl with Asparagus', cal: '450 kcal', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80' }
    ],
    snack: [
      { name: 'Carrot Sticks with Hummus', cal: '150 kcal', img: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=800&q=80' },
      { name: 'Handful of Raw Walnuts & Green Tea', cal: '180 kcal', img: 'https://images.unsplash.com/photo-1599599553557-080c354673fb?auto=format&fit=crop&w=800&q=80' },
      { name: 'Roasted Pumpkin Seeds', cal: '140 kcal', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80' },
      { name: '1 Green Apple with Almond Butter', cal: '200 kcal', img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=800&q=80' },
      { name: 'Roasted Makhana (Fox Nuts)', cal: '120 kcal', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80' },
      { name: 'Fresh Papaya Bowl', cal: '110 kcal', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80' }
    ],
    dinner: [
      { name: 'Baked Salmon with Steamed Asparagus', cal: '450 kcal', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80' },
      { name: 'Vegetable Soup & Grilled Tofu', cal: '340 kcal', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80' },
      { name: 'Baked Cod with Roasted Sweet Potatoes', cal: '420 kcal', img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80' },
      { name: 'Mushroom Risotto with Parmesan', cal: '480 kcal', img: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80' },
      { name: 'Chicken Broth with Leafy Greens', cal: '280 kcal', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80' },
      { name: 'Light Moong Dal Khichdi', cal: '320 kcal', img: 'https://images.unsplash.com/photo-1543339459-00f72a44d0f6?auto=format&fit=crop&w=800&q=80' }
    ]
  };

  const getActiveMealObject = (mealType) => {
    const overrideKey = `w${selectedWeek}_${selectedDay}_${mealType}`;
    if (mealOverrides[overrideKey]) { return mealOverrides[overrideKey]; } 

    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
    let activeMeal = mealDatabase[mealType][0]; 

    if (publishedPlan && publishedPlan.weeks && publishedPlan.weeks[selectedWeek]) {
      const dayData = publishedPlan.weeks[selectedWeek][selectedDay];
      if (dayData && dayData[mealType]) {
        let rawName = typeof dayData[mealType] === 'object' ? (dayData[mealType].name || '') : (dayData[mealType] || '');
        let assignedCal = typeof dayData[mealType] === 'object' && dayData[mealType].cal ? dayData[mealType].cal : (rawName.match(/\((\d+\s*kcal)\)/i)?.[1] || activeMeal.cal);
        
        let providedImg = typeof dayData[mealType] === 'object' && typeof dayData[mealType].img === 'string' ? dayData[mealType].img : null;
        if (providedImg && (!providedImg.startsWith('http') && !providedImg.startsWith('data:image'))) {
            providedImg = null; 
        }

        let assignedName = rawName.replace(/\s*\(\d+\s*kcal\)/i, '').trim(); 
        
        const found = mealDatabase[mealType].find(m => 
            m.name.toLowerCase().includes(assignedName.toLowerCase()) || 
            (assignedName && assignedName.toLowerCase().includes(m.name.toLowerCase()))
        );

        if (found) {
          activeMeal = { 
            name: assignedName || found.name, 
            cal: assignedCal || found.cal, 
            img: providedImg || found.img || getMealImage(assignedName, mealType)
          };
        } else {
          activeMeal = { 
            name: assignedName || 'Custom Meal', 
            cal: assignedCal, 
            img: providedImg || getMealImage(assignedName, mealType) 
          };
        }
      }
    } 
    return activeMeal;
  };

  const handleSwapMeal = (mealType) => {
    const currentMeal = getActiveMealObject(mealType);
    const options = mealDatabase[mealType];
    const currentIndex = options.findIndex(opt => opt.name === currentMeal.name);
    const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % options.length : 0;
    const nextMealObj = options[nextIndex]; 

    const overrideKey = `w${selectedWeek}_${selectedDay}_${mealType}`;
    setMealOverrides(prev => ({ ...prev, [overrideKey]: nextMealObj }));
    setSelectedMeal({ ...nextMealObj, type: mealType });
  };

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
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden relative border border-[#EBE9E0]">
            <div className="flex justify-between items-center mb-8 border-b border-[#EBE9E0] pb-4">
              <h2 className="text-2xl font-black text-[#1C2C22] flex items-center gap-2"><Calendar size={24} className="text-[#456A50]" />{bookingStep === 1 ? 'Book Appointment' : 'Secure Checkout'}</h2>
              <button onClick={() => {setShowApptModal(false); setBookingStep(1); setPaymentErrors({}); setPaymentForm({ cardName: '', cardNumber: '', expiry: '', cvv: '' });}} className="text-gray-400 hover:text-gray-800 transition bg-gray-100 rounded-full p-2"><X size={18} /></button>
            </div>
            {bookingStep === 1 && (
              <form onSubmit={handleProceedToPayment} className="space-y-6 animate-in slide-in-from-left-4">
                <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Select Nutritionist</label><select required value={apptForm.nutritionist} onChange={(e) => setApptForm({...apptForm, nutritionist: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="AUTO">Auto-Assign Best Available</option>{nutritionists.map(n => <option key={n.id} value={n.id}>Dr. {n.first_name} {n.last_name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Date</label>
                    <input type="date" required min={todayStr} value={apptForm.date} onChange={(e) => { const selectedDate = e.target.value; if (isClinicHolidayOrOff(selectedDate)) { alert("❌ Clinic Holiday / Off-day: The clinic is closed on Sundays and 2nd Saturdays."); setApptForm({ ...apptForm, date: '' }); } else { setApptForm({ ...apptForm, date: selectedDate }); } }} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" />
                    <div className="mt-2 bg-red-50 border border-red-200 p-2.5 rounded-lg"><p className="text-[10px] text-red-700 font-bold leading-tight">🚫 Clinic Closed on: <br/>• All Sundays <br/>• All 2nd Saturdays</p></div>
                  </div>
                  <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Time</label><input type="time" required value={apptForm.time} onChange={(e) => setApptForm({...apptForm, time: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" /></div>
                </div>
                <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Consultation Mode</label><select value={apptForm.mode} onChange={(e) => setApptForm({...apptForm, mode: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option value="ONLINE">Online (Video Call)</option><option value="OFFLINE">In-Clinic</option></select></div>
                <div className="bg-[#EAF0EC] rounded-2xl p-5 flex justify-between items-center border border-[#456A50]/20 shadow-sm"><span className="font-bold text-[#456A50] text-sm">Consultation Fee</span><span className="font-black text-2xl text-[#1C2C22]">₹ 500</span></div>
                <button type="submit" className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg mt-2 flex items-center justify-center gap-2">Proceed to Payment <CreditCard size={18}/></button>
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
                  <button type="button" onClick={() => setBookingStep(1)} className="w-1/3 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-sm hover:bg-gray-200 transition">Back</button>
                  <button type="submit" className="w-2/3 bg-green-700 text-white py-4 rounded-xl font-bold text-sm hover:bg-green-800 transition shadow-lg flex justify-center items-center gap-2"><Lock size={16} /> Pay ₹ 500</button>
                </div>
              </form>
            )}
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
                  <div className="flex items-center gap-3 mb-6"><div className="bg-blue-50 text-blue-600 p-3 rounded-xl shadow-sm"><FileText size={20} /></div><div><h2 className="text-xl font-bold">Health Vault</h2><p className="text-[10px] text-[#5A6B60] uppercase tracking-widest mt-1">Medical Documents</p></div></div>
                  <div className="mb-5"><label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Document Type</label><select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl p-3.5 text-sm font-bold text-[#1C2C22] outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"><option>Laboratory Report</option><option>Prescription</option><option>Scan / X-Ray</option></select></div>
                  {uploadStatus && <div className={`p-3 text-xs font-bold text-center rounded-xl mb-4 ${uploadStatus.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-[#EAF0EC] text-[#456A50]'}`}>{uploadStatus}</div>}
                  <div className="border-2 border-dashed border-[#456A50]/30 bg-[#FDFCF8] rounded-2xl p-8 text-center hover:bg-[#EAF0EC]/40 transition cursor-pointer relative mb-5 shadow-sm group">
                    <input type="file" onChange={handleLabReportUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.jpg,.png" />
                    <Upload size={28} className="mx-auto text-[#456A50] mb-3 group-hover:-translate-y-1 transition transform duration-300" />
                    <p className="text-sm font-bold text-[#1C2C22]">Upload {docType}</p>
                    <p className="text-[10px] text-[#5A6B60] mt-1.5 font-medium">PDF, JPG (Max 5MB)</p>
                  </div>
                  <div className="bg-[#EAF0EC] p-4 rounded-xl flex items-center gap-3 mb-5 border border-[#456A50]/20 shadow-sm"><input type="checkbox" checked={digitalConsent} onChange={(e) => setDigitalConsent(e.target.checked)} className="w-4 h-4 text-[#456A50] rounded focus:ring-[#456A50]" /><p className="text-[10px] text-[#456A50] font-bold leading-tight flex flex-col"><span>Digital Consent Form</span><span className="font-normal opacity-80 mt-0.5">I authorize my assigned nutritionist to view these records.</span></p><ShieldCheck size={16} className="text-[#456A50] ml-auto" /></div>
                  <div className="space-y-3 overflow-y-auto max-h-40 pr-2 custom-scrollbar">
                    {labReports.map((report) => (
                      <div key={report.id} className="flex justify-between items-center p-4 bg-white border border-[#EBE9E0] rounded-xl shadow-sm hover:border-[#456A50]/30 transition group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0"><File size={16} /></div>
                          <div className="truncate"><p className="font-bold text-sm text-[#1C2C22] truncate">{report.name || report.file?.split('/').pop() || 'Document'}</p><p className="text-[9px] text-[#5A6B60] mt-0.5 font-bold tracking-widest uppercase">{report.type || report.document_type} • {report.date || (report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString() : '')}</p></div>
                        </div>
                        <button onClick={() => removeLabReport(report.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                      </div>
                    ))}
                    {labReports.length === 0 && <p className="text-center text-[11px] text-gray-400 italic py-6">No documents uploaded.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🌟 TAB 2: MY DIET PLAN (DRILL DOWN, DYNAMIC IMAGES, SWAPPING & INTERACTIVE WATER UI) 🌟 */}
          {activeTab === 'diet' && (() => {
            const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || JSON.parse(localStorage.getItem(`healora_diet_plan_${userId}`)) || null);

            return (
              <div className="space-y-6 animate-in fade-in">
                
                {/* 🌟 GLOBAL DIET HEADER & DOWNLOAD PROTOCOL BUTTON 🌟 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9E0] gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#1C2C22]">Your 4-Week Clinical Protocol</h2>
                    <p className="text-sm text-[#5A6B60] mt-1 font-medium">Goal: <span className="font-bold text-[#456A50] uppercase tracking-wider">{profile.health_goals || 'Weight Management'}</span></p>
                  </div>
                  
                  <button onClick={handleDownloadPlan} className="bg-[#456A50] text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#35533E] transition shadow-lg shadow-[#456A50]/30 border border-[#456A50]">
                    <DownloadCloud size={16}/> Download PDF Protocol
                  </button>
                </div>

                {/* --- LEVEL 1: WEEKS VIEW --- */}
                {dietView === 'weeks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
                    {[
                      { wk: 1, img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80', subtitle: 'Foundation & Detox' },
                      { wk: 2, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', subtitle: 'Metabolic Balance' },
                      { wk: 3, img: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=800&q=80', subtitle: 'Energy Optimization' },
                      { wk: 4, img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', subtitle: 'Long-term Sustainability' }
                    ].map(card => (
                      <div key={card.wk} onClick={() => { setSelectedWeek(card.wk); setDietView('days'); }} className="cursor-pointer group relative overflow-hidden rounded-[2rem] shadow-sm border border-[#EBE9E0] h-56 transition-all hover:shadow-xl hover:-translate-y-1">
                        <img src={card.img} alt={`Week ${card.wk}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                        
                        <div className="relative p-8 h-full flex flex-col justify-end text-white">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">{card.subtitle}</p>
                          <h3 className="text-3xl font-black mb-3">Week {card.wk} Schedule</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">View 7-Day Plan</span>
                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-[#456A50] group-hover:border-[#456A50] transition-colors">
                              <ChevronRight size={20} className="text-white"/>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* --- LEVEL 2: DAYS VIEW --- */}
                {dietView === 'days' && (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#EBE9E0] animate-in slide-in-from-right-8 fade-in">
                    <button onClick={() => setDietView('weeks')} className="text-sm font-bold text-[#456A50] mb-6 flex items-center gap-1.5 hover:underline bg-[#EAF0EC] px-4 py-2 rounded-xl border border-[#456A50]/20 w-max transition"><ChevronLeft size={16}/> Back to Weeks</button>
                    <h3 className="text-3xl font-black text-[#1C2C22] mb-8">Week {selectedWeek} Schedule</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                      {daysOfWeek.map((day, idx) => (
                        <div key={day} onClick={() => { setSelectedDay(day); setDietView('meals'); }} className="cursor-pointer bg-white border border-[#EBE9E0] hover:border-[#456A50] hover:shadow-lg hover:-translate-y-1 transition-all rounded-3xl p-6 text-center group shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 group-hover:bg-[#456A50] transition-colors"></div>
                          <div className="w-12 h-12 rounded-full bg-[#FDFCF8] border border-[#EBE9E0] mx-auto mb-4 mt-2 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                            <Calendar size={20} className="text-[#5A6B60] group-hover:text-[#456A50]" />
                          </div>
                          <h4 className="font-black text-[#1C2C22] text-xl mb-1">{day}</h4>
                          <p className="text-xs font-bold text-[#456A50] bg-[#EAF0EC] inline-block px-3 py-1 rounded-full mb-3">{getProtocolDate(selectedWeek, day)}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Day {idx + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- LEVEL 3: MEALS & DETAILS VIEW --- */}
                {dietView === 'meals' && (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#EBE9E0] animate-in slide-in-from-right-8 fade-in">
                    <div className="flex justify-between items-center mb-8 border-b border-[#EBE9E0] pb-6">
                      <div>
                        <button onClick={() => setDietView('days')} className="text-sm font-bold text-[#456A50] mb-3 flex items-center gap-1.5 hover:underline bg-[#EAF0EC] px-4 py-2 rounded-xl border border-[#456A50]/20 w-max transition"><ChevronLeft size={16}/> Back to Days</button>
                        <h3 className="text-3xl font-black text-[#1C2C22] tracking-tight">Week {selectedWeek} — {selectedDay}</h3>
                        <p className="text-sm text-[#5A6B60] mt-1 font-bold">{getProtocolDate(selectedWeek, selectedDay)}</p>
                      </div>
                    </div>

                    {/* Meals Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                      {['breakfast', 'lunch', 'snack', 'dinner'].map(mealType => {
                        const mealObj = getActiveMealObject(mealType);
                        const titles = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snack: '🍎 Snack', dinner: '🌙 Dinner' };
                        const colors = { breakfast: 'orange', lunch: 'yellow', snack: 'green', dinner: 'blue' };
                        const c = colors[mealType];

                        return (
                          <div key={mealType} onClick={() => setSelectedMeal({ ...mealObj, type: mealType })} className="bg-white border border-[#EBE9E0] rounded-[2rem] p-5 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#456A50]/40 transition-all cursor-pointer group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 right-0 h-2 bg-${c}-400 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                            <img 
                              src={mealObj.img} 
                              alt={mealType} 
                              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGES[mealType]; }}
                              className="w-full h-36 object-cover rounded-2xl mb-5 shadow-sm mt-1" 
                            />
                            <div className="flex justify-between items-center mb-3">
                              <h4 className={`text-[10px] font-black text-${c}-600 uppercase tracking-widest bg-${c}-50 px-2 py-1 rounded-lg border border-${c}-100`}>{titles[mealType]}</h4>
                            </div>
                            <p className="text-sm font-black text-[#1C2C22] leading-snug flex-1">{mealObj.name}</p>
                            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                              <span className="text-[10px] font-black bg-[#FDFCF8] text-gray-600 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-[#EBE9E0]"><Flame size={12}/> {mealObj.cal}</span>
                              <span className="w-8 h-8 rounded-full bg-[#EAF0EC] text-[#456A50] flex items-center justify-center group-hover:bg-[#456A50] group-hover:text-white transition-colors"><ChevronRight size={16}/></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 🌟 Daily Guidelines & INTERACTIVE WATER TRACKER 🌟 */}
                    <h3 className="text-xl font-black text-[#1C2C22] mb-5 border-b border-[#EBE9E0] pb-3">Daily Protocol Rules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      <div className="bg-blue-50/60 p-6 rounded-[2rem] border border-blue-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Droplets size={80} color="blue"/></div>
                        <b className="text-[11px] uppercase text-blue-700 tracking-widest block mb-2 flex items-center gap-1.5 relative z-10"><Droplets size={16}/> Hydration Target</b>
                        <p className="text-xs font-black text-blue-950 leading-relaxed mb-4 relative z-10">Drink at least 8 glasses (3 liters) of water today.</p>
                        
                        <div className="flex gap-1.5 relative z-10">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(glass => (
                            <button key={glass} onClick={() => setQuickWaterTracker(glass)} className={`transition-all transform hover:scale-125 focus:outline-none ${glass <= quickWaterTracker ? 'text-blue-500 fill-blue-500 scale-110' : 'text-blue-200'}`}>
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
                        <p className="text-sm font-black text-red-950 leading-relaxed relative z-10">{publishedPlan?.things_to_avoid || 'Refined sugars, processed foods, and late-night heavy snacking.'}</p>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 🌟 LEVEL 4: MEAL DETAIL & SWAP MODAL 🌟 */}
          {selectedMeal && (
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedMeal(null)}>
              <div className="bg-white rounded-[2rem] w-full max-w-md p-7 shadow-2xl border border-[#EBE9E0] relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedMeal(null)} className="absolute top-6 right-6 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-md transition z-10"><X size={18}/></button>
                
                <div className="relative overflow-hidden rounded-[1.5rem]">
                  <img 
                    key={selectedMeal.img} 
                    src={selectedMeal.img} 
                    alt={selectedMeal.name} 
                    onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGES[selectedMeal.type]; }}
                    className="w-full h-64 object-cover shadow-sm animate-in fade-in duration-500" 
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C2C22]">{selectedMeal.type}</p>
                  </div>
                </div>

                <div className="mt-6 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6B60] mb-1">Week {selectedWeek} • {selectedDay}</p>
                  <h3 className="text-2xl font-black text-[#1C2C22] leading-tight">{selectedMeal.name}</h3>
                </div>

                <div className="flex items-center justify-between mt-6 p-5 rounded-2xl bg-[#EAF0EC] border border-[#456A50]/20 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-widest text-[#5A6B60]">Total Calories</span>
                  <span className="text-2xl font-black text-[#456A50] flex items-center gap-1.5"><Flame size={20}/> {selectedMeal.cal}</span>
                </div>

                <button onClick={() => handleSwapMeal(selectedMeal.type)} className="w-full mt-5 py-4 rounded-2xl bg-[#1C2C22] text-white font-black text-sm hover:bg-[#456A50] transition shadow-lg flex items-center justify-center gap-2">
                  🔄 Swap for Alternative Meal
                </button>
                <p className="text-center text-[10px] text-[#5A6B60] mt-3 font-medium">Clinically approved alternatives for your goal.</p>
              </div>
            </div>
          )}

          {/* 🌟 TAB 3: END-OF-DAY WELLNESS ENTRY & PROGRESS 🌟 */}
          {activeTab === 'tracking' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
              {/* Daily Log Entry Form */}
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
                <div><h2 className="text-2xl font-black text-[#1C2C22]">My Appointments</h2><p className="text-sm text-[#5A6B60] mt-1">Track bookings & download receipts.</p></div>
                <button onClick={() => {setShowApptModal(true); setPaymentErrors({});}} className="bg-[#456A50] text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#35533E] shadow-lg shadow-[#456A50]/20 text-sm transition"><Calendar size={18} /> Request Appointment</button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                <table className="w-full text-left text-sm text-[#1C2C22]">
                  <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0"><tr><th className="py-4 px-6">Date & Time</th><th className="py-4 px-6">Mode</th><th className="py-4 px-6">Status</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[#EBE9E0]">
                    {appointments.map(a => (
                      <tr key={a.id} className="hover:bg-[#FDFCF8] transition group">
                        <td className="py-5 px-6 font-black text-[#1C2C22]">{a.date} <span className="text-[#5A6B60] font-medium mx-1">at</span> {a.time}</td>
                        <td className="py-5 px-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.mode}</span></td>
                        <td className="py-5 px-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{a.status}</span></td>
                        <td className="py-5 px-6 text-right"><button onClick={() => generateReceipt(a)} className="bg-white text-[#456A50] px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-[#EAF0EC] flex items-center gap-1.5 ml-auto transition shadow-sm border border-[#EBE9E0]"><Download size={14}/> Receipt</button></td>
                      </tr>
                    ))}
                    {appointments.length === 0 && <tr><td colSpan="4" className="py-12 text-center text-gray-400 italic font-medium">No appointments scheduled.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white text-[#1C2C22] rounded-3xl shadow-xl p-0 h-[75vh] border border-[#EBE9E0] flex flex-col overflow-hidden">
                {/* 🌟 Tab Toggle for Chat 🌟 */}
                <div className="flex border-b border-[#EBE9E0] bg-[#FDFCF8] shrink-0">
                  <button onClick={() => setChatPartner('manager')} className={`flex-1 py-4 text-xs font-black flex items-center justify-center gap-2 transition ${chatPartner === 'manager' ? 'bg-[#EAF0EC] text-[#456A50] border-b-2 border-[#456A50]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}><MessageSquare size={16}/> Clinic Manager</button>
                  <button onClick={() => setChatPartner('nutritionist')} className={`flex-1 py-4 text-xs font-black flex items-center justify-center gap-2 transition ${chatPartner === 'nutritionist' ? 'bg-[#EAF0EC] text-[#456A50] border-b-2 border-[#456A50]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}><Stethoscope size={16}/> Nutritionist</button>
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
                  {chats.filter(c => c.chatPartner === chatPartner).length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm italic">{chatPartner === 'manager' ? <MessageSquare size={48} className="mb-4 text-gray-300 opacity-50" /> : <Stethoscope size={48} className="mb-4 text-gray-300 opacity-50" />} Have a question? Send a direct message.</div> : chats.filter(c => c.chatPartner === chatPartner).map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'PATIENT' ? 'items-end' : 'items-start'}`}>
                      {msg.senderRole === 'SYSTEM' ? (
                        <div className="bg-orange-100 text-orange-800 border border-orange-200 px-4 py-1.5 rounded-full text-[10px] font-bold my-2 shadow-sm self-center tracking-widest uppercase">{msg.text}</div>
                      ) : (
                        <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${msg.senderRole === 'PATIENT' ? 'bg-[#456A50] text-white rounded-br-sm' : 'bg-[#FDFCF8] border border-[#EBE9E0] text-[#1C2C22] rounded-bl-sm'}`}><p className="text-sm leading-relaxed">{msg.text}</p><span className={`text-[9px] mt-2 block font-bold tracking-widest uppercase ${msg.senderRole === 'PATIENT' ? 'text-green-200' : 'text-gray-400'}`}>{msg.time}</span></div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendChat} className="p-4 border-t border-[#EBE9E0] bg-[#FDFCF8] flex items-end gap-3"><textarea value={queryText} onChange={e=>setQueryText(e.target.value)} required rows="1" placeholder={`Message ${chatPartner === 'manager' ? 'Manager' : 'Nutritionist'}...`} className="flex-1 bg-white border border-[#EBE9E0] rounded-2xl p-4 text-sm outline-none focus:border-[#456A50] text-[#1C2C22] placeholder-gray-400 resize-none transition shadow-sm"></textarea><button type="submit" className="bg-[#456A50] text-white p-4 rounded-2xl hover:bg-[#35533E] transition shadow-md flex justify-center items-center h-[54px] w-[54px] shrink-0"><Send size={20} className="ml-1" /></button></form>
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