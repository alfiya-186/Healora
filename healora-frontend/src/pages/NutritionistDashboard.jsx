import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, FileText, Apple, Activity, Calendar, 
  CheckCircle2, Save, Send, LogOut, HeartPulse, UserCheck, 
  ArrowRight, Sparkles, AlertCircle, Clock, CheckCircle, Scale, 
  Flame, Stethoscope, UserCircle, Layers, Bell, MessageSquare, X, ShieldAlert, Droplets, Moon, Footprints, Star,
  Video, ExternalLink, Link2, Eye, ShieldCheck, Download, Lock, Unlock, AlertTriangle, TrendingUp, TrendingDown, Target, Award, Zap,
  ClipboardList, Edit3
} from 'lucide-react';
import { getKeralaPersonalizedOptions, getKeralaMealImage, generatePersonalizedKeralaWeeks } from '../utils/keralaNutritionEngine.js';

export const DEFAULT_MEAL_TIMINGS = {
  pre_breakfast: '07:00 AM',
  breakfast: '08:30 AM',
  drink: '11:00 AM',
  lunch: '01:30 PM',
  snack: '04:30 PM',
  dinner: '08:00 PM'
};

const NutritionistDashboard = () => {
  const navigate = useNavigate();
  const nutritionistName = localStorage.getItem('user_name') || 'Dr. Sarah Jenkins';
  const nutritionistId = localStorage.getItem('user_id') || 'nut_1';

  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'case', 'messages'
  const [searchQuery, setSearchQuery] = useState('');
  const [adherenceFilter, setAdherenceFilter] = useState('ALL'); // 'ALL' | 'ATTENTION' | 'HIGH' | 'MODERATE' | 'STRUGGLING'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('healora_all_appointments')) || []; } catch { return []; }
  });
  const [patientReports, setPatientReports] = useState([]);
  const [selectedReportModal, setSelectedReportModal] = useState(null);
  const [modalViewMode, setModalViewMode] = useState('diagnostic'); // 'diagnostic' or 'original'

  // --- 4. DOCUMENT STATUS & CLINICAL REVIEW ---
  const [reviewingDocModal, setReviewingDocModal] = useState(null);
  const [docReviewStatus, setDocReviewStatus] = useState('REVIEWED'); // 'AVAILABLE_FOR_REVIEW' | 'REVIEWED'
  const [docReviewNotes, setDocReviewNotes] = useState('');

  const handleOpenDocReview = (report) => {
    setReviewingDocModal(report);
    setDocReviewStatus(report.status === 'REVIEWED' ? 'REVIEWED' : 'REVIEWED');
    setDocReviewNotes(report.review_notes || '');
  };

  const handleSaveDocReview = (e) => {
    e.preventDefault();
    if (!reviewingDocModal || !selectedPatient) return;

    const reviewerName = `Dr. ${nutritionistName}`;
    const reviewedAt = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedDoc = {
      ...reviewingDocModal,
      status: docReviewStatus,
      review_notes: docReviewNotes.trim(),
      reviewed_by: docReviewStatus === 'REVIEWED' ? reviewerName : '',
      reviewed_at: docReviewStatus === 'REVIEWED' ? reviewedAt : ''
    };

    // 1. Update local patientReports state
    const updatedReports = patientReports.map(r => (r.id === updatedDoc.id || r.name === updatedDoc.name) ? updatedDoc : r);
    setPatientReports(updatedReports);

    // 2. Persist to patient's labReports in localStorage
    localStorage.setItem(`labReports_${selectedPatient.id}`, JSON.stringify(updatedReports));

    // 3. Persist to all vault
    const allVault = JSON.parse(localStorage.getItem('healora_all_patient_reports')) || {};
    allVault[selectedPatient.id] = updatedReports;
    localStorage.setItem('healora_all_patient_reports', JSON.stringify(allVault));

    // 4. Send notification to Patient Portal
    if (docReviewStatus === 'REVIEWED') {
      const patientNotifs = JSON.parse(localStorage.getItem(`healora_notifications_${selectedPatient.id}`)) || [];
      patientNotifs.unshift({
        id: Date.now(),
        title: "Clinical Document Reviewed by Nutritionist",
        message: `${reviewerName} reviewed your document "${updatedDoc.name}". ${docReviewNotes ? `Note: "${docReviewNotes}"` : 'Status updated to Reviewed.'}`,
        date: new Date().toLocaleString(),
        read: false
      });
      localStorage.setItem(`healora_notifications_${selectedPatient.id}`, JSON.stringify(patientNotifs));
    }

    setReviewingDocModal(null);
    setDocReviewNotes('');
    alert(`✅ Document marked as "${docReviewStatus === 'REVIEWED' ? 'Reviewed' : 'Available for Review'}"!`);
  };

  const getClinicalReportDetails = (report, patient) => {
    const type = (report?.type || report?.document_type || report?.name || '').toLowerCase();
    const date = report?.date || (report?.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString() : 'Recent');
    const pName = patient ? `${patient.first_name} ${patient.last_name}` : 'Patient';
    const age = patient?.age || 26;
    const gender = patient?.gender || 'Female';

    if (type.includes('blood') || type.includes('glucose') || type.includes('hba1c') || type.includes('sugar') || type.includes('insulin')) {
      return {
        title: 'Blood Glucose, HbA1c & Fasting Insulin Panel',
        lab: 'Healora Diagnostic Pathology & Bio-Analytics',
        date,
        patientName: pName,
        age,
        gender,
        parameters: [
          { test: 'Fasting Blood Sugar (FBS)', result: '104 mg/dL', ref: '70 - 99 mg/dL', status: 'BORDERLINE HIGH', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'Post-Prandial Blood Sugar (PPBS)', result: '142 mg/dL', ref: '< 140 mg/dL', status: 'SLIGHTLY ELEVATED', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'HbA1c (Glycated Hemoglobin)', result: '5.9 %', ref: '< 5.7 % (Non-diabetic)', status: 'PRE-DIABETIC RANGE', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'Average Estimated Glucose (eAG)', result: '123 mg/dL', ref: '< 117 mg/dL', status: 'BORDERLINE', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'Fasting Serum Insulin', result: '14.2 µIU/mL', ref: '2.6 - 12.0 µIU/mL', status: 'ELEVATED (Mild Resistance)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'HOMA-IR (Insulin Resistance Index)', result: '3.6', ref: '< 2.0 (Optimal)', status: 'INSULIN RESISTANT', color: 'text-red-700 bg-red-50 border-red-200' }
        ],
        clinicalNotes: 'Mild insulin resistance with pre-diabetic glycemic profile. Low-glycemic diet rich in soluble fiber, complex carbohydrates, and timed protein intake recommended to restore insulin sensitivity.'
      };
    }

    if (type.includes('thyroid') || type.includes('tsh') || type.includes('t3') || type.includes('t4')) {
      return {
        title: 'Comprehensive Thyroid Function Panel (TSH, T3, T4)',
        lab: 'Healora Diagnostic Pathology & Endocrinology Labs',
        date,
        patientName: pName,
        age,
        gender,
        parameters: [
          { test: 'Thyroid Stimulating Hormone (TSH)', result: '4.85 µIU/mL', ref: '0.45 - 4.50 µIU/mL', status: 'MILD ELEVATION', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'Total Triiodothyronine (Total T3)', result: '1.05 ng/mL', ref: '0.80 - 2.00 ng/mL', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { test: 'Total Thyroxine (Total T4)', result: '6.8 µg/dL', ref: '5.1 - 14.1 µg/dL', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { test: 'Free Thyroxine (FT4)', result: '1.1 ng/dL', ref: '0.9 - 1.7 ng/dL', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { test: 'Anti-TPO Antibodies', result: '24.0 IU/mL', ref: '< 34.0 IU/mL', status: 'NEGATIVE', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
        ],
        clinicalNotes: 'Subclinical hypothyroidism with sluggish basal metabolic rate. Ensure adequate selenium (brazil nuts), zinc, tyrosine, and iodine intake. Caloric deficit must be carefully calibrated.'
      };
    }

    if (type.includes('lipid') || type.includes('cholesterol') || type.includes('cbc') || type.includes('count')) {
      return {
        title: 'Complete Blood Count (CBC) & Full Lipid Profile',
        lab: 'Healora Diagnostic Pathology & Bio-Analytics',
        date,
        patientName: pName,
        age,
        gender,
        parameters: [
          { test: 'Total Cholesterol', result: '214 mg/dL', ref: '< 200 mg/dL', status: 'BORDERLINE HIGH', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'Serum Triglycerides', result: '168 mg/dL', ref: '< 150 mg/dL', status: 'ELEVATED', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'HDL Cholesterol (Good)', result: '46 mg/dL', ref: '> 50 mg/dL', status: 'SUB-OPTIMAL', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'LDL Cholesterol (Bad)', result: '134 mg/dL', ref: '< 100 mg/dL', status: 'HIGH', color: 'text-red-700 bg-red-50 border-red-200' },
          { test: 'VLDL Cholesterol', result: '34 mg/dL', ref: '< 30 mg/dL', status: 'BORDERLINE', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'Hemoglobin (Hb)', result: '12.8 g/dL', ref: '12.0 - 15.5 g/dL', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { test: 'Total WBC Count', result: '6,800 /µL', ref: '4,000 - 11,000 /µL', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { test: 'Platelet Count', result: '240,000 /µL', ref: '150,000 - 450,000 /µL', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
        ],
        clinicalNotes: 'Mild dyslipidemia with elevated LDL and triglycerides. Recommend reducing saturated fats, increasing Omega-3 fatty acids (flaxseeds, walnuts, chia seeds), and adopting Mediterranean dietary patterns.'
      };
    }

    if (type.includes('vitamin') || type.includes('mineral') || type.includes('iron') || type.includes('b12')) {
      return {
        title: 'Micronutrient, Vitamin & Mineral Assay',
        lab: 'Healora Diagnostic Pathology & Bio-Analytics',
        date,
        patientName: pName,
        age,
        gender,
        parameters: [
          { test: 'Vitamin D3 (25-Hydroxy)', result: '16.8 ng/mL', ref: '30.0 - 100.0 ng/mL', status: 'DEFICIENT', color: 'text-red-700 bg-red-50 border-red-200' },
          { test: 'Vitamin B12 (Cobalamin)', result: '245 pg/mL', ref: '211 - 911 pg/mL', status: 'BORDERLINE LOW', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'Serum Ferritin (Iron Stores)', result: '22 ng/mL', ref: '20 - 250 ng/mL', status: 'LOW NORMAL', color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { test: 'Serum Calcium', result: '9.3 mg/dL', ref: '8.8 - 10.2 mg/dL', status: 'OPTIMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { test: 'Serum Magnesium', result: '2.1 mg/dL', ref: '1.7 - 2.4 mg/dL', status: 'OPTIMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
        ],
        clinicalNotes: 'Significant Vitamin D3 deficiency with borderline B12. Suggest morning sunlight exposure (20 mins), Vitamin D3 supplement protocol, nutritional yeast, fortified almond/dairy milk, and dark leafy greens.'
      };
    }

    // Default Comprehensive Clinical Report
    return {
      title: report?.type || report?.document_type || 'Clinical Laboratory Diagnostic Report',
      lab: 'Healora Diagnostic Clinical Labs & Bio-Analytics',
      date,
      patientName: pName,
      age,
      gender,
      parameters: [
        { test: 'Biochemical Metabolic Panel', result: 'Evaluated & Documented', ref: 'Clinical Standard', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { test: 'Serum Albumin / Total Protein', result: '4.2 g/dL / 7.1 g/dL', ref: '3.5 - 5.0 / 6.0 - 8.3 g/dL', status: 'OPTIMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { test: 'Liver Function (SGOT / SGPT)', result: '22 U/L / 26 U/L', ref: '< 35 U/L / < 45 U/L', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { test: 'Renal Function (Serum Creatinine & BUN)', result: '0.8 mg/dL / 14 mg/dL', ref: '0.6 - 1.1 mg/dL / 7 - 20 mg/dL', status: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { test: 'Estimated GFR (eGFR)', result: '> 90 mL/min', ref: '> 90 mL/min/1.73m²', status: 'HEALTHY', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { test: 'Clinical Diagnostic Findings', result: 'Patient Consent Verified', ref: 'Verified Lab Record', status: 'SYNCHRONIZED', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      ],
      clinicalNotes: 'Diagnostic laboratory investigation verified and recorded in patient medical file. Biochemical indicators are available for direct dietary planning and nutrition protocol adjustment.'
    };
  };

  // --- NOTIFICATIONS STATE ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- WELLNESS LOGS & EVALUATION ---
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [weeklyEvaluation, setWeeklyEvaluation] = useState('');
  const [evaluationRating, setEvaluationRating] = useState(5); // New Feature: Interactive Star Ratings
  const [evaluations, setEvaluations] = useState({});

  // --- CHAT STATE ---
  const [activeChatContact, setActiveChatContact] = useState('manager'); 
  const [chatInput, setChatInput] = useState('');
  const [chats, setChats] = useState([]);
  const chatEndRef = useRef(null);

  // --- 5. PATIENT CLINICAL HISTORY & LONGITUDINAL TRACKING ---
  const [historySubTab, setHistorySubTab] = useState('daily_weekly'); // 'daily_weekly' | 'weight' | 'lifestyle' | 'food'
  const [patientWeightHistory, setPatientWeightHistory] = useState([]);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [newWeightNotes, setNewWeightNotes] = useState('');
  const [historyWeekFilter, setHistoryWeekFilter] = useState('ALL'); // 'ALL' | '1' | '2' | '3' | '4'

  const handleAddWeightEntry = (e) => {
    e.preventDefault();
    if (!newWeightInput || !selectedPatient) return;
    const wVal = parseFloat(newWeightInput);
    if (isNaN(wVal) || wVal <= 0) {
      alert('Please enter a valid weight in kg.');
      return;
    }
    const hM = (parseFloat(selectedPatient.height_cm) || 165) / 100;
    const calcBMI = (wVal / (hM * hM)).toFixed(1);

    const entry = {
      id: Date.now(),
      date: newWeightDate || new Date().toISOString().split('T')[0],
      weight_kg: wVal.toFixed(1),
      bmi: calcBMI,
      notes: newWeightNotes || 'Clinical Weigh-in Recorded'
    };
    const updated = [entry, ...patientWeightHistory.filter(w => w.date !== entry.date)].sort((a, b) => new Date(b.date) - new Date(a.date));
    setPatientWeightHistory(updated);
    localStorage.setItem(`healora_weight_history_${selectedPatient.id}`, JSON.stringify(updated));

    // Also update selected patient's current weight
    setSelectedPatient(prev => ({ ...prev, weight_kg: entry.weight_kg }));
    const pProfile = JSON.parse(localStorage.getItem(`healora_profile_${selectedPatient.id}`) || '{}');
    pProfile.weight_kg = entry.weight_kg;
    localStorage.setItem(`healora_profile_${selectedPatient.id}`, JSON.stringify(pProfile));

    setNewWeightInput('');
    setNewWeightNotes('');
    alert(`✅ Weight record (${entry.weight_kg} kg on ${entry.date}) saved successfully!`);
  };

  // --- PROGRAM-WISE SMART FOOD SUGGESTIONS DATABASE ---
  // --- CLINICAL PERSONALIZED KERALA MEAL SUGGESTION ENGINE (2-3 PERSONALIZED OPTIONS) ---
  const getSuggestionsForPatient = (mealType) => {
    if (!selectedPatient) return [];
    const options = getKeralaPersonalizedOptions(mealType, selectedPatient, patientReports);
    return options.map(opt => `${opt.name} (${opt.cal})`);
  };



  // --- EXACT LOGGED-IN PATIENT STORE DYNAMIC SYNC ---
  const [patients, setPatients] = useState(() => {
    try {
      const activeUserId = localStorage.getItem('user_id') || '1';
      const activeUserName = localStorage.getItem('user_name') || 'Patient';
      
      const nameParts = activeUserName.trim().split(' ');
      const firstName = nameParts[0] || 'Patient';
      const lastName = nameParts.slice(1).join(' ') || '';

      const savedProfile = JSON.parse(localStorage.getItem(`healora_profile_${activeUserId}`)) || {};
      const globalUsers = JSON.parse(localStorage.getItem('healora_local_users')) || [];
      const registeredPatients = globalUsers.filter(u => u.role === 'PATIENT');

      if (registeredPatients.length > 0) {
        return registeredPatients.map(rp => {
          const pId = String(rp.id || activeUserId);
          const pProfile = JSON.parse(localStorage.getItem(`healora_profile_${pId}`) || '{}');
          return {
            id: pId,
            first_name: rp.first_name || rp.name?.split(' ')[0] || firstName,
            last_name: rp.last_name || rp.name?.split(' ').slice(1).join(' ') || lastName,
            email: rp.email || '',
            age: pProfile.age || '24',
            height_cm: pProfile.height_cm || '165',
            weight_kg: pProfile.weight_kg || '65',
            blood_group: pProfile.blood_group || 'O+',
            food_allergies: pProfile.food_allergies || 'None',
            food_preferences: pProfile.food_preferences || 'No preference',
            medical_history: pProfile.medical_history || 'None reported',
            enrolled_program: pProfile.health_goals || 'Weight Management',
            profile_image: localStorage.getItem(`profilePic_${pId}`) || null,
            ...pProfile
          };
        });
      }

      return [{
        id: activeUserId,
        first_name: firstName,
        last_name: lastName,
        email: localStorage.getItem('user_email') || 'patient@healora.com',
        age: savedProfile.age || '24',
        height_cm: savedProfile.height_cm || '165',
        weight_kg: savedProfile.weight_kg || '65',
        blood_group: savedProfile.blood_group || 'O+',
        food_allergies: savedProfile.food_allergies || 'None',
        food_preferences: savedProfile.food_preferences || 'No preference',
        medical_history: savedProfile.medical_history || 'None reported',
        enrolled_program: savedProfile.health_goals || 'Weight Management',
        profile_image: localStorage.getItem(`profilePic_${activeUserId}`) || null,
        ...savedProfile
      }];
    } catch(e) {
      return [{
        id: '1',
        first_name: localStorage.getItem('user_name') || 'Patient',
        last_name: '',
        enrolled_program: 'Weight Management',
        age: '24',
        height_cm: '165',
        weight_kg: '65',
        profile_image: null
      }];
    }
  });

  // --- INITIAL DATA LOAD EFFECT ---
  useEffect(() => {
    let cancelled = false;
    const loadPatients = async () => {
      try {
        const response = await fetch('/api/nutritionist/patients/');
        if (!response.ok) throw new Error('Unable to load patients');
        const data = await response.json();
        
        // Attach profile images from local storage
        const augmentedData = data.map(p => ({
            ...p,
            profile_image: localStorage.getItem(`profilePic_${p.id}`) || null
        }));

        if (!cancelled) setPatients(Array.isArray(augmentedData) ? augmentedData : []);
      } catch (error) {
        console.warn('Patient directory sync failed:', error);
      }
    };
    loadPatients();

    const syncLiveNutritionistData = async () => {
      try {
        const apptRes = await fetch('/api/admin-api/appointments/');
        if (apptRes.ok) {
          const apptData = await apptRes.json();
          const cleanAppts = (Array.isArray(apptData) ? apptData : []).filter(a => a.patient !== 1 && String(a.patient) !== '1');
          if (!cancelled) {
            setAppointments(cleanAppts);
            localStorage.setItem('healora_all_appointments', JSON.stringify(cleanAppts));
          }
        }
      } catch(e) {}

      // Load Chats live
      const allChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
      if (!cancelled) setChats(allChats);

      // Load Notifications live
      const notifs = JSON.parse(localStorage.getItem(`healora_notifications_${nutritionistId}`)) || [];
      if (!cancelled) setNotifications(notifs);
    };

    syncLiveNutritionistData();
    const syncInterval = setInterval(syncLiveNutritionistData, 1500);

    return () => { 
      cancelled = true; 
      clearInterval(syncInterval);
    };
  }, [nutritionistId]);

  // Scroll on chat update
  useEffect(() => {
    if(chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, activeChatContact, chats]);

  // Load Wellness Logs, Evaluations & Lab Reports on patient select
  useEffect(() => {
    if (selectedPatient) {
      // Load wellness logs submitted by this patient
      const globalLogs = JSON.parse(localStorage.getItem('healora_all_wellness_logs')) || [];
      const localLogs = JSON.parse(localStorage.getItem(`healora_wellness_${selectedPatient.id}`)) || [];
      
      const mergedLogsMap = new Map();
      localLogs.forEach(l => mergedLogsMap.set(l.id, l));
      globalLogs.filter(l => String(l.patientId) === String(selectedPatient.id)).forEach(l => mergedLogsMap.set(l.id, l));
      
      setWellnessLogs(Array.from(mergedLogsMap.values()).sort((a,b) => new Date(b.date) - new Date(a.date)));

      // Load Clinical Laboratory Reports & Diagnostic documents
      const allVault = JSON.parse(localStorage.getItem('healora_all_patient_reports')) || {};
      const patientLocalReports = JSON.parse(localStorage.getItem(`labReports_${selectedPatient.id}`)) || [];
      const reportsFromVault = allVault[selectedPatient.id] || [];

      const mergedReportsMap = new Map();
      patientLocalReports.forEach(r => mergedReportsMap.set(r.id || r.name, r));
      reportsFromVault.forEach(r => mergedReportsMap.set(r.id || r.name, r));
      
      setPatientReports(Array.from(mergedReportsMap.values()));

      // Load Weight History
      const hM = (parseFloat(selectedPatient.height_cm) || 165) / 100;
      const wKg = parseFloat(selectedPatient.weight_kg) || 65;
      const patientBMI = (wKg / (hM * hM)).toFixed(1);

      const storedWeightHistory = JSON.parse(localStorage.getItem(`healora_weight_history_${selectedPatient.id}`)) || [
        { id: 1, date: '2026-08-01', weight_kg: parseFloat(selectedPatient.weight_kg) ? (parseFloat(selectedPatient.weight_kg) + 2.4).toFixed(1) : '67.4', bmi: '24.7', notes: 'Initial Baseline Weigh-in' },
        { id: 2, date: '2026-08-15', weight_kg: parseFloat(selectedPatient.weight_kg) ? (parseFloat(selectedPatient.weight_kg) + 1.1).toFixed(1) : '66.1', bmi: '24.2', notes: 'Mid-Month Clinical Check-in' },
        { id: 3, date: new Date().toISOString().split('T')[0], weight_kg: String(selectedPatient.weight_kg || '65.0'), bmi: patientBMI, notes: 'Current Active Record' }
      ];
      setPatientWeightHistory(storedWeightHistory);

      // Set Evaluation text draft if they didn't send last time
      const allEvals = JSON.parse(localStorage.getItem('healora_evaluations')) || {};
      setEvaluations(allEvals);
      setWeeklyEvaluation(allEvals[selectedPatient.id] || '');
      setEvaluationRating(5);
    }
  }, [selectedPatient]);


  // --- NOTIFICATIONS HANDLER ---
  const markNotificationsRead = () => {
    const updated = notifications.map(n => ({...n, read: true}));
    setNotifications(updated);
    localStorage.setItem(`healora_notifications_${nutritionistId}`, JSON.stringify(updated));
  };
  const unreadCount = notifications.filter(n => !n.read).length;

  // --- CHAT HANDLER ---
  const handleSendChat = (e) => {
    e.preventDefault();
    if(!chatInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      patientId: activeChatContact === 'manager' ? 'manager' : String(activeChatContact),
      contactId: activeChatContact === 'manager' ? 'manager' : String(activeChatContact),
      chatPartner: activeChatContact === 'manager' ? 'manager' : 'nutritionist',
      patientName: activeChatContact !== 'manager' ? (patients.find(p => String(p.id) === String(activeChatContact))?.first_name || 'Patient') : 'Clinic Manager',
      senderRole: 'NUTRITIONIST',
      text: chatInput,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    const allChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
    allChats.push(newMsg);
    localStorage.setItem('healora_chats', JSON.stringify(allChats));
    setChats(prev => [...prev, newMsg]);
    setChatInput('');
  };


  const currentChats = useMemo(() => {
    return chats.filter(c => {
        if (activeChatContact === 'manager') return c.contactId === 'manager' || c.patientId === 'manager';
        return String(c.patientId) === String(activeChatContact) || String(c.contactId) === String(activeChatContact);
    });
  }, [chats, activeChatContact]);

  // --- NUTRITION ASSESSMENT STATE ---
  const [assessments, setAssessments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('healora_assessments')) || {}; } catch { return {}; }
  });

  const [currentAssessment, setCurrentAssessment] = useState({
    dietary_assessment: '',
    lifestyle_assessment: '',
    physical_activity_assessment: '',
    nutrition_diagnosis: ''
  });

  // --- CARE PLAN CREATOR STATE (MONTHLY STRUCTURED) ---
  const [carePlans, setCarePlans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('healora_care_plans')) || {}; } catch { return {}; }
  });

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const [monthlyPlanData, setMonthlyPlanData] = useState({
    nutrition_goal: 'Sustainable Fat Loss & Metabolic Optimization (Kerala Protocol)',
    target_calories: 1550,
    meal_frequency: 5,
    meal_timings: { ...DEFAULT_MEAL_TIMINGS },
    start_date: new Date().toISOString().split('T')[0],
    review_date: new Date(Date.now() + 14*86400000).toISOString().split('T')[0],
    status: 'Draft',
    phase1_status: 'ACTIVE',
    phase2_status: 'LOCKED_REQUIRES_CONSULTATION',
    activity_recommendation: '30 mins brisk walking daily + 15 min core strengthening.',
    lifestyle_recommendation: 'Hydrate 3L daily with Sambharam/Herbal infusions, sleep by 10:30 PM.',
    nutritionist_notes: 'Phase 1: Initial 2-week adaptation. Re-evaluate biomarkers at consultation before Phase 2 progression.',
    weeks: generatePersonalizedKeralaWeeks({}, [], 5)
  });

  useEffect(() => {
    localStorage.setItem('healora_assessments', JSON.stringify(assessments));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem('healora_care_plans', JSON.stringify(carePlans));
  }, [carePlans]);

  const handleMealFrequencyChange = (newFreq) => {
    if (!selectedPatient) return;
    const patientLabDocs = (selectedPatient?.medical_documents || []).concat(patientReports.filter(r => String(r.patient) === String(selectedPatient?.id)));
    const newWeeks = generatePersonalizedKeralaWeeks(selectedPatient, patientLabDocs, newFreq);
    setMonthlyPlanData(prev => ({
      ...prev,
      meal_frequency: newFreq,
      weeks: newWeeks
    }));
  };

  const handleMealTimingChange = (slotKey, newTime) => {
    setMonthlyPlanData(prev => ({
      ...prev,
      meal_timings: {
        ...(prev.meal_timings || DEFAULT_MEAL_TIMINGS),
        [slotKey]: newTime
      }
    }));
  };

  const handleOpenCase = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('case');
    
    if (assessments[patient.id]) {
      setCurrentAssessment(assessments[patient.id]);
    } else {
      setCurrentAssessment({ dietary_assessment: '', lifestyle_assessment: '', physical_activity_assessment: '', nutrition_diagnosis: '' });
    }

    const patientLabDocs = (patient.medical_documents || []).concat(patientReports.filter(r => String(r.patient) === String(patient.id)));

    if (carePlans[patient.id]) {
      const existing = carePlans[patient.id];
      const freq = existing.meal_frequency || 5;
      if (!existing.weeks) {
        existing.weeks = generatePersonalizedKeralaWeeks(patient, patientLabDocs, freq);
      }
      existing.meal_frequency = freq;
      setMonthlyPlanData(existing);
    } else {
      const programGoals = {
        'Weight Management': 'Sustainable Fat Loss & Caloric Deficit (Kerala Protocol)',
        'Weight Loss': 'Metabolic Reset & Caloric Deficit (Kerala Protocol)',
        'PCOS Care': 'Hormonal Balance & Anti-Inflammatory Kerala Protocol',
        'Diabetes Reversal': 'Glycemic Regulation & Low-GI Kerala Protocol',
        'Thyroid Health': 'Thyroid Optimization & Micronutrient Balance (Kerala Protocol)',
        'Cholesterol Management': 'Cardiovascular Lipid Balancing Kerala Protocol',
        'Muscle Building': 'Hypertrophy & High-Protein Kerala Protocol'
      };

      const defaultFreq = 5;
      const personalizedWeeks = generatePersonalizedKeralaWeeks(patient, patientLabDocs, defaultFreq);

      // Calibrate Target Calories
      const hM = (parseFloat(patient.height_cm) || 165) / 100;
      const wKg = parseFloat(patient.weight_kg) || 68;
      const age = parseFloat(patient.age) || 28;
      const bmr = Math.round((10 * wKg) + (6.25 * (hM * 100)) - (5 * age) - (patient.gender === 'Male' ? -5 : 161));
      let targetCals = bmr || 1550;
      const prog = (patient.enrolled_program || patient.health_goals || '').toLowerCase();
      if (prog.includes('weight') || prog.includes('loss')) targetCals = Math.max(1350, bmr - 300);
      else if (prog.includes('muscle') || prog.includes('gain')) targetCals = bmr + 400;
      else if (prog.includes('pcos')) targetCals = Math.max(1400, bmr - 150);
      else if (prog.includes('diabet')) targetCals = Math.max(1450, bmr - 200);

      setMonthlyPlanData({
        nutrition_goal: programGoals[patient.enrolled_program || patient.health_goals] || 'Personalized Kerala Metabolic Protocol',
        target_calories: targetCals,
        meal_frequency: defaultFreq,
        start_date: new Date().toISOString().split('T')[0],
        review_date: new Date(Date.now() + 14*86400000).toISOString().split('T')[0],
        status: 'Draft',
        phase1_status: 'ACTIVE',
        phase2_status: 'LOCKED_REQUIRES_CONSULTATION',
        activity_recommendation: '30 mins brisk walking daily + 15 min core strengthening.',
        lifestyle_recommendation: 'Hydrate 3L daily with Sambharam/Herbal infusions, sleep by 10:30 PM.',
        nutritionist_notes: 'Phase 1: Initial 2-week adaptation. Re-evaluate biomarkers at consultation before Phase 2 progression.',
        weeks: personalizedWeeks
      });
    }
  };

  // --- AUTO CALCULATIONS ---
  const calculatedBMI = useMemo(() => {
    if (!selectedPatient?.height_cm || !selectedPatient?.weight_kg) return '23.8';
    const hM = selectedPatient.height_cm / 100;
    return (selectedPatient.weight_kg / (hM * hM)).toFixed(1);
  }, [selectedPatient]);

  const calculatedBMR = useMemo(() => {
    if (!selectedPatient?.weight_kg || !selectedPatient?.height_cm || !selectedPatient?.age) return '1540';
    const w = parseFloat(selectedPatient.weight_kg);
    const h = parseFloat(selectedPatient.height_cm);
    const a = parseFloat(selectedPatient.age);
    return Math.round((10 * w) + (6.25 * h) - (5 * a) - 161);
  }, [selectedPatient]);

  const handleSaveAssessment = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const updated = { ...assessments, [selectedPatient.id]: { ...currentAssessment, bmi: calculatedBMI, bmr: calculatedBMR, updated_at: new Date().toLocaleDateString() } };
    setAssessments(updated);
    alert("✅ Nutrition Assessment & Clinical Diagnosis saved successfully!");
  };

  // 🌟 ENHANCED SAVE EVALUATION - SYNC WITH PATIENT DASHBOARD 🌟
  const handleSaveEvaluation = () => {
    if (!selectedPatient) return;
    
    if (!weeklyEvaluation.trim()) {
      alert("⚠️ Please provide written feedback before sending the evaluation.");
      return;
    }

    // 1. Structure the new evaluation perfectly for the Patient Dashboard
    const evalKey = `healora_evaluations_${selectedPatient.id}`;
    const existingPatientEvals = JSON.parse(localStorage.getItem(evalKey)) || [];

    const newEvaluation = {
      id: Date.now(),
      title: "New Weekly Evaluation",
      message: weeklyEvaluation,
      rating: evaluationRating,
      date: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Prepend to array so it appears at the top on the Patient Side
    const updatedPatientEvals = [newEvaluation, ...existingPatientEvals];
    localStorage.setItem(evalKey, JSON.stringify(updatedPatientEvals));

    // 2. Keep the simple string map for backward compatibility in the nutritionist view drafts
    const allEvals = { ...evaluations, [selectedPatient.id]: weeklyEvaluation };
    setEvaluations(allEvals);
    localStorage.setItem('healora_evaluations', JSON.stringify(allEvals));
    
    // 3. Notify Patient of the new evaluation
    const pNotifs = JSON.parse(localStorage.getItem(`healora_notifications_${selectedPatient.id}`)) || [];
    pNotifs.unshift({
      id: Date.now(), title: "New Weekly Evaluation",
      message: `${nutritionistName} has reviewed your wellness logs and left an evaluation.`,
      date: new Date().toLocaleString(), read: false
    });
    localStorage.setItem(`healora_notifications_${selectedPatient.id}`, JSON.stringify(pNotifs));
    
    alert("✅ Weekly Evaluation saved and sent to Patient Portal successfully!");
    
    // Clear the form after sending 
    setWeeklyEvaluation('');
    setEvaluationRating(5);
  };

  const handleSaveDraft = () => {
    if (!selectedPatient) return;
    const updated = { ...carePlans, [selectedPatient.id]: { ...monthlyPlanData, status: 'Draft' } };
    setCarePlans(updated);
    alert("💾 Monthly Care Plan saved as draft.");
  };

  const handlePublishPlan = async () => {
    if (!selectedPatient) return;

    const fullPlan = {
      ...monthlyPlanData,
      status: 'Published',
      published_at: new Date().toISOString(),
      duration_weeks: 4,
      nutritionist_name: nutritionistName,
    };

    const payload = {
      patient: selectedPatient.id,
      nutritionist: nutritionistId,
      breakfast: fullPlan.weeks?.[1]?.Sunday?.breakfast || '',
      lunch: fullPlan.weeks?.[1]?.Sunday?.lunch || '',
      dinner: fullPlan.weeks?.[1]?.Sunday?.dinner || '',
      instructions: JSON.stringify(fullPlan),
      plan_data: fullPlan,
    };

    try {
      const response = await fetch(`/api/nutritionist/patient/${selectedPatient.id}/publish-diet/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.detail || result.message || 'The server rejected this care plan.');
      }

      const serverPlan = result.plan_data ? { ...fullPlan, ...result.plan_data } : fullPlan;
      const publishedData = {
        ...serverPlan,
        patient: String(selectedPatient.id),
        nutritionist: nutritionistId,
        status: 'Published',
        published_at: result.published_at || serverPlan.published_at,
        id: result.id,
      };

      const updated = { ...carePlans, [selectedPatient.id]: publishedData };
      setCarePlans(updated);
      localStorage.setItem('healora_care_plans', JSON.stringify(updated));
      localStorage.setItem(`healora_patient_dietplan_${selectedPatient.id}`, JSON.stringify(publishedData));
      localStorage.setItem(`healora_diet_plan_${selectedPatient.id}`, JSON.stringify(publishedData));

      const notifKey = `healora_notifications_${selectedPatient.id}`;
      const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
      notifs.unshift({
        id: Date.now(),
        title: 'New 4-Week Monthly Care Plan Published!',
        message: `${nutritionistName} has published your custom monthly clinical meal schedule.`,
        date: new Date().toLocaleString(),
        read: false,
      });
      localStorage.setItem(notifKey, JSON.stringify(notifs));

      alert(`🚀 4-Week Monthly Care Plan published successfully for ${selectedPatient.first_name || 'the selected patient'}!`);
    } catch (err) {
      console.error('Publish failed:', err);
      alert(`❌ Could not publish the care plan. ${err.message}`);
    }
  };

  const handleTogglePhase2Unlock = () => {
    if (!selectedPatient) return;
    const isCurrentlyLocked = (monthlyPlanData.phase2_status || 'LOCKED_REQUIRES_CONSULTATION') === 'LOCKED_REQUIRES_CONSULTATION';
    const newStatus = isCurrentlyLocked ? 'UNLOCKED' : 'LOCKED_REQUIRES_CONSULTATION';
    
    const updatedPlan = {
      ...monthlyPlanData,
      phase2_status: newStatus,
      phase2_unlocked_at: newStatus === 'UNLOCKED' ? new Date().toISOString() : null
    };

    setMonthlyPlanData(updatedPlan);
    const updatedCarePlans = { ...carePlans, [selectedPatient.id]: updatedPlan };
    setCarePlans(updatedCarePlans);
    localStorage.setItem('healora_care_plans', JSON.stringify(updatedCarePlans));
    localStorage.setItem(`healora_patient_dietplan_${selectedPatient.id}`, JSON.stringify(updatedPlan));
    localStorage.setItem(`healora_diet_plan_${selectedPatient.id}`, JSON.stringify(updatedPlan));

    if (newStatus === 'UNLOCKED') {
      const notifKey = `healora_notifications_${selectedPatient.id}`;
      const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
      notifs.unshift({
        id: Date.now(),
        title: '🎉 Phase 2 (Weeks 3 & 4) Unlocked!',
        message: `${nutritionistName} reviewed your progress consultation and unlocked your Phase 2 Personalized Kerala Meal Protocol.`,
        date: new Date().toLocaleString(),
        read: false
      });
      localStorage.setItem(notifKey, JSON.stringify(notifs));
      alert(`🎉 Phase 2 (Weeks 3 & 4) unlocked and released to ${selectedPatient.first_name || 'the patient'}!`);
    } else {
      alert(`🔒 Phase 2 (Weeks 3 & 4) is now set to require a progress consultation.`);
    }
  };

  const handleMealChange = (mealType, value) => {
    setMonthlyPlanData(prev => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [selectedWeek]: {
          ...prev.weeks?.[selectedWeek],
          [selectedDay]: {
            ...prev.weeks?.[selectedWeek]?.[selectedDay],
            [mealType]: value
          }
        }
      }
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    navigate('/', { replace: true });
  };

  const handleMessagePatient = (patient) => {
    setSelectedPatient(patient);
    setActiveChatContact(String(patient.id));
    setActiveTab('messages');
  };

  // --- 🌟 CLINICAL ADHERENCE SCORE & TRIAGE CALCULATION ENGINE 🌟 ---
  // Only evaluate adherence and struggling for patients who have been assigned/published a meal plan
  const patientAdherenceMap = useMemo(() => {
    const globalLogs = JSON.parse(localStorage.getItem('healora_all_wellness_logs')) || [];
    const allEvals = JSON.parse(localStorage.getItem('healora_all_evaluations')) || {};

    const map = {};

    patients.forEach(patient => {
      const pId = String(patient.id);
      
      // 1. Check if patient has an active/published meal plan
      const patientCarePlan = carePlans[pId] || 
        JSON.parse(localStorage.getItem(`healora_patient_dietplan_${pId}`)) || 
        JSON.parse(localStorage.getItem(`healora_diet_plan_${pId}`)) || null;

      const hasPublishedMealPlan = Boolean(
        patientCarePlan && (
          patientCarePlan.status === 'Published' || 
          (patientCarePlan.weeks && Object.keys(patientCarePlan.weeks).length > 0)
        )
      );

      const localLogs = JSON.parse(localStorage.getItem(`healora_wellness_${pId}`)) || [];
      const mergedMap = new Map();
      localLogs.forEach(l => mergedMap.set(l.id, l));
      globalLogs.filter(l => String(l.patientId) === pId).forEach(l => mergedMap.set(l.id, l));
      const logs = Array.from(mergedMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

      // CASE A: Patient has NO meal plan assigned yet -> NOT struggling, just awaiting plan!
      if (!hasPublishedMealPlan) {
        map[pId] = {
          score: null,
          hasMealPlan: false,
          status: 'PLAN_PENDING',
          label: 'Plan Pending',
          color: 'text-blue-800 bg-blue-50 border-blue-200',
          barColor: 'bg-blue-300',
          daysSinceLastLog: null,
          mealAdherencePct: 0,
          totalLogs: logs.length,
          offPlanCount: 0,
          needsAttention: false, // NOT marked struggling
          attentionReasons: []
        };
        return;
      }

      // CASE B: Patient HAS a meal plan -> evaluate adherence against their plan
      if (logs.length === 0) {
        map[pId] = {
          score: 0,
          hasMealPlan: true,
          status: 'STRUGGLING',
          label: 'Struggling (No Logs)',
          color: 'text-red-700 bg-red-50 border-red-200',
          barColor: 'bg-red-500',
          daysSinceLastLog: 999,
          mealAdherencePct: 0,
          totalLogs: 0,
          offPlanCount: 0,
          needsAttention: true,
          attentionReasons: ['Meal plan assigned but 0 daily logs submitted']
        };
        return;
      }

      // Calculate days since last log
      const lastLogDate = new Date(logs[0].date);
      const now = new Date();
      const diffHours = (now.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60);
      const daysSinceLastLog = Math.floor(diffHours / 24);

      // Calculate meal completion
      let totalPrescribed = 0;
      let totalCompleted = 0;
      let offPlanCount = 0;
      let waterGoalsMet = 0;

      const recentLogs = logs.slice(0, 14);
      recentLogs.forEach(log => {
        const completedMap = log.completed_slots || {
          breakfast: log.breakfast_completed,
          lunch: log.lunch_completed,
          dinner: log.dinner_completed
        };
        const slots = log.prescribed_slots || Object.keys(completedMap);
        slots.forEach(slotKey => {
          totalPrescribed++;
          if (completedMap[slotKey]) totalCompleted++;
        });

        if (log.ate_other_food) offPlanCount++;
        if ((log.water_glasses || 0) >= 6) waterGoalsMet++;
      });

      const mealAdherencePct = totalPrescribed > 0 ? Math.round((totalCompleted / totalPrescribed) * 100) : 0;
      const waterScore = Math.round((waterGoalsMet / recentLogs.length) * 100);
      const offPlanPenalty = Math.min(offPlanCount * 7, 25);
      const recencyPenalty = daysSinceLastLog >= 3 ? 30 : daysSinceLastLog >= 2 ? 15 : 0;

      let finalScore = Math.round((mealAdherencePct * 0.65) + (waterScore * 0.20) + (recentLogs.length >= 4 ? 15 : 5) - offPlanPenalty - recencyPenalty);
      finalScore = Math.max(5, Math.min(100, finalScore));

      const attentionReasons = [];
      if (daysSinceLastLog >= 2) attentionReasons.push(`Missed daily tracking (${daysSinceLastLog} days)`);
      if (finalScore < 60) attentionReasons.push(`Low meal adherence (${finalScore}%)`);
      if (offPlanCount >= 2) attentionReasons.push(`${offPlanCount} off-plan cheat meals logged`);
      
      const patientEval = allEvals[pId] || JSON.parse(localStorage.getItem(`healora_eval_${pId}`)) || null;
      if (!patientEval) {
        attentionReasons.push('Weekly evaluation pending');
      }

      let status = 'HIGH';
      let label = 'High';
      let color = 'text-emerald-800 bg-emerald-50 border-emerald-200';
      let barColor = 'bg-emerald-500';

      if (finalScore < 60) {
        status = 'STRUGGLING';
        label = 'Struggling';
        color = 'text-red-700 bg-red-50 border-red-200';
        barColor = 'bg-red-500';
      } else if (finalScore < 85) {
        status = 'MODERATE';
        label = 'Moderate';
        color = 'text-amber-800 bg-amber-50 border-amber-200';
        barColor = 'bg-amber-500';
      }

      map[pId] = {
        score: finalScore,
        hasMealPlan: true,
        status,
        label,
        color,
        barColor,
        daysSinceLastLog,
        mealAdherencePct,
        totalLogs: logs.length,
        offPlanCount,
        needsAttention: attentionReasons.length > 0 || finalScore < 60 || daysSinceLastLog >= 2,
        attentionReasons
      };
    });

    return map;
  }, [patients, wellnessLogs, carePlans]);

  // Patients who have a meal plan AND are struggling / needing attention
  const patientsNeedingAttention = useMemo(() => {
    return patients.filter(p => {
      const adh = patientAdherenceMap[String(p.id)];
      return adh && adh.hasMealPlan && adh.needsAttention;
    });
  }, [patients, patientAdherenceMap]);

  // Filtered patients for directory table
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(q) || 
        String(p.id).includes(q) || 
        (p.enrolled_program || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const adh = patientAdherenceMap[String(p.id)];
      if (adherenceFilter === 'ATTENTION') return adh?.hasMealPlan && adh?.needsAttention;
      if (adherenceFilter === 'HIGH') return adh?.hasMealPlan && adh?.status === 'HIGH';
      if (adherenceFilter === 'STRUGGLING') return adh?.hasMealPlan && adh?.status === 'STRUGGLING';
      if (adherenceFilter === 'PLAN_PENDING') return !adh?.hasMealPlan;
      return true;
    });
  }, [patients, searchQuery, adherenceFilter, patientAdherenceMap]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#FDFCF8] font-sans text-[#1C2C22]">
      
      {/* 🌟 OVERLAYS 🌟 */}
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

      {/* 🌟 NUTRITIONIST SIDEBAR 🌟 */}
      <aside className="w-64 bg-white border-r border-[#EBE9E0] flex flex-col shadow-sm z-10 flex-shrink-0 h-full">
        <div className="p-6 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-[#456A50] text-white rounded-xl p-2 shadow-sm"><HeartPulse size={24} /></div>
          <span className="text-2xl font-black tracking-tight text-[#1C2C22]">Heal<span className="text-[#456A50]">ora</span></span>
        </div>
        
        <nav className="flex-1 px-4 mt-4 space-y-2 font-medium overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-3 mt-2">Nutritionist Console</p>
          <button onClick={() => { setActiveTab('directory'); setSelectedPatient(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm cursor-pointer ${activeTab==='directory' && !selectedPatient ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <Users size={18} /> Assigned Patients
          </button>
          <button onClick={() => { setActiveTab('consultations'); setSelectedPatient(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm cursor-pointer ${activeTab==='consultations' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <Video size={18} /> Online Consultations
          </button>
          {selectedPatient && (
            <button onClick={() => setActiveTab('case')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm cursor-pointer ${activeTab==='case' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
              <FileText size={18} /> Patient Case File
            </button>
          )}
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm cursor-pointer ${activeTab==='messages' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <MessageSquare size={18} /> Messages & Chat
          </button>
        </nav>

        {/* NUTRITIONIST PROFILE FOOTER */}
        <div className="p-6 border-t border-[#EBE9E0] bg-[#FDFCF8]/50">
          <div className="flex items-center gap-3 mb-5 px-1">
            <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0 bg-[#EAF0EC] text-[#456A50] font-black flex items-center justify-center text-sm">
              {nutritionistName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-[#1C2C22] truncate">{nutritionistName}</p>
              <p className="text-[10px] font-bold text-[#456A50] uppercase tracking-widest truncate">Clinical Dietitian</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition text-sm border border-red-100 shadow-sm cursor-pointer">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* HEADER BAR */}
          <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-6">
            <div>
              <span className="text-[10px] font-extrabold text-[#456A50] tracking-widest uppercase bg-[#EAF0EC] px-3 py-1 rounded-full">Clinical Care Workspace • Live Backend Synced</span>
              <h1 className="text-4xl font-black tracking-tight text-[#1C2C22] mt-2">
                {activeTab === 'directory' 
                  ? 'Assigned Patient Directory' 
                  : activeTab === 'consultations'
                  ? 'Online Consultations & Telehealth'
                  : activeTab === 'messages' 
                  ? 'Clinic & Patient Messaging' 
                  : `Patient Case: ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
              </h1>
              <p className="text-[#5A6B60] mt-1 text-sm">
                {activeTab === 'directory' 
                  ? 'Search records, view biometrics, and build monthly care plans.' 
                  : activeTab === 'consultations'
                  ? 'Directly join scheduled Google Meet sessions and review patient appointments.'
                  : activeTab === 'messages' 
                  ? 'Secure communication with patients and management.' 
                  : `Patient ID: #${selectedPatient?.id} | Enrolled Program: ${selectedPatient?.enrolled_program || selectedPatient?.health_goals || 'Weight Management'}`}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
                {/* 🌟 NOTIFICATIONS BUTTON 🌟 */}
                <div className="relative cursor-pointer group" onClick={() => {setShowNotifications(true); markNotificationsRead();}}>
                  <div className="bg-white border border-[#EBE9E0] p-3.5 rounded-full shadow-sm group-hover:bg-gray-50 transition"><Bell size={22} className="text-[#1C2C22]" /></div>
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FDFCF8] shadow-sm">{unreadCount}</span>}
                </div>
                
                {activeTab === 'case' && selectedPatient && (
                  <button onClick={() => { setSelectedPatient(null); setActiveTab('directory'); }} className="bg-white border border-[#EBE9E0] text-[#5A6B60] hover:text-[#1C2C22] px-5 py-3 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer">
                    ← Back to Directory
                  </button>
                )}
            </div>
          </div>


          {/* 1. ASSIGNED PATIENT DIRECTORY + CLINICAL TRIAGE & ADHERENCE */}
          {activeTab === 'directory' && (
            <div className="space-y-6 animate-in fade-in">

              {/* 🚨 CLINICAL TRIAGE: PATIENTS NEEDING ATTENTION WIDGET 🚨 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#EBE9E0] space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EBE9E0] pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-2xl ${patientsNeedingAttention.length > 0 ? 'bg-amber-100 text-amber-900 shadow-2xs' : 'bg-emerald-100 text-emerald-900'}`}>
                      <AlertTriangle size={22} className={patientsNeedingAttention.length > 0 ? 'text-amber-700 animate-bounce' : 'text-emerald-700'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-[#1C2C22]">Patients Needing Attention</h2>
                        {patientsNeedingAttention.length > 0 ? (
                          <span className="bg-red-50 text-red-700 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-red-200 shadow-2xs">
                            {patientsNeedingAttention.length} Patient{patientsNeedingAttention.length > 1 ? 's' : ''} Flagged
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                            All On Track
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5A6B60] mt-0.5">
                        Automated clinical triage identifying missed daily tracking, low adherence (&lt;60%), or pending weekly evaluations.
                      </p>
                    </div>
                  </div>

                  {patientsNeedingAttention.length > 0 && (
                    <button
                      onClick={() => setAdherenceFilter('ATTENTION')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${adherenceFilter === 'ATTENTION' ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'}`}
                    >
                      Filter Table to Flagged ({patientsNeedingAttention.length})
                    </button>
                  )}
                </div>

                {patientsNeedingAttention.length === 0 ? (
                  <div className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-6 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-sm font-black text-[#1C2C22]">All Patients Are Actively Adhering!</p>
                    <p className="text-xs text-[#5A6B60] max-w-md mx-auto">
                      All assigned patients are consistently logging their meals, meeting prescribed targets, and up-to-date on weekly evaluations.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patientsNeedingAttention.map(patient => {
                      const adh = patientAdherenceMap[String(patient.id)] || {};
                      return (
                        <div key={patient.id} className="bg-[#FDFCF8] border border-[#EBE9E0] hover:border-amber-400 p-5 rounded-2xl shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#5A6B60] overflow-hidden border border-gray-200 shadow-2xs">
                                  {patient.profile_image ? (
                                    <img src={patient.profile_image} className="w-full h-full object-cover" alt="Profile" />
                                  ) : (
                                    <UserCircle size={22} />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-black text-sm text-[#1C2C22]">{patient.first_name} {patient.last_name || ''}</h3>
                                  <span className="text-[10px] text-[#456A50] font-bold block">{patient.enrolled_program || 'Weight Management'}</span>
                                </div>
                              </div>

                              {/* Score Badge */}
                              <div className="text-right">
                                <span className={`text-xs font-black px-2.5 py-1 rounded-xl border inline-block ${adh.color}`}>
                                  {adh.score}%
                                </span>
                                <span className="block text-[9px] font-extrabold text-[#5A6B60] uppercase tracking-wider mt-0.5">
                                  {adh.label}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-3">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${adh.barColor}`} 
                                style={{ width: `${Math.min(100, Math.max(5, adh.score))}%` }}
                              />
                            </div>

                            {/* Attention Trigger Pills */}
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Clinical Flags:</p>
                              <div className="flex flex-wrap gap-1">
                                {adh.attentionReasons?.map((reason, idx) => (
                                  <span key={idx} className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertCircle size={10} className="text-amber-700 shrink-0" /> {reason}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-2 pt-3 border-t border-[#EBE9E0]">
                            <button 
                              onClick={() => handleOpenCase(patient)}
                              className="flex-1 bg-[#1C2C22] hover:bg-[#456A50] text-white py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              Open Case <ArrowRight size={12} />
                            </button>
                            <button 
                              onClick={() => handleMessagePatient(patient)}
                              className="bg-white hover:bg-emerald-50 text-[#456A50] border border-[#456A50]/20 p-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                              title="Send direct message"
                            >
                              <MessageSquare size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DIRECTORY SEARCH & CATEGORY FILTERS */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9E0] space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#1C2C22]">Patient Directory & Adherence</h2>
                    <p className="text-xs text-[#5A6B60] mt-0.5">Live adherence tracking computed from daily meals, hydration, and protocol compliance.</p>
                  </div>

                  <div className="relative w-full md:w-80 shrink-0">
                    <Search className="absolute left-3.5 top-3 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      placeholder="Search patient, ID, or program..." 
                      className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#456A50] focus:ring-1 focus:ring-[#456A50]/20 transition shadow-inner"
                    />
                  </div>
                </div>

                {/* Category Filter Pills in dedicated responsive row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                  <span className="text-[10px] font-black text-[#5A6B60] uppercase tracking-widest mr-1">Filter By:</span>
                  <button 
                    onClick={() => setAdherenceFilter('ALL')} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${adherenceFilter === 'ALL' ? 'bg-[#1C2C22] text-white shadow-xs' : 'bg-[#FDFCF8] border border-[#EBE9E0] text-[#5A6B60] hover:text-[#1C2C22] hover:bg-gray-100'}`}
                  >
                    All ({patients.length})
                  </button>
                  <button 
                    onClick={() => setAdherenceFilter('ATTENTION')} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${adherenceFilter === 'ATTENTION' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50/70 border border-amber-200 text-amber-800 hover:bg-amber-100'}`}
                  >
                    <span>⚠️</span> Needing Attention ({patientsNeedingAttention.length})
                  </button>
                  <button 
                    onClick={() => setAdherenceFilter('HIGH')} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${adherenceFilter === 'HIGH' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-50/70 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'}`}
                  >
                    <span>🟢</span> High Adherence ({patients.filter(p => patientAdherenceMap[String(p.id)]?.hasMealPlan && patientAdherenceMap[String(p.id)]?.status === 'HIGH').length})
                  </button>
                  <button 
                    onClick={() => setAdherenceFilter('STRUGGLING')} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${adherenceFilter === 'STRUGGLING' ? 'bg-red-700 text-white shadow-xs' : 'bg-red-50/70 border border-red-200 text-red-800 hover:bg-red-100'}`}
                  >
                    <span>🔴</span> Struggling ({patients.filter(p => patientAdherenceMap[String(p.id)]?.hasMealPlan && patientAdherenceMap[String(p.id)]?.status === 'STRUGGLING').length})
                  </button>
                  <button 
                    onClick={() => setAdherenceFilter('PLAN_PENDING')} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${adherenceFilter === 'PLAN_PENDING' ? 'bg-blue-700 text-white shadow-xs' : 'bg-blue-50/70 border border-blue-200 text-blue-800 hover:bg-blue-100'}`}
                  >
                    <span>📋</span> Plan Pending ({patients.filter(p => !patientAdherenceMap[String(p.id)]?.hasMealPlan).length})
                  </button>
                </div>
              </div>

              {/* DIRECTORY TABLE WITH PATIENT ADHERENCE SCORE */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] overflow-hidden">
                <table className="w-full text-left text-sm text-[#1C2C22]">
                  <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b">
                    <tr>
                      <th className="py-4 px-6">Patient ID</th>
                      <th className="py-4 px-6">Patient Name</th>
                      <th className="py-4 px-6">Enrolled Program</th>
                      <th className="py-4 px-6">Patient Adherence Score</th>
                      <th className="py-4 px-6">Biometrics</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE9E0]">
                    {filteredPatients.map(patient => {
                      const adh = patientAdherenceMap[String(patient.id)] || {
                        score: null,
                        hasMealPlan: false,
                        label: 'Plan Pending',
                        color: 'text-blue-800 bg-blue-50 border-blue-200',
                        barColor: 'bg-blue-300',
                        mealAdherencePct: 0,
                        totalLogs: 0
                      };

                      return (
                      <tr key={patient.id} className="hover:bg-[#FDFCF8] transition group">
                        <td className="py-5 px-6 font-bold text-[#456A50]">#{patient.id}</td>
                        <td className="py-5 px-6 font-black text-[#1C2C22] flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#5A6B60] font-bold overflow-hidden shadow-sm border border-[#EBE9E0]">
                            {patient.profile_image ? <img src={patient.profile_image} className="w-full h-full object-cover" alt="Profile" /> : <UserCircle size={20}/>}
                          </div>
                          <div>
                            <span>{patient.first_name || 'Patient'} {patient.last_name || ''}</span>
                            {adh.hasMealPlan && adh.needsAttention && (
                              <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                ⚠️ Needs Follow-up
                              </span>
                            )}
                            {!adh.hasMealPlan && (
                              <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md">
                                New • Plan Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="bg-[#EAF0EC] text-[#456A50] px-3 py-1 rounded-lg text-xs font-bold border border-[#456A50]/20">
                            {patient.enrolled_program || patient.health_goals || 'Weight Management'}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          {adh.hasMealPlan ? (
                            <div className="space-y-1.5 w-40">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-black text-[#1C2C22]">{adh.score}%</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${adh.color}`}>
                                  {adh.label}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${adh.barColor}`} 
                                  style={{ width: `${Math.min(100, Math.max(5, adh.score))}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-[#5A6B60] block font-medium">
                                {adh.totalLogs} Log{adh.totalLogs === 1 ? '' : 's'} • {adh.mealAdherencePct}% Meals Logged
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1 w-40">
                              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-800 border-blue-200 inline-flex items-center gap-1">
                                <FileText size={11} /> Plan Pending
                              </span>
                              <span className="text-[10px] text-[#5A6B60] block font-medium">
                                Meal protocol not yet assigned
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-5 px-6 text-[#5A6B60]">
                          {patient.age ? `${patient.age} yrs` : 'Age N/A'} • {patient.weight_kg ? `${patient.weight_kg} kg` : 'Weight N/A'}
                        </td>
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleMessagePatient(patient)}
                              className="bg-white hover:bg-emerald-50 text-[#456A50] border border-[#456A50]/20 p-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                              title="Message Patient"
                            >
                              <MessageSquare size={14} />
                            </button>
                            <button 
                              onClick={() => handleOpenCase(patient)}
                              className="bg-[#456A50] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#35533E] transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              Open Case <ArrowRight size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-gray-400 italic">No assigned patients match your search or filter criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 🌟 2. ONLINE CONSULTATIONS & TELEHEALTH SCHEDULE 🌟 */}
          {activeTab === 'consultations' && (
            <div className="space-y-6 animate-in fade-in">
              {/* METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <Video size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Total Telehealth</p>
                    <h3 className="text-2xl font-black text-[#1C2C22] mt-0.5">
                      {appointments.filter(a => a.mode === 'ONLINE').length} Sessions
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-blue-100 text-blue-700 rounded-2xl">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Today's Schedule</p>
                    <h3 className="text-2xl font-black text-[#1C2C22] mt-0.5">
                      {(() => {
                        const now = new Date();
                        const y = now.getFullYear();
                        const m = String(now.getMonth() + 1).padStart(2, '0');
                        const d = String(now.getDate()).padStart(2, '0');
                        const localToday = `${y}-${m}-${d}`;
                        const isoToday = now.toISOString().split('T')[0];
                        return appointments.filter(a => a.date === localToday || a.date === isoToday).length;
                      })()} Bookings
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-purple-100 text-purple-700 rounded-2xl">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Assigned Patients</p>
                    <h3 className="text-2xl font-black text-[#1C2C22] mt-0.5">{patients.length} Active</h3>
                  </div>
                </div>
              </div>

              {/* CONSULTATIONS TABLE */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] overflow-hidden">
                <div className="p-6 border-b border-[#EBE9E0] bg-[#FDFCF8] flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-[#1C2C22]">My Consultation Bookings & Google Meet Rooms</h2>
                    <p className="text-xs text-[#5A6B60] mt-0.5">Directly join video consultations scheduled by the clinic desk.</p>
                  </div>
                </div>

                <table className="w-full text-left text-sm text-[#1C2C22]">
                  <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b">
                    <tr>
                      <th className="py-4 px-6">Date & Time</th>
                      <th className="py-4 px-6">Patient</th>
                      <th className="py-4 px-6">Mode</th>
                      <th className="py-4 px-6">Telehealth Video</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE9E0]">
                    {appointments.filter(a => a.patient !== 1 && String(a.patient) !== '1' && patients.some(p => String(p.id) === String(a.patient))).map(a => {
                      const patientObj = patients.find(p => String(p.id) === String(a.patient));
                      const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : `Patient`;
                      const pPhone = patientObj?.phone_number || patientObj?.phone;
                      const isToday = (() => {
                        const now = new Date();
                        const y = now.getFullYear();
                        const m = String(now.getMonth() + 1).padStart(2, '0');
                        const d = String(now.getDate()).padStart(2, '0');
                        const localToday = `${y}-${m}-${d}`;
                        const isoToday = now.toISOString().split('T')[0];
                        return a.date === localToday || a.date === isoToday;
                      })();

                      return (
                        <tr key={a.id} className={`hover:bg-[#FDFCF8] transition group ${isToday ? 'bg-amber-50/20' : ''}`}>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1C2C22]">{a.date}</span>
                              <span className="text-xs font-semibold text-[#456A50]">at {a.time}</span>
                              {isToday && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 overflow-hidden shadow-2xs">
                                {patientObj?.profile_image ? (
                                  <img src={patientObj.profile_image} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                  <UserCircle size={18} />
                                )}
                              </div>
                              <div>
                                <span className="font-black text-[#1C2C22] block">{pName}</span>
                                {pPhone && <span className="text-[11px] text-gray-500 font-medium">📞 {pPhone}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {a.mode === 'ONLINE' ? 'Online Telehealth' : 'In-Clinic'}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            {a.mode === 'ONLINE' ? (
                              (() => {
                                const todayIso = new Date().toISOString().split('T')[0];
                                const isPast = a.date && a.date < todayIso;
                                if (isPast || a.status === 'COMPLETED' || a.status === 'CANCELLED') {
                                  return (
                                    <span className="text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg inline-flex items-center gap-1.5">
                                      📅 Session Completed
                                    </span>
                                  );
                                }
                                return a.meet_link ? (
                                  <a 
                                    href={a.meet_link} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition transform hover:scale-105"
                                  >
                                    <Video size={14} /> Join Google Meet <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg inline-flex items-center gap-1.5">
                                    <Clock size={12} /> Meet Link Pending Setup
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">In-Clinic Session</span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : a.status === 'RESCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            {patientObj && (
                              <button 
                                onClick={() => handleOpenCase(patientObj)} 
                                className="bg-white border border-[#EBE9E0] text-[#456A50] hover:bg-[#EAF0EC] px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <FileText size={13} /> Open Case
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {appointments.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-gray-400 italic">
                          No consultation appointments booked yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PATIENT CASE, ASSESSMENT, WELLNESS EVALUATION & CARE PLAN */}
          {activeTab === 'case' && selectedPatient && (

            <div className="space-y-8 animate-in fade-in">
              
              {/* 🌟 TELEHEALTH GOOGLE MEET CONSULTATION BANNER 🌟 */}
              {(() => {
                const patientAppt = appointments.find(a => String(a.patient) === String(selectedPatient.id) && a.status !== 'CANCELLED');
                if (!patientAppt) return null;
                return (
                  <div className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in ${patientAppt.meet_link ? 'bg-emerald-50/90 border-emerald-200' : 'bg-[#EAF0EC]/60 border-[#456A50]/20'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${patientAppt.meet_link ? 'bg-emerald-600 text-white' : 'bg-[#456A50] text-white'}`}>
                        <Video size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-[#1C2C22]">
                            {patientAppt.mode === 'ONLINE' ? 'Telehealth Video Consultation' : 'In-Clinic Consultation'}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#EBE9E0] text-gray-700 shadow-2xs">
                            📅 {patientAppt.date} at {patientAppt.time}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {patientAppt.meet_link 
                            ? 'Google Meet room is active and ready for your clinical consultation.' 
                            : 'Consultation session scheduled. Meet link will be provided by clinic desk prior to call.'}
                        </p>
                      </div>
                    </div>

                    {patientAppt.meet_link && (
                      <a 
                        href={patientAppt.meet_link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition transform hover:scale-105 shrink-0"
                      >
                        <Video size={16} /> Join Google Meet <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                );
              })()}

              {/* 🌟 CLINICAL ADHERENCE & COMPLIANCE INTELLIGENCE BANNER 🌟 */}
              {(() => {
                const adh = patientAdherenceMap[String(selectedPatient.id)] || {
                  score: 0,
                  status: 'NO_LOGS',
                  label: 'No Logs',
                  color: 'text-gray-500 bg-gray-50 border-gray-200',
                  barColor: 'bg-gray-300',
                  mealAdherencePct: 0,
                  totalLogs: 0,
                  offPlanCount: 0,
                  daysSinceLastLog: 0,
                  attentionReasons: []
                };

                return (
                  <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EBE9E0] pb-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-3.5 rounded-2xl ${adh.score >= 80 ? 'bg-emerald-100 text-emerald-800' : adh.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          <Award size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-[#1C2C22]">Patient Adherence & Behavioral Score</h3>
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-xl border ${adh.color}`}>
                              {adh.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#5A6B60] mt-0.5">
                            Real-time index calculated from daily prescribed meal slots logged, water goals, and plan fidelity.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-3xl font-black text-[#1C2C22]">{adh.score}%</span>
                          <span className="block text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-wider">Overall Score</span>
                        </div>
                        <button
                          onClick={() => handleMessagePatient(selectedPatient)}
                          className="bg-[#1C2C22] hover:bg-[#456A50] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <MessageSquare size={14} /> Direct Message
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0] space-y-1">
                        <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-wider flex items-center gap-1">
                          <Apple size={12} className="text-[#456A50]"/> Meal Slot Compliance
                        </p>
                        <p className="text-2xl font-black text-[#1C2C22]">{adh.mealAdherencePct}%</p>
                        <p className="text-[10px] text-gray-500">of prescribed meals marked eaten</p>
                      </div>

                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0] space-y-1">
                        <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-wider flex items-center gap-1">
                          <Flame size={12} className="text-orange-500"/> Total Logs Tracked
                        </p>
                        <p className="text-2xl font-black text-[#1C2C22]">{adh.totalLogs}</p>
                        <p className="text-[10px] text-gray-500">{adh.daysSinceLastLog === 0 ? 'Logged today' : adh.daysSinceLastLog === 999 ? 'No logs yet' : `${adh.daysSinceLastLog} days since last log`}</p>
                      </div>

                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0] space-y-1">
                        <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle size={12} className="text-amber-600"/> Off-Plan Cheat Food
                        </p>
                        <p className={`text-2xl font-black ${adh.offPlanCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {adh.offPlanCount}
                        </p>
                        <p className="text-[10px] text-gray-500">{adh.offPlanCount === 0 ? '100% strict plan adherence' : `${adh.offPlanCount} cheat entries recorded`}</p>
                      </div>

                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0] space-y-1">
                        <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-wider flex items-center gap-1">
                          <Target size={12} className="text-purple-600"/> Clinical Triage
                        </p>
                        <p className="text-sm font-black text-[#1C2C22] pt-1">
                          {adh.needsAttention ? '⚠️ Needs Intervention' : '🟢 Adhering Well'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {adh.attentionReasons?.length > 0 ? adh.attentionReasons[0] : 'Protocol on schedule'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* HEALTH INFORMATION & AUTOMATED CALCULATIONS */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                    <Activity size={20} className="text-[#456A50]"/> Patient Biometrics & Health Records
                  </h3>

                  <span className="bg-[#EAF0EC] text-[#456A50] px-4 py-1.5 rounded-full text-xs font-bold border border-[#456A50]/30">
                    Enrolled Program: {selectedPatient.enrolled_program || selectedPatient.health_goals || 'Weight Management'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0] text-center">
                    <p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1">Height</p>
                    <p className="text-xl font-black text-[#1C2C22]">{selectedPatient.height_cm || '165'} <span className="text-xs font-normal text-gray-500">cm</span></p>
                  </div>
                  <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0] text-center">
                    <p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1">Weight</p>
                    <p className="text-xl font-black text-[#1C2C22]">{selectedPatient.weight_kg || '65'} <span className="text-xs font-normal text-gray-500">kg</span></p>
                  </div>
                  <div className="bg-[#EAF0EC] border border-[#456A50]/20 p-4 rounded-2xl text-center">
                    <p className="text-[10px] uppercase font-bold text-[#456A50] tracking-widest mb-1">Calculated BMI</p>
                    <p className="text-xl font-black text-[#1C2C22]">{calculatedBMI}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center">
                    <p className="text-[10px] uppercase font-bold text-purple-600 tracking-widest mb-1">Calculated BMR</p>
                    <p className="text-xl font-black text-purple-700">{calculatedBMR} <span className="text-xs font-normal text-gray-500">kcal</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
                  <div className="bg-white p-4 rounded-xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-bold text-[#5A6B60] uppercase">Food Preferences</span>
                    <p className="font-bold text-sm mt-1 text-[#1C2C22]">{selectedPatient.food_preferences || 'No preference'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-bold text-[#5A6B60] uppercase">Food Allergies</span>
                    <p className="font-bold text-sm mt-1 text-red-500">{selectedPatient.food_allergies || 'None reported'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-bold text-[#5A6B60] uppercase">Medical History</span>
                    <p className="font-bold text-sm mt-1 text-[#1C2C22]">{selectedPatient.medical_history || 'None reported'}</p>
                  </div>
                </div>
              </div>

              {/* 🌟 PATIENT CLINICAL LABORATORY REPORTS & DIAGNOSTIC VAULT 🌟 */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 animate-in fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-[#EBE9E0] pb-4">
                  <div>
                    <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2.5">
                      <FileText size={22} className="text-[#456A50]"/> Clinical Laboratory Reports & Diagnostic Vault
                    </h3>
                    <p className="text-xs text-[#5A6B60] mt-1">Medical diagnostics and laboratory investigations uploaded by {selectedPatient.first_name}.</p>
                  </div>
                  <span className="bg-[#EAF0EC] text-[#456A50] text-xs font-bold px-3.5 py-1.5 rounded-full border border-[#456A50]/20 flex items-center gap-1.5 shadow-2xs">
                    <ShieldCheck size={14} /> Consent Verified
                  </span>
                </div>

                {patientReports.length === 0 ? (
                  <div className="bg-[#FDFCF8] border border-dashed border-[#EBE9E0] rounded-2xl p-8 text-center">
                    <FileText size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-500">No Clinical Laboratory Reports Uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">When {selectedPatient.first_name} uploads blood panels, hormonal assays, or lipid tests, they will appear here instantly.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patientReports.map((report) => {
                      const isReviewed = report.status === 'REVIEWED';
                      return (
                      <div key={report.id || report.name} className="p-4 bg-[#FDFCF8] border border-[#EBE9E0] hover:border-[#456A50]/40 rounded-2xl flex flex-col justify-between gap-3 shadow-2xs transition hover:shadow-xs group">
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-xl shrink-0 transition ${isReviewed ? 'bg-emerald-50 text-emerald-700' : 'bg-[#EAF0EC] text-[#456A50]'}`}>
                            <FileText size={20} />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="bg-white border border-[#456A50]/30 text-[#456A50] text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider block w-max max-w-full truncate">
                                {report.type || report.document_type || 'Clinical Report'}
                              </span>

                              {/* Document Status Flow Badge */}
                              {isReviewed ? (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                  <CheckCircle2 size={11} className="text-emerald-700" /> Reviewed
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                  <Clock size={11} className="text-amber-700" /> Available for Review
                                </span>
                              )}
                            </div>

                            <p className="font-bold text-xs text-[#1C2C22] truncate" title={report.name}>{report.name || 'Laboratory Document'}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-medium">
                              <span>📅 {report.date || (report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString() : 'Recent')}</span>
                              {report.size && <span>• {report.size}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Nutritionist Clinical Notes Display */}
                        {isReviewed && report.review_notes && (
                          <div className="bg-white border border-emerald-200/80 rounded-xl p-2.5 text-xs text-[#1C2C22] shadow-inner">
                            <p className="font-extrabold text-[#456A50] text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                              <ClipboardList size={12}/> Clinical Findings & Diet Adjustments:
                            </p>
                            <p className="text-gray-700 italic">"{report.review_notes}"</p>
                            {report.reviewed_at && (
                              <p className="text-[9px] text-gray-400 mt-1 text-right">Reviewed by {report.reviewed_by || 'Nutritionist'} on {report.reviewed_at}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EBE9E0] flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDocReview(report)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
                              isReviewed 
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200' 
                                : 'bg-[#1C2C22] text-white hover:bg-[#456A50]'
                            }`}
                          >
                            <CheckCircle size={13} /> {isReviewed ? 'Edit Review Note' : 'Review & Add Note'}
                          </button>

                          <div className="flex items-center gap-2 ml-auto">
                            <button 
                              onClick={() => {
                                setSelectedReportModal(report);
                                setModalViewMode(report.fileUrl ? 'original' : 'diagnostic');
                              }} 
                              className="bg-[#456A50] hover:bg-[#35533E] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                            >
                              <Eye size={13} /> View
                            </button>
                            {report.fileUrl && (
                              <a 
                                href={report.fileUrl} 
                                download={report.name} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-white hover:bg-gray-50 border border-[#EBE9E0] text-[#1C2C22] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                              >
                                <Download size={13} /> Download
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>


              {/* GRID: ASSESSMENT (Left) AND WELLNESS TRACKING (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* NUTRITION ASSESSMENT & DIAGNOSIS FORM */}
                <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 h-max">
                  <div className="border-b border-[#EBE9E0] pb-4 mb-6">

                    <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                      <Stethoscope size={20} className="text-[#456A50]"/> Nutrition Assessment & Diagnosis
                    </h3>
                    <p className="text-[11px] text-[#5A6B60] mt-1">Evaluate dietary habits, lifestyle, and establish clinical diagnosis.</p>
                  </div>

                  <form onSubmit={handleSaveAssessment} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Dietary Assessment</label>
                      <textarea required rows="2" value={currentAssessment.dietary_assessment} onChange={e=>setCurrentAssessment({...currentAssessment, dietary_assessment: e.target.value})} placeholder="Evaluate nutrient intake, meal frequency..." className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50] transition shadow-inner resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Lifestyle Assessment</label>
                        <textarea required rows="2" value={currentAssessment.lifestyle_assessment} onChange={e=>setCurrentAssessment({...currentAssessment, lifestyle_assessment: e.target.value})} placeholder="Assess stress, sleep..." className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50] transition shadow-inner resize-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Physical Activity</label>
                        <textarea required rows="2" value={currentAssessment.physical_activity_assessment} onChange={e=>setCurrentAssessment({...currentAssessment, physical_activity_assessment: e.target.value})} placeholder="Evaluate exercise routine..." className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50] transition shadow-inner resize-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#456A50] uppercase tracking-widest mb-1.5">Nutritionist's Clinical Diagnosis</label>
                      <input 
                        type="text" required
                        value={currentAssessment.nutrition_diagnosis}
                        onChange={e=>setCurrentAssessment({...currentAssessment, nutrition_diagnosis: e.target.value})}
                        placeholder="e.g., Caloric surplus leading to metabolic sluggishness with mild insulin resistance." 
                        className="w-full bg-[#EAF0EC]/30 border border-[#456A50]/30 rounded-xl p-3.5 text-xs font-semibold text-[#1C2C22] outline-none focus:border-[#456A50] shadow-sm"
                      />
                    </div>
                    <div className="flex justify-end pt-2 border-t border-[#EBE9E0]">
                      <button type="submit" className="bg-[#1C2C22] text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#456A50] transition shadow-md flex items-center gap-2">
                        <Save size={14} /> Save Assessment
                      </button>
                    </div>
                  </form>
                </div>

                {/* 🌟 WELLNESS LOGS & WEEKLY EVALUATION (NEW FEATURE) 🌟 */}
                <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] flex flex-col h-max overflow-hidden">
                  <div className="p-8 pb-4 border-b border-[#EBE9E0] bg-[#FDFCF8]">
                    <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-[#456A50]"/> Patient Wellness Logs
                    </h3>
                    <p className="text-[11px] text-[#5A6B60] mt-1">Review end-of-day reports submitted by {selectedPatient.first_name}.</p>
                  </div>
                  
                  {/* Logs list with Complete Multi-Meal Check-in Report */}
                  <div className="h-80 overflow-y-auto p-6 bg-[#FDFCF8]/50 custom-scrollbar space-y-4 border-b border-[#EBE9E0]">
                    {wellnessLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Activity size={32} className="mb-2 opacity-50"/>
                        <p className="text-xs italic font-medium">No wellness logs submitted by {selectedPatient.first_name} yet.</p>
                      </div>
                    ) : wellnessLogs.map(log => {
                      const slotLabels = {
                        pre_breakfast: '🌿 Pre-Breakfast',
                        breakfast: '🌅 Breakfast',
                        drink: '🥤 Drink / Smoothie',
                        lunch: '☀️ Lunch',
                        snack: '🍎 Snack',
                        dinner: '🌙 Dinner'
                      };

                      // Determine this selected patient's active prescribed slots
                      const allSlotKeys = ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'];
                      const currentDayPlan = (monthlyPlanData?.weeks?.[selectedWeek || 1]?.[selectedDay || 'Sunday']) || (monthlyPlanData?.weeks?.['1']?.['Sunday']) || {};
                      const planSlotKeys = Object.keys(currentDayPlan).filter(k => currentDayPlan[k] && allSlotKeys.includes(k));

                      const patientPrescribedSlots = log.prescribed_slots || (planSlotKeys.length > 0 ? planSlotKeys : (monthlyPlanData.meal_frequency === 3 ? ['breakfast', 'lunch', 'dinner'] : monthlyPlanData.meal_frequency === 4 ? ['breakfast', 'lunch', 'snack', 'dinner'] : monthlyPlanData.meal_frequency === 6 ? ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'] : ['breakfast', 'drink', 'lunch', 'snack', 'dinner']));

                      // Only include slots that are prescribed for this patient
                      const completedMap = {};
                      patientPrescribedSlots.forEach(slotKey => {
                        completedMap[slotKey] = log.completed_slots?.[slotKey] !== undefined
                          ? !!log.completed_slots[slotKey]
                          : (slotKey === 'breakfast' ? log.breakfast_completed : slotKey === 'lunch' ? log.lunch_completed : slotKey === 'dinner' ? log.dinner_completed : false);
                      });

                      const activeSlots = Object.keys(completedMap);
                      const doneCount = Object.values(completedMap).filter(Boolean).length;

                      return (
                        <div key={log.id} className="bg-white border border-[#EBE9E0] p-4 rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-start border-b border-gray-100 pb-2.5">
                            <div>
                              <p className="font-black text-[#1C2C22] text-xs">
                                📅 {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <span className="text-[10px] text-[#456A50] font-black">
                                {doneCount} of {activeSlots.length} Prescribed Meals Done
                              </span>
                            </div>
                            {log.ate_other_food ? (
                              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[8px] font-bold border border-red-100 uppercase tracking-widest">
                                Ate Off-Plan
                              </span>
                            ) : (
                              <span className="bg-[#EAF0EC] text-[#456A50] px-2 py-0.5 rounded text-[8px] font-bold border border-[#456A50]/20 uppercase tracking-widest">
                                Followed Protocol
                              </span>
                            )}
                          </div>

                          {/* Individual Meal Slots Breakdown */}
                          <div>
                            <p className="text-[9px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1.5">Scheduled Meals Status:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {Object.entries(completedMap).map(([slotKey, isDone]) => (
                                <div 
                                  key={slotKey} 
                                  className={`text-[9px] font-bold px-2 py-1 rounded-lg flex items-center justify-between border ${
                                    isDone 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                      : 'bg-gray-50 text-gray-400 border-gray-200'
                                  }`}
                                >
                                  <span className="truncate">{slotLabels[slotKey] || slotKey}</span>
                                  <span className="shrink-0 ml-1">{isDone ? '✓' : '✕'}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Clinical Vitals */}
                          <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] text-[#5A6B60] pt-2 border-t border-gray-100">
                            <p className="flex items-center gap-1.5"><Droplets size={12} className="text-blue-500"/><span className="text-blue-600 font-bold">{log.water_glasses || 0} glasses water</span></p>
                            <p className="flex items-center gap-1.5 truncate"><Footprints size={12} className="text-green-500 shrink-0"/><span className="truncate">{log.physical_activity || 'No activity'}</span></p>
                            <p className="flex items-center gap-1.5"><Moon size={12} className="text-purple-500"/><span className="text-purple-600 font-bold">{log.sleep_hours || 0} hrs sleep</span></p>
                            <p className="flex items-center gap-1.5 truncate"><Activity size={12} className="text-orange-500 shrink-0"/><span className="truncate">{log.mood || 'N/A'}</span></p>
                          </div>

                          {/* Supplements status */}
                          <div className="text-[10px] text-gray-600 flex items-center justify-between bg-[#FDFCF8] px-2.5 py-1 rounded-lg border border-[#EBE9E0]">
                            <span>💊 Supplements Taken:</span>
                            <span className={`font-bold ${log.supplements_taken ? 'text-green-700' : 'text-gray-400'}`}>
                              {log.supplements_taken ? '✓ Yes (Compliant)' : '✕ Not Logged'}
                            </span>
                          </div>

                          {log.ate_other_food && (
                            <p className="text-[10px] bg-red-50 p-2 rounded-lg text-red-800 border border-red-100 font-medium">
                              <span className="font-bold">⚠️ Off-Plan Details:</span> {log.other_food_details}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 🌟 ENHANCED WEEKLY EVALUATION FORM W/ STARS 🌟 */}
                  <div className="p-6 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest flex items-center gap-2">
                        Weekly Evaluation & Feedback
                        <span className="text-gray-400 lowercase font-medium tracking-normal">visible to patient</span>
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={16} 
                            onClick={() => setEvaluationRating(star)}
                            className={`cursor-pointer transition-colors ${star <= evaluationRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <textarea 
                      value={weeklyEvaluation} 
                      onChange={e=>setWeeklyEvaluation(e.target.value)} 
                      placeholder="Based on the logs above, provide encouragement, feedback, or adjustments..." 
                      className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50] transition shadow-inner resize-none" 
                      rows="3"
                    ></textarea>
                    
                    <button onClick={handleSaveEvaluation} className="w-full bg-[#EAF0EC] text-[#456A50] border border-[#456A50]/20 py-3 rounded-xl font-bold text-xs hover:bg-[#456A50] hover:text-white transition shadow-sm flex items-center justify-center gap-2">
                      <Sparkles size={14}/> Send Evaluation to Patient Portal
                    </button>
                  </div>
                </div>

              </div>

              {/* 🌟 5. PATIENT CLINICAL HISTORY & LONGITUDINAL TRACKING VAULT 🌟 */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-6 sm:p-8 space-y-6 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#EBE9E0] pb-5">
                  <div>
                    <h3 className="text-xl font-black text-[#1C2C22] flex items-center gap-2.5">
                      <Clock size={22} className="text-[#456A50]"/> 5. Patient Clinical History & Longitudinal Tracking
                    </h3>
                    <p className="text-xs text-[#5A6B60] mt-1">
                      Comprehensive clinical records, longitudinal weight trajectory, lifestyle metrics, and meal history for <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong>.
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
                        onClick={() => setHistorySubTab(tab.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          historySubTab === tab.id
                            ? 'bg-[#1C2C22] text-white shadow-sm'
                            : 'text-[#5A6B60] hover:text-[#1C2C22] hover:bg-gray-100/70'
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* --- 5.1 DAILY / WEEKLY RECORDS SUB-TAB --- */}
                {historySubTab === 'daily_weekly' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-black text-sm text-[#1C2C22]">Clinical Tracking Timeline</h4>
                        <p className="text-xs text-[#5A6B60]">Filter and inspect daily patient adherence reports and weekly summaries.</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-[#EBE9E0]">
                        {['ALL', '1', '2', '3', '4'].map(wk => (
                          <button
                            key={wk}
                            onClick={() => setHistoryWeekFilter(wk)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              historyWeekFilter === wk
                                ? 'bg-[#456A50] text-white shadow-2xs'
                                : 'text-gray-600 hover:text-black'
                            }`}
                          >
                            {wk === 'ALL' ? 'All Weeks' : `Week ${wk}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Total Logs Logged</span>
                        <span className="text-2xl font-black text-[#1C2C22]">{wellnessLogs.length}</span>
                        <span className="text-[10px] text-[#456A50] block mt-0.5 font-bold">Recorded Check-ins</span>
                      </div>
                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Meal Compliance Rate</span>
                        <span className="text-2xl font-black text-emerald-700">
                          {(() => {
                            if (wellnessLogs.length === 0) return '0%';
                            const totalDone = wellnessLogs.reduce((acc, log) => {
                              const done = Object.values(log.completed_slots || {}).filter(Boolean).length || 
                                ((log.breakfast_completed ? 1 : 0) + (log.lunch_completed ? 1 : 0) + (log.dinner_completed ? 1 : 0));
                              return acc + done;
                            }, 0);
                            const totalPrescribed = wellnessLogs.reduce((acc, log) => {
                              return acc + (log.prescribed_slots?.length || 3);
                            }, 0);
                            return totalPrescribed > 0 ? `${Math.round((totalDone / totalPrescribed) * 100)}%` : '100%';
                          })()}
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">prescribed meals eaten</span>
                      </div>
                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Average Daily Water</span>
                        <span className="text-2xl font-black text-blue-600">
                          {(() => {
                            if (wellnessLogs.length === 0) return '0';
                            const avg = (wellnessLogs.reduce((a, b) => a + (parseFloat(b.water_glasses) || 0), 0) / wellnessLogs.length).toFixed(1);
                            return `${avg} gls`;
                          })()}
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">~ 2.2L target / day</span>
                      </div>
                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Off-Plan Cheat Meals</span>
                        <span className="text-2xl font-black text-amber-700">
                          {wellnessLogs.filter(l => l.ate_other_food).length}
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">recorded deviations</span>
                      </div>
                    </div>

                    {/* Day-by-Day Detailed Log Cards */}
                    <div className="space-y-3">
                      {wellnessLogs.length === 0 ? (
                        <div className="bg-[#FDFCF8] border border-dashed border-[#EBE9E0] rounded-2xl p-10 text-center">
                          <Clock size={36} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-sm font-bold text-gray-600">No Daily Records Submitted Yet</p>
                          <p className="text-xs text-gray-400 mt-1">When {selectedPatient.first_name} logs their daily meals, water, sleep, and activity, longitudinal reports will be automatically compiled here.</p>
                        </div>
                      ) : (
                        wellnessLogs.map(log => {
                          const slotsMap = log.completed_slots || {
                            breakfast: log.breakfast_completed,
                            lunch: log.lunch_completed,
                            dinner: log.dinner_completed
                          };
                          const slotsDone = Object.values(slotsMap).filter(Boolean).length;
                          const slotsTotal = Object.keys(slotsMap).length || 3;
                          const logPct = Math.round((slotsDone / (slotsTotal || 1)) * 100);

                          return (
                            <div key={log.id} className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-4 sm:p-5 hover:border-[#456A50]/40 transition shadow-2xs space-y-3">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200/60 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EBE9E0] flex items-center justify-center font-black text-xs text-[#1C2C22] shadow-2xs">
                                    {new Date(log.date).getDate()}
                                  </div>
                                  <div>
                                    <h5 className="font-black text-xs text-[#1C2C22]">
                                      {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </h5>
                                    <span className="text-[10px] text-gray-500 font-medium">Logged Check-in • {slotsDone}/{slotsTotal} Prescribed Meals Logged</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                                    logPct >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                    logPct >= 50 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                    'bg-red-50 text-red-800 border-red-200'
                                  }`}>
                                    {logPct}% Compliance
                                  </span>
                                  {log.ate_other_food && (
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                                      ⚠️ Off-Plan
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Slot Checkboxes */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {Object.entries(slotsMap).map(([slot, done]) => (
                                  <div key={slot} className={`p-2 rounded-xl border text-[10px] font-bold flex items-center justify-between ${done ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-white text-gray-400 border-gray-200'}`}>
                                    <span className="capitalize">{slot.replace('_', ' ')}</span>
                                    <span>{done ? '✓' : '✕'}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Lifestyle & Vitals summary */}
                              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                                <span className="flex items-center gap-1.5"><Droplets size={13} className="text-blue-500"/> {log.water_glasses || 0} Glasses Water</span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5"><Moon size={13} className="text-purple-500"/> {log.sleep_hours || 0} Hours Sleep</span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5"><Footprints size={13} className="text-emerald-600"/> {log.physical_activity || 'No workout'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-amber-500"/> Mood: {log.mood || 'Normal'}</span>
                              </div>

                              {log.ate_other_food && log.other_food_details && (
                                <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 text-xs text-red-900 font-medium">
                                  <strong>⚠️ Deviation Note:</strong> {log.other_food_details}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* --- 5.2 WEIGHT HISTORY SUB-TAB --- */}
                {historySubTab === 'weight' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Baseline Weight</span>
                        <span className="text-2xl font-black text-[#1C2C22]">
                          {patientWeightHistory.length > 0 ? patientWeightHistory[patientWeightHistory.length - 1].weight_kg : selectedPatient.weight_kg || '65.0'} <span className="text-xs font-medium text-gray-500">kg</span>
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">Initial Consultation Record</span>
                      </div>

                      <div className="bg-[#EAF0EC] p-4 rounded-2xl border border-[#456A50]/20">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#456A50] block mb-1">Current Active Weight</span>
                        <span className="text-2xl font-black text-[#1C2C22]">
                          {patientWeightHistory.length > 0 ? patientWeightHistory[0].weight_kg : selectedPatient.weight_kg || '65.0'} <span className="text-xs font-medium text-gray-500">kg</span>
                        </span>
                        <span className="text-[10px] text-[#456A50] block mt-0.5 font-bold">Latest Verified Record</span>
                      </div>

                      <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Total Net Change (Δ)</span>
                        {(() => {
                          if (patientWeightHistory.length < 2) {
                            return <span className="text-2xl font-black text-gray-400">0.0 kg</span>;
                          }
                          const latest = parseFloat(patientWeightHistory[0].weight_kg) || 0;
                          const baseline = parseFloat(patientWeightHistory[patientWeightHistory.length - 1].weight_kg) || 0;
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
                        <span className="text-[10px] text-gray-500 block mt-0.5">Trajectory vs Baseline</span>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-1">Target Healthy Goal</span>
                        <span className="text-2xl font-black text-purple-900">
                          {(() => {
                            const hM = (parseFloat(selectedPatient.height_cm) || 165) / 100;
                            return (22.0 * hM * hM).toFixed(1);
                          })()} <span className="text-xs font-medium text-purple-700">kg</span>
                        </span>
                        <span className="text-[10px] text-purple-700 block mt-0.5 font-bold">BMI 22.0 Ideal Range</span>
                      </div>
                    </div>

                    {/* Weight Check-in Logging Form */}
                    <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#EBE9E0]">
                      <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Scale size={16} className="text-[#456A50]" /> Record New Verified Clinical Weigh-in
                      </h4>
                      <form onSubmit={handleAddWeightEntry} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Check-in Date</label>
                          <input 
                            type="date" 
                            required 
                            value={newWeightDate} 
                            onChange={e => setNewWeightDate(e.target.value)} 
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
                            value={newWeightInput} 
                            onChange={e => setNewWeightInput(e.target.value)} 
                            className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Clinical Observation Notes</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Post-fasting morning weigh-in" 
                            value={newWeightNotes} 
                            onChange={e => setNewWeightNotes(e.target.value)} 
                            className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]" 
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-[#1C2C22] hover:bg-[#456A50] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Save size={14} /> Save Weigh-in
                        </button>
                      </form>
                    </div>

                    {/* Weight Log Chronological Table */}
                    <div className="bg-white rounded-2xl border border-[#EBE9E0] overflow-hidden">
                      <table className="w-full text-left text-xs text-[#1C2C22]">
                        <thead className="bg-[#FDFCF8] text-[10px] uppercase font-black text-gray-500 tracking-wider border-b border-[#EBE9E0]">
                          <tr>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Weight</th>
                            <th className="py-3 px-4">Change vs Previous</th>
                            <th className="py-3 px-4">Calculated BMI</th>
                            <th className="py-3 px-4">Observation Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {patientWeightHistory.map((item, index) => {
                            const prevItem = patientWeightHistory[index + 1];
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
                                <td className="py-3 px-4 font-bold text-gray-700">{item.bmi || calculatedBMI}</td>
                                <td className="py-3 px-4 text-gray-600 font-medium">{item.notes || 'Routine check-in'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* --- 5.3 LIFESTYLE HISTORY SUB-TAB --- */}
                {historySubTab === 'lifestyle' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Sleep Tracking History */}
                      <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] space-y-4">
                        <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-3">
                          <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider flex items-center gap-2">
                            <Moon size={16} className="text-purple-600" /> Sleep Architecture & Duration History
                          </h4>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            Target: 7–8 hrs / night
                          </span>
                        </div>
                        
                        <div className="space-y-2.5">
                          {wellnessLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-xs text-[#1C2C22] block">{log.date}</span>
                                <span className="text-[10px] text-gray-500">{log.sleep_hours >= 7 ? '✓ Optimal restorative sleep' : '⚠️ Mild sleep deficit'}</span>
                              </div>
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
                        <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-3">
                          <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider flex items-center gap-2">
                            <Droplets size={16} className="text-blue-500" /> Daily Hydration History
                          </h4>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            Target: 8–10 glasses (2.5L)
                          </span>
                        </div>
                        
                        <div className="space-y-2.5">
                          {wellnessLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-xs text-[#1C2C22] block">{log.date}</span>
                                <span className="text-[10px] text-gray-500">{log.water_glasses >= 8 ? '✓ Hydration goal met' : '⚠️ Sub-optimal hydration'}</span>
                              </div>
                              <span className="font-black text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                                {log.water_glasses || 0} glasses ({((log.water_glasses || 0) * 0.25).toFixed(1)} L)
                              </span>
                            </div>
                          ))}
                          {wellnessLogs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-6">No water logs submitted yet.</p>}
                        </div>
                      </div>

                      {/* Physical Activity & Steps */}
                      <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] space-y-4">
                        <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-3">
                          <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider flex items-center gap-2">
                            <Footprints size={16} className="text-emerald-600" /> Physical Activity & Exercise History
                          </h4>
                        </div>
                        <div className="space-y-2.5">
                          {wellnessLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-xs text-[#1C2C22] block">{log.date}</span>
                                <span className="text-[10px] text-gray-500">{log.physical_activity || 'Routine physical activity'}</span>
                              </div>
                              <span className="font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                Logged
                              </span>
                            </div>
                          ))}
                          {wellnessLogs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-6">No exercise logs submitted yet.</p>}
                        </div>
                      </div>

                      {/* Vitality & Mood Trends */}
                      <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] space-y-4">
                        <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-3">
                          <h4 className="font-black text-xs text-[#1C2C22] uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" /> Vitality, Mood & Energy Trends
                          </h4>
                        </div>
                        <div className="space-y-2.5">
                          {wellnessLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-xs text-[#1C2C22] block">{log.date}</span>
                                <span className="text-[10px] text-gray-500">Supplements: {log.supplements_taken ? '✓ Taken' : '✕ Missed'}</span>
                              </div>
                              <span className="font-bold text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-lg">
                                {log.mood || 'Normal'}
                              </span>
                            </div>
                          ))}
                          {wellnessLogs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-6">No vitality logs submitted yet.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 5.4 FOOD HISTORY SUB-TAB --- */}
                {historySubTab === 'food' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] space-y-4">
                      <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-3">
                        <div>
                          <h4 className="font-black text-sm text-[#1C2C22]">Nutritional Log & Meal Intake Vault</h4>
                          <p className="text-xs text-[#5A6B60]">History of prescribed meals completed versus patient logged meals and off-plan entries.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {wellnessLogs.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 italic">
                            No meal logs submitted yet by {selectedPatient.first_name}.
                          </div>
                        ) : (
                          wellnessLogs.map(log => {
                            const slots = log.completed_slots || {
                              breakfast: log.breakfast_completed,
                              lunch: log.lunch_completed,
                              dinner: log.dinner_completed
                            };
                            return (
                              <div key={log.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                                  <span className="font-black text-xs text-[#1C2C22]">📅 {log.date}</span>
                                  {log.ate_other_food ? (
                                    <span className="text-[10px] font-black bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">
                                      ⚠️ Off-Plan Foods Recorded
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                      ✓ 100% Plan Compliance
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                  {Object.entries(slots).map(([slotKey, isEaten]) => (
                                    <div key={slotKey} className={`p-2.5 rounded-xl border flex items-center justify-between ${isEaten ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                      <span className="font-bold capitalize">{slotKey.replace('_', ' ')}</span>
                                      <span className="font-black">{isEaten ? '✓ Eaten' : '✕ Missed'}</span>
                                    </div>
                                  ))}
                                </div>

                                {log.ate_other_food && (
                                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-800">
                                    <strong>Off-Plan Details:</strong> {log.other_food_details || 'Patient logged additional snacks/cheat meal.'}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4-WEEK MONTHLY STRUCTURED CARE PLAN CREATOR */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 space-y-6">
                <div className="border-b border-[#EBE9E0] pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                      <Apple size={20} className="text-[#456A50]"/> 4-Week Monthly Structured Care Plan Builder
                    </h3>
                    <p className="text-[11px] text-[#5A6B60] mt-0.5">
                      Tailored specifically for program: <span className="font-bold text-[#456A50] uppercase">{selectedPatient.enrolled_program || selectedPatient.health_goals || 'Weight Management'}</span>. Pick from smart clinical recommendations or type custom entries.
                    </p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${monthlyPlanData.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    Status: {monthlyPlanData.status}
                  </span>
                </div>

                <div className="space-y-6">
                  
                  {/* Top Meta info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Nutrition Goal</label>
                      <input type="text" value={monthlyPlanData.nutrition_goal} onChange={e=>setMonthlyPlanData({...monthlyPlanData, nutrition_goal: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Start Date</label>
                      <input type="date" value={monthlyPlanData.start_date} onChange={e=>setMonthlyPlanData({...monthlyPlanData, start_date: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Review Date</label>
                      <input type="date" value={monthlyPlanData.review_date} onChange={e=>setMonthlyPlanData({...monthlyPlanData, review_date: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50]" />
                    </div>
                  </div>

                  {/* Week & Day Selector Tabs for Granular Customization */}
                  <div className="bg-[#FDFCF8] border border-[#EBE9E0] p-6 rounded-2xl space-y-4 shadow-inner">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#EBE9E0] pb-4 gap-3">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1C2C22] flex items-center gap-2">
                          <Layers size={16} className="text-[#456A50]"/> Select Clinical Protocol Week & Day
                        </h4>
                        <p className="text-[11px] text-[#5A6B60] mt-0.5 font-medium">
                          {selectedWeek <= 2 ? (
                            <span className="text-emerald-700 font-bold">● Phase 1: Initial Adaptation (Weeks 1 & 2) — Active</span>
                          ) : (
                            <span className={monthlyPlanData.phase2_status === 'UNLOCKED' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                              {monthlyPlanData.phase2_status === 'UNLOCKED' ? '● Phase 2: Progress Protocol — 🔓 Unlocked' : '● Phase 2: Requires Progress Consultation — 🔒 Gated'}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-[#EBE9E0] shadow-2xs">
                          {[1, 2, 3, 4].map(w => (
                            <button 
                              key={w} 
                              type="button" 
                              onClick={() => setSelectedWeek(w)} 
                              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest transition cursor-pointer ${selectedWeek === w ? 'bg-[#456A50] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              Wk {w} {w >= 3 && (monthlyPlanData.phase2_status === 'UNLOCKED' ? '🔓' : '🔒')}
                            </button>
                          ))}
                        </div>

                        {selectedWeek >= 3 && (
                          <button
                            type="button"
                            onClick={handleTogglePhase2Unlock}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${monthlyPlanData.phase2_status === 'UNLOCKED' ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                          >
                            {monthlyPlanData.phase2_status === 'UNLOCKED' ? <><Lock size={13}/> Relock Phase 2</> : <><Unlock size={13}/> 🔓 Unlock Phase 2 for Patient</>}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Day selector pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {daysOfWeek.map(d => (
                        <button key={d} type="button" onClick={() => setSelectedDay(d)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${selectedDay === d ? 'bg-[#1C2C22] text-white' : 'bg-white border border-[#EBE9E0] text-gray-600 hover:bg-gray-50'}`}>{d}</button>
                      ))}
                    </div>

                    {/* CLINICAL KERALA PERSONALIZATION CONTEXT BANNER */}
                    <div className="bg-[#EAF0EC]/80 border border-[#456A50]/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-[#456A50] font-black">
                        <Sparkles size={16} />
                        <span>Kerala Clinical Nutrition Matrix for {selectedPatient.first_name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-700">
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-[#EBE9E0] shadow-2xs">
                          🌴 Program: <strong>{selectedPatient.enrolled_program || selectedPatient.health_goals || 'Weight Loss'}</strong>
                        </span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-[#EBE9E0] shadow-2xs">
                          🥗 Diet: <strong>{selectedPatient.food_preferences || 'Standard'}</strong>
                        </span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-[#EBE9E0] shadow-2xs">
                          🚫 Allergies: <strong>{selectedPatient.food_allergies || 'None'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* CLINICAL MEAL FREQUENCY & TIMETABLE SELECTOR */}
                    <div className="bg-white p-4 rounded-2xl border border-[#EBE9E0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
                      <div>
                        <h5 className="text-xs font-black text-[#1C2C22] flex items-center gap-1.5">
                          <Apple size={15} className="text-[#456A50]" /> Prescribed Meal Frequency for {selectedPatient.first_name}
                        </h5>
                        <p className="text-[11px] text-[#5A6B60] mt-0.5">Customize daily meal slots based on clinical pathology, insulin spikes & lifestyle routine.</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 bg-[#FDFCF8] p-1.5 rounded-xl border border-[#EBE9E0]">
                        {[
                          { count: 3, label: '3 Meals', desc: 'B, L, D' },
                          { count: 4, label: '4 Meals', desc: 'B, L, Snack, D' },
                          { count: 5, label: '5 Meals (Standard)', desc: 'B, Drink, L, Snack, D' },
                          { count: 6, label: '6 Meals (Clinical)', desc: 'Pre-B, B, Drink, L, Snack, D' }
                        ].map(m => (
                          <button
                            key={m.count}
                            type="button"
                            onClick={() => handleMealFrequencyChange(m.count)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                              (monthlyPlanData.meal_frequency || 5) === m.count 
                                ? 'bg-[#456A50] text-white shadow-xs' 
                                : 'text-gray-700 hover:bg-gray-200/60'
                            }`}
                          >
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ⏰ PRESCRIBED MEAL INTAKE TIMINGS CONFIGURATION ⏰ */}
                    <div className="bg-[#FDFCF8] p-4.5 rounded-2xl border border-[#EBE9E0] space-y-3">
                      <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-2.5">
                        <h5 className="text-xs font-black text-[#1C2C22] flex items-center gap-2">
                          <Clock size={16} className="text-[#456A50]" /> Prescribed Intake Timings Protocol (Real-Time Patient Dashboard Alerts)
                        </h5>
                        <span className="text-[10px] text-[#456A50] font-bold bg-[#EAF0EC] px-2 py-0.5 rounded-md">
                          Live Synchronized
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5A6B60]">
                        Configure prescribed meal window timings. The patient's portal will automatically display real-time active meal recommendations at these hours.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
                        {[
                          { key: 'pre_breakfast', label: '🌿 Pre-Breakfast' },
                          { key: 'breakfast', label: '🌅 Breakfast' },
                          { key: 'drink', label: '🥤 Smoothie/Drink' },
                          { key: 'lunch', label: '☀️ Lunch' },
                          { key: 'snack', label: '🍎 Evening Snack' },
                          { key: 'dinner', label: '🌙 Dinner' }
                        ].map(slot => (
                          <div key={slot.key} className="bg-white p-2.5 rounded-xl border border-[#EBE9E0] space-y-1">
                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider truncate">
                              {slot.label}
                            </label>
                            <input 
                              type="text" 
                              value={monthlyPlanData.meal_timings?.[slot.key] || DEFAULT_MEAL_TIMINGS[slot.key]} 
                              onChange={e => handleMealTimingChange(slot.key, e.target.value)}
                              placeholder="e.g. 08:30 AM"
                              className="w-full bg-[#FDFCF8] border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Meal Fields with Dynamic Personalized Suggestion Dropdowns & Real Images */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                      {(() => {
                        const slotDefs = {
                          pre_breakfast: { key: 'pre_breakfast', label: '🌿 Pre-Breakfast Tonic', text: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50/50', ring: 'focus:ring-emerald-400', placeholder: 'Type herbal infusion / morning tonic...' },
                          breakfast: { key: 'breakfast', label: '🌅 Breakfast', text: 'text-orange-700', border: 'border-orange-200', bg: 'bg-orange-50/50', ring: 'focus:ring-orange-400', placeholder: 'Type custom breakfast...' },
                          drink: { key: 'drink', label: '🥤 Clinical Drink / Smoothie', text: 'text-teal-700', border: 'border-teal-200', bg: 'bg-teal-50/50', ring: 'focus:ring-teal-400', placeholder: 'Type beverage / smoothie...' },
                          lunch: { key: 'lunch', label: '☀️ Lunch', text: 'text-yellow-700', border: 'border-yellow-200', bg: 'bg-yellow-50/50', ring: 'focus:ring-yellow-400', placeholder: 'Type custom lunch...' },
                          snack: { key: 'snack', label: '🍎 Evening Snack', text: 'text-green-700', border: 'border-green-200', bg: 'bg-green-50/50', ring: 'focus:ring-green-400', placeholder: 'Type custom snack...' },
                          dinner: { key: 'dinner', label: '🌙 Dinner', text: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/50', ring: 'focus:ring-blue-400', placeholder: 'Type custom dinner...' },
                        };

                        const count = monthlyPlanData.meal_frequency || 5;
                        let activeSlots = [slotDefs.breakfast, slotDefs.drink, slotDefs.lunch, slotDefs.snack, slotDefs.dinner];
                        if (count === 3) activeSlots = [slotDefs.breakfast, slotDefs.lunch, slotDefs.dinner];
                        else if (count === 4) activeSlots = [slotDefs.breakfast, slotDefs.lunch, slotDefs.snack, slotDefs.dinner];
                        else if (count === 6) activeSlots = [slotDefs.pre_breakfast, slotDefs.breakfast, slotDefs.drink, slotDefs.lunch, slotDefs.snack, slotDefs.dinner];

                        return activeSlots.map(slot => {
                          const mealVal = monthlyPlanData.weeks?.[selectedWeek]?.[selectedDay]?.[slot.key] || '';
                          const imgUrl = getKeralaMealImage(mealVal, slot.key);

                          return (
                            <div key={slot.key} className="space-y-1.5 bg-white p-4 rounded-2xl border border-[#EBE9E0] shadow-2xs flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className={`block text-[10px] font-black uppercase tracking-widest ${slot.text}`}>
                                    {slot.label}
                                  </label>
                                  <span className="text-[10px] text-gray-400 font-bold">W{selectedWeek} • {selectedDay}</span>
                                </div>
                                <div className="relative h-28 rounded-xl overflow-hidden mb-2.5 bg-gray-100 border border-gray-100 shadow-2xs">
                                  <img 
                                    src={imgUrl} 
                                    alt={slot.label} 
                                    onError={(e) => { e.target.onerror = null; e.target.src = getKeralaMealImage(mealVal, slot.key); }}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                                  />
                                </div>
                                <select 
                                  onChange={(e) => { 
                                    if(e.target.value && e.target.value !== '__custom__') {
                                      handleMealChange(slot.key, e.target.value); 
                                    }
                                  }}
                                  className={`w-full border ${slot.border} ${slot.bg} rounded-xl p-2.5 text-xs font-semibold text-[#1C2C22] outline-none focus:ring-1 ${slot.ring} cursor-pointer mb-2`}
                                >
                                  <option value="">💡 2-3 Tailored Options for {selectedPatient.first_name}...</option>
                                  {getSuggestionsForPatient(slot.key).map((opt, i) => (
                                    <option key={i} value={opt}>✨ Option {i + 1}: {opt}</option>
                                  ))}
                                  <option value="__custom__">✍️ Custom food (Type below)...</option>
                                </select>
                              </div>
                              <input 
                                type="text" 
                                value={mealVal} 
                                onChange={e => handleMealChange(slot.key, e.target.value)} 
                                placeholder={slot.placeholder} 
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50] text-[#1C2C22] font-medium" 
                              />
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>


                  {/* General Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Activity Recommendation</label>
                      <textarea rows="2" value={monthlyPlanData.activity_recommendation} onChange={e=>setMonthlyPlanData({...monthlyPlanData, activity_recommendation: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50] resize-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Lifestyle Recommendation</label>
                      <textarea rows="2" value={monthlyPlanData.lifestyle_recommendation} onChange={e=>setMonthlyPlanData({...monthlyPlanData, lifestyle_recommendation: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50] resize-none"></textarea>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-1.5">Nutritionist Notes & Encouragement</label>
                    <input type="text" value={monthlyPlanData.nutritionist_notes} onChange={e=>setMonthlyPlanData({...monthlyPlanData, nutritionist_notes: e.target.value})} className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-3 text-xs outline-none focus:border-[#456A50]" />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#EBE9E0]">
                    <button type="button" onClick={handleSaveDraft} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5">
                      <Save size={14}/> Save Draft
                    </button>
                    <button type="button" onClick={handlePublishPlan} className="bg-[#456A50] hover:bg-[#35533E] text-white px-8 py-3.5 rounded-xl font-bold text-xs transition shadow-lg flex items-center gap-2">
                      <Send size={14}/> Publish to Patient Portal
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 3. MESSAGES AND CHAT SECTION */}
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh] animate-in fade-in">
              {/* Contacts List */}
              <div className="bg-white border border-[#EBE9E0] rounded-3xl p-5 flex flex-col shadow-sm overflow-hidden">
                 <h3 className="font-black text-[#1C2C22] text-lg mb-4 flex items-center gap-2">
                    <MessageSquare size={18} className="text-[#456A50]"/> Conversations
                 </h3>
                 <div className="overflow-y-auto flex-1 custom-scrollbar pr-2 space-y-2">
                    {/* Clinic Manager Pinned */}
                    <div onClick={() => setActiveChatContact('manager')} className={`p-3 rounded-2xl cursor-pointer flex items-center gap-3 transition border ${activeChatContact === 'manager' ? 'bg-[#EAF0EC] border-[#456A50]/20' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black shadow-sm border border-blue-200"><ShieldAlert size={18}/></div>
                      <div><p className="font-bold text-sm text-[#1C2C22]">Clinic Manager</p><p className="text-[10px] text-[#5A6B60] uppercase tracking-widest font-bold">Internal Admin</p></div>
                    </div>
                    
                    <div className="py-2"><hr className="border-[#EBE9E0]"/></div>

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-1">Assigned Patients</p>
                    {/* Patients */}
                    {patients.map(p => (
                      <div key={p.id} onClick={() => setActiveChatContact(p.id)} className={`p-3 rounded-2xl cursor-pointer flex items-center gap-3 transition border ${activeChatContact === p.id ? 'bg-[#EAF0EC] border-[#456A50]/20' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-[#5A6B60] flex items-center justify-center font-black shadow-sm overflow-hidden border border-[#EBE9E0]">
                          {p.profile_image ? <img src={p.profile_image} className="w-full h-full object-cover" alt={p.first_name}/> : <UserCircle size={20}/>}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm text-[#1C2C22] truncate">{p.first_name} {p.last_name}</p>
                          <p className="text-[10px] text-[#5A6B60] uppercase tracking-widest font-bold truncate">Patient #{p.id}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Chat Window */}
              <div className="md:col-span-2 bg-white border border-[#EBE9E0] rounded-3xl flex flex-col shadow-sm overflow-hidden">
                 {/* Header */}
                 <div className="bg-[#FDFCF8] border-b border-[#EBE9E0] p-5 flex items-center gap-3">
                   {activeChatContact === 'manager' ? (
                     <><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black shadow-sm"><ShieldAlert size={18}/></div><div><h3 className="font-black text-[#1C2C22]">Clinic Management Desk</h3><p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Secure Internal Channel</p></div></>
                   ) : (
                     <><div className="w-10 h-10 rounded-full bg-gray-100 text-[#5A6B60] flex items-center justify-center font-black shadow-sm overflow-hidden">{patients.find(p=>p.id===activeChatContact)?.profile_image ? <img src={patients.find(p=>p.id===activeChatContact)?.profile_image} className="w-full h-full object-cover" alt="Profile" /> : <UserCircle size={20}/>}</div><div><h3 className="font-black text-[#1C2C22]">{patients.find(p=>p.id===activeChatContact)?.first_name} {patients.find(p=>p.id===activeChatContact)?.last_name}</h3><p className="text-[10px] font-bold text-[#456A50] uppercase tracking-widest">Active Patient</p></div></>
                   )}
                 </div>

                 {/* Messages Area */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white custom-scrollbar">
                    {currentChats.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageSquare size={40} className="mb-3 opacity-30"/>
                        <p className="text-sm italic font-medium text-gray-400">Start the conversation...</p>
                      </div>
                    ) : (
                      currentChats.map(msg => {
                        const isMe = msg.senderRole === 'NUTRITIONIST';
                        const matchMeet = msg.meetLink || (typeof msg.text === 'string' && msg.text.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0]);
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {msg.senderRole === 'SYSTEM' ? (
                              <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold my-2 shadow-sm self-center max-w-[85%]">
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
                              <div className={`max-w-[75%] p-4 rounded-3xl shadow-sm ${isMe ? 'bg-[#456A50] text-white rounded-br-sm' : 'bg-[#FDFCF8] border border-[#EBE9E0] text-[#1C2C22] rounded-bl-sm'}`}>
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
                                <span className={`text-[9px] mt-2 block font-bold tracking-widest uppercase ${isMe ? 'text-green-200' : 'text-gray-400'}`}>{msg.time}</span>
                              </div>
                            )}
                          </div>
                        );
                      })

                    )}
                    <div ref={chatEndRef} />
                 </div>

                 {/* Input Area */}
                 <form onSubmit={handleSendChat} className="p-4 border-t border-[#EBE9E0] bg-[#FDFCF8] flex items-end gap-3">
                   <textarea 
                     value={chatInput} 
                     onChange={e=>setChatInput(e.target.value)} 
                     required 
                     rows="1" 
                     placeholder="Type a secure message..." 
                     className="flex-1 bg-white border border-[#EBE9E0] rounded-2xl p-4 text-sm outline-none focus:border-[#456A50] text-[#1C2C22] placeholder-gray-400 resize-none transition shadow-sm"
                   ></textarea>
                   <button type="submit" className="bg-[#1C2C22] text-white p-4 rounded-2xl hover:bg-[#456A50] transition shadow-md flex justify-center items-center h-[54px] w-[54px] shrink-0">
                     <Send size={18} className="ml-1" />
                   </button>
                 </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 🌟 CLINICAL LABORATORY REPORT & DIAGNOSTIC VIEWER MODAL 🌟 */}
      {selectedReportModal && (() => {
        const details = getClinicalReportDetails(selectedReportModal, selectedPatient);
        const hasFile = Boolean(selectedReportModal.fileUrl);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={() => setSelectedReportModal(null)}>
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EBE9E0] overflow-hidden" onClick={e => e.stopPropagation()}>
              
              {/* MODAL HEADER */}
              <div className="p-6 border-b border-[#EBE9E0] bg-[#FDFCF8] flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-[#EAF0EC] text-[#456A50] rounded-2xl shadow-2xs">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-[#1C2C22] truncate max-w-lg">{selectedReportModal.name || details.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#456A50] font-black uppercase tracking-wider bg-[#EAF0EC] px-2.5 py-0.5 rounded-md border border-[#456A50]/20">
                        {selectedReportModal.type || details.title}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">📅 {details.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasFile && (
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
                      <button 
                        onClick={() => setModalViewMode('diagnostic')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${modalViewMode === 'diagnostic' ? 'bg-white text-[#456A50] shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        🔬 Diagnostic Analysis
                      </button>
                      <button 
                        onClick={() => setModalViewMode('original')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${modalViewMode === 'original' ? 'bg-white text-[#456A50] shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        📄 Original Attachment
                      </button>
                    </div>
                  )}
                  <button onClick={() => setSelectedReportModal(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* MODAL CONTENT BODY */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFCF8]/40 custom-scrollbar">
                
                {modalViewMode === 'original' && hasFile ? (
                  <div className="flex items-center justify-center p-4 bg-white rounded-2xl border border-[#EBE9E0] min-h-[50vh]">
                    {selectedReportModal.fileUrl?.startsWith('data:image') ? (
                      <img src={selectedReportModal.fileUrl} alt={selectedReportModal.name} className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-xs border border-gray-200" />
                    ) : selectedReportModal.fileUrl?.startsWith('data:application/pdf') ? (
                      <iframe src={selectedReportModal.fileUrl} title={selectedReportModal.name} className="w-full h-[65vh] rounded-xl border border-gray-200" />
                    ) : (
                      <div className="text-center py-12">
                        <FileText size={56} className="mx-auto text-[#456A50] mb-3 opacity-70" />
                        <p className="font-black text-sm text-[#1C2C22]">{selectedReportModal.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Uploaded and registered in patient diagnostic file on {details.date}.</p>
                        <a 
                          href={selectedReportModal.fileUrl} 
                          download={selectedReportModal.name} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-2 bg-[#456A50] hover:bg-[#35533E] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
                        >
                          <Download size={14} /> Download Document
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 🔬 CLINICAL LABORATORY REPORT DIAGNOSTIC SHEET 🔬 */
                  <div className="space-y-6">
                    {/* PATIENT & LAB DEMOGRAPHICS BANNER */}
                    <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#456A50] mb-1">{details.lab}</p>
                        <h4 className="font-black text-lg text-[#1C2C22]">{details.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600 font-medium">
                          <span>Patient: <strong className="text-[#1C2C22]">{details.patientName}</strong></span>
                          <span>•</span>
                          <span>Age/Gender: <strong>{details.age} yrs / {details.gender}</strong></span>
                          <span>•</span>
                          <span>ID: <strong>#{selectedPatient?.id || '2'}</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 size={12} /> Certified Diagnostic Record
                        </span>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Report Date: {details.date}</p>
                      </div>
                    </div>

                    {/* BIOCHEMICAL PARAMETERS TABLE */}
                    <div className="bg-white rounded-2xl border border-[#EBE9E0] shadow-2xs overflow-hidden">
                      <div className="p-4 border-b border-[#EBE9E0] bg-[#FDFCF8] flex justify-between items-center">
                        <h5 className="font-black text-xs uppercase tracking-wider text-[#1C2C22] flex items-center gap-2">
                          <Activity size={15} className="text-[#456A50]" /> Diagnostic Investigation Findings
                        </h5>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Reference Biological Range</span>
                      </div>

                      <table className="w-full text-left text-xs text-[#1C2C22]">
                        <thead className="bg-[#FDFCF8] text-[9px] uppercase font-black text-[#5A6B60] tracking-widest border-b">
                          <tr>
                            <th className="py-3 px-5">Investigation / Biomarker</th>
                            <th className="py-3 px-5">Observed Value</th>
                            <th className="py-3 px-5">Reference Interval</th>
                            <th className="py-3 px-5 text-right">Clinical Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {details.parameters.map((param, idx) => (
                            <tr key={idx} className="hover:bg-[#FDFCF8] transition">
                              <td className="py-3.5 px-5 font-bold text-[#1C2C22]">{param.test}</td>
                              <td className="py-3.5 px-5 font-black text-[#456A50]">{param.result}</td>
                              <td className="py-3.5 px-5 text-gray-500 font-medium">{param.ref}</td>
                              <td className="py-3.5 px-5 text-right">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase border inline-block ${param.color}`}>
                                  {param.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* CLINICAL NUTRITIONIST INTERPRETATION & ACTION PLAN */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
                      <h5 className="font-black text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-2 mb-1.5">
                        <Sparkles size={14} className="text-[#456A50]" /> Dietitian Clinical Action Notes & Nutritional Guidelines
                      </h5>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        {details.clinicalNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="p-5 border-t border-[#EBE9E0] flex justify-between items-center bg-[#FDFCF8]">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <ShieldCheck size={16} className="text-[#456A50]" />
                  <span>Authorized by Healora Clinical Diagnostics & Laboratory Network</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {selectedReportModal.fileUrl && (
                    <a 
                      href={selectedReportModal.fileUrl} 
                      download={selectedReportModal.name} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-[#456A50] hover:bg-[#35533E] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                      <Download size={13} /> Download File
                    </a>
                  )}
                  <button 
                    onClick={() => setSelectedReportModal(null)} 
                    className="bg-white hover:bg-gray-100 border border-[#EBE9E0] text-gray-700 px-4 py-2 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🌟 4. DOCUMENT STATUS & CLINICAL REVIEW MODAL 🌟 */}
      {reviewingDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#EBE9E0] space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-[#EBE9E0] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#EAF0EC] text-[#456A50] rounded-2xl">
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-[#1C2C22]">Review Clinical Document</h4>
                  <p className="text-xs text-[#5A6B60] mt-0.5">
                    Patient: <strong>{selectedPatient?.first_name} {selectedPatient?.last_name}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setReviewingDocModal(null)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Details Strip */}
            <div className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1C2C22] truncate">{reviewingDocModal.name}</span>
                <span className="text-[10px] bg-white border border-[#EBE9E0] px-2 py-0.5 rounded font-black text-[#456A50]">
                  {reviewingDocModal.type || 'Clinical Report'}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">
                Uploaded: {reviewingDocModal.date || 'Recent'} • Size: {reviewingDocModal.size || 'Standard'}
              </p>
            </div>

            <form onSubmit={handleSaveDocReview} className="space-y-4">
              {/* Status Flow Selection */}
              <div>
                <label className="block text-[10px] font-black text-[#5A6B60] uppercase tracking-wider mb-2">
                  Document Review Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDocReviewStatus('AVAILABLE_FOR_REVIEW')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      docReviewStatus === 'AVAILABLE_FOR_REVIEW'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                        : 'bg-[#FDFCF8] border-[#EBE9E0] text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Available for Review</p>
                      <p className="text-[10px] text-amber-700">Pending Evaluation</p>
                    </div>
                    {docReviewStatus === 'AVAILABLE_FOR_REVIEW' && <Clock size={16} className="text-amber-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocReviewStatus('REVIEWED')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      docReviewStatus === 'REVIEWED'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-400/30'
                        : 'bg-[#FDFCF8] border-[#EBE9E0] text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Reviewed</p>
                      <p className="text-[10px] text-emerald-700">Verified by Nutritionist</p>
                    </div>
                    {docReviewStatus === 'REVIEWED' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Optional Review Note */}
              <div>
                <label className="block text-[10px] font-black text-[#5A6B60] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Nutritionist Findings & Dietary Note <span className="text-gray-400 font-normal lowercase">(optional)</span></span>
                  <span className="text-emerald-700 font-bold text-[9px]">Visible to Patient</span>
                </label>
                <textarea
                  rows="3"
                  value={docReviewNotes}
                  onChange={e => setDocReviewNotes(e.target.value)}
                  placeholder="e.g., Blood glucose is within normal limits. Recommend maintaining current complex carbohydrate intake."
                  className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-2xl p-3 text-xs outline-none focus:border-[#456A50] transition shadow-inner resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingDocModal(null)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-[#1C2C22] hover:bg-[#456A50] text-white font-bold py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={15} /> Save Document Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(69, 106, 80, 0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(69, 106, 80, 0.5); }
      `}</style>
    </div>
  );
};

export default NutritionistDashboard;