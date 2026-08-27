import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, LogOut, Search, 
  CheckCircle2, HeartPulse, UserCircle, UserPlus, X, 
  User, Mail, Phone, Lock, CalendarPlus, Edit3, MessageSquare, Send, Camera, IndianRupee, Download, Bell, Apple, Clock
} from 'lucide-react';

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
  const managerName = localStorage.getItem('user_name') || 'Clinic Manager';
  const managerId = localStorage.getItem('user_id') || 'manager_1';

  // --- REAL BACKEND STATE ---
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [nutritionists, setNutritionists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- MODALS & FORMS ---
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [patientForm, setPatientForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' });
  const [walkinForm, setWalkinForm] = useState({ patient: '', nutritionist: '', date: '', time: '' });
  const [rescheduleForm, setRescheduleForm] = useState({ id: '', date: '', time: '', patientName: '', patientId: '', nutritionistId: '' });

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
    if (activeTab === 'notifications' && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, chats, selectedChatUser]);

  // Updated to accept a 'showLoader' parameter
  const fetchRealData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const localUsers = JSON.parse(localStorage.getItem('healora_local_patients')) || [];
      const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
      const localChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      const notifs = JSON.parse(localStorage.getItem(`healora_notifications_${managerId}`)) || [];
      
      const [usersRes, nutRes] = await Promise.all([
        secureFetch('/api/admin-api/users/').catch(()=>({ok:false})),
        secureFetch('/api/nutritionists/').catch(()=>({ok:false}))
      ]);

      let apiUsers = [];
      if (usersRes.ok) { apiUsers = await usersRes.json(); }
      
      const mergedUsers = [...apiUsers.filter(u => u.role === 'PATIENT'), ...localUsers];
      const uniquePatients = Array.from(new Map(mergedUsers.map(item => [item.email, item])).values());
      
      const normalizedPatients = uniquePatients.map((p, idx) => ({
        ...p,
        id: String(p.id && !isNaN(p.id) && parseInt(p.id) < 1000 ? p.id : (idx + 1))
      }));

      setPatients(normalizedPatients);
      
      if (nutRes.ok) setNutritionists(await nutRes.json());

      // Bulletproof ID sorting logic
      const sortedAppts = localAppts.sort((a, b) => {
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
    setIsSaving(true);
    try {
      const updatedAppts = appointments.map(a => String(a.id) === String(rescheduleForm.id) ? { ...a, date: rescheduleForm.date, time: rescheduleForm.time, status: 'RESCHEDULED' } : a);
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
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative border border-[#EBE9E0]">
            <button onClick={() => setShowWalkinModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-50 rounded-full p-2 transition"><X size={18} /></button>
            <h2 className="text-2xl font-black text-[#1C2C22] mb-1">Book Walk-in Patient</h2>
            <p className="text-xs text-[#5A6B60] mb-6">Collect payment at desk and generate invoice.</p>
            <form onSubmit={handleWalkinAppt} className="space-y-5">
              <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Select Patient</label>
                <select required value={walkinForm.patient} onChange={e=>setWalkinForm({...walkinForm, patient: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition">
                  <option value="" disabled>Select Patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
                {patients.length === 0 && <p className="text-red-500 text-[10px] mt-1 font-bold">No patients available. Please Register a patient first.</p>}
              </div>
              <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Assign Nutritionist</label>
                <select required value={walkinForm.nutritionist} onChange={e=>setWalkinForm({...walkinForm, nutritionist: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition">
                  <option value="" disabled>Select Nutritionist...</option>
                  {nutritionists.map(n => <option key={n.id} value={n.id}>Dr. {n.first_name} {n.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Date</label><input type="date" required min={new Date().toISOString().split('T')[0]} value={walkinForm.date} onChange={e=>setWalkinForm({...walkinForm, date: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition" /></div><div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase mb-2 tracking-widest">Time</label><input type="time" required value={walkinForm.time} onChange={e=>setWalkinForm({...walkinForm, time: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition" /></div></div>
              <div className="bg-[#EAF0EC] border border-[#456A50]/20 rounded-2xl p-5 flex justify-between items-center mt-2 shadow-sm"><span className="font-bold text-[#456A50] text-sm">Collect Cash/Card:</span><span className="font-black text-2xl text-[#1C2C22]">₹ 500</span></div>
              <button type="submit" disabled={isSaving || patients.length === 0} className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'Processing...' : <><IndianRupee size={16}/> Confirm Payment & Print Invoice</>}</button>
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
            <form onSubmit={handleRegisterPatient} className="space-y-6" autoComplete="off" noValidate>
              {formErrors.api && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100">{formErrors.api}</div>}
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">First Name</label><div className="relative"><User size={18} className="absolute left-4 top-4 text-gray-400" /><input name="first_name" spellCheck="false" autoComplete="new-password" type="text" placeholder="First Name" value={patientForm.first_name} onChange={handlePatientFormChange} className={`w-full border ${formErrors.first_name ? 'border-red-500 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-[#FDFCF8]'} rounded-xl p-3.5 pl-12 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm`} /></div>{formErrors.first_name && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.first_name}</p>}</div>
                <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Last Name</label><input name="last_name" spellCheck="false" autoComplete="new-password" type="text" placeholder="Last Name" value={patientForm.last_name} onChange={handlePatientFormChange} className={`w-full border ${formErrors.last_name ? 'border-red-500 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-[#FDFCF8]'} rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm`} />{formErrors.last_name && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.last_name}</p>}</div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Email Address</label><div className="relative"><Mail size={18} className="absolute left-4 top-4 text-gray-400" /><input name="email" spellCheck="false" autoComplete="new-password" type="email" placeholder="patient@example.com" value={patientForm.email} onChange={handlePatientFormChange} className={`w-full border ${formErrors.email ? 'border-red-500 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-[#FDFCF8]'} rounded-xl p-3.5 pl-12 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm`} /></div>{formErrors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.email}</p>}</div>
                <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Phone Number (10 Digits)</label><div className="relative"><Phone size={18} className="absolute left-4 top-4 text-gray-400" /><input name="phone" maxLength="10" spellCheck="false" autoComplete="new-password" type="text" placeholder="10-digit number" value={patientForm.phone} onChange={handlePatientFormChange} className={`w-full border ${formErrors.phone ? 'border-red-500 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-[#FDFCF8]'} rounded-xl p-3.5 pl-12 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm`} /></div>{formErrors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.phone}</p>}</div>
              </div>
              <div><label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest mb-2">Temporary Password</label><div className="relative"><Lock size={18} className="absolute left-4 top-4 text-gray-400" /><input name="password" spellCheck="false" autoComplete="new-password" type="password" placeholder="••••••••" value={patientForm.password} onChange={handlePatientFormChange} className={`w-full border ${formErrors.password ? 'border-red-500 bg-red-50 text-red-900' : 'border-[#EBE9E0] bg-[#FDFCF8]'} rounded-xl p-3.5 pl-12 text-sm outline-none focus:ring-2 focus:ring-[#456A50]/20 focus:border-[#456A50] transition shadow-sm`} /></div>{formErrors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.password}</p>}</div>
              <button type="submit" disabled={isSaving} className="w-full bg-[#1C2C22] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#456A50] transition shadow-lg mt-4 disabled:opacity-70">{isSaving ? 'Registering...' : 'Register Patient & Create Account'}</button>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 PREMIUM ORANGE RESCHEDULE MODAL 🌟 */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative border border-[#EBE9E0]">
            <button onClick={() => setShowRescheduleModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition bg-gray-100 rounded-full p-2"><X size={18} /></button>
            
            <h2 className="text-2xl font-black text-[#1C2C22]">Reschedule Session</h2>
            <p className="text-sm text-[#5A6B60] mt-1 mb-8">Updating booking for <b className="text-[#1C2C22]">{rescheduleForm.patientName}</b>.</p>
            
            <form onSubmit={handleRescheduleAppt} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-[#5A6B60] uppercase tracking-widest mb-2">New Date</label>
                  <div className="relative">
                    <input type="date" required min={new Date().toISOString().split('T')[0]} value={rescheduleForm.date} onChange={e => setRescheduleForm({...rescheduleForm, date: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition shadow-sm css-date-icon-hide" />
                    <Calendar size={16} className="absolute right-4 top-4 text-[#1C2C22] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#5A6B60] uppercase tracking-widest mb-2">New Time</label>
                  <div className="relative">
                    <input type="time" required value={rescheduleForm.time} onChange={e => setRescheduleForm({...rescheduleForm, time: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition shadow-sm css-time-icon-hide" />
                    <Clock size={16} className="absolute right-4 top-4 text-[#1C2C22] pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <button type="submit" disabled={isSaving} className="w-full bg-[#f97316] text-white py-4 rounded-xl font-black text-sm hover:bg-[#ea580c] transition shadow-lg mt-4 shadow-orange-500/30">
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
          
          <button onClick={() => setActiveTab('notifications')} className={`w-full relative flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab === 'notifications' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <MessageSquare size={18} /> Internal Comms
            {unreadMessageCount > 0 && (
              <span className="absolute right-3 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
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
            <div className="flex items-center gap-4">
              <button onClick={() => setShowWalkinModal(true)} className="bg-[#456A50] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#35533E] shadow-lg shadow-[#456A50]/20 text-sm transition"><CalendarPlus size={16} /> Book Walk-in</button>
              <button onClick={() => { setPatientForm({ first_name: '', last_name: '', email: '', phone: '', password: '' }); setFormErrors({}); setShowAddPatient(true); }} className="bg-white border border-[#EBE9E0] text-[#5A6B60] px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-sm flex items-center gap-2"><UserPlus size={16} /> Register</button>
              
              {/* 🌟 MANAGER NOTIFICATION BELL 🌟 */}
              <div className="relative cursor-pointer group ml-2" onClick={() => {setShowNotifications(true); markManagerNotifsRead();}}>
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
                    <MetricCard title="Total Appointments" count={appointments.length} icon={<Calendar size={20} />} color="text-blue-600" bg="bg-blue-50" />
                    <MetricCard title="Total Conversations" count={[...new Set(chats.map(c=>c.patientId || c.senderId))].length} icon={<MessageSquare size={20} />} color="text-orange-600" bg="bg-orange-50" />
                    <MetricCard title="Completed Consults" count={appointments.filter(a => a.status === 'COMPLETED').length} icon={<CheckCircle2 size={20} />} color="text-green-600" bg="bg-green-50" />
                    <MetricCard title="Registered Patients" count={patients.length} icon={<Users size={20} />} color="text-[#456A50]" bg="bg-[#EAF0EC]" />
                  </div>
                  
                  <div className="mt-8 bg-white rounded-3xl shadow-sm border border-[#EBE9E0] overflow-hidden">
                    <div className="p-6 border-b border-[#EBE9E0] bg-[#FDFCF8]"><h3 className="font-black text-xl text-[#1C2C22]">Today's Schedule</h3><p className="text-xs text-[#5A6B60] mt-1">Live monitoring of incoming appointments.</p></div>
                    <div className="overflow-y-auto max-h-96">
                      <table className="w-full text-left text-sm text-[#1C2C22]">
                        <thead className="bg-white text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0"><tr><th className="py-4 px-6">Date & Time</th><th className="py-4 px-6">Patient</th><th className="py-4 px-6">Mode</th><th className="py-4 px-6">Status</th></tr></thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {appointments.slice(0,5).map(a => {
                            const pName = patients.find(p => String(p.id) === String(a.patient))?.first_name || `Patient #${a.patient}`;
                            return (
                            <tr key={a.id} className="hover:bg-[#FDFCF8] transition group">
                              <td className="py-5 px-6 font-bold text-[#456A50]">{a.date} at {a.time}</td>
                              <td className="py-5 px-6 font-black text-[#1C2C22]">{pName}</td>
                              <td className="py-5 px-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.mode}</span></td>
                              <td className="py-5 px-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.status === 'SCHEDULED' ? 'bg-orange-100 text-orange-700' : a.status === 'RESCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{a.status}</span></td>
                            </tr>
                          )})}
                          {appointments.length === 0 && <tr><td colSpan="4" className="py-12 text-center text-gray-400 italic font-medium">No schedule for today.</td></tr>}
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
                      <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0"><tr><th className="py-4 px-6">User ID</th><th className="py-4 px-6">Patient Name</th><th className="py-4 px-6">Email</th><th className="py-4 px-6">Status</th></tr></thead>
                      <tbody className="divide-y divide-[#EBE9E0]">
                        {patients.map(p => {
                          const imgUrl = getProfileImg(p.id);
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
                            <td className="py-5 px-6 text-gray-500">{p.email}</td>
                            <td className="py-5 px-6">{p.is_active ? <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">Active</span> : <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">Suspended</span>}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 animate-in fade-in h-[75vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-black text-[#1C2C22]">All Appointments</h2><p className="text-sm text-[#5A6B60] mt-1">View patient bookings and manage rescheduling.</p></div></div>
                  <div className="overflow-y-auto flex-1 border border-[#EBE9E0] rounded-2xl custom-scrollbar">
                    <table className="w-full text-left text-sm text-[#1C2C22] whitespace-nowrap">
                      <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0"><tr><th className="py-4 px-6">Booking ID</th><th className="py-4 px-6">Patient</th><th className="py-4 px-6">Nutritionist</th><th className="py-4 px-6">Date & Time</th><th className="py-4 px-6">Status</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-[#EBE9E0]">
                        {appointments.map(a => {
                          const pName = patients.find(p => String(p.id) === String(a.patient))?.first_name || `Patient #${a.patient}`;
                          const nName = nutritionists.find(n => String(n.id) === String(a.nutritionist))?.first_name || 'Assigned';
                          return (
                          <tr key={a.id} className="hover:bg-[#FDFCF8] transition group">
                            <td className="py-5 px-6 font-bold text-gray-500">APT-{a.id}</td>
                            <td className="py-5 px-6 font-black text-[#1C2C22]">{pName}</td>
                            <td className="py-5 px-6 font-bold text-[#456A50] flex items-center gap-1.5 mt-1"><Apple size={14}/> Dr. {nName}</td>
                            <td className="py-5 px-6 font-bold text-[#1C2C22]">{a.date} <span className="text-[#5A6B60] font-normal mx-1">at</span> {a.time}</td>
                            <td className="py-5 px-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.status === 'SCHEDULED' ? 'bg-orange-100 text-orange-700' : a.status === 'RESCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{a.status}</span></td>
                            <td className="py-5 px-6 text-right flex justify-end gap-2">
                              <button onClick={() => openReschedule(a)} className="bg-white text-orange-600 px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-orange-50 flex items-center gap-1.5 ml-auto transition shadow-sm border border-orange-200"><Clock size={14}/> Reschedule</button>
                              <button onClick={() => generateInvoice(a)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1.5 transition"><Download size={14}/></button>
                            </td>
                          </tr>
                        )})}
                        {appointments.length === 0 && (<tr><td colSpan="6" className="py-12 text-center text-gray-400 italic font-medium">No appointments booked yet.</td></tr>)}
                      </tbody>
                    </table>
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
  <button onClick={() => setTab(tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab === tab ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>{icon} <span>{label}</span></button>
);
const MetricCard = ({ title, count, icon, color, bg }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-[#EBE9E0] p-6 flex items-center gap-4"><div className={`${bg} ${color} p-4 rounded-xl`}>{icon}</div><div><p className="text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest">{title}</p><p className="text-3xl font-black text-[#1C2C22]">{count}</p></div></div>
);

export default ClinicManagerDashboard;