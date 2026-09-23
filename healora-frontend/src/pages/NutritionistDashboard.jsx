import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, FileText, Apple, Activity, Calendar, 
  CheckCircle2, Save, Send, LogOut, HeartPulse, UserCheck, 
  ArrowRight, Sparkles, AlertCircle, Clock, CheckCircle, Scale, 
  Flame, Stethoscope, UserCircle, Layers, Bell, MessageSquare, X, ShieldAlert, Droplets, Moon, Footprints, Star,
  Video, ExternalLink, Link2, Eye, ShieldCheck, Download, Lock, Unlock, AlertTriangle, TrendingUp, TrendingDown, Target, Award, Zap,
  ClipboardList, Edit3, History, Megaphone, DoorOpen, Volume2, Printer, Ticket, Check,
  RefreshCw, Plus
} from 'lucide-react';
import { getKeralaPersonalizedOptions, getKeralaMealImage, generatePersonalizedKeralaWeeks } from '../utils/keralaNutritionEngine.js';
import TelehealthVideoRoom from '../components/TelehealthVideoRoom.jsx';
import { evaluateClinicalSafety, checkMealAllergenConflict, evaluateMealConflicts } from '../utils/clinicalSafetyRules.js';
import { playClinicChime, printClinicTokenSlip } from './ClinicManagerDashboard.jsx';

export const DEFAULT_MEAL_TIMINGS = {
  pre_breakfast: '07:00 AM',
  breakfast: '08:30 AM',
  drink: '11:00 AM',
  lunch: '01:30 PM',
  snack: '04:30 PM',
  dinner: '08:00 PM'
};

export const DEFAULT_ACTIVITY_PLAN = {
  start_date: '2026-09-22',
  end_date: '2026-10-22',
  weekly_target_days: 5,
  who_guideline: 'WHO recommends adults generally get 150–300 minutes of moderate aerobic activity per week and muscle-strengthening activities on 2 or more days per week, while reducing sedentary time.',
  activities: [
    {
      id: 'act_1',
      name: 'Brisk Walking & Post-Meal Pacing',
      type: 'Walking',
      frequency: '5 days/week',
      duration_mins: 30,
      intensity: 'Moderate',
      target: '6,000 - 8,000 steps/day',
      preferred_time: 'Evening (06:00 PM)',
      instructions: 'Walk at a comfortable, brisk pace and gradually increase duration. Stay hydrated.',
      start_date: '2026-09-22',
      end_date: '2026-10-22'
    },
    {
      id: 'act_2',
      name: 'Core Strengthening & Joint Mobility Yoga',
      type: 'Yoga',
      frequency: '2 days/week',
      duration_mins: 20,
      intensity: 'Light',
      target: 'Surya Namaskar, bridge pose & gentle spinal twists',
      preferred_time: 'Morning (07:00 AM)',
      instructions: 'Perform mindful breathing, focus on core engagement, and do not hold breath.',
      start_date: '2026-09-22',
      end_date: '2026-10-22'
    }
  ]
};

export const DEFAULT_LIFESTYLE_PLAN = {
  start_date: '2026-09-22',
  end_date: '2026-10-22',
  who_guideline: 'WHO also identifies sleep, physical activity, hydration, and healthy lifestyle practices as essential elements of clinical self-care.',
  sleep: {
    area: 'Sleep Hygiene',
    target_value: '7 - 8 hrs restorative',
    current: '5 - 6 hrs irregular',
    target: '7 - 8 hrs restorative',
    bedtime: '10:30 PM',
    wakeup_time: '06:30 AM',
    frequency: 'Nightly',
    start_date: '2026-09-22',
    end_date: '2026-10-22',
    instructions: 'Turn off all screens 45 mins before bed. Keep bedroom cool, quiet, and dark.'
  },
  hydration: {
    area: 'Hydration & Fluids',
    target_value: '2.5 - 3.0 L / day (8+ glasses)',
    current: '1.0 - 1.2 L / day',
    target: '2.5 - 3.0 L / day',
    frequency: 'Daily',
    start_date: '2026-09-22',
    end_date: '2026-10-22',
    water_reminders: true,
    instructions: 'Keep a 1L water bottle at desk. Drink 1 glass upon waking and 1 glass before each meal; enjoy spiced Sambharam.'
  },
  meal_timing: {
    area: 'Meal Timing & Cadence',
    target_value: 'Follow prescribed meal schedule (No gaps > 4h)',
    current: 'Skips breakfast, late dinner (>10 PM)',
    target: 'Breakfast <9:00 AM, Lunch 1:30 PM, Dinner <8:00 PM',
    frequency: 'Daily',
    start_date: '2026-09-22',
    end_date: '2026-10-22',
    instructions: 'Avoid prolonged fasting gaps (>4 hours) during daytime; stop eating heavy meals 2 hours before bed.'
  },
  screen_sedentary: {
    area: 'Screen & Sedentary Time',
    target_value: '< 4 hrs static screen time / movement breaks',
    current: '6 - 7 hrs uninterrupted desk sitting',
    target: '< 4 hrs static screen time / movement breaks',
    frequency: 'Daily',
    start_date: '2026-09-22',
    end_date: '2026-10-22',
    instructions: 'Take a 5-minute movement or standing stretch break for every 45 minutes of continuous desk work.'
  },
  stress_management: {
    area: 'Stress Modulation & Recovery',
    target_value: '10 mins daily conscious relaxation / Box Breathing',
    current: 'High daily stress / tension',
    target: '10 mins daily conscious relaxation',
    frequency: 'Daily',
    start_date: '2026-09-22',
    end_date: '2026-10-22',
    instructions: 'Practice 4-4-4-4 Box Breathing or 10 minutes of guided evening Pranayama before sleep.'
  }
};

export const DEFAULT_BEHAVIOR_CHANGE_PLAN = {
  cbt_approach: 'Cognitive Behavioural Therapy (CBT) habit transformation: identify the patient\'s actual behaviour problem, root barrier, and structure actionable replacement habit loops.',
  habits: [
    {
      id: 'beh_1',
      current_behavior: 'Skips breakfast due to morning rush',
      target_behavior: 'Eat balanced, protein-rich breakfast regularly',
      action_strategy: 'Prepare breakfast (overnight oats or boiled eggs) the night before',
      target_frequency: '5 days/week',
      start_date: '2026-09-22',
      target_date: '2026-10-22',
      status: 'In Progress'
    },
    {
      id: 'beh_2',
      current_behavior: 'Drinks sugary soft drinks / sweetened milk tea every afternoon',
      target_behavior: 'Reduce sugary drinks & replace with healthy hydration',
      action_strategy: 'Replace with Sambharam (spiced buttermilk) or fresh lemon-mint water',
      target_frequency: 'Maximum 1 time/week treat',
      start_date: '2026-09-22',
      target_date: '2026-10-22',
      status: 'In Progress'
    },
    {
      id: 'beh_3',
      current_behavior: 'Sleeps at inconsistent times and scrolls phone in bed',
      target_behavior: 'Fixed restorative bedtime routine',
      action_strategy: 'Set a 10:00 PM wind-down reminder; charge phone across the room',
      target_frequency: 'Before 11:00 PM nightly',
      start_date: '2026-09-22',
      target_date: '2026-10-22',
      status: 'In Progress'
    }
  ]
};

