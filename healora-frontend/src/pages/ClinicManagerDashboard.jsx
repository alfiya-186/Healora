import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, LogOut, Search, 
  CheckCircle2, HeartPulse, UserCircle, UserPlus, X, 
  User, Mail, Phone, Lock, CalendarPlus, Edit3, MessageSquare, Send, Camera, IndianRupee, Download, Bell, Apple, Clock,
  CalendarDays, CalendarX, Plus, Trash2, AlertCircle, ShieldAlert, Check, Video, VideoOff, Link2, ExternalLink, Copy, RotateCw,
  Ticket, DoorOpen, Megaphone, Stethoscope, Sparkles, Printer
} from 'lucide-react';
import BookingCalendarPicker from '../components/BookingCalendarPicker.jsx';
import TimeSlotPicker, { normalizeTimeTo24H, normalizeTimeToLabel } from '../components/TimeSlotPicker.jsx';

export const CLINIC_ROOMS = [
  { id: 'ROOM_101', name: 'Doctor Consultation Chamber (In-Clinic)', doctor: 'Dr. Sarah Jenkins (Lead Clinical Nutritionist)', type: 'IN_CLINIC', badge: '🏥 Doctor Consultation Chamber' }
];

export const playClinicChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Hospital announcement chime (C5, E5, G5, C6)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.18 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.18);
      osc.stop(ctx.currentTime + idx * 0.18 + 0.45);
    });
  } catch (e) {
    console.warn("Clinic announcement chime error", e);
  }
};

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


const secureFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    window.location.href = '/signin';
    throw new Error('Session expired. Please sign in again.');
  }
  return response;
};

const ClinicManagerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [managerName] = useState(localStorage.getItem('user_name') || 'Clinic Manager');
  const [managerId] = useState(localStorage.getItem('user_id') || '15');
  
  const [patients, setPatients] = useState([]);
  const [nutritionists, setNutritionists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clinicHolidays, setClinicHolidays] = useState([]);
  const [apptFilter, setApptFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CANCELLED'
  const [isLoading, setIsLoading] = useState(true);

  // --- MODALS & FORMS ---
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [patientForm, setPatientForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' });
  const [walkinForm, setWalkinForm] = useState({ patient: '', nutritionist: '', date: '', time: '' });
  const [rescheduleForm, setRescheduleForm] = useState({ id: '', date: '', time: '', patientName: '', patientId: '', nutritionistId: '' });
  const [holidayForm, setHolidayForm] = useState({ date: '', holiday_type: 'CLINIC_HOLIDAY', reason: '', nutritionist: '' });



  // --- CHAT & NOTIFICATIONS STATE ---
  const [chats, setChats] = useState([]);
  const [chatType, setChatType] = useState('PATIENT'); // 'PATIENT' | 'NUTRITIONIST'
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [replyText, setReplyText] = useState("");
  const chatEndRef = useRef(null);

  const [managerNotifs, setManagerNotifs] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const savedPic = localStorage.getItem(`profilePic_${managerId}`);
    if (savedPic) setProfilePic(savedPic);
    
    // Initial fetch SHOWS the loading screen
    fetchRealData(true);
    
    // Background polling every 5 seconds DOES NOT show the loading screen (prevents blinking)
    const interval = setInterval(() => fetchRealData(false), 5000); 
    
    return () => clearInterval(interval);
  }, [managerId]);

  useEffect(() => {
    const handleStorageChange = () => {
      const cachedAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
      if (cachedAppts.length > 0) {
        setAppointments(cachedAppts);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications' && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, chats, selectedChatUser]);

  const fetchRealData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const localUsers = JSON.parse(localStorage.getItem('healora_local_patients')) || [];
      const localChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      const notifs = JSON.parse(localStorage.getItem(`healora_notifications_${managerId}`)) || [];
      const cachedHolidays = JSON.parse(localStorage.getItem('healora_clinic_holidays_db')) || [];
      
      const [usersRes, nutRes, holidayRes, apptRes] = await Promise.all([
        secureFetch('/api/admin-api/users/').catch(()=>({ok:false})),
        secureFetch('/api/nutritionists/').catch(()=>({ok:false})),
        secureFetch('/api/clinic-holidays/').catch(()=>({ok:false})),
        secureFetch('/api/admin-api/appointments/').catch(()=>({ok:false}))
      ]);

      let apiUsers = [];
      if (usersRes.ok) { apiUsers = await usersRes.json(); }
      
      const mergedUsers = [...apiUsers.filter(u => u.role === 'PATIENT'), ...localUsers];
      const uniquePatients = Array.from(new Map(mergedUsers.map(item => [item.email, item])).values());
      
      const normalizedPatients = uniquePatients.map(p => ({
        ...p,
        id: String(p.id)
      }));

      setPatients(normalizedPatients);
      
      if (nutRes.ok) setNutritionists(await nutRes.json());

      if (holidayRes.ok) {
        const hData = await holidayRes.json();
        setClinicHolidays(hData);
        localStorage.setItem('healora_clinic_holidays_db', JSON.stringify(hData));
      } else {
        setClinicHolidays(cachedHolidays);
      }

      const cachedAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
      const cachedMap = new Map();
      cachedAppts.forEach(c => cachedMap.set(String(c.id), c));

      let rawAppts = [];
      if (apptRes.ok) {
        const apiAppts = await apptRes.json();
        rawAppts = (Array.isArray(apiAppts) ? apiAppts : []).map(a => {
          const cached = cachedMap.get(String(a.id)) || {};
          return {
            ...a,
            ...cached,
            token_number: cached.token_number || a.token_number,
            queue_status: cached.queue_status || a.queue_status || 'WAITING',
            allocated_room: cached.allocated_room || a.allocated_room
          };
        });
      } else {
        rawAppts = cachedAppts;
      }

      // Filter out dummy/orphaned patient 1 entries
      const cleanAppts = (Array.isArray(rawAppts) ? rawAppts : []).filter(a => a.patient !== 1 && String(a.patient) !== '1');
      localStorage.setItem('healora_all_appointments', JSON.stringify(cleanAppts));

      // Bulletproof ID sorting logic
      const sortedAppts = cleanAppts.sort((a, b) => {
        const idA = typeof a.id === 'string' ? parseInt(a.id.replace(/\D/g, '')) || 0 : a.id;
        const idB = typeof b.id === 'string' ? parseInt(b.id.replace(/\D/g, '')) || 0 : b.id;
        return idB - idA;
      });
      
      setAppointments(sortedAppts);
      setChats(localChats);
      setManagerNotifs(notifs);

    } catch (error) { console.error("Data fetch error", error); } 
    finally { if (showLoader) setIsLoading(false); } // Only remove loader if we added it
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.date) {
      alert("Please select a date for the holiday / leave.");
      return;
    }
    if (!holidayForm.reason.trim()) {
      alert("Please provide a reason or description.");
      return;
    }
    if (holidayForm.holiday_type === 'NUTRITIONIST_LEAVE' && !holidayForm.nutritionist) {
      alert("Please select the nutritionist taking leave.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: holidayForm.date,
        holiday_type: holidayForm.holiday_type,
        reason: holidayForm.reason.trim(),
        nutritionist: holidayForm.holiday_type === 'NUTRITIONIST_LEAVE' ? holidayForm.nutritionist : null
      };

      const res = await secureFetch('/api/clinic-holidays/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      let savedItem = null;
      if (res.ok) {
        savedItem = await res.json();
      } else {
        const nutObj = nutritionists.find(n => String(n.id) === String(holidayForm.nutritionist));
        savedItem = {
          id: Date.now(),
          ...payload,
          nutritionist_name: nutObj ? `Dr. ${nutObj.first_name} ${nutObj.last_name}` : null
        };
      }

      const updated = [...clinicHolidays.filter(h => !(h.date === payload.date && h.holiday_type === payload.holiday_type && String(h.nutritionist) === String(payload.nutritionist))), savedItem];
      setClinicHolidays(updated);
      localStorage.setItem('healora_clinic_holidays_db', JSON.stringify(updated));

      // Broadcast system notification
      const label = payload.holiday_type === 'CLINIC_HOLIDAY' ? 'Clinic Holiday Marked' : 'Staff Leave Registered';
      const detail = payload.holiday_type === 'CLINIC_HOLIDAY' 
        ? `The clinic will be closed on ${payload.date} (${payload.reason}). Patient bookings are blocked for this date.`
        : `Dr. ${savedItem.nutritionist_name || 'Staff'} will be on leave on ${payload.date} (${payload.reason}).`;
      
      // Notify patients and staff
      patients.slice(0, 10).forEach(p => sendNotificationToUser(p.id, label, detail));
      nutritionists.forEach(n => sendNotificationToUser(n.id, label, detail));

      setShowHolidayModal(false);
      setHolidayForm({ date: '', holiday_type: 'CLINIC_HOLIDAY', reason: '', nutritionist: '' });
      alert(`✅ ${label} successfully registered for ${payload.date}!`);
    } catch (err) {
      console.error(err);
      alert("Failed to save holiday. Please check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHoliday = async (id, dateStr) => {
    if (!window.confirm(`Are you sure you want to remove the holiday/leave marked for ${dateStr}?`)) return;
    
    try {
      await secureFetch(`/api/clinic-holidays/${id}/`, { method: 'DELETE' });
    } catch (err) {}

    const updated = clinicHolidays.filter(h => h.id !== id);
    setClinicHolidays(updated);
    localStorage.setItem('healora_clinic_holidays_db', JSON.stringify(updated));
    alert("✅ Schedule updated: Holiday removed.");
  };


  const getProfileImg = (id) => {
    const pic = localStorage.getItem(`profilePic_${id}`);
    return pic && (pic.startsWith('data:') || pic.startsWith('http')) ? pic : null;
  };

  const generateInvoice = (appt) => {
    const pName = patients.find(p => String(p.id) === String(appt.patient))?.first_name || `Patient #${appt.patient}`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><body style="font-family: Arial, sans-serif; padding: 40px; color: #1C2C22; max-width:600px; margin:auto;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #EBE9E0; padding-bottom: 20px;"><h1 style="color: #456A50; margin:0;">Healora Clinic</h1><h2 style="margin:0; color:#5A6B60;">OFFICIAL INVOICE</h2></div><br/>
        <div style="background: #FDFCF8; padding: 20px; border-radius: 10px; border: 1px solid #EBE9E0;">
          <p><strong>Patient Name:</strong> ${pName}</p><p><strong>Invoice ID:</strong> INV-${appt.id}</p><p><strong>Date & Time:</strong> ${appt.date} at ${appt.time}</p><p><strong>Consultation Mode:</strong> ${appt.mode}</p><p><strong>Payment Method:</strong> ${appt.mode === 'OFFLINE' ? 'Cash/Card at Desk' : 'Online Gateway'}</p>
        </div><br/>
        <table style="width: 100%; text-align: left; border-collapse: collapse;">
          <tr style="background: #EAF0EC; color:#456A50;"><th style="padding: 12px; border: 1px solid #EBE9E0;">Description</th><th style="padding: 12px; border: 1px solid #EBE9E0;">Amount</th></tr>
          <tr><td style="padding: 12px; border: 1px solid #EBE9E0;">Expert Nutrition Consultation</td><td style="padding: 12px; border: 1px solid #EBE9E0;">₹ 500.00</td></tr>
        </table>
        <h3 style="text-align: right; margin-top: 20px; font-size:24px;">Total Paid: ₹ 500.00</h3>
        <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px;">Generated by Clinic Manager. Thank you for choosing Healora.</p>
      </body></html>
    `);
    printWindow.document.close(); printWindow.focus(); setTimeout(()=>printWindow.print(), 250);
  };

  const sendNotificationToUser = (userId, title, message) => {
    if (!userId || userId === 'AUTO') return;
    const key = `healora_notifications_${userId}`;
    const notifs = JSON.parse(localStorage.getItem(key)) || [];
    notifs.unshift({ id: Date.now(), title, message, date: new Date().toLocaleString(), read: false });
    localStorage.setItem(key, JSON.stringify(notifs));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setProfilePic(reader.result); localStorage.setItem(`profilePic_${managerId}`, reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handlePatientFormChange = (e) => {
    const { name, value } = e.target;
    let filteredValue = value;
    if (name === 'first_name' || name === 'last_name') filteredValue = value.replace(/[^A-Za-z\s]/g, ''); 
    if (name === 'phone') { 
      filteredValue = value.replace(/\D/g, ''); 
      if (filteredValue.length > 10) return; 
    }
    setPatientForm({ ...patientForm, [name]: filteredValue });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: null });
  };

  const validatePatientForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

    if (!patientForm.first_name.trim()) errors.first_name = "Required.";
    if (!patientForm.last_name.trim()) errors.last_name = "Required.";
    if (!patientForm.email.trim()) errors.email = "Required."; else if (!emailRegex.test(patientForm.email)) errors.email = "Invalid format.";
    if (!patientForm.phone.trim()) errors.phone = "Required."; else if (patientForm.phone.length !== 10) errors.phone = "Must be exactly 10 digits.";
    if (!patientForm.password) errors.password = "Required."; else if (patientForm.password.length < 8) errors.password = "Min 8 chars.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!validatePatientForm()) return;
    setIsSaving(true);
    
    const localPatients = JSON.parse(localStorage.getItem('healora_local_patients')) || [];
    const allKnownPatients = [...patients, ...localPatients];
    const nextIdNum = allKnownPatients.length > 0 ? Math.max(...allKnownPatients.map(p => parseInt(p.id) || 0)) + 1 : patients.length + 1;

    const newPatient = { 
      id: String(nextIdNum), 
      first_name: patientForm.first_name.trim(), 
      last_name: patientForm.last_name.trim(), 
      email: patientForm.email.toLowerCase().trim(), 
      is_active: true, 
      role: 'PATIENT', 
      date_joined: new Date().toISOString() 
    };

    localStorage.setItem('healora_local_patients', JSON.stringify([newPatient, ...localPatients]));
    setPatients([newPatient, ...patients]);

    try { await secureFetch("/api/register/", { method: "POST", body: JSON.stringify({...newPatient, phone_number: patientForm.phone, password: patientForm.password}) }); } catch (err) {} 
    
    setTimeout(() => {
      setShowAddPatient(false); setPatientForm({ first_name: '', last_name: '', email: '', phone: '', password: '' });
      setIsSaving(false); alert("✅ Walk-in Patient registered successfully!"); setActiveTab('patients'); 
    }, 600);
  };

  const handleWalkinAppt = async (e) => {
    e.preventDefault();
    if (!walkinForm.patient || !walkinForm.nutritionist) {
      alert("Please ensure both a Patient and Nutritionist are selected.");
      return;
    }
    if (!walkinForm.date || !walkinForm.time) {
      alert("Please select both a Date and an available 20-25 min Time Slot.");
      return;
    }

    // Collision check
    const isSlotTaken = appointments.some(a => 
      a.status !== 'CANCELLED' && 
      a.date === walkinForm.date && 
      normalizeTimeTo24H(a.time) === normalizeTimeTo24H(walkinForm.time) &&
      (String(a.nutritionist) === String(walkinForm.nutritionist))
    );

    if (isSlotTaken) {
      alert(`⚠️ The selected time slot (${normalizeTimeToLabel(walkinForm.time)}) on ${walkinForm.date} is already booked for this doctor. Please pick another available slot.`);
      return;
    }
    
    setIsSaving(true);
    try {
      const newAppt = { id: Date.now(), ...walkinForm, mode: 'OFFLINE', status: 'SCHEDULED', amount_paid: 500 };
      const updatedAppts = [newAppt, ...appointments];
      setAppointments(updatedAppts);
      localStorage.setItem('healora_all_appointments', JSON.stringify(updatedAppts));
      
      sendNotificationToUser(walkinForm.patient, "Walk-in Registered", `The clinic desk has registered your walk-in consultation for ${walkinForm.date} at ${walkinForm.time}.`);
      
      setShowWalkinModal(false); 
      setWalkinForm({ patient: '', nutritionist: '', date: '', time: '' });
      alert(`✅ Walk-in Registered & ₹500 Collected!\n\nGenerating invoice to hand to patient...`);
      generateInvoice(newAppt);
    } finally { setIsSaving(false); }
  };

  const openReschedule = (appt) => {
    const patientName = patients.find(p => String(p.id) === String(appt.patient))?.first_name || `Patient #${appt.patient}`;
    setRescheduleForm({ id: appt.id, date: appt.date || '', time: appt.time || '', patientName, patientId: appt.patient, nutritionistId: appt.nutritionist });
    setShowRescheduleModal(true);
  };

  const handleRescheduleAppt = async (e) => {
    e.preventDefault();
    if (!rescheduleForm.date || !rescheduleForm.time) {
      alert("Please select both a new Date and an available Time Slot.");
      return;
    }

    // Collision check
    const isSlotTaken = appointments.some(a => 
      String(a.id) !== String(rescheduleForm.id) &&
      a.status !== 'CANCELLED' && 
      a.date === rescheduleForm.date && 
      normalizeTimeTo24H(a.time) === normalizeTimeTo24H(rescheduleForm.time) &&
      (String(a.nutritionist) === String(rescheduleForm.nutritionistId))
    );

    if (isSlotTaken) {
      alert(`⚠️ The slot ${normalizeTimeToLabel(rescheduleForm.time)} on ${rescheduleForm.date} is already booked. Please choose an open slot.`);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: rescheduleForm.date,
        time: rescheduleForm.time,
        status: 'RESCHEDULED'
      };

      try {
        await secureFetch(`/api/appointments/${rescheduleForm.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn("Backend reschedule sync failed, proceeding with local sync", err);
      }

      const updatedAppts = appointments.map(a => 
        String(a.id) === String(rescheduleForm.id) 
          ? { ...a, date: rescheduleForm.date, time: rescheduleForm.time, status: 'RESCHEDULED' } 
          : a
      );
      setAppointments(updatedAppts);
      localStorage.setItem('healora_all_appointments', JSON.stringify(updatedAppts));
      
      sendNotificationToUser(rescheduleForm.patientId, "Appointment Rescheduled", `Your appointment has been updated to ${rescheduleForm.date} at ${rescheduleForm.time}.`);
      sendNotificationToUser(rescheduleForm.nutritionistId, "Schedule Update", `The session with ${rescheduleForm.patientName} was rescheduled to ${rescheduleForm.date} at ${rescheduleForm.time}.`);

      const allChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      allChats.push({ id: Date.now(), patientId: String(rescheduleForm.patientId), patientName: 'Manager', senderRole: 'SYSTEM', text: `Appointment status updated: Rescheduled to ${rescheduleForm.date} at ${rescheduleForm.time}.`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), read: false });
      localStorage.setItem('healora_chats', JSON.stringify(allChats));
      setChats(allChats);

      setShowRescheduleModal(false); alert(`✅ Appointment Rescheduled and status updated to RESCHEDULED!`);
    } finally { setIsSaving(false); }
  };


  const handleSendAppointmentReminder = (appt) => {
    const patientObj = patients.find(p => String(p.id) === String(appt.patient));
    const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : `Patient #${appt.patient}`;
    const nObj = nutritionists.find(n => String(n.id) === String(appt.nutritionist));
    const nName = nObj ? `Dr. ${nObj.first_name} ${nObj.last_name}` : 'Assigned Doctor';
    
    const isOnline = appt.mode === 'ONLINE';
    const patientMsg = isOnline 
      ? `Reminder: You have an In-App Video Consultation scheduled today at ${appt.time} with ${nName}. Please log in to your Healora portal and click 'Enter Video Consultation Room' when your session begins.`
      : `Reminder: You have a scheduled In-Clinic consultation today at ${appt.time} with ${nName}. Please arrive at the clinic 10 minutes prior.`;

    const nutritionistMsg = isOnline
      ? `Reminder: You have an In-App Video Consultation scheduled today at ${appt.time} with patient ${pName}. Please launch your consultation room from your Healora Doctor Dashboard.`
      : `Reminder: You have an In-Clinic consultation session today at ${appt.time} with patient ${pName}.`;

    // 1. Notify Patient
    sendNotificationToUser(
      appt.patient,
      isOnline ? "🎥 In-App Video Consultation Reminder" : "🔔 Today's Consultation Reminder",
      patientMsg
    );

    // 2. Notify Nutritionist / Doctor
    if (appt.nutritionist && appt.nutritionist !== 'AUTO') {
      sendNotificationToUser(
        appt.nutritionist,
        isOnline ? "🎥 In-App Video Consultation Reminder" : "🔔 Today's Consultation Reminder",
        nutritionistMsg
      );
    }

    // 3. Drop chat message in patient thread
    const allChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
    const reminderMsg = {
      id: Date.now(),
      patientId: String(appt.patient),
      contactId: 'manager',
      senderRole: 'SYSTEM',
      chatPartner: 'manager',
      text: isOnline
        ? `🔔 In-App Video Consultation Reminder: Today at ${appt.time} with ${nName}. Both patient and doctor can join directly inside Healora without external apps.`
        : `🔔 Clinic Consultation Reminder: Today at ${appt.time} with ${nName} at Healora Consultation Chamber.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    allChats.push(reminderMsg);
    localStorage.setItem('healora_chats', JSON.stringify(allChats));

    // 4. Update appointment with reminder_sent flag
    const updatedAppts = appointments.map(a => {
      if (String(a.id) === String(appt.id)) {
        return { ...a, reminder_sent: true, reminder_timestamp: new Date().toISOString() };
      }
      return a;
    });
    setAppointments(updatedAppts);
    localStorage.setItem('healora_all_appointments', JSON.stringify(updatedAppts));

    alert(`✅ Video consultation reminder successfully sent to Patient (${pName}) and ${nName}!`);
  };

  const handleSendRemindersToAllToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const localToday = `${y}-${m}-${d}`;
    const isoToday = now.toISOString().split('T')[0];

    const todayAppointments = appointments.filter(a => a.date === localToday || a.date === isoToday);
    if (todayAppointments.length === 0) {
      alert("No appointments scheduled for today.");
      return;
    }

    todayAppointments.forEach(appt => {
      const patientObj = patients.find(p => String(p.id) === String(appt.patient));
      const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : `Patient #${appt.patient}`;
      const nObj = nutritionists.find(n => String(n.id) === String(appt.nutritionist));
      const nName = nObj ? `Dr. ${nObj.first_name} ${nObj.last_name}` : 'Assigned Doctor';
      
      const isOnline = appt.mode === 'ONLINE';
      const patientMsg = isOnline 
        ? `Reminder: You have an In-App Video Consultation scheduled today at ${appt.time} with ${nName}. Please log in to your Healora portal and click 'Enter Video Consultation Room' when your session begins.`
        : `Reminder: You have a scheduled In-Clinic consultation today at ${appt.time} with ${nName}. Please arrive at the clinic 10 minutes prior.`;

      const nutritionistMsg = isOnline
        ? `Reminder: You have an In-App Video Consultation scheduled today at ${appt.time} with patient ${pName}. Please launch your consultation room from your Healora Doctor Dashboard.`
        : `Reminder: You have an In-Clinic consultation session today at ${appt.time} with patient ${pName}.`;

      sendNotificationToUser(
        appt.patient,
        isOnline ? "🎥 In-App Video Consultation Reminder" : "🔔 Today's Consultation Reminder",
        patientMsg
      );

      if (appt.nutritionist && appt.nutritionist !== 'AUTO') {
        sendNotificationToUser(
          appt.nutritionist,
          isOnline ? "🎥 In-App Video Consultation Reminder" : "🔔 Today's Consultation Reminder",
          nutritionistMsg
        );
      }
    });

    const updatedAppts = appointments.map(a => {
      if (todayAppointments.some(ta => String(ta.id) === String(a.id))) {
        return { ...a, reminder_sent: true, reminder_timestamp: new Date().toISOString() };
      }
      return a;
    });
    setAppointments(updatedAppts);
    localStorage.setItem('healora_all_appointments', JSON.stringify(updatedAppts));

    alert(`✅ Consultation reminders dispatched to all ${todayAppointments.length} patient(s) & nutritionist(s) scheduled for today!`);
  };

  // --- 🎟️ LIVE QUEUE & ROOM ALLOCATION SYSTEM ---
  const todayQueueAppointments = useMemo(() => {
    const now = new Date();
    const isoToday = now.toISOString().split('T')[0];
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const todays = appointments.filter(a => {
      if (a.status === 'CANCELLED') return false;
      const isToday = (a.date === isoToday || a.date === localToday);
      const isOffline = a.mode === 'OFFLINE';
      return isToday || isOffline;
    });

    // Stable clinical sort: CALLED first -> IN_CONSULTATION -> WAITING -> COMPLETED
    const statusOrder = { 'CALLED': 1, 'IN_CONSULTATION': 2, 'WAITING': 3, 'COMPLETED': 4 };
    todays.sort((a, b) => {
      const orderA = statusOrder[a.queue_status] || (a.status === 'COMPLETED' ? 4 : 3);
      const orderB = statusOrder[b.queue_status] || (b.status === 'COMPLETED' ? 4 : 3);
      if (orderA !== orderB) return orderA - orderB;
      return (a.time || '').localeCompare(b.time || '');
    });

    return todays.map((appt, idx) => {
      const tokenNum = appt.token_number || `TK-${101 + ((appt.id || (idx + 1)) % 50)}`;
      const defaultRoom = appt.allocated_room || (appt.mode === 'ONLINE' ? 'In-App Telehealth Video Suite' : 'Doctor Consultation Chamber (Ground Floor, Room 101)');
      const qStatus = appt.queue_status || (appt.status === 'COMPLETED' ? 'COMPLETED' : 'WAITING');

      return {
        ...appt,
        token_number: tokenNum,
        allocated_room: defaultRoom,
        queue_status: qStatus
      };
    });
  }, [appointments]);

  // Ensure all today's queue appointments have their tokens & rooms permanently saved in cache
  useEffect(() => {
    if (!todayQueueAppointments || todayQueueAppointments.length === 0) return;
    let hasChanges = false;
    const cachedAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
    const updated = cachedAppts.map(a => {
      const qItem = todayQueueAppointments.find(q => String(q.id) === String(a.id));
      if (qItem && (!a.token_number || !a.allocated_room || !a.queue_status)) {
        hasChanges = true;
        return {
          ...a,
          token_number: a.token_number || qItem.token_number,
          allocated_room: a.allocated_room || qItem.allocated_room,
          queue_status: a.queue_status || qItem.queue_status || 'WAITING'
        };
      }
      return a;
    });
    if (hasChanges) {
      localStorage.setItem('healora_all_appointments', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  }, [todayQueueAppointments]);

  const handleUpdateTokenQueue = (apptId, newStatus, newRoom = null) => {
    const qItem = todayQueueAppointments.find(q => String(q.id) === String(apptId));
    const defaultToken = (qItem && qItem.token_number) || 'TK-101';
    const defaultRoom = (qItem && qItem.allocated_room) || 'Doctor Consultation Chamber (Ground Floor, Room 101)';

    const updatedAppts = appointments.map(a => {
      if (String(a.id) === String(apptId)) {
        const patientObj = patients.find(p => String(p.id) === String(a.patient));
        const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : `Patient #${a.patient}`;
        const roomName = newRoom || a.allocated_room || defaultRoom;
        const tokenNum = a.token_number || defaultToken;

        const updated = {
          ...a,
          token_number: tokenNum,
          queue_status: newStatus,
          allocated_room: roomName,
          ...(newStatus === 'CALLED' ? { token_called_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : {})
        };

        // Live notification & audio chime dispatch
        if (newStatus === 'CALLED') {
          playClinicChime();
          sendNotificationToUser(
            a.patient,
            "🎟️ YOUR TOKEN HAS BEEN CALLED!",
            `Token #${tokenNum} called! Please proceed to ${roomName} for your consultation.`
          );
        } else if (newStatus === 'COMPLETED') {
          sendNotificationToUser(
            a.patient,
            "✓ Consultation Completed",
            `Your consultation session with the doctor has completed. You can view your diet protocol in the portal.`
          );
        }

        return updated;
      }
      return a;
    });

    setAppointments(updatedAppts);
    localStorage.setItem('healora_all_appointments', JSON.stringify(updatedAppts));
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogout = () => { localStorage.removeItem('access_token'); navigate('/', { replace: true }); };




  const handleSelectChatThread = (peerId) => {
    setSelectedChatUser(peerId);
    const updatedChats = chats.map(c => 
      (String(c.senderId) === String(peerId) || String(c.patientId) === String(peerId)) ? { ...c, read: true } : c
    );
    setChats(updatedChats);
    localStorage.setItem('healora_chats', JSON.stringify(updatedChats));
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if(!replyText.trim() || !selectedChatUser) return;
    
    const newMsg = { 
      id: Date.now(), 
      patientId: chatType === 'PATIENT' ? String(selectedChatUser) : undefined,
      senderId: String(managerId),
      receiverId: String(selectedChatUser),
      senderName: managerName,
      senderRole: 'MANAGER', 
      text: replyText, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      read: true 
    };
    
    sendNotificationToUser(selectedChatUser, "New Message from Clinic Manager", replyText);
    
    const newChats = [...chats, newMsg];
    setChats(newChats); 
    localStorage.setItem('healora_chats', JSON.stringify(newChats)); 
    setReplyText("");
  };

  const markManagerNotifsRead = () => {
    const updated = managerNotifs.map(n => ({...n, read: true}));
    setManagerNotifs(updated);
    localStorage.setItem(`healora_notifications_${managerId}`, JSON.stringify(updated));
  };

  const currentThread = chats.filter(c => 
    (String(c.patientId) === String(selectedChatUser)) || 
    (String(c.senderId) === String(managerId) && String(c.receiverId) === String(selectedChatUser)) ||
    (String(c.senderId) === String(selectedChatUser) && String(c.receiverId) === String(managerId))
  );

  const unreadMessageCount = chats.filter(c => (c.senderRole === 'PATIENT' || c.senderRole === 'NUTRITIONIST') && !c.read && (c.receiverId === managerId || !c.receiverId)).length;
  const unreadNotifCount = managerNotifs.filter(n => !n.read).length;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#FDFCF8] font-sans text-[#1C2C22]">
      
      {/* 🌟 MANAGER NOTIFICATIONS MODAL 🌟 */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end p-6 pt-24 animate-in fade-in" onClick={() => setShowNotifications(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative mr-12 border border-[#EBE9E0]" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-[#EBE9E0] pb-4">
              <h2 className="text-xl font-black text-[#1C2C22] flex items-center gap-2"><Bell size={20} className="text-[#456A50]"/> Notifications</h2>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full transition"><X size={16} /></button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {managerNotifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400"><Bell size={40} className="mb-4 opacity-30"/> <p className="text-sm italic font-medium">No new notifications.</p></div>
              ) : managerNotifs.map(n => (
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

      {/* WALK-IN APPOINTMENT MODAL */}
      {showWalkinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative border border-[#EBE9E0]">
            <button onClick={() => setShowWalkinModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-50 rounded-full p-2 transition cursor-pointer"><X size={18} /></button>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-[#1C2C22]">Book Walk-in Patient</h2>
              <p className="text-xs text-[#5A6B60] mt-1">Schedule an in-clinic or online consultation, collect payment at desk, and generate an invoice.</p>
            </div>
            
            <form onSubmit={handleWalkinAppt} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Select Patient</label>
                  <select required value={walkinForm.patient} onChange={e=>setWalkinForm({...walkinForm, patient: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition font-medium shadow-2xs">
                    <option value="" disabled>Select Patient...</option>
                    {patients.map(p => {
                      const phone = p.phone_number || p.phone;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} {phone ? `• 📞 ${phone}` : p.email ? `• (${p.email})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {patients.length === 0 && <p className="text-red-500 text-[10px] mt-1 font-bold">No patients available. Please Register a patient first.</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Assign Nutritionist</label>
                  <select required value={walkinForm.nutritionist} onChange={e=>setWalkinForm({...walkinForm, nutritionist: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-2xs font-medium">
                    <option value="" disabled>Select Nutritionist...</option>
                    {nutritionists.map(n => <option key={n.id} value={n.id}>Dr. {n.first_name} {n.last_name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Consultation Date</label>
                <input 
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]} 
                  value={walkinForm.date} 
                  onChange={e=>setWalkinForm({...walkinForm, date: e.target.value, time: ''})} 
                  className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-2xs font-medium" 
                />
              </div>

              <div>
                <TimeSlotPicker 
                  selectedDate={walkinForm.date}
                  selectedTime={walkinForm.time}
                  onSelectTime={(slotId) => setWalkinForm({...walkinForm, time: slotId})}
                  selectedNutritionistId={walkinForm.nutritionist}
                  existingAppointments={appointments}
                />
              </div>

              <div className="bg-[#EAF0EC] border border-[#456A50]/20 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                <div>
                  <span className="font-black text-[#456A50] text-sm block">Consultation Fee</span>
                  <span className="text-[11px] text-[#5A6B60]">Includes 100% money back cancellation guarantee</span>
                </div>
                <span className="font-black text-2xl text-[#1C2C22]">₹ 500.00</span>
              </div>

              <button 
                type="submit" 
                disabled={isSaving || patients.length === 0 || !walkinForm.date || !walkinForm.time} 
                className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? 'Processing...' : <><IndianRupee size={16}/> Confirm Booking & Print Invoice</>}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* REGISTER WALK-IN PATIENT MODAL */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#EBE9E0] relative">
            <button onClick={() => {setShowAddPatient(false); setFormErrors({});}} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-50 rounded-full p-2 transition"><X size={20} /></button>
            <div className="flex items-center gap-4 mb-8 border-b border-[#EBE9E0] pb-6"><div className="bg-[#EAF0EC] p-4 rounded-2xl text-[#456A50] shadow-sm"><UserPlus size={32} /></div><div><h2 className="text-2xl font-black text-[#1C2C22]">Register Walk-in Patient</h2><p className="text-sm text-[#5A6B60] mt-1">Create a new patient account directly into the system database.</p></div></div>
            <form onSubmit={handleRegisterPatient} className="space-y-5" autoComplete="off" noValidate>
              {formErrors.api && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100">{formErrors.api}</div>}
              
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">First Name</label>
                    {patientForm.first_name.length > 0 && (
                      <span className={`text-[10px] font-bold ${patientForm.first_name.trim().length >= 2 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {patientForm.first_name.trim().length >= 2 ? '✓ Valid' : 'Min 2 letters'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <User size={18} className={`absolute left-4 top-3.5 ${
                      patientForm.first_name.length === 0 ? 'text-gray-400' : patientForm.first_name.trim().length >= 2 ? 'text-emerald-700' : 'text-amber-700'
                    }`} />
                    <input 
                      name="first_name" 
                      spellCheck="false" 
                      autoComplete="new-password" 
                      type="text" 
                      placeholder="First Name" 
                      value={patientForm.first_name} 
                      onChange={handlePatientFormChange} 
                      className={`w-full border rounded-xl p-3 pl-12 text-sm outline-none transition shadow-sm ${
                        patientForm.first_name.length === 0 
                          ? 'border-[#EBE9E0] bg-[#FDFCF8] focus:border-[#456A50]' 
                          : patientForm.first_name.trim().length >= 2 
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                            : 'border-amber-400 bg-amber-50/10 focus:border-amber-500'
                      }`} 
                    />
                  </div>
                  {patientForm.first_name.length > 0 && patientForm.first_name.trim().length < 2 && (
                    <p className="text-amber-700 text-xs mt-1 font-medium">⚠️ First name must be at least 2 letters.</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Last Name</label>
                    {patientForm.last_name.length > 0 && (
                      <span className={`text-[10px] font-bold ${patientForm.last_name.trim().length >= 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {patientForm.last_name.trim().length >= 1 ? '✓ Valid' : 'Required'}
                      </span>
                    )}
                  </div>
                  <input 
                    name="last_name" 
                    spellCheck="false" 
                    autoComplete="new-password" 
                    type="text" 
                    placeholder="Last Name" 
                    value={patientForm.last_name} 
                    onChange={handlePatientFormChange} 
                    className={`w-full border rounded-xl p-3 text-sm outline-none transition shadow-sm ${
                      patientForm.last_name.length === 0 
                        ? 'border-[#EBE9E0] bg-[#FDFCF8] focus:border-[#456A50]' 
                        : patientForm.last_name.trim().length >= 1 
                          ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                          : 'border-amber-400 bg-amber-50/10 focus:border-amber-500'
                    }`} 
                  />
                  {patientForm.last_name.length > 0 && patientForm.last_name.trim().length < 1 && (
                    <p className="text-amber-700 text-xs mt-1 font-medium">⚠️ Last name is required.</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Email Address</label>
                    {patientForm.email.length > 0 && (
                      <span className={`text-[10px] font-bold ${
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientForm.email.trim()) 
                          ? 'text-emerald-700' 
                          : !patientForm.email.includes('@') 
                            ? 'text-red-600' 
                            : 'text-amber-700'
                      }`}>
                        {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientForm.email.trim()) 
                          ? '✓ Valid' 
                          : !patientForm.email.includes('@') 
                            ? 'Missing @' 
                            : 'Domain incomplete'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail size={18} className={`absolute left-4 top-3.5 ${
                      patientForm.email.length === 0 
                        ? 'text-gray-400' 
                        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientForm.email.trim()) 
                          ? 'text-emerald-700' 
                          : !patientForm.email.includes('@') 
                            ? 'text-red-600' 
                            : 'text-amber-700'
                    }`} />
                    <input 
                      name="email" 
                      spellCheck="false" 
                      autoComplete="new-password" 
                      type="email" 
                      placeholder="patient@example.com" 
                      value={patientForm.email} 
                      onChange={handlePatientFormChange} 
                      className={`w-full border rounded-xl p-3 pl-12 text-sm outline-none transition shadow-sm ${
                        patientForm.email.length === 0 
                          ? 'border-[#EBE9E0] bg-[#FDFCF8] focus:border-[#456A50]' 
                          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientForm.email.trim()) 
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                            : !patientForm.email.includes('@') 
                              ? 'border-red-400 bg-red-50/20 focus:border-red-500' 
                              : 'border-amber-400 bg-amber-50/20 focus:border-amber-500'
                      }`} 
                    />
                  </div>
                  {patientForm.email.length > 0 && !patientForm.email.includes('@') && (
                    <p className="text-red-600 text-xs mt-1 font-semibold flex items-center gap-1">
                      ⚠️ Must include an '@' (e.g. name@example.com)
                    </p>
                  )}
                  {patientForm.email.length > 0 && patientForm.email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientForm.email.trim()) && (
                    <p className="text-amber-700 text-xs mt-1 font-semibold flex items-center gap-1">
                      ⚠️ Include a valid domain (e.g. @gmail.com)
                    </p>
                  )}
                  {patientForm.email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientForm.email.trim()) && (
                    <p className="text-emerald-700 text-xs mt-1 font-semibold flex items-center gap-1">
                      ✓ Valid email address format
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Phone Number (10 Digits)</label>
                    {patientForm.phone.length > 0 && (
                      <span className={`text-[10px] font-bold ${patientForm.phone.length === 10 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {patientForm.phone.length === 10 ? '✓ 10 Digits' : `${patientForm.phone.length}/10 digits`}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone size={18} className={`absolute left-4 top-3.5 ${
                      patientForm.phone.length === 0 ? 'text-gray-400' : patientForm.phone.length === 10 ? 'text-emerald-700' : 'text-amber-700'
                    }`} />
                    <input 
                      name="phone" 
                      maxLength="10" 
                      spellCheck="false" 
                      autoComplete="new-password" 
                      type="text" 
                      placeholder="10-digit number" 
                      value={patientForm.phone} 
                      onChange={handlePatientFormChange} 
                      className={`w-full border rounded-xl p-3 pl-12 text-sm outline-none transition shadow-sm ${
                        patientForm.phone.length === 0 
                          ? 'border-[#EBE9E0] bg-[#FDFCF8] focus:border-[#456A50]' 
                          : patientForm.phone.length === 10 
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                            : 'border-amber-400 bg-amber-50/20 focus:border-amber-500'
                      }`} 
                    />
                  </div>
                  {patientForm.phone.length > 0 && patientForm.phone.length < 10 && (
                    <p className="text-amber-700 text-xs mt-1 font-semibold flex items-center gap-1">
                      ⚠️ {10 - patientForm.phone.length} more digits needed (10 digits required)
                    </p>
                  )}
                  {patientForm.phone.length === 10 && (
                    <p className="text-emerald-700 text-xs mt-1 font-semibold flex items-center gap-1">
                      ✓ 10-digit phone verified
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Temporary Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Temporary Password</label>
                  {patientForm.password.length > 0 && (
                    <span className={`text-[10px] font-bold ${patientForm.password.length >= 8 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {patientForm.password.length >= 8 ? '✓ Strong' : `${patientForm.password.length}/8 chars`}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock size={18} className={`absolute left-4 top-3.5 ${
                    patientForm.password.length === 0 ? 'text-gray-400' : patientForm.password.length >= 8 ? 'text-emerald-700' : 'text-red-600'
                  }`} />
                  <input 
                    name="password" 
                    spellCheck="false" 
                    autoComplete="new-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={patientForm.password} 
                    onChange={handlePatientFormChange} 
                    className={`w-full border rounded-xl p-3 pl-12 text-sm outline-none transition shadow-sm ${
                      patientForm.password.length === 0 
                        ? 'border-[#EBE9E0] bg-[#FDFCF8] focus:border-[#456A50]' 
                        : patientForm.password.length >= 8 
                          ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                          : 'border-red-400 bg-red-50/20 focus:border-red-500'
                    }`} 
                  />
                </div>
                {patientForm.password.length === 0 && (
                  <p className="text-gray-500 text-xs mt-1">ⓘ Temporary password must be at least 8 characters.</p>
                )}
                {patientForm.password.length > 0 && patientForm.password.length < 8 && (
                  <p className="text-red-600 text-xs mt-1 font-semibold flex items-center gap-1">
                    ⚠️ {8 - patientForm.password.length} more characters needed (Min 8 characters)
                  </p>
                )}
                {patientForm.password.length >= 8 && (
                  <p className="text-emerald-700 text-xs mt-1 font-semibold flex items-center gap-1">
                    ✓ Strong password format ({patientForm.password.length} characters)
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isSaving} 
                className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg mt-2 disabled:opacity-70 cursor-pointer"
              >
                {isSaving ? 'Registering...' : 'Register Patient & Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 CLINIC HOLIDAY & STAFF LEAVE MODAL 🌟 */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative border border-[#EBE9E0]">
            <button onClick={() => setShowHolidayModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-2 transition"><X size={18} /></button>
            <div className="flex items-center gap-3 mb-6 border-b border-[#EBE9E0] pb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <CalendarX size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#1C2C22]">Mark Holiday / Leave</h2>
                <p className="text-xs text-[#5A6B60]">Block appointment bookings for clinic or specific staff.</p>
              </div>
            </div>

            <form onSubmit={handleCreateHoliday} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Schedule Event Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setHolidayForm({...holidayForm, holiday_type: 'CLINIC_HOLIDAY'})}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition flex flex-col items-start ${holidayForm.holiday_type === 'CLINIC_HOLIDAY' ? 'border-red-500 bg-red-50/70' : 'border-[#EBE9E0] bg-white'}`}
                  >
                    <span className="text-xs font-black text-red-700 uppercase tracking-wider">Full Clinic Holiday</span>
                    <span className="text-[11px] text-gray-500 mt-1">Entire clinic is closed. All bookings blocked.</span>
                  </div>
                  <div 
                    onClick={() => setHolidayForm({...holidayForm, holiday_type: 'NUTRITIONIST_LEAVE'})}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition flex flex-col items-start ${holidayForm.holiday_type === 'NUTRITIONIST_LEAVE' ? 'border-amber-500 bg-amber-50/70' : 'border-[#EBE9E0] bg-white'}`}
                  >
                    <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Nutritionist Leave</span>
                    <span className="text-[11px] text-gray-500 mt-1">Specific doctor is away. Others remain open.</span>
                  </div>
                </div>
              </div>

              {holidayForm.holiday_type === 'NUTRITIONIST_LEAVE' && (
                <div className="animate-in fade-in">
                  <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Select Nutritionist</label>
                  <select 
                    required 
                    value={holidayForm.nutritionist} 
                    onChange={e => setHolidayForm({...holidayForm, nutritionist: e.target.value})}
                    className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm"
                  >
                    <option value="" disabled>Choose Doctor / Nutritionist...</option>
                    {nutritionists.map(n => (
                      <option key={n.id} value={n.id}>Dr. {n.first_name} {n.last_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Select Date</label>
                <input 
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]} 
                  value={holidayForm.date} 
                  onChange={e => setHolidayForm({...holidayForm, date: e.target.value})}
                  className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Reason / Public Description</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. National Holiday / Medical Conference / Personal Leave"
                  value={holidayForm.reason} 
                  onChange={e => setHolidayForm({...holidayForm, reason: e.target.value})}
                  className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm" 
                />
                <p className="text-[10px] text-[#5A6B60] mt-1">This message will be shown to patients if they attempt to book this date.</p>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Registering...' : <><CalendarX size={16} /> Save Holiday / Leave</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 PREMIUM ORANGE RESCHEDULE MODAL 🌟 */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 shadow-2xl relative border border-[#EBE9E0]">
            <button onClick={() => setShowRescheduleModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition bg-gray-100 rounded-full p-2 cursor-pointer"><X size={18} /></button>
            
            <h2 className="text-2xl font-black text-[#1C2C22]">Reschedule Session</h2>
            <p className="text-sm text-[#5A6B60] mt-1 mb-6">Updating booking for <b className="text-[#1C2C22]">{rescheduleForm.patientName}</b>.</p>
            
            <form onSubmit={handleRescheduleAppt} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-[#5A6B60] uppercase tracking-widest mb-2">New Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]} 
                    value={rescheduleForm.date} 
                    onChange={e => setRescheduleForm({...rescheduleForm, date: e.target.value, time: ''})} 
                    className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition shadow-sm css-date-icon-hide" 
                  />
                  <Calendar size={16} className="absolute right-4 top-4 text-[#1C2C22] pointer-events-none" />
                </div>
              </div>

              <div>
                <TimeSlotPicker 
                  selectedDate={rescheduleForm.date}
                  selectedTime={rescheduleForm.time}
                  onSelectTime={(slotId) => setRescheduleForm({...rescheduleForm, time: slotId})}
                  selectedNutritionistId={rescheduleForm.nutritionistId}
                  existingAppointments={appointments}
                  excludeAppointmentId={rescheduleForm.id}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSaving || !rescheduleForm.date || !rescheduleForm.time} 
                className="w-full bg-[#f97316] text-white py-4 rounded-xl font-black text-sm hover:bg-[#ea580c] transition shadow-lg mt-4 shadow-orange-500/30 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Updating...' : 'Update & Notify Patient'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}

      <aside className="w-64 bg-white border-r border-[#EBE9E0] flex flex-col hidden lg:flex shadow-sm z-10 flex-shrink-0 h-full">
        <div className="p-6 flex items-center gap-2 cursor-pointer border-b border-[#EBE9E0]" onClick={() => navigate('/')}>
          <div className="bg-[#456A50] text-white rounded-xl p-2 shadow-sm"><HeartPulse size={24} /></div>
          <span className="text-2xl font-black tracking-tight text-[#1C2C22]">Heal<span className="text-[#456A50]">ora</span></span>
        </div>
        <nav className="flex-1 px-4 mt-6 space-y-2 font-medium overflow-y-auto pb-4">
          <p className="px-4 text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-3 mt-2">Clinic Operations</p>
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" tab="dashboard" activeTab={activeTab} setTab={setActiveTab} />
          <NavItem icon={<Users size={18} />} label="Patient Records" tab="patients" activeTab={activeTab} setTab={setActiveTab} />
          <NavItem icon={<Calendar size={18} />} label="Appointments" tab="appointments" activeTab={activeTab} setTab={setActiveTab} />
          <NavItem icon={<Ticket size={18} />} label="Live Queue & Tokens" tab="queue" activeTab={activeTab} setTab={setActiveTab} />
          <NavItem icon={<CalendarDays size={18} />} label="Clinic Holidays & Leaves" tab="holidays" activeTab={activeTab} setTab={setActiveTab} />
          
          <button onClick={() => setActiveTab('notifications')} className={`w-full relative flex items-center text-left gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab === 'notifications' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <div className="shrink-0 flex items-center justify-center"><MessageSquare size={18} /></div>
            <span className="text-left leading-tight">Internal Comms</span>
            {unreadMessageCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {unreadMessageCount}
              </span>
            )}
          </button>
        </nav>

        <div className="p-6 border-t border-[#EBE9E0] bg-[#FDFCF8]/50">
          <div className="flex items-center gap-3 mb-5 px-1 relative group cursor-pointer">
            <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center shadow-sm">
              {profilePic ? <img src={profilePic} className="w-full h-full object-cover" alt="User" /> : <UserCircle size={28} className="text-gray-400" />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full"><Camera size={14} className="text-white" /></div>
            </div>
            <input type="file" onChange={handleProfilePicChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="overflow-hidden"><p className="text-sm font-black text-[#1C2C22] truncate">{managerName}</p><p className="text-[10px] font-bold text-[#f97316] uppercase tracking-widest truncate">Clinic Manager</p></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition text-sm shadow-sm border border-red-100"><LogOut size={16} /> Log Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end border-b border-[#EBE9E0] pb-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#1C2C22]">Manager Portal.</h1>
              <p className="text-[#5A6B60] mt-2 font-serif italic text-base">Welcome back, {managerName}. Manage cross-platform data.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowHolidayModal(true)} className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 text-sm transition shadow-sm cursor-pointer"><CalendarX size={16} /> Mark Holiday</button>
              <button onClick={() => setShowWalkinModal(true)} className="bg-[#456A50] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#35533E] shadow-lg shadow-[#456A50]/20 text-sm transition cursor-pointer"><CalendarPlus size={16} /> Book Walk-in</button>
              <button onClick={() => { setPatientForm({ first_name: '', last_name: '', email: '', phone: '', password: '' }); setFormErrors({}); setShowAddPatient(true); }} className="bg-white border border-[#EBE9E0] text-[#5A6B60] px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-sm flex items-center gap-2 cursor-pointer"><UserPlus size={16} /> Register</button>
              
              {/* 🌟 MANAGER NOTIFICATION BELL 🌟 */}
              <div className="relative cursor-pointer group ml-1" onClick={() => {setShowNotifications(true); markManagerNotifsRead();}}>
                <div className="bg-white border border-[#EBE9E0] p-3.5 rounded-xl shadow-sm hover:bg-gray-50 transition">
                  <Bell size={20} className="text-[#1C2C22]" />
                </div>
                {unreadNotifCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FDFCF8] shadow-sm">{unreadNotifCount}</span>}
              </div>
            </div>

          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><p className="text-[#5A6B60] font-bold animate-pulse">Syncing cross-platform data...</p></div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(() => {
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = String(now.getMonth() + 1).padStart(2, '0');
                      const d = String(now.getDate()).padStart(2, '0');
                      const localToday = `${y}-${m}-${d}`;
                      const isoToday = now.toISOString().split('T')[0];
                      const todayCount = appointments.filter(a => a.date === localToday || a.date === isoToday).length;

                      return (
                        <>
                          <MetricCard title="Today's Bookings" count={todayCount} icon={<Calendar size={20} />} color="text-blue-600" bg="bg-blue-50" />
                          <MetricCard title="Total Appointments" count={appointments.length} icon={<CalendarDays size={20} />} color="text-purple-600" bg="bg-purple-50" />
                          <MetricCard title="Total Conversations" count={[...new Set(chats.map(c=>c.patientId || c.senderId))].length} icon={<MessageSquare size={20} />} color="text-orange-600" bg="bg-orange-50" />
                          <MetricCard title="Registered Patients" count={patients.length} icon={<Users size={20} />} color="text-[#456A50]" bg="bg-[#EAF0EC]" />
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="mt-8 bg-white rounded-3xl shadow-sm border border-[#EBE9E0] overflow-hidden">
                    <div className="p-6 border-b border-[#EBE9E0] bg-[#FDFCF8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-black text-xl text-[#1C2C22]">Today's Schedule</h3>
                        <p className="text-xs text-[#5A6B60] mt-1">Live monitoring of sessions scheduled for today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}).</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black px-3 py-1.5 rounded-full bg-[#EAF0EC] text-[#456A50]">
                          {(() => {
                            const now = new Date();
                            const y = now.getFullYear();
                            const m = String(now.getMonth() + 1).padStart(2, '0');
                            const d = String(now.getDate()).padStart(2, '0');
                            const localToday = `${y}-${m}-${d}`;
                            const isoToday = now.toISOString().split('T')[0];
                            return appointments.filter(a => a.date === localToday || a.date === isoToday).length;
                          })()} Scheduled Today
                        </span>
                        <button 
                          onClick={handleSendRemindersToAllToday}
                          className="bg-[#456A50] hover:bg-[#35533E] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                          title="Send reminder notifications to all scheduled patients and nutritionists for today"
                        >
                          <Bell size={13} /> Remind All Today
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-96">
                      <table className="w-full text-left text-sm text-[#1C2C22]">
                        <thead className="bg-white text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0">
                          <tr>
                            <th className="py-4 px-6">Time</th>
                            <th className="py-4 px-6">Patient</th>
                            <th className="py-4 px-6">Mode</th>
                            <th className="py-4 px-6">Telehealth Meet</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Reminder</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {(() => {
                            const now = new Date();
                            const y = now.getFullYear();
                            const m = String(now.getMonth() + 1).padStart(2, '0');
                            const d = String(now.getDate()).padStart(2, '0');
                            const localToday = `${y}-${m}-${d}`;
                            const isoToday = now.toISOString().split('T')[0];

                            const todayAppointments = appointments.filter(a => a.date === localToday || a.date === isoToday);

                            if (todayAppointments.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="6" className="py-12 text-center text-gray-400 italic font-medium">
                                    No appointments scheduled for today ({localToday}).
                                  </td>
                                </tr>
                              );
                            }

                            return todayAppointments.map(a => {
                              const patientObj = patients.find(p => String(p.id) === String(a.patient));
                              const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : `Patient #${a.patient}`;
                              const pPhone = patientObj?.phone_number || patientObj?.phone;
                              return (
                                <tr key={a.id} className="hover:bg-[#FDFCF8] transition group">
                                  <td className="py-5 px-6 font-bold text-[#456A50]">
                                    {a.time || 'Time pending'}
                                  </td>
                                  <td className="py-5 px-6">
                                    <span className="font-black text-[#1C2C22] block">{pName}</span>
                                    {pPhone && <span className="text-[11px] text-gray-500 font-medium">📞 {pPhone}</span>}
                                  </td>
                                  <td className="py-5 px-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.mode}</span></td>
                                  <td className="py-5 px-6">
                                     {a.mode === 'ONLINE' ? (
                                       (() => {
                                         const todayIso = new Date().toISOString().split('T')[0];
                                         const isPast = a.date && a.date < todayIso;
                                         if (isPast || a.status === 'COMPLETED' || a.status === 'CANCELLED') {
                                           return (
                                             <span className="text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                               📅 Session Completed
                                             </span>
                                           );
                                         }
                                         return (
                                           <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                                             <Video size={13} className="text-purple-600" /> In-App Telehealth
                                           </span>
                                         );
                                       })()
                                     ) : (
                                       <span className="text-gray-400 text-xs font-medium">In-Clinic</span>
                                     )}
                                  </td>
                                  <td className="py-5 px-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.status === 'SCHEDULED' ? 'bg-orange-100 text-orange-700' : a.status === 'RESCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{a.status}</span></td>
                                  <td className="py-5 px-6 text-right">
                                    <button 
                                      onClick={() => handleSendAppointmentReminder(a)}
                                      className={`${a.reminder_sent ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'} border px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer`}
                                      title="Send In-App Consultation Reminder to Patient and Doctor"
                                    >
                                      <Bell size={13} className={a.reminder_sent ? 'text-emerald-700' : 'text-emerald-600'} />
                                      {a.reminder_sent ? 'Reminder Sent' : 'Send Reminder'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}



              {/* 🌟 TAB 2: PATIENT DIRECTORY (WITH PROFILE IMAGES) 🌟 */}
              {activeTab === 'patients' && (
                <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 animate-in fade-in h-[75vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-black text-[#1C2C22]">Registered Patients</h2><p className="text-sm text-[#5A6B60] mt-1">Live data from system database.</p></div></div>
                  <div className="overflow-y-auto flex-1 border border-[#EBE9E0] rounded-2xl custom-scrollbar">
                    <table className="w-full text-left text-sm text-[#1C2C22] whitespace-nowrap">
                      <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0"><tr><th className="py-4 px-6">User ID</th><th className="py-4 px-6">Patient Name</th><th className="py-4 px-6">Phone Number</th><th className="py-4 px-6">Email</th><th className="py-4 px-6">Status</th></tr></thead>
                      <tbody className="divide-y divide-[#EBE9E0]">
                        {patients.map(p => {
                          const imgUrl = getProfileImg(p.id);
                          const phone = p.phone_number || p.phone;
                          return (
                          <tr key={p.id} className="hover:bg-[#FDFCF8] transition">
                            <td className="py-5 px-6 font-bold text-[#456A50]">#{p.id}</td>
                            <td className="py-5 px-6 font-black text-[#1C2C22] flex items-center gap-3">
                              {imgUrl ? (
                                <img src={imgUrl} className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm" alt="Profile" />
                              ) : (
                                <UserCircle size={28} className="text-gray-400"/>
                              )}
                              {p.first_name || 'No Name'} {p.last_name || ''}
                            </td>
                            <td className="py-5 px-6 font-bold text-gray-700">
                              {phone ? `📞 ${phone}` : <span className="text-gray-400 font-normal italic">Not provided</span>}
                            </td>
                            <td className="py-5 px-6 text-gray-500">{p.email}</td>
                            <td className="py-5 px-6">{p.is_active ? <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">Active</span> : <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">Suspended</span>}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>

                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (() => {
                const filteredValidAppts = appointments
                  .filter(a => a.patient !== 1 && String(a.patient) !== '1' && (patients.some(p => String(p.id) === String(a.patient)) || typeof a.patient === 'string'))
                  .sort((a, b) => {
                    const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime() || 0;
                    const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime() || 0;
                    return dateTimeB - dateTimeA;
                  });

                const activeCount = filteredValidAppts.filter(a => a.status === 'SCHEDULED' || a.status === 'RESCHEDULED').length;
                const cancelledCount = filteredValidAppts.filter(a => a.status === 'CANCELLED').length;

                const displayedAppts = filteredValidAppts.filter(a => {
                  if (apptFilter === 'ACTIVE') return a.status === 'SCHEDULED' || a.status === 'RESCHEDULED';
                  if (apptFilter === 'CANCELLED') return a.status === 'CANCELLED';
                  return true;
                });

                return (
                  <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 animate-in fade-in h-[75vh] flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-[#1C2C22]">Consultation Bookings</h2>
                        <p className="text-sm text-[#5A6B60] mt-1">Track active bookings, monitor in-app telehealth sessions, and manage rescheduling & reminders.</p>
                      </div>
                      
                      {/* Filter category pills */}
                      <div className="flex bg-[#FDFCF8] p-1.5 rounded-2xl border border-[#EBE9E0] gap-1 shrink-0">
                        <button 
                          onClick={() => setApptFilter('ALL')} 
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${apptFilter === 'ALL' ? 'bg-[#1C2C22] text-white shadow-sm' : 'text-[#5A6B60] hover:text-[#1C2C22]'}`}
                        >
                          All ({filteredValidAppts.length})
                        </button>
                        <button 
                          onClick={() => setApptFilter('ACTIVE')} 
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${apptFilter === 'ACTIVE' ? 'bg-[#456A50] text-white shadow-sm' : 'text-[#5A6B60] hover:text-[#1C2C22]'}`}
                        >
                          Active & Rescheduled ({activeCount})
                        </button>
                        <button 
                          onClick={() => setApptFilter('CANCELLED')} 
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${apptFilter === 'CANCELLED' ? 'bg-red-700 text-white shadow-sm' : 'text-[#5A6B60] hover:text-[#1C2C22]'}`}
                        >
                          Cancelled & Refunded ({cancelledCount})
                        </button>
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 border border-[#EBE9E0] rounded-2xl custom-scrollbar">
                      <table className="w-full text-left text-sm text-[#1C2C22] whitespace-nowrap">
                        <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0">
                          <tr>
                            <th className="py-4 px-6">Booking ID</th>
                            <th className="py-4 px-6">Patient</th>
                            <th className="py-4 px-6">Nutritionist</th>
                            <th className="py-4 px-6">Date & Time</th>
                            <th className="py-4 px-6">Mode & Telehealth</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {displayedAppts.map(a => {
                            const patientObj = patients.find(p => String(p.id) === String(a.patient));
                            const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name || ''}` : (typeof a.patient === 'string' ? a.patient : `Patient`);
                            const nName = nutritionists.find(n => String(n.id) === String(a.nutritionist))?.first_name || 'Assigned';
                            const isCancelled = a.status === 'CANCELLED';
                            const isRescheduled = a.status === 'RESCHEDULED';

                            return (
                            <tr key={a.id} className={`hover:bg-[#FDFCF8] transition group ${isCancelled ? 'bg-gray-50/50 opacity-75' : ''}`}>
                              <td className="py-5 px-6 font-bold text-gray-500">APT-{a.id}</td>
                              <td className="py-5 px-6 font-black text-[#1C2C22]">{pName}</td>
                              <td className="py-5 px-6 font-bold text-[#456A50] flex items-center gap-1.5 mt-1"><Apple size={14}/> Dr. {nName}</td>
                              <td className="py-5 px-6 font-bold text-[#1C2C22]">
                                <span className="font-bold">{a.date}</span> <span className="text-[#5A6B60] font-normal mx-1">at</span> <span className="font-bold">{a.time}</span>
                              </td>
                              <td className="py-5 px-6">
                                {isCancelled ? (
                                  <span className="text-xs text-gray-400 font-semibold italic">Session Cancelled</span>
                                ) : a.mode === 'ONLINE' ? (
                                  (() => {
                                    const todayIso = new Date().toISOString().split('T')[0];
                                    const isPast = a.date && a.date < todayIso;
                                    if (isPast || a.status === 'COMPLETED') {
                                      return (
                                        <span className="text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                          📅 Session Completed
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                                        <Video size={13} className="text-purple-600" /> In-App Telehealth
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">In-Clinic</span>
                                )}
                              </td>
                              <td className="py-5 px-6">
                                {isCancelled ? (
                                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase bg-red-50 text-red-700 border border-red-200">
                                    CANCELLED
                                  </span>
                                ) : isRescheduled ? (
                                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                    RESCHEDULED
                                  </span>
                                ) : a.status === 'COMPLETED' ? (
                                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    COMPLETED
                                  </span>
                                ) : (
                                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                    SCHEDULED
                                  </span>
                                )}
                              </td>
                              <td className="py-5 px-6 text-right flex justify-end items-center gap-2">
                                {isCancelled ? (
                                  <span className="text-[11px] text-gray-400 font-medium italic pr-2">Refunded</span>
                                ) : (
                                  <>
                                    {a.mode === 'ONLINE' && a.status !== 'COMPLETED' && (
                                      <button 
                                        type="button"
                                        onClick={() => handleSendAppointmentReminder(a)} 
                                        className={`${a.reminder_sent ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'} border px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs`}
                                        title="Send in-app video consultation reminder to patient and doctor"
                                      >
                                        <Bell size={13} className={a.reminder_sent ? 'text-emerald-700' : 'text-emerald-600'} />
                                        {a.reminder_sent ? 'Reminder Sent' : 'Send Video Reminder'}
                                      </button>
                                    )}
                                    <button onClick={() => openReschedule(a)} className="bg-white text-orange-600 px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-orange-50 flex items-center gap-1.5 transition shadow-sm border border-orange-200 cursor-pointer"><Clock size={14}/> Reschedule</button>
                                  </>
                                )}
                                <button onClick={() => generateInvoice(a)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1.5 transition cursor-pointer" title="Download Invoice"><Download size={14}/></button>
                              </td>
                            </tr>
                          )})}
                          {displayedAppts.length === 0 && (
                            <tr>
                              <td colSpan="7" className="py-12 text-center text-gray-400 italic font-medium">
                                No appointments found in this section.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* 🌟 TAB: LIVE CLINIC TOKEN QUEUE & CONSULTATION ROOM ALLOCATIONS 🌟 */}
              {activeTab === 'queue' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Today's Queue</span>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-black text-[#1C2C22]">{todayQueueAppointments.length}</span>
                        <div className="p-2.5 bg-[#EAF0EC] text-[#456A50] rounded-xl"><Ticket size={20} /></div>
                      </div>
                      <span className="text-[10px] text-[#456A50] block mt-1 font-bold">Total Patient Tokens</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">In Consultation</span>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-black text-emerald-700">
                          {todayQueueAppointments.filter(a => a.queue_status === 'IN_CONSULTATION').length}
                        </span>
                        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl"><Stethoscope size={20} /></div>
                      </div>
                      <span className="text-[10px] text-emerald-700 block mt-1 font-bold">Active in Rooms</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/20">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1">Called / Proceeding</span>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-black text-amber-700">
                          {todayQueueAppointments.filter(a => a.queue_status === 'CALLED').length}
                        </span>
                        <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl"><Megaphone size={20} /></div>
                      </div>
                      <span className="text-[10px] text-amber-700 block mt-1 font-bold">Announced Tokens</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Waiting in Lobby</span>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-black text-[#1C2C22]">
                          {todayQueueAppointments.filter(a => a.queue_status === 'WAITING').length}
                        </span>
                        <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl"><Clock size={20} /></div>
                      </div>
                      <span className="text-[10px] text-gray-500 block mt-1 font-bold">Next in Queue</span>
                    </div>
                  </div>

                  {/* Consultation Room Allocation Board */}
                  <div className="bg-white rounded-3xl border border-[#EBE9E0] p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#EBE9E0] pb-4">
                      <div>
                        <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                          <DoorOpen size={22} className="text-[#456A50]" /> Live Consultation Room Status
                        </h3>
                        <p className="text-xs text-[#5A6B60] mt-0.5">Doctor consultation chamber live occupancy & patient status.</p>
                      </div>
                      <span className="text-xs bg-[#FDFCF8] border border-[#EBE9E0] text-gray-600 font-bold px-3 py-1.5 rounded-xl">
                        📅 Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {CLINIC_ROOMS.map(room => {
                        const occupantAppt = todayQueueAppointments.find(
                          a => a.queue_status === 'IN_CONSULTATION' || a.queue_status === 'CALLED'
                        );
                        const isOccupied = !!occupantAppt;
                        const patientObj = occupantAppt ? patients.find(p => String(p.id) === String(occupantAppt.patient)) : null;
                        const patientName = patientObj ? `${patientObj.first_name} ${patientObj.last_name || ''}` : `Patient #${occupantAppt?.patient}`;

                        return (
                          <div 
                            key={room.id} 
                            className={`p-5 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                              isOccupied 
                                ? occupantAppt.queue_status === 'CALLED'
                                  ? 'bg-amber-50/70 border-amber-300' 
                                  : 'bg-emerald-50/70 border-emerald-300'
                                : 'bg-[#FDFCF8] border-[#EBE9E0]'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3.5 rounded-2xl shrink-0 ${
                                isOccupied ? 'bg-[#456A50] text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                <Stethoscope size={24} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sm text-[#1C2C22] block">{room.badge}</span>
                                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                    isOccupied 
                                      ? occupantAppt.queue_status === 'CALLED'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                                      : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}>
                                    {isOccupied ? occupantAppt.queue_status : 'Available'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 block mt-0.5">{room.doctor}</span>
                              </div>
                            </div>

                            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200/50 w-full sm:w-auto">
                              {isOccupied ? (
                                <div>
                                  <span className="text-xs font-black text-[#456A50] block">
                                    Current Token: #{occupantAppt.token_number}
                                  </span>
                                  <p className="text-sm font-black text-[#1C2C22]">{patientName}</p>
                                  <span className="text-[10px] text-gray-500 font-bold uppercase">{occupantAppt.mode} Session</span>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-xs text-gray-400 font-medium italic block">Chamber is currently empty</span>
                                  <span className="text-[10px] text-[#456A50] font-bold">Ready for next patient</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Token Queue Table */}
                  <div className="bg-white rounded-3xl border border-[#EBE9E0] p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EBE9E0] pb-4">
                      <div>
                        <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                          <Ticket size={22} className="text-[#456A50]" /> Today's Patient Queue Board
                        </h3>
                        <p className="text-xs text-[#5A6B60] mt-0.5">Call tokens, allocate consultation rooms, and update live statuses.</p>
                      </div>
                      <button 
                        onClick={() => setShowWalkinModal(true)} 
                        className="bg-[#456A50] hover:bg-[#35533E] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <CalendarPlus size={14} /> + Add Walk-in Token
                      </button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-xs text-[#1C2C22]">
                        <thead className="bg-[#FDFCF8] text-[10px] uppercase font-black text-gray-500 tracking-wider border-b border-[#EBE9E0]">
                          <tr>
                            <th className="py-3 px-4">Token #</th>
                            <th className="py-3 px-4">Patient</th>
                            <th className="py-3 px-4">Time & Mode</th>
                            <th className="py-3 px-4">Assigned Room</th>
                            <th className="py-3 px-4">Queue Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {todayQueueAppointments.map((appt) => {
                            const patientObj = patients.find(p => String(p.id) === String(appt.patient));
                            const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name || ''}` : `Patient #${appt.patient}`;
                            const isCalled = appt.queue_status === 'CALLED';
                            const isInSession = appt.queue_status === 'IN_CONSULTATION';
                            const isCompleted = appt.queue_status === 'COMPLETED';

                            return (
                              <tr key={appt.id} className={`hover:bg-gray-50/70 transition ${isCalled ? 'bg-amber-50/30' : isInSession ? 'bg-emerald-50/30' : ''}`}>
                                <td className="py-3.5 px-4">
                                  <span className="font-mono font-black text-sm bg-gray-100 px-2.5 py-1 rounded-lg text-[#1C2C22] border border-gray-200">
                                    {appt.token_number}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-xs text-[#1C2C22]">{pName}</td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">{appt.time}</span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${appt.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {appt.mode}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <select 
                                    value={appt.allocated_room || 'Doctor Consultation Chamber (In-Clinic)'}
                                    onChange={e => handleUpdateTokenQueue(appt.id, appt.queue_status, e.target.value)}
                                    className="border border-[#EBE9E0] bg-white rounded-lg p-1.5 text-xs outline-none focus:border-[#456A50]"
                                  >
                                    {CLINIC_ROOMS.map(r => (
                                      <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                                    isInSession
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : isCalled
                                      ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                                      : isCompleted
                                      ? 'bg-gray-100 text-gray-700 border-gray-200'
                                      : 'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}>
                                    {isInSession ? '🟢 In Room' : isCalled ? '📢 Called' : isCompleted ? '✓ Completed' : '⏳ Waiting'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    {appt.mode !== 'ONLINE' && (
                                      <button
                                        type="button"
                                        onClick={() => printClinicTokenSlip(appt, { name: pName })}
                                        className="bg-white hover:bg-gray-50 border border-[#EBE9E0] text-[#1C2C22] px-2.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                        title="Print Official Token Pass for Patient"
                                      >
                                        <Printer size={12} className="text-[#456A50]" /> Print Token
                                      </button>
                                    )}

                                    {!isCompleted && !isInSession && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateTokenQueue(appt.id, 'CALLED')}
                                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                        title="Announce Token to Patient"
                                      >
                                        <Megaphone size={12} /> Call
                                      </button>
                                    )}

                                    {!isCompleted && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateTokenQueue(appt.id, isInSession ? 'COMPLETED' : 'IN_CONSULTATION')}
                                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                                          isInSession
                                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                        }`}
                                      >
                                        {isInSession ? <><Check size={12} /> Finish</> : <><DoorOpen size={12} /> Start Session</>}
                                      </button>
                                    )}

                                    {isCompleted && (
                                      <span className="text-[11px] text-gray-400 italic font-medium">Session Closed</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {todayQueueAppointments.length === 0 && (
                            <tr>
                              <td colSpan="6" className="py-12 text-center text-gray-400 italic">
                                No consultations scheduled for today's queue.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 🌟 TAB: CLINIC HOLIDAYS & LEAVES MANAGEMENT 🌟 */}
              {activeTab === 'holidays' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MetricCard 
                      title="Marked Clinic Holidays" 
                      count={clinicHolidays.filter(h => h.holiday_type === 'CLINIC_HOLIDAY').length} 
                      icon={<CalendarX size={20} />} 
                      color="text-red-600" 
                      bg="bg-red-50" 
                    />
                    <MetricCard 
                      title="Active Staff Leaves" 
                      count={clinicHolidays.filter(h => h.holiday_type === 'NUTRITIONIST_LEAVE').length} 
                      icon={<CalendarDays size={20} />} 
                      color="text-amber-600" 
                      bg="bg-amber-50" 
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Interactive Calendar Preview */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-black text-[#1C2C22]">Live Calendar Schedule Preview</h3>
                          <p className="text-xs text-[#5A6B60]">View how holidays & leaves appear to patients during booking.</p>
                        </div>
                        <BookingCalendarPicker 
                          selectedDate=""
                          onSelectDate={(date) => {
                            setHolidayForm({ ...holidayForm, date });
                            setShowHolidayModal(true);
                          }}
                          holidays={clinicHolidays}
                        />
                      </div>
                    </div>

                    {/* Right: Table of Marked Holidays & Leaves */}
                    <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-6 flex flex-col h-[600px]">
                      <div className="flex justify-between items-center mb-4 border-b border-[#EBE9E0] pb-4">
                        <div>
                          <h3 className="text-lg font-black text-[#1C2C22]">Registered Holidays & Leaves</h3>
                          <p className="text-xs text-[#5A6B60]">Manage all active overrides.</p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 bg-[#EAF0EC] text-[#456A50] rounded-full">
                          {clinicHolidays.length} Total
                        </span>
                      </div>

                      <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm text-[#1C2C22]">
                          <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0">
                            <tr>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Type & Details</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EBE9E0]">
                            {clinicHolidays.map(h => (
                              <tr key={h.id} className="hover:bg-[#FDFCF8] transition group">
                                <td className="py-4 px-4 font-black text-[#1C2C22] whitespace-nowrap">
                                  {h.date}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                      h.holiday_type === 'CLINIC_HOLIDAY' 
                                        ? 'bg-red-100 text-red-800 border border-red-200' 
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                      {h.holiday_type === 'CLINIC_HOLIDAY' ? 'Clinic Holiday' : 'Staff Leave'}
                                    </span>
                                    {h.nutritionist_name && (
                                      <span className="text-xs font-bold text-[#456A50] truncate">
                                        {h.nutritionist_name}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 leading-snug font-medium">
                                    {h.reason}
                                  </p>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <button 
                                    onClick={() => handleDeleteHoliday(h.id, h.date)}
                                    className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition cursor-pointer"
                                    title="Delete Holiday"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}

                            {clinicHolidays.length === 0 && (
                              <tr>
                                <td colSpan="3" className="py-16 text-center text-gray-400">
                                  <CalendarX size={36} className="mx-auto mb-2 opacity-30" />
                                  <p className="text-xs font-bold">No custom holidays or leaves added yet.</p>
                                  <p className="text-[10px] text-gray-400 mt-1">Click "Add New Holiday / Leave" to schedule one.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🌟 TAB 3: INTERNAL COMMUNICATIONS (DUAL CHAT SYSTEM) 🌟 */}
              {activeTab === 'notifications' && (

                <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] overflow-hidden flex h-[75vh] animate-in fade-in">
                  
                  {/* Contacts Sidebar */}
                  <div className="w-1/3 border-r border-[#EBE9E0] bg-[#FDFCF8] flex flex-col">
                    <div className="p-6 border-b border-[#EBE9E0] bg-white"><h2 className="font-black text-xl text-[#1C2C22]">Communications</h2><p className="text-xs text-[#5A6B60] mt-1">Cross-platform chat hub.</p></div>
                    
                    <div className="flex p-3 bg-white border-b border-[#EBE9E0]">
                      <button onClick={() => {setChatType('PATIENT'); setSelectedChatUser(null);}} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition ${chatType === 'PATIENT' ? 'bg-[#1C2C22] text-white shadow-md' : 'text-[#5A6B60] hover:bg-gray-100'}`}>Patients</button>
                      <button onClick={() => {setChatType('NUTRITIONIST'); setSelectedChatUser(null);}} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition ml-2 ${chatType === 'NUTRITIONIST' ? 'bg-[#1C2C22] text-white shadow-md' : 'text-[#5A6B60] hover:bg-gray-100'}`}>Staff</button>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                      {(chatType === 'PATIENT' ? patients : nutritionists).map(user => {
                        const imgUrl = getProfileImg(user.id);
                        const unreadInThread = chats.some(c => !c.read && (c.senderId === user.id || c.patientId === user.id));
                        return (
                          <div key={user.id} onClick={() => handleSelectChatThread(user.id)} className={`p-5 border-b border-[#EBE9E0] cursor-pointer transition flex justify-between items-center ${selectedChatUser === user.id ? 'bg-[#EAF0EC] border-l-4 border-l-[#456A50]' : 'hover:bg-white border-l-4 border-l-transparent'}`}>
                            <div className="flex items-center gap-3">
                              {imgUrl ? <img src={imgUrl} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="Pic" /> : <UserCircle className={selectedChatUser === user.id ? 'text-[#456A50]' : 'text-gray-400'} size={32} />}
                              <div className="overflow-hidden">
                                <span className="font-black text-sm text-[#1C2C22] truncate block">{user.first_name} {user.last_name}</span>
                                <span className="text-[10px] text-[#5A6B60] font-bold uppercase tracking-widest truncate">{chatType === 'PATIENT' ? 'Patient' : 'Nutritionist'}</span>
                              </div>
                            </div>
                            {unreadInThread && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>}
                          </div>
                        )
                      })}
                      {(chatType === 'PATIENT' ? patients : nutritionists).length === 0 && <p className="text-center text-xs text-gray-400 py-10">No {chatType.toLowerCase()}s found.</p>}
                    </div>
                  </div>

                  {/* Chat Window */}
                  <div className="w-2/3 flex flex-col bg-white">
                    {selectedChatUser ? (() => {
                      const activeUserObj = (chatType === 'PATIENT' ? patients : nutritionists).find(u => String(u.id) === String(selectedChatUser));
                      const imgUrl = getProfileImg(selectedChatUser);
                      return (
                      <>
                        <div className="p-6 border-b border-[#EBE9E0] flex items-center gap-3 bg-[#FDFCF8]">
                          {imgUrl ? <img src={imgUrl} className="w-12 h-12 rounded-full object-cover shadow-sm" alt="Pic"/> : <UserCircle className="text-[#456A50]" size={36} />}
                          <div><h2 className="font-black text-lg text-[#1C2C22]">{activeUserObj?.first_name} {activeUserObj?.last_name}</h2><p className="text-[10px] text-[#456A50] font-bold uppercase tracking-widest">Active Secure Chat</p></div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-5 bg-white custom-scrollbar">
                          {currentThread.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm italic"><MessageSquare size={48} className="mb-4 text-gray-300 opacity-50" />Start a secure conversation.</div>
                          ) : currentThread.map(msg => {
                            const isMe = String(msg.senderId) === String(managerId) || msg.senderRole === 'MANAGER' || msg.senderRole === 'SYSTEM';
                            return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              {msg.senderRole === 'SYSTEM' ? (
                                <div className="bg-orange-100 text-orange-800 border border-orange-200 px-5 py-2 rounded-full text-[10px] font-bold my-2 shadow-sm self-center tracking-widest uppercase">{msg.text}</div>
                              ) : (
                                <div className={`max-w-[75%] p-4 rounded-3xl shadow-sm ${isMe ? 'bg-[#456A50] text-white rounded-br-sm' : 'bg-[#FDFCF8] border border-[#EBE9E0] text-[#1C2C22] rounded-bl-sm'}`}><p className="text-sm leading-relaxed">{msg.text}</p><span className={`text-[9px] mt-2 block font-bold tracking-widest uppercase ${isMe ? 'text-green-200' : 'text-gray-400'}`}>{msg.time}</span></div>
                              )}
                            </div>
                          )})}
                          <div ref={chatEndRef} />
                        </div>
                        
                        <form onSubmit={handleSendChatMessage} className="p-5 border-t border-[#EBE9E0] bg-[#FDFCF8] flex items-end gap-3">
                          <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} required rows="1" placeholder={`Type a message to ${activeUserObj?.first_name}...`} className="flex-1 bg-white border border-[#EBE9E0] rounded-2xl p-4 text-sm outline-none focus:border-[#456A50] text-[#1C2C22] placeholder-gray-400 resize-none transition shadow-sm"></textarea>
                          <button type="submit" className="bg-[#1C2C22] text-white p-4 rounded-2xl hover:bg-[#456A50] transition shadow-md flex justify-center items-center h-[54px] w-[54px] shrink-0"><Send size={20} className="ml-1"/></button>
                        </form>
                      </>
                    )})() : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#FDFCF8]"><MessageSquare size={60} className="mb-6 text-gray-300 opacity-50" /><p className="font-medium">Select a user from the list to view chat.</p></div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(69, 106, 80, 0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(69, 106, 80, 0.5); }
        .css-date-icon-hide::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; top: 0; bottom: 0; width: 40px; cursor: pointer; }
        .css-time-icon-hide::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; top: 0; bottom: 0; width: 40px; cursor: pointer; }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, tab, activeTab, setTab }) => (
  <button 
    onClick={() => setTab(tab)} 
    className={`w-full flex items-center text-left gap-3 px-4 py-3 rounded-xl transition text-sm ${
      activeTab === tab 
        ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' 
        : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'
    }`}
  >
    <div className="shrink-0 flex items-center justify-center">{icon}</div> 
    <span className="text-left leading-tight">{label}</span>
  </button>
);
const MetricCard = ({ title, count, icon, color, bg }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-[#EBE9E0] p-6 flex items-center gap-4"><div className={`${bg} ${color} p-4 rounded-xl`}>{icon}</div><div><p className="text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest">{title}</p><p className="text-3xl font-black text-[#1C2C22]">{count}</p></div></div>
);

export default ClinicManagerDashboard;