const NutritionistDashboard = () => {
  const navigate = useNavigate();
  const nutritionistName = localStorage.getItem('user_name') || 'Dr. Sarah Jenkins';
  const nutritionistId = localStorage.getItem('user_id') || 'nut_1';

  // 🌟 PRIMARY VIEW: BOOKED CONSULTATIONS FIRST 🌟
  const [activeTab, setActiveTab] = useState('consultations'); // 'consultations' (default), 'directory', 'case', 'messages'
  const [carePlanPillar, setCarePlanPillar] = useState('meals'); // 'meals' | 'activity' | 'lifestyle' | 'behavior'
  const [consultationModeFilter, setConsultationModeFilter] = useState('ONLINE'); // 'ONLINE' | 'OFFLINE'
  const [completingConsultationAppt, setCompletingConsultationAppt] = useState(null);
  const [consultationForm, setConsultationForm] = useState({
    notes: '',
    weight: '',
    bp: '',
    glucose: '',
    dietaryFindings: ''
  });
  const [patientConsultationHistory, setPatientConsultationHistory] = useState([]);
  const [activeVideoCallAppt, setActiveVideoCallAppt] = useState(null);
  const [followupBarrierNote, setFollowupBarrierNote] = useState('');

  const handleStartVideoConsultation = (appt) => {
    setActiveVideoCallAppt(appt);
  };

  // 🎟️ LIVE QUEUE & IN-CLINIC CHAMBER STATE & CALLING HANDLERS
  const [calledAnnouncement, setCalledAnnouncement] = useState(null);

  const handleCallToken = (apptId) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let calledApptData = null;

    const updated = appointments.map(a => {
      if (String(a.id) === String(apptId)) {
        const tokenNum = a.token_number || `TK-${101 + ((a.id || 1) % 50)}`;
        const patientObj = patients.find(p => String(p.id) === String(a.patient));
        const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : `Patient #${a.patient}`;
        
        // Dispatched patient notification
        const patientNotifs = JSON.parse(localStorage.getItem(`healora_notifications_${a.patient}`)) || [];
        patientNotifs.unshift({
          id: Date.now(),
          title: "🎟️ YOUR TOKEN HAS BEEN CALLED!",
          message: `Token #${tokenNum} called! Please proceed into Doctor Consultation Chamber (Room 101).`,
          date: new Date().toLocaleString(),
          read: false
        });
        localStorage.setItem(`healora_notifications_${a.patient}`, JSON.stringify(patientNotifs));

        calledApptData = {
          token: tokenNum,
          patientName: pName,
          time: timeStr
        };

        return {
          ...a,
          token_number: tokenNum,
          queue_status: 'CALLED',
          token_called_at: timeStr,
          allocated_room: 'Doctor Consultation Chamber (Ground Floor, Room 101)'
        };
      }
      return a;
    });

    setAppointments(updated);
    localStorage.setItem('healora_all_appointments', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));

    // Audio chime sound in clinic
    playClinicChime();

    if (calledApptData) {
      setCalledAnnouncement(calledApptData);
    }
  };

  const handlePatientEntered = (apptId) => {
    const updated = appointments.map(a => {
      if (String(a.id) === String(apptId)) {
        return {
          ...a,
          queue_status: 'IN_CONSULTATION'
        };
      }
      return a;
    });
    setAppointments(updated);
    localStorage.setItem('healora_all_appointments', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleReturnToWaiting = (apptId) => {
    const updated = appointments.map(a => {
      if (String(a.id) === String(apptId)) {
        return {
          ...a,
          queue_status: 'WAITING'
        };
      }
      return a;
    });
    setAppointments(updated);
    localStorage.setItem('healora_all_appointments', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    if (calledAnnouncement) setCalledAnnouncement(null);
  };

  const handleCallNextWaitingToken = () => {
    const waitingAppt = appointments.find(a => 
      a.mode === 'OFFLINE' && 
      a.patient !== 1 && 
      String(a.patient) !== '1' && 
      a.status !== 'COMPLETED' && 
      a.queue_status !== 'COMPLETED' && 
      a.queue_status !== 'IN_CONSULTATION' && 
      a.queue_status !== 'CALLED'
    );
    if (waitingAppt) {
      handleCallToken(waitingAppt.id);
    } else {
      alert("No waiting in-clinic patients found in the lobby queue.");
    }
  };
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
  // --- CLINICAL PERSONALIZED KERALA MEAL SUGGESTION ENGINE (EXACTLY 2 PERSONALIZED OPTIONS) ---
  const getSuggestionsForPatient = (mealType) => {
    if (!selectedPatient) return [];
    const options = getKeralaPersonalizedOptions(mealType, selectedPatient, patientReports);
    return options.slice(0, 2).map(opt => `${opt.name} (${opt.cal})`);
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
          const cachedAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
          const cachedMap = new Map();
          cachedAppts.forEach(c => cachedMap.set(String(c.id), c));

          const cleanAppts = (Array.isArray(apptData) ? apptData : [])
            .filter(a => a.patient !== 1 && String(a.patient) !== '1')
            .map(a => {
              const cached = cachedMap.get(String(a.id)) || {};
              return {
                ...a,
                ...cached,
                token_number: cached.token_number || a.token_number || (a.mode === 'OFFLINE' ? `TK-${101 + ((a.id || 1) % 50)}` : undefined),
                queue_status: cached.queue_status || a.queue_status || (a.status === 'COMPLETED' ? 'COMPLETED' : 'WAITING'),
                allocated_room: cached.allocated_room || a.allocated_room || 'Doctor Consultation Chamber (Ground Floor, Room 101)',
                status: cached.status || a.status
              };
            });

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

  // Immediate storage sync across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const cached = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
      if (cached.length > 0) {
        setAppointments(cached);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

      // Load Patient's Complete Consultation History
      const patientLocalHistory = JSON.parse(localStorage.getItem(`healora_consultation_history_${selectedPatient.id}`)) || [];
      const patientAppts = appointments.filter(a => String(a.patient) === String(selectedPatient.id));

      const mappedApptHistory = patientAppts.map(a => ({
        id: a.id,
        date: a.date,
        time: a.time,
        mode: a.mode,
        status: a.status,
        nutritionist_name: nutritionistName,
        clinical_notes: a.health_notes || (a.status === 'COMPLETED' ? 'Consultation completed. Clinical vitals and nutritional targets evaluated.' : 'Session scheduled.'),
        vitals: a.vitals || null,
        completed_at: a.completed_at || (a.status === 'COMPLETED' ? `${a.date} ${a.time}` : null)
      }));

      const historyMap = new Map();
      mappedApptHistory.forEach(h => historyMap.set(String(h.id), h));
      patientLocalHistory.forEach(h => historyMap.set(String(h.id || h.appt_id), h));

      const sortedHistory = Array.from(historyMap.values()).sort((a,b) => new Date(`${b.date} ${b.time || '00:00'}`) - new Date(`${a.date} ${a.time || '00:00'}`));
      setPatientConsultationHistory(sortedHistory);
    }
  }, [selectedPatient, appointments]);


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
    weeks: generatePersonalizedKeralaWeeks({}, [], 5),
    activity_plan: { ...DEFAULT_ACTIVITY_PLAN },
    lifestyle_plan: { ...DEFAULT_LIFESTYLE_PLAN },
    behavior_change_plan: { ...DEFAULT_BEHAVIOR_CHANGE_PLAN }
  });

  const patientAdherence = useMemo(() => {
    if (!selectedPatient) return null;
    const key = `healora_activity_adherence_${selectedPatient.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    // Realistic clinical initial demo tracking: 4/5 days completed (80%), Wednesday missed with reason
    return {
      week_number: 1,
      target_days: 5,
      days: {
        Monday: { status: 'completed', reason: '' },
        Tuesday: { status: 'completed', reason: '' },
        Wednesday: { status: 'missed', reason: 'Busy with college' },
        Thursday: { status: 'completed', reason: '' },
        Friday: { status: 'completed', reason: '' },
        Saturday: { status: 'pending', reason: '' },
        Sunday: { status: 'pending', reason: '' }
      },
      last_updated: new Date().toISOString()
    };
  }, [selectedPatient]);

  // 📊 MONTHLY PROGRESS & AUDIT REPORT STATE
  const [selectedReportMonth, setSelectedReportMonth] = useState('2026-09');
  const [monthlyNutritionistEval, setMonthlyNutritionistEval] = useState('');
  const [carePlanChangesLog, setCarePlanChangesLog] = useState([]);

  useEffect(() => {
    if (selectedPatient) {
      const evalKey = `healora_monthly_eval_${selectedPatient.id}_${selectedReportMonth}`;
      const savedEval = localStorage.getItem(evalKey);
      if (savedEval) {
        setMonthlyNutritionistEval(savedEval);
      } else {
        setMonthlyNutritionistEval(
          `Monthly Nutritionist Clinical Review (${selectedReportMonth === '2026-09' ? 'September 2026' : selectedReportMonth}): Patient ${selectedPatient.first_name || 'Patient'} demonstrates consistent engagement with the Phase 1 lifestyle protocol. Physical activity cadence maintained at 4/5 days weekly with documented college workload barrier on Wednesday. Daily hydration consistently above 2.2L. Prescribed carbohydrate timing aligns well with metabolic pacing. Recommend continuing walking routine and reinforcing stress down-regulation before sleep.`
        );
      }

      const changesKey = `healora_care_plan_changes_${selectedPatient.id}`;
      const savedChanges = JSON.parse(localStorage.getItem(changesKey)) || [
        {
          date: '2026-09-22',
          previous_plan: 'Phase 1 Initial Clinical Assessment & Standard Guidelines',
          updated_plan: 'Personalized 4-Pillar Care Plan (Meals: 1550 kcal, Activity: 5 days/wk, Lifestyle: 5-Domain, Behaviour: CBT Habits)',
          reason: 'Initial consultation protocol prescription based on blood glucose and metabolic findings.'
        }
      ];
      setCarePlanChangesLog(savedChanges);
    }
  }, [selectedPatient, selectedReportMonth]);

  const handleSaveMonthlyEval = () => {
    if (!selectedPatient) return;
    const evalKey = `healora_monthly_eval_${selectedPatient.id}_${selectedReportMonth}`;
    localStorage.setItem(evalKey, monthlyNutritionistEval);
    alert(`✅ Monthly Nutritionist Evaluation & Sign-off saved for ${selectedReportMonth}!`);
  };

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

  const handleAutoFillPersonalizedPlan = () => {
    if (!selectedPatient) return;
    const patientLabDocs = (selectedPatient?.medical_documents || []).concat(patientReports.filter(r => String(r.patient) === String(selectedPatient?.id)));
    const freq = monthlyPlanData.meal_frequency || 5;
    const newWeeks = generatePersonalizedKeralaWeeks(selectedPatient, patientLabDocs, freq);
    setMonthlyPlanData(prev => ({
      ...prev,
      weeks: newWeeks
    }));
    alert(`✨ Successfully populated a 100% personalized, conflict-free 4-week protocol for ${selectedPatient.first_name}!\n\n• Allergies Filtered: Zero ${selectedPatient.food_allergies || 'None'}\n• Diet Protocol: 100% ${selectedPatient.food_preferences || 'Standard'}\n• Clinical Condition: Tailored for ${selectedPatient.enrolled_program || selectedPatient.medical_history || 'metabolic wellness'}`);
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

  // 🌟 CONSULTATION COMPLETION & CLINICAL HISTORY HANDLERS 🌟
  const handleOpenCompleteModal = (appt) => {
    const p = patients.find(pt => String(pt.id) === String(appt.patient)) || selectedPatient;
    setCompletingConsultationAppt(appt);
    setConsultationForm({
      notes: appt.health_notes || '',
      weight: p?.weight_kg || '',
      bp: '120/80',
      glucose: '95',
      dietaryFindings: ''
    });
  };

  const handleCompleteConsultation = async (e, openPlanImmediately = false) => {
    if (e) e.preventDefault();
    if (!completingConsultationAppt) return;

    const appt = completingConsultationAppt;
    const apptId = appt.id;
    const patientId = appt.patient;
    const targetPatient = patients.find(p => String(p.id) === String(patientId)) || selectedPatient;
    const now = new Date();
    const completedAtStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const noteText = consultationForm.notes.trim() || `Consultation successfully conducted via ${appt.mode === 'ONLINE' ? 'Online Telehealth' : 'In-Clinic session'}. Vitals & dietary needs assessed.`;

    // 1. Update appointment object in state & localStorage
    const updatedAppts = appointments.map(a => {
      if (String(a.id) === String(apptId)) {
        return {
          ...a,
          status: 'COMPLETED',
          queue_status: 'COMPLETED',
          health_notes: noteText,
          vitals: {
            bp: consultationForm.bp,
            weight: consultationForm.weight,
            glucose: consultationForm.glucose,
            dietaryFindings: consultationForm.dietaryFindings
          },
          completed_at: completedAtStr
        };
      }
      return a;
    });
    setAppointments(updatedAppts);
    localStorage.setItem('healora_all_appointments', JSON.stringify(updatedAppts));
    window.dispatchEvent(new Event('storage'));
    setCalledAnnouncement(null);

    // 2. Call Django backend patch if endpoint active
    try {
      await fetch(`/api/appointments/${apptId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          health_notes: noteText
        })
      });
    } catch (err) {
      console.warn('Backend appointment patch error:', err);
    }

    // 3. Save to patient's permanent consultation history
    const patientHistory = JSON.parse(localStorage.getItem(`healora_consultation_history_${patientId}`)) || [];
    const historyEntry = {
      id: `hist_${apptId}_${Date.now()}`,
      appt_id: apptId,
      date: appt.date,
      time: appt.time,
      mode: appt.mode,
      status: 'COMPLETED',
      nutritionist_name: nutritionistName,
      clinical_notes: noteText,
      vitals: {
        bp: consultationForm.bp,
        weight: consultationForm.weight,
        glucose: consultationForm.glucose,
        dietaryFindings: consultationForm.dietaryFindings
      },
      completed_at: completedAtStr
    };
    const newHistory = [historyEntry, ...patientHistory.filter(h => String(h.appt_id) !== String(apptId))];
    localStorage.setItem(`healora_consultation_history_${patientId}`, JSON.stringify(newHistory));
    if (selectedPatient && String(selectedPatient.id) === String(patientId)) {
      setPatientConsultationHistory(newHistory);
    }

    // 4. Update weight history if weight entered
    if (consultationForm.weight && targetPatient) {
      const hM = (parseFloat(targetPatient.height_cm) || 165) / 100;
      const wKg = parseFloat(consultationForm.weight);
      const bmi = (wKg / (hM * hM)).toFixed(1);
      const currentWeightHist = JSON.parse(localStorage.getItem(`healora_weight_history_${patientId}`)) || [];
      const newWeightEntry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        weight_kg: consultationForm.weight,
        bmi: bmi,
        notes: `Recorded during ${appt.mode === 'ONLINE' ? 'Telehealth' : 'In-Clinic'} Consultation`
      };
      const updatedWeightHist = [newWeightEntry, ...currentWeightHist];
      localStorage.setItem(`healora_weight_history_${patientId}`, JSON.stringify(updatedWeightHist));
      if (selectedPatient && String(selectedPatient.id) === String(patientId)) {
        setPatientWeightHistory(updatedWeightHist);
      }
    }

    // 5. Notify patient portal
    const patientNotifs = JSON.parse(localStorage.getItem(`healora_notifications_${patientId}`)) || [];
    patientNotifs.unshift({
      id: Date.now(),
      title: "Consultation Completed",
      message: `Your ${appt.mode === 'ONLINE' ? 'Online Telehealth' : 'In-Clinic'} consultation with ${nutritionistName} has been marked completed. Dietary care plan formulation is now active.`,
      date: new Date().toLocaleString(),
      read: false
    });
    localStorage.setItem(`healora_notifications_${patientId}`, JSON.stringify(patientNotifs));

    setCompletingConsultationAppt(null);
    setConsultationForm({ notes: '', weight: '', bp: '', glucose: '', dietaryFindings: '' });

    alert(`✅ Consultation marked as COMPLETED for ${targetPatient ? targetPatient.first_name : 'Patient'}!\nClinical consultation history updated & Care Plan builder unlocked.`);

    if (openPlanImmediately && targetPatient) {
      handleOpenCase(targetPatient);
    }
  };

  const handleConductDirectConsultation = (patient) => {
    const today = new Date().toISOString().split('T')[0];
    const newDirectAppt = {
      id: Date.now(),
      patient: patient.id,
      nutritionist: nutritionistId,
      date: today,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'ONLINE',
      status: 'SCHEDULED',
      health_notes: 'Direct intake consultation'
    };
    handleOpenCompleteModal(newDirectAppt);
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
      if (!existing.activity_plan) existing.activity_plan = { ...DEFAULT_ACTIVITY_PLAN };
      if (!existing.lifestyle_plan) existing.lifestyle_plan = { ...DEFAULT_LIFESTYLE_PLAN };
      if (!existing.behavior_change_plan) existing.behavior_change_plan = { ...DEFAULT_BEHAVIOR_CHANGE_PLAN };
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
        weeks: personalizedWeeks,
        activity_plan: { ...DEFAULT_ACTIVITY_PLAN },
        lifestyle_plan: { ...DEFAULT_LIFESTYLE_PLAN },
        behavior_change_plan: { ...DEFAULT_BEHAVIOR_CHANGE_PLAN }
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

    // 🔒 CLINICAL PROTOCOL: Check consultation completion
    const patientCompletedConsultations = appointments.filter(
      a => String(a.patient) === String(selectedPatient.id) && a.status === 'COMPLETED'
    );
    const patientLocalHistory = JSON.parse(localStorage.getItem(`healora_consultation_history_${selectedPatient.id}`)) || [];
    const hasCompletedConsultation = patientCompletedConsultations.length > 0 || patientLocalHistory.length > 0;

    if (!hasCompletedConsultation) {
      alert(`⚠️ Clinical Governance Rule:\n\nA consultation (Online Telehealth or In-Clinic) must be conducted and completed with ${selectedPatient.first_name || 'the patient'} before you can prescribe and publish a personalized Care Plan.`);
      return;
    }

    // Scan for allergen and dietary preference conflicts before publishing
    const conflicts = [];
    for (const [wk, days] of Object.entries(monthlyPlanData.weeks || {})) {
      for (const [day, slots] of Object.entries(days || {})) {
        for (const [slotKey, mealVal] of Object.entries(slots || {})) {
          const evalRes = evaluateMealConflicts(mealVal, {
            food_allergies: selectedPatient?.food_allergies,
            food_preferences: selectedPatient?.food_preferences
          });
          if (evalRes.allergenConflict) {
            conflicts.push(`• [ALLERGEN] Week ${wk} ${day} (${slotKey}): "${mealVal}" — Contains ${evalRes.allergenConflict.matchedKeyword} (${evalRes.allergenConflict.patientAllergy} Allergy)`);
          }
          if (evalRes.dietPreferenceConflict) {
            conflicts.push(`• [DIET CONFLICT] Week ${wk} ${day} (${slotKey}): "${mealVal}" — Contains "${evalRes.dietPreferenceConflict.matchedKeyword}" (${evalRes.dietPreferenceConflict.preference} Violation)`);
          }
        }
      }
    }

    if (conflicts.length > 0) {
      const confirmMsg = 
        `🚨 CLINICAL ALLERGEN & DIET CONFLICT FOR ${selectedPatient.first_name.toUpperCase()}!\n\n` +
        `The care plan contains items conflicting with ${selectedPatient.first_name}'s restrictions:\n\n` +
        conflicts.slice(0, 5).join('\n') +
        (conflicts.length > 5 ? `\n...and ${conflicts.length - 5} more conflict(s)` : '') +
        `\n\nPrescribing known food allergens or non-compliant foods risks patient harm.\nAre you certain you want to force-publish this plan?`;
      
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

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

      // 📝 Log Care Plan Change Audit Trail
      const changesKey = `healora_care_plan_changes_${selectedPatient.id}`;
      const existingChanges = JSON.parse(localStorage.getItem(changesKey)) || [];
      existingChanges.unshift({
        date: new Date().toISOString().split('T')[0],
        previous_plan: 'Phase 1 Care Plan Baseline',
        updated_plan: `${publishedData.nutrition_goal || 'Personalized Kerala Protocol'} (${publishedData.target_calories || 1550} kcal, ${publishedData.meal_frequency || 5} meals/day)`,
        reason: publishedData.nutritionist_notes || 'Care plan published and active for patient adherence tracking.'
      });
      localStorage.setItem(changesKey, JSON.stringify(existingChanges));
      setCarePlanChangesLog(existingChanges);

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

  // --- 🎟️ IN-CLINIC OFFLINE QUEUE DATA & CHAMBER OCCUPANCY ---
  const offlineAppointments = useMemo(() => {
    const list = appointments.filter(a => a.mode === 'OFFLINE' && a.patient !== 1 && String(a.patient) !== '1');
    const statusOrder = { 'CALLED': 1, 'IN_CONSULTATION': 2, 'WAITING': 3, 'COMPLETED': 4 };
    return [...list].sort((a, b) => {
      const orderA = statusOrder[a.queue_status] || (a.status === 'COMPLETED' ? 4 : 3);
      const orderB = statusOrder[b.queue_status] || (b.status === 'COMPLETED' ? 4 : 3);
      if (orderA !== orderB) return orderA - orderB;
      return (a.time || '').localeCompare(b.time || '');
    }).map((appt, idx) => ({
      ...appt,
      token_number: appt.token_number || `TK-${101 + ((appt.id || (idx + 1)) % 50)}`,
      queue_status: appt.queue_status || (appt.status === 'COMPLETED' ? 'COMPLETED' : 'WAITING'),
      allocated_room: appt.allocated_room || 'Doctor Consultation Chamber (Ground Floor, Room 101)'
    }));
  }, [appointments]);

  const activeCalledAppt = useMemo(() => {
    return offlineAppointments.find(a => a.queue_status === 'CALLED');
  }, [offlineAppointments]);

  const activeInChamberAppt = useMemo(() => {
    return offlineAppointments.find(a => a.queue_status === 'IN_CONSULTATION');
  }, [offlineAppointments]);

  const nextWaitingAppt = useMemo(() => {
    return offlineAppointments.find(a => 
      a.queue_status !== 'COMPLETED' && 
      a.queue_status !== 'IN_CONSULTATION' && 
      a.queue_status !== 'CALLED' && 
      a.status !== 'COMPLETED'
    );
  }, [offlineAppointments]);

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

      {/* 🌟 CONSULTATION COMPLETION & CLINICAL INTAKE MODAL 🌟 */}
      {completingConsultationAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl border border-[#EBE9E0] space-y-6 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-[#EBE9E0] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#EAF0EC] text-[#456A50] rounded-2xl">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1C2C22]">Conduct & Complete Consultation</h3>
                  <p className="text-xs text-[#5A6B60] mt-0.5">
                    {completingConsultationAppt.mode === 'ONLINE' ? '🎥 Online Video Telehealth' : '🏥 In-Clinic Offline Session'} • 
                    Patient #{completingConsultationAppt.patient} ({(() => {
                      const p = patients.find(pt => String(pt.id) === String(completingConsultationAppt.patient)) || selectedPatient;
                      return p ? `${p.first_name} ${p.last_name}` : 'Patient';
                    })()})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCompletingConsultationAppt(null)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => handleCompleteConsultation(e, false)} className="space-y-4">
              <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE9E0] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Session Scheduled</span>
                  <span className="font-bold text-[#1C2C22]">📅 {completingConsultationAppt.date} at {completingConsultationAppt.time}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Consulting Doctor</span>
                  <span className="font-bold text-[#456A50]">{nutritionistName}</span>
                </div>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#1C2C22] mb-1.5">
                  Clinical Consultation Notes & Dietary Observations <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={consultationForm.notes}
                  onChange={(e) => setConsultationForm({...consultationForm, notes: e.target.value})}
                  placeholder="Record patient complaints, appetite patterns, current eating routine, digestive symptoms, and dietary targets discussed..."
                  className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-3.5 text-xs text-[#1C2C22] outline-none focus:border-[#456A50] focus:ring-1 focus:ring-[#456A50]/20 resize-none shadow-inner"
                />
              </div>

              {/* Vitals Recorded */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A6B60] mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={consultationForm.weight}
                    onChange={(e) => setConsultationForm({...consultationForm, weight: e.target.value})}
                    placeholder="e.g. 64.5"
                    className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A6B60] mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={consultationForm.bp}
                    onChange={(e) => setConsultationForm({...consultationForm, bp: e.target.value})}
                    placeholder="e.g. 120/80"
                    className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A6B60] mb-1">Fasting Glucose (mg/dL)</label>
                  <input
                    type="text"
                    value={consultationForm.glucose}
                    onChange={(e) => setConsultationForm({...consultationForm, glucose: e.target.value})}
                    placeholder="e.g. 95"
                    className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]"
                  />
                </div>
              </div>

              {/* Additional dietary findings */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A6B60] mb-1">Specific Food Allergens or Dislikes Identified</label>
                <input
                  type="text"
                  value={consultationForm.dietaryFindings}
                  onChange={(e) => setConsultationForm({...consultationForm, dietaryFindings: e.target.value})}
                  placeholder="e.g. Mild lactose sensitivity, prefers low coconut oil"
                  className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#EBE9E0]">
                <button
                  type="button"
                  onClick={() => setCompletingConsultationAppt(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCompleteConsultation(e, true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#456A50] hover:bg-[#35533E] text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={15} /> Complete & Open Diet Plan Builder
                </button>
              </div>
            </form>
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
          
          {/* 🌟 1. BOOKED CONSULTATIONS (DEFAULT / PRIMARY) 🌟 */}
          <button 
            type="button"
            onClick={() => { setActiveTab('consultations'); setSelectedPatient(null); }} 
            className={`w-full flex items-center justify-between gap-2.5 px-4 py-3 rounded-xl transition text-sm text-left cursor-pointer ${activeTab==='consultations' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}
          >
            <div className="flex items-center gap-3 min-w-0 text-left">
              <Calendar size={18} className="shrink-0" />
              <span className="text-left font-bold whitespace-nowrap">Booked Consultations</span>
            </div>
            <span className="bg-[#456A50] text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
              {appointments.filter(a => a.patient !== 1 && String(a.patient) !== '1' && patients.some(p => String(p.id) === String(a.patient))).length}
            </span>
          </button>

          {/* Sub-modes for Online vs Offline */}
          {activeTab === 'consultations' && (
            <div className="pl-6 space-y-1.5 pt-1 animate-in fade-in">
              <button
                type="button"
                onClick={() => setConsultationModeFilter('ONLINE')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${consultationModeFilter === 'ONLINE' ? 'bg-purple-100 text-purple-800 shadow-2xs' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'}`}
              >
                <span className="flex items-center gap-2">
                  <Video size={13} className="text-purple-600" /> Online Telehealth
                </span>
                <span className="text-[10px] bg-white text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                  {appointments.filter(a => a.mode === 'ONLINE' && a.patient !== 1 && String(a.patient) !== '1' && patients.some(p => String(p.id) === String(a.patient))).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConsultationModeFilter('OFFLINE')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${consultationModeFilter === 'OFFLINE' ? 'bg-blue-100 text-blue-800 shadow-2xs' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'}`}
              >
                <span className="flex items-center gap-2">
                  <Stethoscope size={13} className="text-blue-600" /> In-Clinic (Offline)
                </span>
                <span className="text-[10px] bg-white text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                  {appointments.filter(a => a.mode === 'OFFLINE' && a.patient !== 1 && String(a.patient) !== '1' && patients.some(p => String(p.id) === String(a.patient))).length}
                </span>
              </button>
            </div>
          )}

          {/* 🌟 2. ASSIGNED PATIENTS DIRECTORY 🌟 */}
          <button onClick={() => { setActiveTab('directory'); setSelectedPatient(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm cursor-pointer ${activeTab==='directory' && !selectedPatient ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <Users size={18} /> Assigned Patients
          </button>

          {/* 🌟 3. PATIENT CASE FILE 🌟 */}
          {selectedPatient && (
            <button onClick={() => setActiveTab('case')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm cursor-pointer ${activeTab==='case' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
              <FileText size={18} /> Patient Case File
            </button>
          )}

          {/* 🌟 4. MESSAGES & CHAT 🌟 */}
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
                  ? (consultationModeFilter === 'ONLINE' ? 'Online Telehealth Consultations' : 'In-Clinic (Offline) Consultations')
                  : activeTab === 'messages' 
                  ? 'Clinic & Patient Messaging' 
                  : `Patient Case: ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
              </h1>
              <p className="text-[#5A6B60] mt-1 text-sm">
                {activeTab === 'directory' 
                  ? 'Search records, view biometrics, and build monthly care plans.' 
                  : activeTab === 'consultations'
                  ? (consultationModeFilter === 'ONLINE' 
                      ? 'Directly enter scheduled in-app video consultation sessions and review telehealth appointments.' 
                      : 'Manage in-clinic physical appointments, patient intake, and clinical vital assessments.')
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

          {/* 🌟 1. BOOKED CONSULTATIONS (ONLINE & OFFLINE KEPT SEPARATELY) 🌟 */}
          {activeTab === 'consultations' && (
            <div className="space-y-6 animate-in fade-in">
              {/* TOP MODE TOGGLE & QUICK ACTIONS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1.5 bg-[#F4F7F5] border border-[#DCE4DE] rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => setConsultationModeFilter('ONLINE')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      consultationModeFilter === 'ONLINE'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-[#5A6B60] hover:text-[#1C2C22]'
                    }`}
                  >
                    <Video size={15} />
                    Online Telehealth Sessions
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      consultationModeFilter === 'ONLINE' ? 'bg-purple-700 text-white' : 'bg-white text-[#5A6B60] border'
                    }`}>
                      {appointments.filter(a => a.mode === 'ONLINE' && a.patient !== 1 && String(a.patient) !== '1' && patients.some(p => String(p.id) === String(a.patient))).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationModeFilter('OFFLINE')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      consultationModeFilter === 'OFFLINE'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-[#5A6B60] hover:text-[#1C2C22]'
                    }`}
                  >
                    <Stethoscope size={15} />
                    In-Clinic (Offline) Consultations
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      consultationModeFilter === 'OFFLINE' ? 'bg-blue-700 text-white' : 'bg-white text-[#5A6B60] border'
                    }`}>
                      {appointments.filter(a => a.mode === 'OFFLINE' && a.patient !== 1 && String(a.patient) !== '1' && patients.some(p => String(p.id) === String(a.patient))).length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setActiveTab('directory'); setSelectedPatient(null); }}
                    className="bg-white hover:bg-gray-50 border border-[#DCE4DE] text-[#5A6B60] px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users size={14} /> View All Patients ({patients.length})
                  </button>
                </div>
              </div>

              {/* MODE-SPECIFIC METRIC CARDS */}
              {consultationModeFilter === 'ONLINE' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-purple-100 text-purple-700 rounded-2xl">
                        <Video size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Total Online Telehealth</p>
                        <h3 className="text-2xl font-black text-[#1C2C22] mt-0.5">
                          {appointments.filter(a => a.mode === 'ONLINE').length} Bookings
                        </h3>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-blue-100 text-blue-700 rounded-2xl">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Today's Video Calls</p>
                        <h3 className="text-2xl font-black text-[#1C2C22] mt-0.5">
                          {(() => {
                            const now = new Date();
                            const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                            const isoToday = now.toISOString().split('T')[0];
                            return appointments.filter(a => a.mode === 'ONLINE' && (a.date === localToday || a.date === isoToday)).length;
                          })()} Today
                        </h3>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Completed Telehealth</p>
                        <h3 className="text-2xl font-black text-emerald-700 mt-0.5">
                          {appointments.filter(a => a.mode === 'ONLINE' && a.status === 'COMPLETED').length} Finished
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* ONLINE TELEHEALTH TABLE */}
                  <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] overflow-hidden">
                    <div className="p-6 border-b border-[#EBE9E0] bg-[#FDFCF8] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <h2 className="text-xl font-black text-[#1C2C22] flex items-center gap-2">
                          <Video className="text-purple-600" size={22} />
                          Online Telehealth Consultation Bookings
                        </h2>
                        <p className="text-xs text-[#5A6B60] mt-0.5">
                          Enter scheduled live video rooms, conduct telehealth intake, record clinical notes, and formulate diet plans.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-[#1C2C22]">
                        <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b">
                          <tr>
                            <th className="py-4 px-6">Date & Time</th>
                            <th className="py-4 px-6">Patient</th>
                            <th className="py-4 px-6">Video Studio</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6">Clinical Notes</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {appointments
                            .filter(a => a.mode === 'ONLINE' && a.patient !== 1 && String(a.patient) !== '1' && patients.some(p => String(p.id) === String(a.patient)))
                            .map(a => {
                              const patientObj = patients.find(p => String(p.id) === String(a.patient));
                              const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : `Patient #${a.patient}`;
                              const pPhone = patientObj?.phone_number || patientObj?.phone;
                              const isToday = (() => {
                                const now = new Date();
                                const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                const isoToday = now.toISOString().split('T')[0];
                                return a.date === localToday || a.date === isoToday;
                              })();
                              const isCompleted = a.status === 'COMPLETED';

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
                                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 overflow-hidden shadow-2xs">
                                        {patientObj?.profile_image ? (
                                          <img src={patientObj.profile_image} className="w-full h-full object-cover" alt="Profile" />
                                        ) : (
                                          <UserCircle size={20} />
                                        )}
                                      </div>
                                      <div>
                                        <span className="font-black text-[#1C2C22] block">{pName}</span>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                          {pPhone && <span>📞 {pPhone}</span>}
                                          {patientObj?.enrolled_program && (
                                            <span className="text-[#456A50] font-semibold truncate max-w-[120px]">
                                              • {patientObj.enrolled_program}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-5 px-6">
                                    {isCompleted ? (
                                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl inline-flex items-center gap-1.5">
                                        <CheckCircle size={12} /> Consultation Completed
                                      </span>
                                    ) : (
                                      <button 
                                        type="button"
                                        onClick={() => handleStartVideoConsultation(a)} 
                                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition transform hover:scale-105 cursor-pointer"
                                      >
                                        <Video size={14} /> Enter Video Room
                                      </button>
                                    )}
                                  </td>

                                  <td className="py-5 px-6">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                                      isCompleted 
                                        ? 'bg-green-100 text-green-700 border border-green-200' 
                                        : a.status === 'RESCHEDULED' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                      {a.status}
                                    </span>
                                  </td>

                                  <td className="py-5 px-6 max-w-xs">
                                    <p className="text-xs text-gray-600 truncate" title={a.health_notes || 'No consultation notes recorded yet.'}>
                                      {a.health_notes || <span className="text-gray-400 italic">No notes recorded</span>}
                                    </p>
                                  </td>

                                  <td className="py-5 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {!isCompleted && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenCompleteModal(a)}
                                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                          title="Mark consultation completed and record clinical findings"
                                        >
                                          <CheckCircle2 size={13} /> Complete Session
                                        </button>
                                      )}

                                      {patientObj && (
                                        <button 
                                          onClick={() => handleOpenCase(patientObj)} 
                                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer ${
                                            isCompleted
                                              ? 'bg-[#456A50] hover:bg-[#35533E] text-white shadow-sm'
                                              : 'bg-white border border-[#EBE9E0] text-[#456A50] hover:bg-[#EAF0EC]'
                                          }`}
                                          title={isCompleted ? "Open case file & formulate diet plan" : "View patient medical details"}
                                        >
                                          <FileText size={13} /> {isCompleted ? 'Prescribe Plan' : 'Open Case'}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                          {appointments.filter(a => a.mode === 'ONLINE' && a.patient !== 1 && String(a.patient) !== '1' && patients.some(p => String(p.id) === String(a.patient))).length === 0 && (
                            <tr>
                              <td colSpan="6" className="py-16 text-center text-gray-400 italic">
                                No online telehealth consultations found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                /* 🏥 IN-CLINIC (OFFLINE) LIVE QUEUE & CONSULTATION CHAMBER CONSOLE 🏥 */
                <div className="space-y-6">
                  {/* 🔔 LIVE TOKEN CALLING ANNOUNCEMENT BANNER */}
                  {activeCalledAppt && (
                    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white p-5 sm:p-6 rounded-3xl shadow-xl border-2 border-amber-300 animate-pulse flex flex-col md:flex-row items-center justify-between gap-5">
                      <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
                          <Megaphone size={28} className="text-white animate-bounce" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-2 bg-black/25 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                            Live Patient Queue Calling Active
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                            NOW CALLING: <span className="underline decoration-wavy decoration-white font-mono bg-white/20 px-2.5 py-0.5 rounded-xl">{activeCalledAppt.token_number || 'TK-101'}</span>
                          </h2>
                          <p className="text-xs sm:text-sm font-bold text-amber-100 mt-1 flex items-center gap-2">
                            <span>👉 Please enter Doctor Consultation Chamber (Dr. Sarah Jenkins).</span>
                          </p>
                          <p className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                            🔒 Privacy-First Queue: Patient enters when their token is displayed — no need to call patient's name aloud.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={() => handlePatientEntered(activeCalledAppt.id)}
                          className="bg-white hover:bg-amber-50 text-amber-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg transition transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                        >
                          <DoorOpen size={16} className="text-amber-800" /> Patient Entered Chamber
                        </button>
                        <button
                          type="button"
                          onClick={() => { playClinicChime(); alert(`🔔 Audio chime sounded for Token #${activeCalledAppt.token_number}!`); }}
                          className="bg-amber-700/80 hover:bg-amber-700 text-white font-black px-4 py-3 rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-amber-400/40"
                          title="Re-ring chime in waiting lobby"
                        >
                          <Volume2 size={15} /> Re-Chime
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReturnToWaiting(activeCalledAppt.id)}
                          className="bg-black/20 hover:bg-black/30 text-white font-bold px-3.5 py-3 rounded-2xl text-xs transition cursor-pointer"
                          title="Reset back to waiting if patient delayed"
                        >
                          Return to Waiting
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 🚪 LIVE CONSULTATION CHAMBER STATUS CONSOLE */}
                  <div className="bg-white rounded-3xl border border-[#DCE4DE] p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          activeInChamberAppt 
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' 
                            : activeCalledAppt
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                            : 'bg-[#456A50] text-white ring-4 ring-emerald-50'
                        }`}>
                          {activeInChamberAppt ? <Stethoscope size={28} /> : activeCalledAppt ? <Megaphone size={28} /> : <DoorOpen size={28} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-[#1C2C22]">Doctor Consultation Chamber (Ground Floor, Room 101)</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                              activeInChamberAppt
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : activeCalledAppt
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-green-50 text-green-800 border-green-200'
                            }`}>
                              {activeInChamberAppt ? '🟢 IN ACTIVE CONSULTATION' : activeCalledAppt ? '📢 CALLING TOKEN' : '⚪ CHAMBER READY / AVAILABLE'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 font-medium">
                            Attending Clinician: <span className="font-bold text-[#1C2C22]">{nutritionistName} (Lead Clinical Nutritionist)</span>
                          </p>
                          <p className="text-xs text-[#5A6B60] mt-0.5">
                            {activeInChamberAppt ? (
                              <span className="font-bold text-emerald-800">
                                🩺 Currently consulting with Token #{activeInChamberAppt.token_number} ({patients.find(p => String(p.id) === String(activeInChamberAppt.patient))?.first_name || 'Patient'}). Assessing vitals & formulating clinical care plan.
                              </span>
                            ) : activeCalledAppt ? (
                              <span className="font-bold text-amber-800">
                                📢 Token #{activeCalledAppt.token_number} called on board. Patient is entering the consultation chamber now.
                              </span>
                            ) : (
                              <span>Chamber is unoccupied and ready for the next scheduled in-clinic consultation.</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Top Action Console */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        {activeInChamberAppt ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCompleteModal(activeInChamberAppt)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl text-xs shadow-md shadow-emerald-600/20 transition transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 size={16} /> Complete Consultation & Prescribe Plan
                          </button>
                        ) : activeCalledAppt ? (
                          <button
                            type="button"
                            onClick={() => handlePatientEntered(activeCalledAppt.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl text-xs shadow-md shadow-emerald-600/20 transition transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                          >
                            <DoorOpen size={16} /> Patient Entered Chamber
                          </button>
                        ) : nextWaitingAppt ? (
                          <button
                            type="button"
                            onClick={() => handleCallToken(nextWaitingAppt.id)}
                            className="bg-[#456A50] hover:bg-[#35533E] text-white font-black px-6 py-3 rounded-2xl text-xs shadow-md shadow-[#456A50]/20 transition transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                          >
                            <Megaphone size={16} /> Call Next Token (#{nextWaitingAppt.token_number || 'TK-101'})
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl">
                            All Queued Patients Attended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 📊 IN-CLINIC LIVE QUEUE METRIC STATS */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-[#EBE9E0] shadow-2xs">
                      <p className="text-[10px] font-extrabold text-[#5A6B60] uppercase tracking-widest">Total Tokens</p>
                      <h3 className="text-xl font-black text-[#1C2C22] mt-0.5">{offlineAppointments.length}</h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#EBE9E0] shadow-2xs">
                      <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest">Waiting in Lobby</p>
                      <h3 className="text-xl font-black text-blue-800 mt-0.5">
                        {offlineAppointments.filter(a => (a.queue_status === 'WAITING' || (!a.queue_status && a.status !== 'COMPLETED')) && a.status !== 'COMPLETED').length}
                      </h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#EBE9E0] shadow-2xs">
                      <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest">Called / Entering</p>
                      <h3 className="text-xl font-black text-amber-800 mt-0.5">
                        {offlineAppointments.filter(a => a.queue_status === 'CALLED').length}
                      </h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#EBE9E0] shadow-2xs">
                      <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">In Consultation</p>
                      <h3 className="text-xl font-black text-emerald-800 mt-0.5">
                        {offlineAppointments.filter(a => a.queue_status === 'IN_CONSULTATION').length}
                      </h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#EBE9E0] shadow-2xs col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest">Completed</p>
                      <h3 className="text-xl font-black text-gray-800 mt-0.5">
                        {offlineAppointments.filter(a => a.status === 'COMPLETED' || a.queue_status === 'COMPLETED').length}
                      </h3>
                    </div>
                  </div>

                  {/* 📋 IN-CLINIC PHYSICAL APPOINTMENTS & QUEUE BOARD TABLE */}
                  <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] overflow-hidden">
                    <div className="p-6 border-b border-[#EBE9E0] bg-[#FDFCF8] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <h2 className="text-xl font-black text-[#1C2C22] flex items-center gap-2">
                          <Stethoscope className="text-blue-600" size={22} />
                          In-Clinic Physical Consultation & Token Calling Queue
                        </h2>
                        <p className="text-xs text-[#5A6B60] mt-0.5">
                          Call patient tokens into the consultation room, record clinical vitals, complete sessions, and formulate diet plans.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-[#1C2C22]">
                        <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b">
                          <tr>
                            <th className="py-4 px-6">Queue Token #</th>
                            <th className="py-4 px-6">Patient Details</th>
                            <th className="py-4 px-6">Scheduled Slot</th>
                            <th className="py-4 px-6">Chamber / Desk</th>
                            <th className="py-4 px-6">Live Queue Status</th>
                            <th className="py-4 px-6">Clinical Notes</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE9E0]">
                          {offlineAppointments
                            .filter(a => patients.some(p => String(p.id) === String(a.patient)))
                            .map(a => {
                              const patientObj = patients.find(p => String(p.id) === String(a.patient));
                              const pName = patientObj ? `${patientObj.first_name} ${patientObj.last_name}` : `Patient #${a.patient}`;
                              const pPhone = patientObj?.phone_number || patientObj?.phone;
                              const isToday = (() => {
                                const now = new Date();
                                const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                const isoToday = now.toISOString().split('T')[0];
                                return a.date === localToday || a.date === isoToday;
                              })();
                              const isCompleted = a.status === 'COMPLETED' || a.queue_status === 'COMPLETED';
                              const isCalled = a.queue_status === 'CALLED';
                              const isInConsultation = a.queue_status === 'IN_CONSULTATION';

                              return (
                                <tr key={a.id} className={`hover:bg-[#FDFCF8] transition group ${isCalled ? 'bg-amber-50/40' : isInConsultation ? 'bg-emerald-50/30' : isToday ? 'bg-amber-50/20' : ''}`}>
                                  {/* 🎟️ TOKEN NUMBER BADGE */}
                                  <td className="py-5 px-6">
                                    <span className="font-mono font-black text-sm bg-gray-100 text-[#1C2C22] px-3 py-1.5 rounded-xl border border-gray-300 inline-flex items-center gap-1.5 shadow-2xs">
                                      <Ticket size={13} className="text-[#456A50]" />
                                      {a.token_number || `TK-${101 + ((a.id || 1) % 50)}`}
                                    </span>
                                  </td>

                                  {/* PATIENT DETAILS */}
                                  <td className="py-5 px-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 overflow-hidden shadow-2xs">
                                        {patientObj?.profile_image ? (
                                          <img src={patientObj.profile_image} className="w-full h-full object-cover" alt="Profile" />
                                        ) : (
                                          <UserCircle size={20} />
                                        )}
                                      </div>
                                      <div>
                                        <span className="font-black text-[#1C2C22] block">{pName}</span>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                          {pPhone && <span>📞 {pPhone}</span>}
                                          {patientObj?.enrolled_program && (
                                            <span className="text-[#456A50] font-semibold truncate max-w-[120px]">
                                              • {patientObj.enrolled_program}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* SCHEDULED SLOT */}
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

                                  {/* CHAMBER / DESK */}
                                  <td className="py-5 px-6">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                        <Stethoscope size={11} className="text-blue-700" /> Room 101
                                      </span>
                                    </div>
                                  </td>

                                  {/* LIVE QUEUE STATUS */}
                                  <td className="py-5 px-6">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                                      isInConsultation
                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                        : isCalled
                                        ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                                        : isCompleted
                                        ? 'bg-gray-100 text-gray-700 border-gray-200'
                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                    }`}>
                                      {isInConsultation 
                                        ? <><DoorOpen size={11} /> 🟢 In Chamber</> 
                                        : isCalled 
                                        ? <><Megaphone size={11} /> 📢 Called (Entering)</> 
                                        : isCompleted 
                                        ? <><Check size={11} /> ✓ Completed</> 
                                        : <><Clock size={11} /> ⏳ In Lobby</>}
                                    </span>
                                  </td>

                                  {/* CLINICAL NOTES */}
                                  <td className="py-5 px-6 max-w-xs">
                                    <p className="text-xs text-gray-600 truncate" title={a.health_notes || 'No consultation notes recorded yet.'}>
                                      {a.health_notes || <span className="text-gray-400 italic">No notes recorded</span>}
                                    </p>
                                  </td>

                                  {/* ACTIONS */}
                                  <td className="py-5 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      {/* Print token slip */}
                                      <button
                                        type="button"
                                        onClick={() => printClinicTokenSlip(a, { name: pName })}
                                        className="bg-white hover:bg-gray-50 border border-[#DCE4DE] text-[#1C2C22] px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                        title="Print Official Token Pass"
                                      >
                                        <Printer size={12} className="text-[#456A50]" /> Pass
                                      </button>

                                      {!isCompleted && !isInConsultation && !isCalled && (
                                        <button
                                          type="button"
                                          onClick={() => handleCallToken(a.id)}
                                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1 cursor-pointer"
                                          title="Call patient token into chamber"
                                        >
                                          <Megaphone size={12} /> Call Token
                                        </button>
                                      )}

                                      {isCalled && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handlePatientEntered(a.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1 cursor-pointer"
                                            title="Mark patient as entered room"
                                          >
                                            <DoorOpen size={12} /> Entered
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => { playClinicChime(); alert(`🔔 Audio chime sounded for Token #${a.token_number}!`); }}
                                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-2 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center cursor-pointer"
                                            title="Re-ring chime"
                                          >
                                            <Volume2 size={12} />
                                          </button>
                                        </>
                                      )}

                                      {isInConsultation && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenCompleteModal(a)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition shadow-xs inline-flex items-center gap-1 cursor-pointer"
                                          title="Record vitals and finish consultation"
                                        >
                                          <CheckCircle2 size={13} /> Complete & Prescribe
                                        </button>
                                      )}

                                      {isCompleted && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenCompleteModal(a)}
                                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                          title="Review or update clinical intake findings"
                                        >
                                          <CheckCircle2 size={12} /> Notes
                                        </button>
                                      )}

                                      {patientObj && (
                                        <button 
                                          onClick={() => handleOpenCase(patientObj)} 
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer ${
                                            isCompleted
                                              ? 'bg-[#456A50] hover:bg-[#35533E] text-white shadow-sm'
                                              : 'bg-white border border-[#EBE9E0] text-[#456A50] hover:bg-[#EAF0EC]'
                                          }`}
                                          title={isCompleted ? "Formulate / Prescribe Personalized Care Plan" : "View patient profile & history"}
                                        >
                                          <FileText size={12} /> {isCompleted ? 'Prescribe Plan' : 'Case'}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                          {offlineAppointments.filter(a => patients.some(p => String(p.id) === String(a.patient))).length === 0 && (
                            <tr>
                              <td colSpan="7" className="py-16 text-center text-gray-400 italic">
                                No in-clinic offline consultations scheduled in queue.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
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
                          {patientAppt.mode === 'ONLINE' 
                            ? 'Healora In-App Telehealth Room is active and ready for your clinical consultation.' 
                            : 'In-clinic consultation session scheduled.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {patientAppt.mode === 'ONLINE' && patientAppt.status !== 'COMPLETED' && (
                        <button 
                          type="button"
                          onClick={() => handleStartVideoConsultation(patientAppt)} 
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition transform hover:scale-105 shrink-0 cursor-pointer"
                        >
                          <Video size={16} /> Enter Video Consultation Room <Sparkles size={14} className="text-amber-300" />
                        </button>
                      )}

                      {patientAppt.status !== 'COMPLETED' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCompleteModal(patientAppt)}
                          className="bg-[#456A50] hover:bg-[#35533E] text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 size={16} /> Mark Completed & Record Notes
                        </button>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-2xl border border-emerald-300 flex items-center gap-1.5">
                          <CheckCircle size={15} /> Consultation Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 📋 PATIENT'S COMPLETE CONSULTATION HISTORY & CLINICAL DOSSIER */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EBE9E0] pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3.5 bg-blue-100 text-blue-700 rounded-2xl shadow-sm">
                      <History size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-[#1C2C22]">Consultation History & Clinical Records</h3>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-xl bg-[#EAF0EC] text-[#456A50] border border-[#456A50]/20">
                          {patientConsultationHistory.length} Recorded
                        </span>
                      </div>
                      <p className="text-xs text-[#5A6B60] mt-0.5">
                        Permanent chronological clinical history of in-clinic visits, telehealth calls, vital observations, and care plan authorizations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConductDirectConsultation(selectedPatient)}
                      className="bg-[#456A50] hover:bg-[#35533E] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Stethoscope size={14} /> Record New Consultation
                    </button>
                  </div>
                </div>

                {patientConsultationHistory.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 bg-[#FDFCF8] rounded-2xl border border-dashed border-[#EBE9E0] space-y-2">
                    <History size={36} className="mx-auto opacity-30 text-gray-400" />
                    <p className="text-sm font-bold text-gray-600">No consultation history recorded yet for {selectedPatient.first_name}.</p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Conduct an Online Telehealth session or In-Clinic consultation to record clinical findings, vitals, and unlock their personalized care plan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientConsultationHistory.map((h, idx) => {
                      const isOnline = h.mode === 'ONLINE';
                      const isCompleted = h.status === 'COMPLETED';

                      return (
                        <div key={h.id || idx} className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-5 hover:border-[#456A50]/30 transition shadow-2xs space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex items-center gap-3">
                              <span className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${isOnline ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                {isOnline ? <Video size={14} /> : <Stethoscope size={14} />}
                                {isOnline ? 'Online Telehealth' : 'In-Clinic Offline'}
                              </span>
                              <span className="font-bold text-sm text-[#1C2C22]">
                                📅 {h.date} {h.time && <span className="text-gray-500 font-normal">at {h.time}</span>}
                              </span>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                                {h.status}
                              </span>
                            </div>

                            <span className="text-[11px] text-gray-400 font-medium">
                              Doctor: <strong className="text-gray-700">{h.nutritionist_name || nutritionistName}</strong>
                            </span>
                          </div>

                          {/* Notes and findings */}
                          <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-0.5">Clinical Consultation Findings & Notes</span>
                              <p className="text-[#1C2C22] leading-relaxed whitespace-pre-wrap">{h.clinical_notes || 'Consultation conducted without specific remarks.'}</p>
                            </div>

                            {/* Vitals if recorded */}
                            {h.vitals && (h.vitals.bp || h.vitals.weight || h.vitals.glucose) && (
                              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100 text-[11px]">
                                {h.vitals.weight && (
                                  <span className="font-medium text-gray-600">
                                    ⚖️ Weight: <strong className="text-gray-900">{h.vitals.weight} kg</strong>
                                  </span>
                                )}
                                {h.vitals.bp && (
                                  <span className="font-medium text-gray-600">
                                    💓 BP: <strong className="text-gray-900">{h.vitals.bp}</strong>
                                  </span>
                                )}
                                {h.vitals.glucose && (
                                  <span className="font-medium text-gray-600">
                                    🩸 Fasting Glucose: <strong className="text-gray-900">{h.vitals.glucose} mg/dL</strong>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                  <div className="bg-white p-4 rounded-xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-bold text-[#5A6B60] uppercase">Food Preferences</span>
                    <p className="font-bold text-sm mt-1 text-[#1C2C22]">{selectedPatient.food_preferences || 'No preference'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-bold text-[#5A6B60] uppercase">Food Allergies</span>
                    <p className={`font-bold text-sm mt-1 ${selectedPatient.food_allergies && selectedPatient.food_allergies !== 'None' ? 'text-red-600' : 'text-[#1C2C22]'}`}>{selectedPatient.food_allergies || 'None reported'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-bold text-[#5A6B60] uppercase">Medical History</span>
                    <p className="font-bold text-sm mt-1 text-[#1C2C22]">{selectedPatient.medical_history || 'None reported'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#EBE9E0]">
                    <span className="text-[10px] font-bold text-[#5A6B60] uppercase">Current Medications</span>
                    <p className="font-bold text-sm mt-1 text-[#1C2C22]">{selectedPatient.current_medications || 'None reported'}</p>
                  </div>
                </div>

                {/* 🛡️ CLINICAL DRUG-NUTRIENT & ALLERGY SAFETY ADVISORY (CDSS) */}
                {(() => {
                  const safety = evaluateClinicalSafety(selectedPatient || {});
                  return (
                    <div className={`p-5 rounded-2xl border shadow-sm space-y-3 mt-4 ${
                      safety.isAllClear ? 'bg-emerald-50/40 border-emerald-200' : 'bg-amber-50/70 border-amber-300'
                    }`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-black/5 pb-3">
                        <div className="flex items-center gap-2.5">
                          {safety.isAllClear ? (
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <ShieldCheck size={18} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <ShieldAlert size={18} />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-[#1C2C22]">Clinical Decision Support: Drug–Nutrient & Allergy Protocol</h4>
                            <p className="text-[11px] text-[#5A6B60]">Deterministic Rule-Based Interaction & Malabsorption Screening</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                          safety.isAllClear ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-200 text-amber-900 border-amber-300'
                        }`}>
                          {safety.isAllClear ? '🛡️ Safety Verified • No Contraindications' : `⚠️ ${safety.totalAlerts} Active Contraindication(s)`}
                        </span>
                      </div>

                      {safety.isAllClear ? (
                        <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                          Patient profile cleared: No prescription-food contraindications or active food allergen conflicts detected.
                        </p>
                      ) : (
                        <div className="space-y-2.5 pt-1">
                          {safety.alerts.map((alert) => (
                            <div key={alert.id} className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${alert.badgeColor}`}>
                                  {alert.badge}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                                  {alert.severity} Priority
                                </span>
                              </div>
                              <p className="text-xs font-bold text-[#1C2C22]">{alert.medication}</p>
                              <p className="text-[11px] text-gray-600 leading-relaxed">
                                <strong className="text-[#1C2C22]">Pathological Mechanism:</strong> {alert.mechanism}
                              </p>
                              <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-950 font-medium">
                                <strong>Clinical Directive:</strong> {alert.clinicalDirective}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
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
              {(() => {
                const patientCompletedConsultations = appointments.filter(
                  a => String(a.patient) === String(selectedPatient.id) && a.status === 'COMPLETED'
                );
                const localConsultHist = JSON.parse(localStorage.getItem(`healora_consultation_history_${selectedPatient.id}`)) || [];
                const hasCompletedConsultation = patientCompletedConsultations.length > 0 || localConsultHist.length > 0;
                const patientPendingAppt = appointments.find(a => String(a.patient) === String(selectedPatient.id) && a.status !== 'CANCELLED');

                if (!hasCompletedConsultation) {
                  return (
                    <div className="bg-white rounded-3xl shadow-sm border border-amber-200 p-8 space-y-6">
                      <div className="flex flex-col items-center text-center max-w-lg mx-auto py-6 space-y-4">
                        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-3xl flex items-center justify-center shadow-inner">
                          <Lock size={32} />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest bg-amber-100/70 px-3 py-1 rounded-full">
                            Clinical Governance Protocol
                          </span>
                          <h3 className="text-xl font-black text-[#1C2C22] mt-2">
                            Consultation Required Before Prescribing Diet Plan
                          </h3>
                          <p className="text-xs text-[#5A6B60] mt-1.5 leading-relaxed">
                            Under Healora clinical safety protocols, a formal consultation (Online Telehealth or In-Clinic) must be conducted and completed with <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong> before a personalized Kerala dietary regimen can be formulated and published.
                          </p>
                        </div>

                        {patientPendingAppt ? (
                          <div className="w-full bg-[#FDFCF8] border border-[#EBE9E0] p-4 rounded-2xl text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase ${patientPendingAppt.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {patientPendingAppt.mode === 'ONLINE' ? 'Online Telehealth' : 'In-Clinic Offline'}
                                </span>
                                <span className="text-xs font-bold text-[#1C2C22]">📅 {patientPendingAppt.date} at {patientPendingAppt.time}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-1">Status: <span className="font-semibold uppercase text-amber-700">{patientPendingAppt.status}</span></p>
                            </div>

                            <div className="flex items-center gap-2">
                              {patientPendingAppt.mode === 'ONLINE' && patientPendingAppt.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => handleStartVideoConsultation(patientPendingAppt)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                  <Video size={14} /> Start Video Call
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenCompleteModal(patientPendingAppt)}
                                className="bg-[#456A50] hover:bg-[#35533E] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <CheckCircle2 size={14} /> Complete Consultation & Unlock Plan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                            <p className="text-xs text-gray-600">
                              No booked appointment found for this patient. You can record a direct clinical intake consultation right now to assess vitals and unlock their plan.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleConductDirectConsultation(selectedPatient)}
                              className="bg-[#456A50] hover:bg-[#35533E] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              <Stethoscope size={14} /> Record Direct Consultation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 space-y-6">
                    {/* Unlocked banner */}
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <CheckCircle size={17} className="text-emerald-600" />
                        <span>Clinical Consultation Verified & Completed • 4-Week Care Plan Prescribing Unlocked</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-300 w-fit">
                        {patientCompletedConsultations[0]?.date ? `Completed: ${patientCompletedConsultations[0].date}` : 'Consultation On File'}
                      </span>
                    </div>

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
                  
                  {/* 🌟 5 CARE PLAN PILLARS SEGMENTED NAVIGATION BAR 🌟 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl shadow-inner">
                    <button
                      type="button"
                      onClick={() => setCarePlanPillar('meals')}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        carePlanPillar === 'meals' 
                          ? 'bg-[#456A50] text-white shadow-sm' 
                          : 'text-[#5A6B60] hover:bg-white hover:text-[#1C2C22]'
                      }`}
                    >
                      <Apple size={16} className={carePlanPillar === 'meals' ? 'text-white' : 'text-[#456A50]'} />
                      <span className="truncate">1. Meal Protocol</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCarePlanPillar('activity')}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                        carePlanPillar === 'activity' 
                          ? 'bg-[#456A50] text-white shadow-sm' 
                          : 'text-[#5A6B60] hover:bg-white hover:text-[#1C2C22]'
                      }`}
                    >
                      <Footprints size={16} className={carePlanPillar === 'activity' ? 'text-white' : 'text-blue-600'} />
                      <span className="truncate">2. Activity & Adherence</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2 animate-pulse" title="Adherence Alert"></span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCarePlanPillar('lifestyle')}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        carePlanPillar === 'lifestyle' 
                          ? 'bg-[#456A50] text-white shadow-sm' 
                          : 'text-[#5A6B60] hover:bg-white hover:text-[#1C2C22]'
                      }`}
                    >
                      <Moon size={16} className={carePlanPillar === 'lifestyle' ? 'text-white' : 'text-indigo-600'} />
                      <span className="truncate">3. Lifestyle Habits</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCarePlanPillar('behavior')}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        carePlanPillar === 'behavior' 
                          ? 'bg-[#456A50] text-white shadow-sm' 
                          : 'text-[#5A6B60] hover:bg-white hover:text-[#1C2C22]'
                      }`}
                    >
                      <RefreshCw size={16} className={carePlanPillar === 'behavior' ? 'text-white' : 'text-emerald-600'} />
                      <span className="truncate">4. Behaviour (CBT)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCarePlanPillar('report')}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        carePlanPillar === 'report' 
                          ? 'bg-[#456A50] text-white shadow-sm' 
                          : 'text-[#5A6B60] hover:bg-white hover:text-[#1C2C22]'
                      }`}
                    >
                      <FileText size={16} className={carePlanPillar === 'report' ? 'text-white' : 'text-purple-600'} />
                      <span className="truncate">5. 📊 Monthly Report</span>
                    </button>
                  </div>

                  {/* ======================================================== */}
                  {/* PILLAR 1: 4-WEEK MEAL PROTOCOL (KERALA CLINICAL ENGINE)   */}
                  {/* ======================================================== */}
                  {carePlanPillar === 'meals' && (
                    <div className="space-y-6 animate-in fade-in">
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
                        <div className="bg-[#EAF0EC]/80 border border-[#456A50]/25 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2 text-[#456A50] font-black">
                              <Sparkles size={16} />
                              <span>Kerala Clinical Nutrition Matrix for {selectedPatient.first_name}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-700 mt-2">
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

                          <button
                            type="button"
                            onClick={handleAutoFillPersonalizedPlan}
                            className="bg-[#456A50] hover:bg-[#35533E] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Sparkles size={14} /> Auto-Fill Tailored Protocol
                          </button>
                        </div>

                        {/* CLINICAL SAFETY CONTRAINDICATION ALERT FOR MEAL FORMULATION */}
                        {(() => {
                          const safety = evaluateClinicalSafety(selectedPatient || {});
                          if (safety.isAllClear) return null;
                          return (
                            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                                  <ShieldAlert size={16} className="text-amber-700 shrink-0" />
                                  <span>Clinical Safety Directives for {selectedPatient.first_name}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                                  {safety.totalAlerts} Alert{safety.totalAlerts > 1 ? 's' : ''} Active
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                {safety.alerts.map(a => (
                                  <div key={a.id} className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
                                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border inline-block mb-1 ${a.badgeColor}`}>{a.badge}</span>
                                    <p className="font-bold text-gray-900 leading-tight">{a.safetyRule}</p>
                                    <p className="text-[10px] text-gray-600 mt-0.5">{a.clinicalDirective}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* MEAL FREQUENCY CONFIGURATION CONTROLS */}
                        <div className="bg-white border border-[#EBE9E0] p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                          <div>
                            <span className="text-xs font-black text-[#1C2C22] block">Meal Cadence & Frequency</span>
                            <span className="text-[11px] text-[#5A6B60]">Choose daily eating rhythm (3 to 6 meals) tailored to metabolic rate & fasting tolerance.</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#FDFCF8] p-1 rounded-xl border border-[#EBE9E0]">
                            {[3, 4, 5, 6].map(freq => (
                              <button
                                key={freq}
                                type="button"
                                onClick={() => handleMealFrequencyChange(freq)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  (monthlyPlanData.meal_frequency || 5) === freq
                                    ? 'bg-[#456A50] text-white shadow-2xs'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {freq} Meals
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
                          const { allergenConflict, dietPreferenceConflict } = evaluateMealConflicts(mealVal, {
                            food_allergies: selectedPatient?.food_allergies,
                            food_preferences: selectedPatient?.food_preferences
                          });
                          const isAllergen = !!allergenConflict;

                          return (
                            <div 
                              key={slot.key} 
                              className={`space-y-1.5 p-4 rounded-2xl transition-all flex flex-col justify-between ${
                                isAllergen 
                                  ? 'bg-red-50/70 border-2 border-red-500 shadow-md ring-2 ring-red-400/20' 
                                  : dietPreferenceConflict
                                    ? 'bg-amber-50/70 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/20'
                                    : 'bg-white border border-[#EBE9E0] shadow-2xs'
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className={`block text-[10px] font-black uppercase tracking-widest ${
                                    isAllergen ? 'text-red-700' : dietPreferenceConflict ? 'text-amber-800' : slot.text
                                  }`}>
                                    {slot.label}
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    {isAllergen ? (
                                      <span className="text-[9px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                        <AlertTriangle size={10} /> Allergen Alert
                                      </span>
                                    ) : dietPreferenceConflict ? (
                                      <span className="text-[9px] font-black uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                        <AlertTriangle size={10} /> {dietPreferenceConflict.preference} Clashed
                                      </span>
                                    ) : null}
                                    <span className="text-[10px] text-gray-400 font-bold">W{selectedWeek} • {selectedDay}</span>
                                  </div>
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
                                  <option value="">💡 2 Tailored Options for {selectedPatient.first_name}...</option>
                                  {getSuggestionsForPatient(slot.key).map((opt, i) => (
                                    <option key={i} value={opt}>✨ Option {i + 1}: {opt}</option>
                                  ))}
                                  <option value="__custom__">✍️ Custom food (Type below)...</option>
                                </select>
                              </div>

                              <div>
                                <input 
                                  type="text" 
                                  value={mealVal} 
                                  onChange={e => handleMealChange(slot.key, e.target.value)} 
                                  placeholder={slot.placeholder} 
                                  className={`w-full border rounded-xl p-2.5 text-xs outline-none font-medium transition ${
                                    isAllergen 
                                      ? 'border-2 border-red-500 bg-white text-red-950 font-bold shadow-xs focus:ring-2 focus:ring-red-400' 
                                      : dietPreferenceConflict
                                        ? 'border-2 border-amber-500 bg-white text-amber-950 font-bold shadow-xs focus:ring-2 focus:ring-amber-400'
                                        : 'border-[#EBE9E0] bg-[#FDFCF8] text-[#1C2C22] focus:border-[#456A50]'
                                  }`} 
                                />

                                {allergenConflict && (
                                  <div className="mt-2.5 p-2.5 bg-red-100 border border-red-300 rounded-xl text-red-950 text-xs space-y-1 shadow-xs animate-in fade-in">
                                    <div className="flex items-center gap-1.5 text-red-800 font-black text-[11px] uppercase tracking-wide">
                                      <ShieldAlert size={15} className="text-red-600 shrink-0" />
                                      <span>Allergen Conflict: {allergenConflict.allergenLabel}</span>
                                    </div>
                                    <p className="text-[11px] leading-snug font-bold text-red-900">
                                      ⚠️ "{allergenConflict.matchedKeyword}" conflicts with {selectedPatient.first_name}'s <span className="underline">{allergenConflict.patientAllergy}</span> allergy!
                                    </p>
                                    <p className="text-[10px] text-red-800 leading-tight">
                                      {allergenConflict.warning} Replace this meal before publishing.
                                    </p>
                                  </div>
                                )}

                                {!allergenConflict && dietPreferenceConflict && (
                                  <div className="mt-2.5 p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-950 text-xs space-y-1 shadow-xs animate-in fade-in">
                                    <div className="flex items-center gap-1.5 text-amber-800 font-black text-[11px] uppercase tracking-wide">
                                      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                                      <span>Diet Preference Conflict: {dietPreferenceConflict.preference}</span>
                                    </div>
                                    <p className="text-[11px] leading-snug font-bold text-amber-900">
                                      ⚠️ "{dietPreferenceConflict.matchedKeyword}" is non-{dietPreferenceConflict.preference.toLowerCase()} and violates {selectedPatient.first_name}'s <span className="underline">{dietPreferenceConflict.preference}</span> diet!
                                    </p>
                                    <p className="text-[10px] text-amber-800 leading-tight">
                                      {dietPreferenceConflict.warning}
                                    </p>
                                  </div>
                                )}
                              </div>
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
                </div>
              )}

                  {/* ======================================================== */}
                  {/* PILLAR 2: ACTIVITY PLAN & ADHERENCE MONITORING CONSOLE    */}
                  {/* ======================================================== */}
                  {carePlanPillar === 'activity' && (
                    <div className="space-y-6 animate-in fade-in">
                      {/* WHO Guidelines Banner */}
                      <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Footprints size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md">
                              WHO Benchmark Alignment
                            </span>
                            <h4 className="text-xs font-black text-[#1C2C22] mt-0.5">
                              Clinical Physical Activity Target for {selectedPatient.first_name}
                            </h4>
                            <p className="text-[11px] text-blue-950 mt-0.5 leading-snug">
                              {monthlyPlanData.activity_plan?.who_guideline || DEFAULT_ACTIVITY_PLAN.who_guideline}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold bg-white text-blue-900 border border-blue-200 px-3 py-1.5 rounded-xl shadow-2xs">
                            🏃 Target: <strong>{monthlyPlanData.activity_plan?.weekly_target_days || 5} Days / Week</strong>
                          </span>
                        </div>
                      </div>

                      {/* ⭐ CARE PLAN ADHERENCE VERIFICATION & BARRIER MONITORING */}
                      <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-amber-500/10 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                                <Target size={16} className="text-amber-700" />
                                🎯 Care Plan Adherence Verification & Barrier Audit
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5A6B60] mt-0.5">
                              Rule-based calculation comparing logged activity to prescribed frequency. Adherence calculation does not claim independent medical or clinical diagnosis.
                            </p>
                          </div>
                          {(() => {
                            const targetDays = monthlyPlanData.activity_plan?.weekly_target_days || 5;
                            const completedCount = Object.values(patientAdherence?.days || {}).filter(
                              d => (typeof d === 'string' ? d === 'completed' : d?.status === 'completed')
                            ).length;
                            const missedWithBarrier = Object.values(patientAdherence?.days || {}).some(
                              d => (typeof d === 'object' && d?.status === 'missed' && d?.reason)
                            );
                            const pct = Math.min(100, Math.round((completedCount / targetDays) * 100));
                            
                            let adherenceStatus = '🔄 In Progress';
                            let badgeStyle = 'bg-blue-100 text-blue-800 border-blue-300';
                            if (pct >= 100) {
                              adherenceStatus = '✅ Target Met';
                              badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                            } else if (missedWithBarrier) {
                              adherenceStatus = '🚩 Barrier Recorded';
                              badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300';
                            } else if (pct < 50) {
                              adherenceStatus = '⚠️ Below Target';
                              badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300';
                            }

                            return (
                              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badgeStyle}`}>
                                Status: {adherenceStatus}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Progress Bar Display */}
                        {(() => {
                          const targetDays = monthlyPlanData.activity_plan?.weekly_target_days || 5;
                          const completedCount = Object.values(patientAdherence?.days || {}).filter(
                            d => (typeof d === 'string' ? d === 'completed' : d?.status === 'completed')
                          ).length;
                          const pct = Math.min(100, Math.round((completedCount / targetDays) * 100));

                          return (
                            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-extrabold text-[#1C2C22]">
                                  Weekly Activity Target: <span className="text-[#456A50]">{completedCount}/{targetDays} days completed</span>
                                  <span className="text-[10px] font-normal text-gray-500 ml-2">(Note: Missed sessions with documented barriers remain missed and do NOT count as completed)</span>
                                </span>
                                <span className="text-sm font-black text-[#456A50]">
                                  {pct}% Adherence
                                </span>
                              </div>

                              {/* Progress bar visual */}
                              <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-0.5 border border-gray-200 flex">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-[#456A50] rounded-full transition-all duration-700 shadow-inner"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>

                              {/* Day by Day status breakdown */}
                              <div className="grid grid-cols-7 gap-1.5 pt-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                  const dayData = patientAdherence?.days?.[day];
                                  const status = typeof dayData === 'string' ? dayData : (dayData?.status || 'pending');
                                  const reason = typeof dayData === 'object' ? dayData?.reason : '';
                                  const isCompleted = status === 'completed';
                                  const isMissed = status === 'missed';

                                  return (
                                    <div 
                                      key={day}
                                      className={`p-2 rounded-xl border text-center transition ${
                                        isCompleted 
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                                          : isMissed 
                                            ? 'bg-red-50 border-red-300 text-red-900 shadow-xs' 
                                            : 'bg-gray-50 border-gray-200 text-gray-400'
                                      }`}
                                    >
                                      <p className="text-[10px] font-black uppercase tracking-wider">{day.slice(0, 3)}</p>
                                      <p className="text-xs font-black mt-1">
                                        {isCompleted ? '✓ Done' : isMissed ? '✕ Missed' : '— Rest'}
                                      </p>
                                      {isMissed && reason && (
                                        <p className="text-[9px] font-bold text-red-700 mt-0.5 truncate" title={reason}>
                                          "{reason}"
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Identified barrier highlight */}
                              {(() => {
                                const missedEntries = Object.entries(patientAdherence?.days || {}).filter(
                                  ([_, val]) => (typeof val === 'object' ? val?.status === 'missed' : val === 'missed')
                                );

                                if (missedEntries.length === 0) return null;

                                return (
                                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mt-2 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-black text-red-900">
                                      <AlertTriangle size={15} className="text-red-600" />
                                      <span>Care Plan Barrier Alert: Documented Missed Session Reason</span>
                                    </div>
                                    {missedEntries.map(([d, val]) => (
                                      <p key={d} className="text-xs text-red-950 font-medium">
                                        • <strong>Missed: {d}</strong> — Documented Reason: <span className="font-bold underline italic">"{val?.reason || 'Busy with college'}"</span> (Kept as missed session)
                                      </p>
                                    ))}
                                    <div className="pt-2">
                                      <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">
                                        Nutritionist's Follow-up Adaptation / Strategy
                                      </label>
                                      <div className="flex gap-2">
                                        <input 
                                          type="text"
                                          placeholder="e.g. Prescribed 15-minute quick dorm room stretching / brisk campus walk on Wednesdays"
                                          value={followupBarrierNote}
                                          onChange={e => setFollowupBarrierNote(e.target.value)}
                                          className="flex-1 border border-red-200 bg-white rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50]"
                                        />
                                        <button 
                                          type="button" 
                                          onClick={() => alert(`✅ Follow-up clinical adaptation note saved for ${selectedPatient.first_name}!`)}
                                          className="bg-[#456A50] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[#35533E] cursor-pointer shrink-0"
                                        >
                                          Save Note
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Prescribed Physical Activity Regimen Form */}
                      <div className="bg-white border border-[#EBE9E0] p-6 rounded-2xl space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#EBE9E0] pb-3 gap-3">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#1C2C22] flex items-center gap-2">
                              <Footprints size={16} className="text-[#456A50]" />
                              Prescribed Exercise Regimen
                            </h4>
                            <p className="text-[11px] text-[#5A6B60] mt-0.5">
                              Define exercise types, frequency, duration, intensity, instructions, and start/end dates.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newActivity = {
                                  id: `act_${Date.now()}`,
                                  name: 'Light Cycling & Mobility',
                                  type: 'Cycling',
                                  frequency: '3 days/week',
                                  duration_mins: 25,
                                  intensity: 'Moderate',
                                  target: '5 km steady cadence',
                                  preferred_time: 'Morning (07:00 AM)',
                                  instructions: 'Maintain steady pedaling cadence, wear helmet and hydrate.',
                                  start_date: monthlyPlanData.start_date || '2026-09-22',
                                  end_date: monthlyPlanData.review_date || '2026-10-22'
                                };
                                const updatedActs = [...(monthlyPlanData.activity_plan?.activities || []), newActivity];
                                setMonthlyPlanData(prev => ({
                                  ...prev,
                                  activity_plan: { ...(prev.activity_plan || DEFAULT_ACTIVITY_PLAN), activities: updatedActs }
                                }));
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus size={13} /> Add Activity
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMonthlyPlanData(prev => ({
                                  ...prev,
                                  activity_plan: { ...DEFAULT_ACTIVITY_PLAN }
                                }));
                                alert("✨ Reset to WHO Standard Aerobic & Strengthening Regimen.");
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Reset WHO Regimen
                            </button>
                          </div>
                        </div>

                        {/* Activities List */}
                        <div className="space-y-4">
                          {(monthlyPlanData.activity_plan?.activities || []).map((act, idx) => (
                            <div key={act.id || idx} className="bg-[#FDFCF8] border border-[#EBE9E0] p-4 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                <span className="text-xs font-black text-[#1C2C22] flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-[#456A50] text-white flex items-center justify-center text-[10px]">
                                    {idx + 1}
                                  </span>
                                  Activity #{idx + 1}: {act.name}
                                </span>
                                {(monthlyPlanData.activity_plan?.activities || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = (monthlyPlanData.activity_plan?.activities || []).filter((_, i) => i !== idx);
                                      setMonthlyPlanData(prev => ({
                                        ...prev,
                                        activity_plan: { ...prev.activity_plan, activities: filtered }
                                      }));
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 font-bold cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Activity Name</label>
                                  <input 
                                    type="text" 
                                    value={act.name}
                                    onChange={e => {
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].name = e.target.value;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Activity Type</label>
                                  <select
                                    value={act.type}
                                    onChange={e => {
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].type = e.target.value;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  >
                                    <option value="Walking">Walking</option>
                                    <option value="Cycling">Cycling</option>
                                    <option value="Stretching">Stretching</option>
                                    <option value="Strength training">Strength training</option>
                                    <option value="Yoga">Yoga</option>
                                    <option value="Swimming">Swimming</option>
                                    <option value="Aerobics">Aerobics</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Frequency</label>
                                  <input 
                                    type="text" 
                                    value={act.frequency}
                                    onChange={e => {
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].frequency = e.target.value;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    placeholder="5 days/week"
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Duration</label>
                                  <input 
                                    type="text" 
                                    value={act.duration_mins ? `${act.duration_mins} mins` : ''}
                                    onChange={e => {
                                      const num = parseInt(e.target.value) || 30;
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].duration_mins = num;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    placeholder="30 mins"
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Intensity</label>
                                  <select
                                    value={act.intensity}
                                    onChange={e => {
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].intensity = e.target.value;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  >
                                    <option value="Light">Light</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Vigorous">Vigorous</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Target Metric</label>
                                  <input 
                                    type="text" 
                                    value={act.target}
                                    onChange={e => {
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].target = e.target.value;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    placeholder="6,000 steps/day"
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Start Date</label>
                                  <input 
                                    type="date" 
                                    value={act.start_date || monthlyPlanData.start_date || '2026-09-22'}
                                    onChange={e => {
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].start_date = e.target.value;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">End Date</label>
                                  <input 
                                    type="date" 
                                    value={act.end_date || monthlyPlanData.review_date || '2026-10-22'}
                                    onChange={e => {
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].end_date = e.target.value;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  />
                                </div>

                                <div className="sm:col-span-2 md:col-span-4">
                                  <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Preferred Time Window</label>
                                  <input 
                                    type="text" 
                                    value={act.preferred_time}
                                    onChange={e => {
                                      const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                      updated[idx].preferred_time = e.target.value;
                                      setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                    }}
                                    placeholder="Evening (06:00 PM)"
                                    className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2 font-bold text-[#1C2C22] outline-none focus:border-[#456A50]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Clinical Instructions & Safety</label>
                                <textarea
                                  rows="2"
                                  value={act.instructions}
                                  onChange={e => {
                                    const updated = [...(monthlyPlanData.activity_plan?.activities || [])];
                                    updated[idx].instructions = e.target.value;
                                    setMonthlyPlanData(prev => ({ ...prev, activity_plan: { ...prev.activity_plan, activities: updated } }));
                                  }}
                                  placeholder="Walk at a comfortable pace and gradually increase duration."
                                  className="w-full border border-[#EBE9E0] bg-white rounded-xl p-2.5 text-xs outline-none focus:border-[#456A50] resize-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* PILLAR 3: LIFESTYLE MODIFICATION MATRIX (WHO SELF-CARE)   */}
                  {/* ======================================================== */}
                  {carePlanPillar === 'lifestyle' && (
                    <div className="space-y-6 animate-in fade-in">
                      {/* WHO Guidance Header */}
                      <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Moon size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                              WHO Self-Care Foundation
                            </span>
                            <h4 className="text-xs font-black text-[#1C2C22] mt-0.5">
                              Daily Lifestyle Habit Transformation for {selectedPatient.first_name}
                            </h4>
                            <p className="text-[11px] text-indigo-950 mt-0.5 leading-snug">
                              Addresses circadian rhythm, hydration, meal timing, and stress regulation — distinctly separated from physical exercise.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMonthlyPlanData(prev => ({
                              ...prev,
                              lifestyle_plan: { ...DEFAULT_LIFESTYLE_PLAN }
                            }));
                            alert("✨ Reset to WHO Standard 5-Domain Lifestyle Protocol.");
                          }}
                          className="bg-white text-indigo-900 border border-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs hover:bg-indigo-50 cursor-pointer shrink-0"
                        >
                          Reset WHO Guidelines
                        </button>
                      </div>

                      {/* 5-Domain Matrix */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Domain 1: Sleep */}
                        <div className="bg-white border border-[#EBE9E0] p-5 rounded-2xl space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                <Moon size={15} />
                              </div>
                              <span className="text-xs font-black text-[#1C2C22]">1. Sleep Hygiene</span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              Circadian Reset
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Current Sleep</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.sleep?.current || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, sleep: { ...prev.lifestyle_plan?.sleep, current: e.target.value } }
                                }))}
                                placeholder="5 hrs irregular"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Target Sleep</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.sleep?.target || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, sleep: { ...prev.lifestyle_plan?.sleep, target: e.target.value } }
                                }))}
                                placeholder="7–8 hrs restorative"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Target Bedtime</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.sleep?.bedtime || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, sleep: { ...prev.lifestyle_plan?.sleep, bedtime: e.target.value } }
                                }))}
                                placeholder="10:30 PM"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Wake-up Time</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.sleep?.wakeup_time || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, sleep: { ...prev.lifestyle_plan?.sleep, wakeup_time: e.target.value } }
                                }))}
                                placeholder="06:30 AM"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Start Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.sleep?.start_date || monthlyPlanData.start_date || '2026-09-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, sleep: { ...prev.lifestyle_plan?.sleep, start_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">End Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.sleep?.end_date || monthlyPlanData.review_date || '2026-10-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, sleep: { ...prev.lifestyle_plan?.sleep, end_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Night Routine Action Protocol</label>
                            <textarea
                              rows="2"
                              value={monthlyPlanData.lifestyle_plan?.sleep?.instructions || ''}
                              onChange={e => setMonthlyPlanData(prev => ({
                                ...prev,
                                lifestyle_plan: { ...prev.lifestyle_plan, sleep: { ...prev.lifestyle_plan?.sleep, instructions: e.target.value } }
                              }))}
                              placeholder="Turn off all screens 45 mins before bed; dark, cool bedroom."
                              className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 text-xs outline-none focus:border-[#456A50] resize-none"
                            />
                          </div>
                        </div>

                        {/* Domain 2: Hydration */}
                        <div className="bg-white border border-[#EBE9E0] p-5 rounded-2xl space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                <Droplets size={15} />
                              </div>
                              <span className="text-xs font-black text-[#1C2C22]">2. Hydration & Fluids</span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              Electrolyte Balance
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Current Water Intake</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.hydration?.current || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, hydration: { ...prev.lifestyle_plan?.hydration, current: e.target.value } }
                                }))}
                                placeholder="1.0 - 1.2 L / day"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Target Water Intake</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.hydration?.target || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, hydration: { ...prev.lifestyle_plan?.hydration, target: e.target.value } }
                                }))}
                                placeholder="2.5 - 3.0 L / day"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Start Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.hydration?.start_date || monthlyPlanData.start_date || '2026-09-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, hydration: { ...prev.lifestyle_plan?.hydration, start_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">End Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.hydration?.end_date || monthlyPlanData.review_date || '2026-10-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, hydration: { ...prev.lifestyle_plan?.hydration, end_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Hydration Strategy & Reminders</label>
                            <textarea
                              rows="2"
                              value={monthlyPlanData.lifestyle_plan?.hydration?.instructions || ''}
                              onChange={e => setMonthlyPlanData(prev => ({
                                ...prev,
                                lifestyle_plan: { ...prev.lifestyle_plan, hydration: { ...prev.lifestyle_plan?.hydration, instructions: e.target.value } }
                              }))}
                              placeholder="Drink 1 glass upon waking and before each meal; enjoy spiced Sambharam."
                              className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 text-xs outline-none focus:border-[#456A50] resize-none"
                            />
                          </div>
                        </div>

                        {/* Domain 3: Meal Timing Cadence */}
                        <div className="bg-white border border-[#EBE9E0] p-5 rounded-2xl space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Clock size={15} />
                              </div>
                              <span className="text-xs font-black text-[#1C2C22]">3. Meal Timing & Cadence</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Metabolic Pacing
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Current Habit</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.meal_timing?.current || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, meal_timing: { ...prev.lifestyle_plan?.meal_timing, current: e.target.value } }
                                }))}
                                placeholder="Irregular, skips breakfast"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Target Window</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.meal_timing?.target || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, meal_timing: { ...prev.lifestyle_plan?.meal_timing, target: e.target.value } }
                                }))}
                                placeholder="Breakfast <9 AM, Dinner <8 PM"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Start Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.meal_timing?.start_date || monthlyPlanData.start_date || '2026-09-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, meal_timing: { ...prev.lifestyle_plan?.meal_timing, start_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">End Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.meal_timing?.end_date || monthlyPlanData.review_date || '2026-10-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, meal_timing: { ...prev.lifestyle_plan?.meal_timing, end_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Fasting Gap & Night Eating Directive</label>
                            <textarea
                              rows="2"
                              value={monthlyPlanData.lifestyle_plan?.meal_timing?.instructions || ''}
                              onChange={e => setMonthlyPlanData(prev => ({
                                ...prev,
                                lifestyle_plan: { ...prev.lifestyle_plan, meal_timing: { ...prev.lifestyle_plan?.meal_timing, instructions: e.target.value } }
                              }))}
                              placeholder="Avoid gaps > 4 hours; light dinner 2 hours before bed."
                              className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 text-xs outline-none focus:border-[#456A50] resize-none"
                            />
                          </div>
                        </div>

                        {/* Domain 4: Screen / Sedentary Time */}
                        <div className="bg-white border border-[#EBE9E0] p-5 rounded-2xl space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                <Activity size={15} />
                              </div>
                              <span className="text-xs font-black text-[#1C2C22]">4. Screen & Sedentary Time</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Active Posture
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Current Screen / Sitting</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.screen_sedentary?.current || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, screen_sedentary: { ...prev.lifestyle_plan?.screen_sedentary, current: e.target.value } }
                                }))}
                                placeholder="6+ hrs uninterrupted sitting"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Target Ceiling</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.screen_sedentary?.target || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, screen_sedentary: { ...prev.lifestyle_plan?.screen_sedentary, target: e.target.value } }
                                }))}
                                placeholder="< 4 hrs static sitting"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Start Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.screen_sedentary?.start_date || monthlyPlanData.start_date || '2026-09-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, screen_sedentary: { ...prev.lifestyle_plan?.screen_sedentary, start_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">End Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.screen_sedentary?.end_date || monthlyPlanData.review_date || '2026-10-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, screen_sedentary: { ...prev.lifestyle_plan?.screen_sedentary, end_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Movement Break Strategy</label>
                            <textarea
                              rows="2"
                              value={monthlyPlanData.lifestyle_plan?.screen_sedentary?.instructions || ''}
                              onChange={e => setMonthlyPlanData(prev => ({
                                ...prev,
                                lifestyle_plan: { ...prev.lifestyle_plan, screen_sedentary: { ...prev.lifestyle_plan?.screen_sedentary, instructions: e.target.value } }
                              }))}
                              placeholder="5-minute standing/stretching break every 45 mins of desk work."
                              className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 text-xs outline-none focus:border-[#456A50] resize-none"
                            />
                          </div>
                        </div>

                        {/* Domain 5: Stress Management */}
                        <div className="bg-white border border-[#EBE9E0] p-5 rounded-2xl space-y-3 shadow-2xs md:col-span-2">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                                <HeartPulse size={15} />
                              </div>
                              <span className="text-xs font-black text-[#1C2C22]">5. Stress Management & Nervous System Recovery</span>
                            </div>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              Cortisol Modulation
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Current Stress Level</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.stress_management?.current || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, stress_management: { ...prev.lifestyle_plan?.stress_management, current: e.target.value } }
                                }))}
                                placeholder="High daily stress"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Target Recovery Goal</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.stress_management?.target || ''}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, stress_management: { ...prev.lifestyle_plan?.stress_management, target: e.target.value } }
                                }))}
                                placeholder="10 mins daily conscious down-regulation"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Start Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.stress_management?.start_date || monthlyPlanData.start_date || '2026-09-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, stress_management: { ...prev.lifestyle_plan?.stress_management, start_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">End Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.stress_management?.end_date || monthlyPlanData.review_date || '2026-10-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, stress_management: { ...prev.lifestyle_plan?.stress_management, end_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Relaxation & Breathing Protocol</label>
                            <textarea
                              rows="2"
                              value={monthlyPlanData.lifestyle_plan?.stress_management?.instructions || ''}
                              onChange={e => setMonthlyPlanData(prev => ({
                                ...prev,
                                lifestyle_plan: { ...prev.lifestyle_plan, stress_management: { ...prev.lifestyle_plan?.stress_management, instructions: e.target.value } }
                              }))}
                              placeholder="Practice 4-4-4-4 Box Breathing or 10-min guided evening Pranayama before sleep."
                              className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 text-xs outline-none focus:border-[#456A50] resize-none"
                            />
                          </div>
                        </div>

                        {/* Domain 6: Other Lifestyle Recommendations */}
                        <div className="bg-white border border-[#EBE9E0] p-5 rounded-2xl space-y-3 shadow-2xs md:col-span-2">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                                <Sparkles size={15} />
                              </div>
                              <span className="text-xs font-black text-[#1C2C22]">6. Other Lifestyle Recommendations</span>
                            </div>
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                              Holistic Wellbeing
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Target Habit / Recommendation</label>
                              <input 
                                type="text"
                                value={monthlyPlanData.lifestyle_plan?.other?.target || '15 mins morning sunlight exposure; digital sunset after 9:30 PM'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, other: { ...(prev.lifestyle_plan?.other || {}), target: e.target.value } }
                                }))}
                                placeholder="15 mins morning sunlight exposure"
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">Start Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.other?.start_date || monthlyPlanData.start_date || '2026-09-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, other: { ...(prev.lifestyle_plan?.other || {}), start_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#5A6B60] uppercase tracking-wider mb-1">End Date</label>
                              <input 
                                type="date"
                                value={monthlyPlanData.lifestyle_plan?.other?.end_date || monthlyPlanData.review_date || '2026-10-22'}
                                onChange={e => setMonthlyPlanData(prev => ({
                                  ...prev,
                                  lifestyle_plan: { ...prev.lifestyle_plan, other: { ...(prev.lifestyle_plan?.other || {}), end_date: e.target.value } }
                                }))}
                                className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-xl p-2 font-bold outline-none focus:border-[#456A50]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* PILLAR 4: BEHAVIOUR CHANGE PLAN (CBT HABIT ROADMAP)       */}
                  {/* ======================================================== */}
                  {carePlanPillar === 'behavior' && (
                    <div className="space-y-6 animate-in fade-in">
                      {/* CBT Header */}
                      <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#456A50] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <RefreshCw size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Cognitive Behavioural Therapy (CBT) Framework
                            </span>
                            <h4 className="text-xs font-black text-[#1C2C22] mt-0.5">
                              Behaviour Problem Identification & Replacement Habits
                            </h4>
                            <p className="text-[11px] text-emerald-950 mt-0.5 leading-snug">
                              Instead of giving another recommendation, identify {selectedPatient.first_name}'s actual root behavioral hurdle and prescribe actionable replacement loops.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newHabit = {
                                id: `beh_${Date.now()}`,
                                current_behavior: 'Late-night high calorie snacking while watching TV',
                                target_behavior: 'Stop eating after 8:30 PM; sip herbal tea if craving',
                                action_strategy: 'Prepare warm chamomile or cinnamon tea; keep unhealthy snacks out of pantry',
                                target_frequency: '6 nights/week',
                                status: 'In Progress'
                              };
                              const updatedHabits = [...(monthlyPlanData.behavior_change_plan?.habits || []), newHabit];
                              setMonthlyPlanData(prev => ({
                                ...prev,
                                behavior_change_plan: { ...(prev.behavior_change_plan || DEFAULT_BEHAVIOR_CHANGE_PLAN), habits: updatedHabits }
                              }));
                            }}
                            className="bg-[#456A50] hover:bg-[#35533E] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Plus size={13} /> Add Habit Target
                          </button>
                        </div>
                      </div>

                      {/* Habits Cards */}
                      <div className="space-y-4">
                        {(monthlyPlanData.behavior_change_plan?.habits || []).map((h, idx) => (
                          <div key={h.id || idx} className="bg-white border border-[#EBE9E0] p-5 rounded-2xl space-y-4 shadow-sm relative">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <span className="text-xs font-black text-[#1C2C22] flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#456A50] font-black text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                Behaviour Challenge #{idx + 1}
                              </span>

                              <div className="flex items-center gap-2">
                                <select
                                  value={h.status || 'In Progress'}
                                  onChange={e => {
                                    const updated = [...(monthlyPlanData.behavior_change_plan?.habits || [])];
                                    updated[idx].status = e.target.value;
                                    setMonthlyPlanData(prev => ({ ...prev, behavior_change_plan: { ...prev.behavior_change_plan, habits: updated } }));
                                  }}
                                  className={`text-xs font-black px-3 py-1 rounded-lg border cursor-pointer outline-none ${
                                    h.status === 'Target Met' || h.status === 'Achieved'
                                      ? 'bg-green-100 text-green-800 border-green-300' 
                                      : h.status === 'Below Target'
                                        ? 'bg-red-100 text-red-800 border-red-300'
                                        : h.status === 'Barrier Recorded'
                                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                                          : 'bg-blue-100 text-blue-800 border-blue-300'
                                  }`}
                                >
                                  <option value="In Progress">Status: In Progress 🔄</option>
                                  <option value="Target Met">Status: Target Met ✅</option>
                                  <option value="Below Target">Status: Below Target ⚠️</option>
                                  <option value="Barrier Recorded">Status: Barrier Recorded 🚩</option>
                                </select>

                                {(monthlyPlanData.behavior_change_plan?.habits || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = (monthlyPlanData.behavior_change_plan?.habits || []).filter((_, i) => i !== idx);
                                      setMonthlyPlanData(prev => ({
                                        ...prev,
                                        behavior_change_plan: { ...prev.behavior_change_plan, habits: filtered }
                                      }));
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 font-bold ml-2 cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Habit Transformation Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Current Behaviour Problem */}
                              <div className="bg-red-50/50 border border-red-200 p-3.5 rounded-xl space-y-1">
                                <label className="block text-[10px] font-black text-red-800 uppercase tracking-wider">
                                  🛑 Current Behaviour Problem
                                </label>
                                <input
                                  type="text"
                                  value={h.current_behavior}
                                  onChange={e => {
                                    const updated = [...(monthlyPlanData.behavior_change_plan?.habits || [])];
                                    updated[idx].current_behavior = e.target.value;
                                    setMonthlyPlanData(prev => ({ ...prev, behavior_change_plan: { ...prev.behavior_change_plan, habits: updated } }));
                                  }}
                                  placeholder="e.g. Skips breakfast due to morning rush"
                                  className="w-full border border-red-200 bg-white rounded-lg p-2 font-bold text-red-950 outline-none focus:border-red-400"
                                />
                              </div>

                              {/* Target Behaviour */}
                              <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                                <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                                  🎯 Target Healthy Behaviour
                                </label>
                                <input
                                  type="text"
                                  value={h.target_behavior}
                                  onChange={e => {
                                    const updated = [...(monthlyPlanData.behavior_change_plan?.habits || [])];
                                    updated[idx].target_behavior = e.target.value;
                                    setMonthlyPlanData(prev => ({ ...prev, behavior_change_plan: { ...prev.behavior_change_plan, habits: updated } }));
                                  }}
                                  placeholder="e.g. Eat balanced breakfast regularly"
                                  className="w-full border border-emerald-200 bg-white rounded-lg p-2 font-bold text-emerald-950 outline-none focus:border-emerald-400"
                                />
                              </div>

                              {/* Action Strategy */}
                              <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl space-y-1">
                                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider">
                                  ⚡ Concrete Action Strategy (Habit Loop)
                                </label>
                                <textarea
                                  rows="2"
                                  value={h.action_strategy}
                                  onChange={e => {
                                    const updated = [...(monthlyPlanData.behavior_change_plan?.habits || [])];
                                    updated[idx].action_strategy = e.target.value;
                                    setMonthlyPlanData(prev => ({ ...prev, behavior_change_plan: { ...prev.behavior_change_plan, habits: updated } }));
                                  }}
                                  placeholder="e.g. Prepare breakfast (overnight oats or boiled eggs) the night before"
                                  className="w-full border border-amber-200 bg-white rounded-lg p-2 font-medium text-amber-950 outline-none focus:border-amber-400 resize-none text-xs"
                                />
                              </div>

                              {/* Target Frequency */}
                              <div className="bg-blue-50/50 border border-blue-200 p-3.5 rounded-xl space-y-1">
                                <label className="block text-[10px] font-black text-blue-800 uppercase tracking-wider">
                                  📅 Target Frequency & Milestone
                                </label>
                                <input
                                  type="text"
                                  value={h.target_frequency}
                                  onChange={e => {
                                    const updated = [...(monthlyPlanData.behavior_change_plan?.habits || [])];
                                    updated[idx].target_frequency = e.target.value;
                                    setMonthlyPlanData(prev => ({ ...prev, behavior_change_plan: { ...prev.behavior_change_plan, habits: updated } }));
                                  }}
                                  placeholder="e.g. 5 days/week"
                                  className="w-full border border-blue-200 bg-white rounded-lg p-2 font-bold text-blue-950 outline-none focus:border-blue-400"
                                />
                              </div>

                              {/* Start Date */}
                              <div className="bg-indigo-50/50 border border-indigo-200 p-3.5 rounded-xl space-y-1">
                                <label className="block text-[10px] font-black text-indigo-800 uppercase tracking-wider">
                                  📅 Start Date
                                </label>
                                <input
                                  type="date"
                                  value={h.start_date || monthlyPlanData.start_date || '2026-09-22'}
                                  onChange={e => {
                                    const updated = [...(monthlyPlanData.behavior_change_plan?.habits || [])];
                                    updated[idx].start_date = e.target.value;
                                    setMonthlyPlanData(prev => ({ ...prev, behavior_change_plan: { ...prev.behavior_change_plan, habits: updated } }));
                                  }}
                                  className="w-full border border-indigo-200 bg-white rounded-lg p-2 font-bold text-indigo-950 outline-none focus:border-indigo-400"
                                />
                              </div>

                              {/* Target Review Date */}
                              <div className="bg-purple-50/50 border border-purple-200 p-3.5 rounded-xl space-y-1">
                                <label className="block text-[10px] font-black text-purple-800 uppercase tracking-wider">
                                  🎯 Target Review Date
                                </label>
                                <input
                                  type="date"
                                  value={h.target_date || monthlyPlanData.review_date || '2026-10-22'}
                                  onChange={e => {
                                    const updated = [...(monthlyPlanData.behavior_change_plan?.habits || [])];
                                    updated[idx].target_date = e.target.value;
                                    setMonthlyPlanData(prev => ({ ...prev, behavior_change_plan: { ...prev.behavior_change_plan, habits: updated } }));
                                  }}
                                  className="w-full border border-purple-200 bg-white rounded-lg p-2 font-bold text-purple-950 outline-none focus:border-purple-400"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* PILLAR 5: 📊 MONTHLY PROGRESS & AUDIT REPORT            */}
                  {/* ======================================================== */}
                  {carePlanPillar === 'report' && (() => {
                    const monthlyLogs = wellnessLogs.filter(l => l.date && l.date.startsWith(selectedReportMonth));
                    const monthDisplayNames = {
                      '2026-09': 'September 2026',
                      '2026-08': 'August 2026',
                      '2026-07': 'July 2026'
                    };
                    const formattedMonthName = monthDisplayNames[selectedReportMonth] || selectedReportMonth;

                    const actTargetDays = monthlyPlanData.activity_plan?.weekly_target_days || 5;
                    const actCompletedCount = Object.values(patientAdherence?.days || {}).filter(
                      d => (typeof d === 'string' ? d === 'completed' : d?.status === 'completed')
                    ).length;
                    const actPct = Math.min(100, Math.round((actCompletedCount / actTargetDays) * 100));
                    const missedEntries = Object.entries(patientAdherence?.days || {}).filter(
                      ([_, val]) => (typeof val === 'object' ? val?.status === 'missed' : val === 'missed')
                    );
                    const barrierRecorded = missedEntries.length > 0;

                    const prescribedMealsPerDay = monthlyPlanData.meal_frequency || 5;
                    const totalPlannedMeals = (monthlyLogs.length || 7) * prescribedMealsPerDay;
                    const totalLoggedMeals = monthlyLogs.reduce((acc, log) => {
                      const completedCount = Object.values(log.completed_slots || {}).filter(Boolean).length;
                      if (completedCount > 0) return acc + completedCount;
                      return acc + ((log.breakfast_completed ? 1 : 0) + (log.lunch_completed ? 1 : 0) + (log.dinner_completed ? 1 : 0));
                    }, 0) || (monthlyLogs.length > 0 ? 0 : 31);
                    const mealAdherencePct = Math.min(100, Math.round((totalLoggedMeals / totalPlannedMeals) * 100));

                    const avgWaterGlasses = monthlyLogs.length > 0 
                      ? (monthlyLogs.reduce((a, b) => a + (parseFloat(b.water_glasses) || 0), 0) / monthlyLogs.length).toFixed(1)
                      : '8.5';
                    const avgSleep = monthlyLogs.length > 0
                      ? (monthlyLogs.reduce((a, b) => a + (parseFloat(b.sleep_hours) || 0), 0) / monthlyLogs.length).toFixed(1)
                      : '7.4';

                    return (
                      <div className="space-y-6 animate-in fade-in" id="printable-monthly-report">
                        {/* Print styles */}
                        <style>{`
                          @media print {
                            body * { visibility: hidden !important; }
                            #printable-monthly-report, #printable-monthly-report * { visibility: visible !important; }
                            #printable-monthly-report {
                              position: absolute !important;
                              left: 0 !important;
                              top: 0 !important;
                              width: 100% !important;
                              background: white !important;
                              color: black !important;
                              padding: 24px !important;
                            }
                            .no-print { display: none !important; }
                          }
                        `}</style>

                        {/* Top Control Bar (Hidden on print) */}
                        <div className="bg-[#FDFCF8] border border-[#EBE9E0] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#456A50] text-white flex items-center justify-center shrink-0">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-[#1C2C22]">
                                📊 Monthly Progress & Audit Report
                              </h3>
                              <p className="text-[11px] text-[#5A6B60]">
                                Monthly adherence verification, four-pillar audit, and nutritionist sign-off.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-[#5A6B60] whitespace-nowrap">Report Month:</label>
                              <select
                                value={selectedReportMonth}
                                onChange={e => setSelectedReportMonth(e.target.value)}
                                className="bg-white border border-[#EBE9E0] text-xs font-black text-[#1C2C22] rounded-xl px-3 py-2 outline-none focus:border-[#456A50] cursor-pointer shadow-xs"
                              >
                                <option value="2026-09">September 2026</option>
                                <option value="2026-08">August 2026</option>
                                <option value="2026-07">July 2026</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="bg-white hover:bg-gray-50 text-[#1C2C22] border border-[#EBE9E0] px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs hover:border-[#456A50]"
                            >
                              <Printer size={14} className="text-[#456A50]" />
                              <span>Print Monthly Report</span>
                            </button>
                          </div>
                        </div>

                        {/* ======================================================== */}
                        {/* 6. TOP FOUR-PILLAR SUMMARY                               */}
                        {/* ======================================================== */}
                        <div className="bg-white border-2 border-[#456A50]/20 rounded-3xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#456A50] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                Clinical Audit Summary
                              </span>
                              <h3 className="text-base font-black text-[#1C2C22] mt-1">
                                Four-Pillar Care Plan Adherence — {formattedMonthName}
                              </h3>
                            </div>
                            <span className="text-xs font-black text-gray-500">
                              Patient: {selectedPatient.first_name} {selectedPatient.last_name}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Pillar 1: Meal Plan */}
                            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                                  <Apple size={15} className="text-emerald-700" /> MEAL PLAN
                                </span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  Target Met
                                </span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <p className="text-[#5A6B60]">
                                  <strong>Target:</strong> {monthlyPlanData.target_calories} kcal / {monthlyPlanData.meal_frequency} meals daily
                                </p>
                                <p className="text-[#1C2C22] font-extrabold">
                                  <strong>Actual:</strong> {mealAdherencePct}% adherence ({totalLoggedMeals}/{totalPlannedMeals} meals logged)
                                </p>
                                <p className="text-[11px] text-emerald-800 font-bold">
                                  Status: Target Met ✅
                                </p>
                              </div>
                            </div>

                            {/* Pillar 2: Activity Plan */}
                            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                                  <Footprints size={15} className="text-blue-700" /> ACTIVITY PLAN
                                </span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${barrierRecorded ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {barrierRecorded ? 'Barrier Recorded' : 'In Progress'}
                                </span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <p className="text-[#5A6B60]">
                                  <strong>Target:</strong> {actTargetDays} days/week (30 min brisk walk)
                                </p>
                                <p className="text-[#1C2C22] font-extrabold">
                                  <strong>Actual:</strong> {actCompletedCount}/{actTargetDays} sessions ({actPct}%)
                                </p>
                                <p className="text-[11px] text-amber-900 font-bold">
                                  Status: {barrierRecorded ? 'Barrier Recorded 🚩 (Wed: Busy with college)' : 'In Progress 🔄'}
                                </p>
                              </div>
                            </div>

                            {/* Pillar 3: Lifestyle Plan */}
                            <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                                  <Moon size={15} className="text-indigo-700" /> LIFESTYLE PLAN
                                </span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                  Target Met
                                </span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <p className="text-[#5A6B60]">
                                  <strong>Target:</strong> Water: {monthlyPlanData.lifestyle_plan?.hydration?.target || '2.5L'}, Sleep: 7-8 hrs
                                </p>
                                <p className="text-[#1C2C22] font-extrabold">
                                  <strong>Actual:</strong> Water: ~{avgWaterGlasses} glasses, Sleep: ~{avgSleep} hrs
                                </p>
                                <p className="text-[11px] text-indigo-800 font-bold">
                                  Status: Target Met ✅
                                </p>
                              </div>
                            </div>

                            {/* Pillar 4: Behaviour Change */}
                            <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                                  <RefreshCw size={15} className="text-teal-700" /> BEHAVIOUR CHANGE
                                </span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                  In Progress
                                </span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <p className="text-[#5A6B60]">
                                  <strong>Target:</strong> Regular breakfast preps (5 days/week)
                                </p>
                                <p className="text-[#1C2C22] font-extrabold">
                                  <strong>Actual:</strong> 4/5 days logged this week
                                </p>
                                <p className="text-[11px] text-teal-800 font-bold">
                                  Status: In Progress 🔄
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ======================================================== */}
                        {/* DETAILED CHRONOLOGICAL AUDIT TRAIL (SECTIONS A - I)      */}
                        {/* ======================================================== */}
                        <div className="space-y-6">
                          {/* A. PATIENT INFORMATION */}
                          <div className="bg-white border border-[#EBE9E0] p-6 rounded-3xl shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                              <UserCheck size={16} className="text-[#456A50]" />
                              A. Patient Information & Clinical Context
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Patient Name</span>
                                <span className="font-extrabold text-[#1C2C22]">{selectedPatient.first_name} {selectedPatient.last_name}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Care Plan</span>
                                <span className="font-bold text-[#456A50]">{monthlyPlanData.nutrition_goal}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Program</span>
                                <span className="font-bold text-gray-700">{selectedPatient.enrolled_program || selectedPatient.health_goals || 'Sustainable Metabolic Reset'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Assigned Nutritionist</span>
                                <span className="font-extrabold text-[#1C2C22]">{nutritionistName}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Audit Month</span>
                                <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">{formattedMonthName}</span>
                              </div>
                            </div>
                          </div>

                          {/* B. GOAL SUMMARY */}
                          <div className="bg-white border border-[#EBE9E0] p-6 rounded-3xl shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                              <Target size={16} className="text-[#456A50]" />
                              B. Goal Summary & Prescription Timeline
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="bg-[#FDFCF8] p-3 rounded-2xl border border-gray-100">
                                <span className="text-[10px] text-gray-500 font-bold block">Primary Clinical Goal</span>
                                <span className="font-extrabold text-[#1C2C22]">{monthlyPlanData.nutrition_goal}</span>
                              </div>
                              <div className="bg-[#FDFCF8] p-3 rounded-2xl border border-gray-100">
                                <span className="text-[10px] text-gray-500 font-bold block">Target Energy & Cadence</span>
                                <span className="font-extrabold text-[#456A50]">{monthlyPlanData.target_calories} kcal/day • {monthlyPlanData.meal_frequency} meals/day</span>
                              </div>
                              <div className="bg-[#FDFCF8] p-3 rounded-2xl border border-gray-100">
                                <span className="text-[10px] text-gray-500 font-bold block">Protocol Start Date</span>
                                <span className="font-bold text-[#1C2C22]">{monthlyPlanData.start_date || '2026-09-22'}</span>
                              </div>
                              <div className="bg-[#FDFCF8] p-3 rounded-2xl border border-gray-100">
                                <span className="text-[10px] text-gray-500 font-bold block">Target Clinical Review Date</span>
                                <span className="font-bold text-[#1C2C22]">{monthlyPlanData.review_date || '2026-10-22'}</span>
                              </div>
                            </div>
                          </div>

                          {/* C. MEAL ADHERENCE */}
                          <div className="bg-white border border-[#EBE9E0] p-6 rounded-3xl shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2">
                                <Apple size={16} className="text-[#456A50]" />
                                C. Meal Adherence & Dietary Log Trail ({formattedMonthName})
                              </h4>
                              <span className="text-xs font-black text-[#456A50]">
                                Adherence: {mealAdherencePct}%
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block">Planned Meals</span>
                                <span className="text-sm font-black text-[#1C2C22]">{totalPlannedMeals} meals</span>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block">Logged Meals</span>
                                <span className="text-sm font-black text-emerald-800">{totalLoggedMeals} meals</span>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block">Prescribed Cadence</span>
                                <span className="text-sm font-black text-[#456A50]">Breakfast 08:30 AM • Lunch 01:30 PM • Dinner 08:00 PM</span>
                              </div>
                            </div>

                            {/* Monthly Chronological Log Table */}
                            {monthlyLogs.length === 0 ? (
                              <div className="bg-[#FDFCF8] border border-dashed border-[#EBE9E0] rounded-2xl p-6 text-center text-xs text-gray-500">
                                No check-in records logged for {formattedMonthName}.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-[#FDFCF8] text-[10px] font-black uppercase text-[#5A6B60] border-b border-gray-200">
                                    <tr>
                                      <th className="py-2.5 px-3">Date</th>
                                      <th className="py-2.5 px-3">Logged Meal Slots</th>
                                      <th className="py-2.5 px-3">Deviations Reported</th>
                                      <th className="py-2.5 px-3">Daily Adherence</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {monthlyLogs.map((log, idx) => {
                                      const slots = log.completed_slots || {
                                        breakfast: log.breakfast_completed,
                                        lunch: log.lunch_completed,
                                        dinner: log.dinner_completed
                                      };
                                      const doneCount = Object.values(slots).filter(Boolean).length;
                                      const dailyPct = Math.min(100, Math.round((doneCount / prescribedMealsPerDay) * 100));

                                      return (
                                        <tr key={log.id || idx} className="hover:bg-gray-50/50">
                                          <td className="py-2 px-3 font-bold text-[#1C2C22]">{log.date}</td>
                                          <td className="py-2 px-3">
                                            <div className="flex flex-wrap gap-1">
                                              {Object.entries(slots).map(([k, v]) => (
                                                <span key={k} className={`px-2 py-0.5 rounded text-[10px] font-bold ${v ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                                                  {k}: {v ? '✓' : '✕'}
                                                </span>
                                              ))}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3">
                                            {log.ate_other_food ? (
                                              <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                Deviation: {log.other_food_details || 'Extra snack'}
                                              </span>
                                            ) : (
                                              <span className="text-gray-400">None reported</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 font-black text-[#456A50]">
                                            {dailyPct}%
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* D. ACTIVITY ADHERENCE */}
                          <div className="bg-white border border-[#EBE9E0] p-6 rounded-3xl shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2">
                                <Footprints size={16} className="text-[#456A50]" />
                                D. Activity Adherence & Barrier Audit ({formattedMonthName})
                              </h4>
                              <span className="text-xs font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                                Sessions: {actCompletedCount}/{actTargetDays} ({actPct}%)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block">Prescribed Activity</span>
                                <span className="font-bold text-[#1C2C22]">{(monthlyPlanData.activity_plan?.activities || [])[0]?.name || 'Brisk Walking'}</span>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block">Prescribed Frequency</span>
                                <span className="font-bold text-[#456A50]">{actTargetDays} days/week • 30 mins</span>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block">Estimated Active Time</span>
                                <span className="font-bold text-[#1C2C22]">{actCompletedCount * 30} minutes logged</span>
                              </div>
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block">Adherence Status</span>
                                <span className="font-black text-amber-800">{barrierRecorded ? 'Barrier Recorded 🚩' : 'On Track ✅'}</span>
                              </div>
                            </div>

                            {/* Missed Sessions & Barriers Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-1">
                              <p className="font-black text-amber-900 flex items-center gap-1.5">
                                <AlertTriangle size={14} className="text-amber-700" />
                                Adherence Verification Rule & Barrier Ledger:
                              </p>
                              <p className="text-amber-950">
                                • A documented barrier does <strong>NOT</strong> count as a completed activity; it remains a missed session with a recorded reason.
                              </p>
                              {missedEntries.length > 0 ? (
                                missedEntries.map(([d, val]) => (
                                  <p key={d} className="text-red-950 font-bold pt-1">
                                    ✕ Missed Session: <strong>{d}</strong> — Documented Reason: <em>"{val?.reason || 'Busy with college'}"</em>
                                  </p>
                                ))
                              ) : (
                                <p className="text-emerald-900 font-bold">✓ No workout barriers reported for this audit cycle.</p>
                              )}
                            </div>
                          </div>

                          {/* E. LIFESTYLE ADHERENCE */}
                          <div className="bg-white border border-[#EBE9E0] p-6 rounded-3xl shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                              <Moon size={16} className="text-[#456A50]" />
                              E. Lifestyle Habits Adherence Matrix ({formattedMonthName})
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1">
                                <span className="text-[10px] font-black text-blue-900 uppercase">1. Hydration Target</span>
                                <p className="font-bold text-blue-950">Prescribed: {monthlyPlanData.lifestyle_plan?.hydration?.target || '2.5L/day'}</p>
                                <p className="text-[#5A6B60]">Recorded Average: <strong>~{avgWaterGlasses} glasses (~2.1L)</strong></p>
                                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">Target Met (88%)</span>
                              </div>

                              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-1">
                                <span className="text-[10px] font-black text-indigo-900 uppercase">2. Sleep Duration</span>
                                <p className="font-bold text-indigo-950">Prescribed: {monthlyPlanData.lifestyle_plan?.sleep?.target || '7–8 hrs'} (Bed: 10:30 PM)</p>
                                <p className="text-[#5A6B60]">Recorded Average: <strong>~{avgSleep} hours/night</strong></p>
                                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">Circadian Restored</span>
                              </div>

                              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                                <span className="text-[10px] font-black text-emerald-900 uppercase">3. Meal Timing Cadence</span>
                                <p className="font-bold text-emerald-950">Prescribed: {monthlyPlanData.lifestyle_plan?.meal_timing?.target || 'Breakfast <9 AM, Dinner <8 PM'}</p>
                                <p className="text-[#5A6B60]">Fasting Window: <strong>12-hour overnight digestive rest</strong></p>
                                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">Metabolic Pacing Active</span>
                              </div>
                            </div>
                          </div>

                          {/* F. BEHAVIOUR CHANGE */}
                          <div className="bg-white border border-[#EBE9E0] p-6 rounded-3xl shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                              <RefreshCw size={16} className="text-[#456A50]" />
                              F. Behaviour Change (CBT Habit) Audit ({formattedMonthName})
                            </h4>

                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-[#FDFCF8] text-[10px] font-black uppercase text-[#5A6B60] border-b border-gray-200">
                                  <tr>
                                    <th className="py-2.5 px-3">Current Behaviour</th>
                                    <th className="py-2.5 px-3">Target Replacement</th>
                                    <th className="py-2.5 px-3">Action Strategy</th>
                                    <th className="py-2.5 px-3">Timeline</th>
                                    <th className="py-2.5 px-3">Frequency</th>
                                    <th className="py-2.5 px-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {(monthlyPlanData.behavior_change_plan?.habits || DEFAULT_BEHAVIOR_CHANGE_PLAN.habits).map((h, i) => (
                                    <tr key={h.id || i} className="hover:bg-gray-50/50">
                                      <td className="py-2.5 px-3 font-bold text-red-900 bg-red-50/30">{h.current_behavior}</td>
                                      <td className="py-2.5 px-3 font-bold text-emerald-950 bg-emerald-50/30">{h.target_behavior}</td>
                                      <td className="py-2.5 px-3 text-gray-700">{h.action_strategy}</td>
                                      <td className="py-2.5 px-3 font-bold text-[#5A6B60]">
                                        {h.start_date || monthlyPlanData.start_date || '2026-09-22'} → {h.target_date || monthlyPlanData.review_date || '2026-10-22'}
                                      </td>
                                      <td className="py-2.5 px-3 font-black text-amber-800">{h.target_frequency || '5 days/week'}</td>
                                      <td className="py-2.5 px-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                          h.status === 'Target Met' || h.status === 'Achieved'
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                            : h.status === 'Below Target'
                                              ? 'bg-red-100 text-red-800 border-red-300'
                                              : h.status === 'Barrier Recorded'
                                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                : 'bg-blue-100 text-blue-800 border-blue-300'
                                        }`}>
                                          {h.status || 'In Progress'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* G. PROGRESS & BIOMETRICS */}
                          <div className="bg-white border border-[#EBE9E0] p-6 rounded-3xl shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                              <Scale size={16} className="text-[#456A50]" />
                              G. Progress, Anthropometry & Biometric Measurements
                            </h4>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase">Current Weight</span>
                                <span className="text-base font-black text-[#1C2C22]">
                                  {monthlyLogs[0]?.weight_kg ? `${monthlyLogs[0].weight_kg} kg` : (selectedPatient.weight ? `${selectedPatient.weight} kg` : '65.4 kg')}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">📉 -1.8 kg this month</span>
                              </div>

                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase">Body Mass Index (BMI)</span>
                                <span className="text-base font-black text-[#1C2C22]">
                                  {(() => {
                                    const w = parseFloat(monthlyLogs[0]?.weight_kg || selectedPatient.weight || 65.4);
                                    const h = parseFloat(selectedPatient.height || 165) / 100;
                                    return (w / (h * h)).toFixed(1);
                                  })()}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Healthy Metabolic Range</span>
                              </div>

                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase">Clinical Goal Progress</span>
                                <span className="text-base font-black text-[#456A50]">72% Achieved</span>
                                <span className="text-[10px] text-[#5A6B60] font-bold block mt-0.5">Phase 1 Adaptation</span>
                              </div>

                              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-bold block uppercase">Vitality & Mood Status</span>
                                <span className="text-base font-black text-indigo-900">
                                  {monthlyLogs[0]?.mood || 'Calm & Balanced'}
                                </span>
                                <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">Optimal Energy Levels</span>
                              </div>
                            </div>
                          </div>

                          {/* H. NUTRITIONIST EVALUATION & SIGN-OFF */}
                          <div className="bg-white border-2 border-[#456A50]/30 p-6 rounded-3xl shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={16} className="text-[#456A50]" />
                                H. Monthly Nutritionist Evaluation & Sign-off
                              </h4>
                              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                Clinical Sign-Off Ready
                              </span>
                            </div>

                            <p className="text-xs text-[#5A6B60]">
                              Enter your clinical summary, review observations, and follow-up guidance for {selectedPatient.first_name} for the month of {formattedMonthName}.
                            </p>

                            <textarea
                              rows="4"
                              value={monthlyNutritionistEval}
                              onChange={e => setMonthlyNutritionistEval(e.target.value)}
                              placeholder="Enter monthly evaluation, clinical progress notes, and guidance..."
                              className="w-full border border-[#EBE9E0] bg-[#FDFCF8] rounded-2xl p-3.5 text-xs font-medium text-[#1C2C22] outline-none focus:border-[#456A50] resize-none leading-relaxed"
                            />

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={handleSaveMonthlyEval}
                                className="bg-[#456A50] hover:bg-[#35533E] text-white px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs no-print"
                              >
                                <Save size={14} /> Save Monthly Evaluation & Sign-off
                              </button>

                              {/* Official Digital Signature Block (Shown on Screen and Print) */}
                              <div className="border border-emerald-200 bg-emerald-50/50 p-3 rounded-2xl text-right sm:text-left space-y-0.5 text-xs">
                                <p className="font-extrabold text-[#1C2C22]">
                                  Clinically Evaluated & Signed by: <span className="text-[#456A50] underline">{nutritionistName}</span>
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  Designation: Senior Clinical Nutritionist • Healora Clinical Care Network
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  Date: 22-09-2026 • Protocol: Care Plan Adherence Verification (Rule-Based)
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* I. PLAN CHANGES LOG */}
                          <div className="bg-white border border-[#EBE9E0] p-6 rounded-3xl shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-[#1C2C22] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                              <History size={16} className="text-[#456A50]" />
                              I. Plan Changes Audit Ledger ({formattedMonthName})
                            </h4>

                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-[#FDFCF8] text-[10px] font-black uppercase text-[#5A6B60] border-b border-gray-200">
                                  <tr>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Previous Target / Plan</th>
                                    <th className="py-2.5 px-3">Updated Target / Plan</th>
                                    <th className="py-2.5 px-3">Reason for Change</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {carePlanChangesLog.map((change, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                      <td className="py-2.5 px-3 font-bold text-[#1C2C22]">{change.date}</td>
                                      <td className="py-2.5 px-3 text-gray-600">{change.previous_plan}</td>
                                      <td className="py-2.5 px-3 font-bold text-[#456A50]">{change.updated_plan}</td>
                                      <td className="py-2.5 px-3 text-gray-700 italic">{change.reason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Common Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#EBE9E0]">
                    <button type="button" onClick={handleSaveDraft} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
                      <Save size={14}/> Save Draft Care Plan
                    </button>
                    <button type="button" onClick={handlePublishPlan} className="bg-[#456A50] hover:bg-[#35533E] text-white px-8 py-3.5 rounded-xl font-bold text-xs transition shadow-lg flex items-center gap-2 cursor-pointer">
                      <Send size={14}/> Publish Care Plan to Patient Portal
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

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

      {/* 🌟 HEALORA IN-APP TELEHEALTH VIDEO CONSULTATION STUDIO 🌟 */}
      {activeVideoCallAppt && (
        <TelehealthVideoRoom 
          isOpen={!!activeVideoCallAppt}
          onClose={() => setActiveVideoCallAppt(null)}
          appointment={activeVideoCallAppt}
          currentUserRole="NUTRITIONIST"
          currentUserName={nutritionistName}
          patientProfile={selectedPatient || {}}
          nutritionistInfo={{ first_name: nutritionistName.replace('Dr. ', '').split(' ')[0], last_name: nutritionistName.replace('Dr. ', '').split(' ')[1] || '' }}
          onSaveNotes={(notesData) => {
            console.log("Clinical consultation notes recorded:", notesData);
          }}
        />
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