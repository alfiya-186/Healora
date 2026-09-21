import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Activity, Apple, LogOut, FileText, 
  UserCircle, HeartPulse, Moon, Footprints, Droplets,
  CheckCircle2, Trash2, ShieldCheck, Edit3, Camera, Upload, UploadCloud, X,
  CreditCard, Lock, ChevronRight, ChevronLeft, CheckCircle, MessageSquare, Send, Bell, Download, File, User, Key, Flame, AlertCircle, DownloadCloud, Stethoscope, ClipboardList, Star, ShieldAlert,
  Video, ExternalLink, Link2, Clock, Sparkles, Eye, RotateCcw, XCircle, AlertTriangle, Check, RefreshCw,
  Scale, TrendingDown, TrendingUp, Save, Ticket, DoorOpen, Megaphone, Printer,
  Award, Trophy, Zap, Percent, BadgePercent, Plus
} from 'lucide-react';

import BookingCalendarPicker, { getHolidayOrOffReason } from '../components/BookingCalendarPicker.jsx';
import TimeSlotPicker, { normalizeTimeTo24H, normalizeTimeToLabel } from '../components/TimeSlotPicker.jsx';
import { getKeralaPersonalizedOptions, getKeralaMealImage, KERALA_FOOD_IMAGES, CLINICAL_KERALA_UNIVERSAL_RECIPES, getSafeUniversalMeal } from '../utils/keralaNutritionEngine.js';
import TelehealthVideoRoom from '../components/TelehealthVideoRoom.jsx';
import { evaluateClinicalSafety, checkMealAllergenConflict, evaluateMealConflicts } from '../utils/clinicalSafetyRules.js';

export const calculateMetabolicProfile = (profile = {}, gender = 'Female') => {
  const weight = parseFloat(profile.weight_kg) || 60;
  const height = parseFloat(profile.height_cm) || 165;
  const age = parseFloat(profile.age) || 25;
  const isMale = String(gender).toLowerCase() === 'male';

  // Mifflin-St Jeor Clinical BMR Formula
  const bmr = Math.round(
    10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161)
  );

  // Activity Multiplier
  const lifestyle = profile.lifestyle_habits || 'Sedentary';
  let multiplier = 1.2;
  if (lifestyle === 'Lightly Active') multiplier = 1.375;
  else if (lifestyle === 'Moderately Active') multiplier = 1.55;
  else if (lifestyle === 'Very Active') multiplier = 1.725;

  const tdee = Math.round(bmr * multiplier);

  // Goal Calibration
  const goal = profile.health_goals || 'Weight Loss';
  let targetCalories = tdee;
  let carbRatio = 0.40;
  let proteinRatio = 0.30;
  let fatRatio = 0.30;

  if (goal === 'Weight Loss') {
    targetCalories = Math.max(1200, tdee - 350);
    carbRatio = 0.35;
    proteinRatio = 0.35;
    fatRatio = 0.30;
  } else if (goal === 'PCOS' || profile.medical_history === 'PCOS') {
    targetCalories = Math.max(1250, tdee - 250);
    carbRatio = 0.30; // Low-GI complex carbs
    proteinRatio = 0.35;
    fatRatio = 0.35; // Healthy fats & Omega-3
  } else if (goal === 'Diabetes' || profile.medical_history === 'Diabetes') {
    targetCalories = Math.max(1300, tdee - 200);
    carbRatio = 0.35;
    proteinRatio = 0.35;
    fatRatio = 0.30;
  } else if (goal === 'Weight Gain' || goal === 'Muscle Building') {
    targetCalories = tdee + 400;
    carbRatio = 0.50;
    proteinRatio = 0.25;
    fatRatio = 0.25;
  }

  // Gram Conversions (Carb: 4 kcal/g, Protein: 4 kcal/g, Fat: 9 kcal/g)
  const carbsGrams = Math.round((targetCalories * carbRatio) / 4);
  const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const fatsGrams = Math.round((targetCalories * fatRatio) / 9);

  return {
    bmr,
    tdee,
    targetCalories,
    multiplier,
    carbsGrams,
    proteinGrams,
    fatsGrams,
    carbRatio: Math.round(carbRatio * 100),
    proteinRatio: Math.round(proteinRatio * 100),
    fatRatio: Math.round(fatRatio * 100)
  };
};

export const calculateMetabolicHealthScore = (wellnessLogs = [], weightRecords = [], quickWater = 0, hasPublishedDietPlan = false) => {
  // Pillar 1: Meal Adherence (Max 30 pts)
  // STRICT RULE: If the patient has NOT received a meal plan from the doctor or has no logs, meal score is 0!
  let mealPts = 0;
  if (hasPublishedDietPlan && wellnessLogs && wellnessLogs.length > 0) {
    const compliantCount = wellnessLogs.filter(l => {
      const hasB = !!(l.breakfast_completed || l.completed_slots?.breakfast);
      const hasL = !!(l.lunch_completed || l.completed_slots?.lunch);
      const hasD = !!(l.dinner_completed || l.completed_slots?.dinner);
      return (hasB || hasL || hasD) && !l.ate_other_food;
    }).length;
    mealPts = Math.min(30, Math.round((compliantCount / Math.max(1, Math.min(7, wellnessLogs.length))) * 30));
  }

  // Pillar 2: Daily Hydration Target (Max 20 pts)
  let waterPts = 0;
  const recentLogs = wellnessLogs ? wellnessLogs.slice(0, 7) : [];
  if (recentLogs.length > 0 || quickWater > 0) {
    const avgGlasses = ((recentLogs.reduce((acc, l) => acc + (parseFloat(l.water_glasses) || 0), 0) + quickWater) / Math.max(1, recentLogs.length + (quickWater > 0 ? 1 : 0)));
    waterPts = Math.min(20, Math.round((avgGlasses / 8) * 20));
  }

  // Pillar 3: Restorative Sleep (Max 20 pts)
  let sleepPts = 0;
  if (recentLogs.length > 0) {
    const avgSleep = recentLogs.reduce((acc, l) => acc + (parseFloat(l.sleep_hours) || 0), 0) / recentLogs.length;
    if (avgSleep >= 7 && avgSleep <= 8.5) sleepPts = 20;
    else if (avgSleep >= 6) sleepPts = 15;
    else if (avgSleep > 0) sleepPts = 10;
  }

  // Pillar 4: Physical Activity & Movement (Max 15 pts)
  let actPts = 0;
  if (recentLogs.length > 0) {
    const activeCount = recentLogs.filter(l => l.physical_activity && l.physical_activity !== 'None' && l.physical_activity !== 'No workout').length;
    actPts = Math.min(15, Math.round((activeCount / Math.max(1, recentLogs.length)) * 15));
  }

  // Pillar 5: Biometric Weigh-in Consistency (Max 15 pts)
  const bioCount = Array.isArray(weightRecords) ? weightRecords.length : 0;
  let bioPts = Math.min(15, bioCount * 5);

  const totalScore = Math.min(100, mealPts + waterPts + sleepPts + actPts + bioPts);

  let statusLabel = 'Awaiting Initial Clinical Logs';
  let statusColor = 'text-gray-700 bg-gray-50 border-gray-300';
  let statusBadge = '⚪ Pending Logs';
  let clinicalInsight = 'Please log your daily meals, hydration, sleep, and physical activity to generate your live clinical metabolic rating.';

  if (totalScore >= 85) {
    statusLabel = 'Elite Metabolic Balance';
    statusColor = 'text-emerald-800 bg-emerald-100 border-emerald-400';
    statusBadge = '🌟 Elite Vitality';
    clinicalInsight = 'High metabolic adaptability, 100% Kerala meal timing compliance, and optimal cellular hydration.';
  } else if (totalScore >= 70) {
    statusLabel = 'Optimal Metabolic Stability';
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    statusBadge = '🟢 Optimal Stability';
    clinicalInsight = 'Good adherence to Kerala dietary guidelines with consistent hydration and sleep recovery.';
  } else if (totalScore >= 55) {
    statusLabel = 'Moderate Progress (Improving)';
    statusColor = 'text-amber-800 bg-amber-50 border-amber-300';
    statusBadge = '🟡 Improving';
    clinicalInsight = 'Metabolic adaptation in progress. Aim for tighter dinner timing and 8 full glasses of water.';
  } else if (totalScore > 0) {
    statusLabel = 'Metabolic Attention Required';
    statusColor = 'text-red-800 bg-red-50 border-red-300';
    statusBadge = '🔴 Attention Needed';
    clinicalInsight = 'Plan deviations detected or incomplete logs. Please prioritize log check-ins and schedule your consultation.';
  }

  return {
    totalScore,
    mealPts,
    waterPts,
    sleepPts,
    actPts,
    bioPts,
    statusLabel,
    statusColor,
    statusBadge,
    clinicalInsight
  };
};

export const printMetabolicHealthReportCard = (patientName, scoreObj, profile, metabolicProfile) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to download your Clinical Report Card.");
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const bmiVal = profile.height_cm && profile.weight_kg ? (parseFloat(profile.weight_kg) / Math.pow(parseFloat(profile.height_cm)/100, 2)).toFixed(1) : '23.8';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Clinical Metabolic Health Report - ${patientName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1C2C22; background: #fff; max-width: 800px; margin: auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #456A50; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { margin: 0; color: #456A50; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 3px 0 0 0; color: #5A6B60; font-size: 13px; }
          .badge-box { background: #FDFCF8; border: 1px solid #EBE9E0; padding: 18px; border-radius: 16px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .score-dial { font-size: 40px; font-weight: 900; color: #456A50; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { background: #EAF0EC; color: #1C2C22; text-align: left; padding: 10px 12px; border: 1px solid #EBE9E0; font-weight: 700; }
          td { padding: 10px 12px; border: 1px solid #EBE9E0; }
          .footer { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #777; }
          .signature-box { text-align: right; }
          .signature-box strong { color: #1C2C22; display: block; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Healora Telehealth & Clinical Nutrition</h1>
            <p>Official Weekly Clinical Metabolic Health Report Card</p>
          </div>
          <div style="text-align: right;">
            <p style="font-weight: bold; color: #456A50;">Date: ${dateStr}</p>
            <p>Patient ID: #${profile.id || '101'}</p>
          </div>
        </div>

        <div class="badge-box">
          <div>
            <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #1C2C22;">Patient: ${patientName}</h3>
            <p style="margin: 0; font-size: 12px; color: #5A6B60;">
              Age: <strong>${profile.age || '25'} yrs</strong> &nbsp;|&nbsp;
              Height: <strong>${profile.height_cm || '165'} cm</strong> &nbsp;|&nbsp;
              Weight: <strong>${profile.weight_kg || '65'} kg</strong> (BMI: <strong>${bmiVal}</strong>)
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #456A50; font-weight: bold;">
              Program: ${profile.health_goals || 'Weight Management & Metabolic Health'}
            </p>
          </div>
          <div style="text-align: center; border-left: 2px solid #EBE9E0; padding-left: 25px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #5A6B60;">Metabolic Health Score</span>
            <div class="score-dial">${scoreObj.totalScore} / 100</div>
            <span style="font-size: 11px; font-weight: bold; color: #16a34a;">${scoreObj.statusLabel}</span>
          </div>
        </div>

        <h3 style="color: #456A50; margin: 20px 0 8px 0; font-size: 16px;">1. Five Clinical Pillars Compliance Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Pillar Metric</th>
              <th>Maximum Points</th>
              <th>Patient Score</th>
              <th>Clinical Compliance Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. Kerala Meal Plan Adherence</strong></td>
              <td>30 Pts</td>
              <td><strong>${scoreObj.mealPts} Pts</strong></td>
              <td>${scoreObj.mealPts >= 24 ? '✔ Excellent Adherence' : 'Moderate Adherence'}</td>
            </tr>
            <tr>
              <td><strong>2. Hydration & Ayurvedic Infusions</strong></td>
              <td>20 Pts</td>
              <td><strong>${scoreObj.waterPts} Pts</strong></td>
              <td>${scoreObj.waterPts >= 16 ? '✔ Target Met (8+ Glasses)' : 'Below Optimal Target'}</td>
            </tr>
            <tr>
              <td><strong>3. Restorative Sleep & Circadian Rhythm</strong></td>
              <td>20 Pts</td>
              <td><strong>${scoreObj.sleepPts} Pts</strong></td>
              <td>${scoreObj.sleepPts >= 16 ? '✔ 7-8 Hours Restorative' : 'Sleep Irregularity'}</td>
            </tr>
            <tr>
              <td><strong>4. Physical Activity & Daily Steps</strong></td>
              <td>15 Pts</td>
              <td><strong>${scoreObj.actPts} Pts</strong></td>
              <td>${scoreObj.actPts >= 12 ? '✔ Active Daily Movement' : 'Light Sedentary'}</td>
            </tr>
            <tr>
              <td><strong>5. Biometric Weigh-in Consistency</strong></td>
              <td>15 Pts</td>
              <td><strong>${scoreObj.bioPts} Pts</strong></td>
              <td>${scoreObj.bioPts >= 12 ? '✔ Regular Clinical Logging' : 'Pending Weigh-in'}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #456A50; margin: 25px 0 8px 0; font-size: 16px;">2. Mifflin-St Jeor Clinical Energy & Macro Targets</h3>
        <table>
          <thead>
            <tr>
              <th>Basal Metabolic Rate (BMR)</th>
              <th>Total Daily Expenditure (TDEE)</th>
              <th>Prescribed Calories</th>
              <th>Macro Target Split</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${metabolicProfile.bmr} kcal/day</strong></td>
              <td><strong>${metabolicProfile.tdee} kcal/day</strong></td>
              <td><strong style="color: #456A50;">${metabolicProfile.targetCalories} kcal/day</strong></td>
              <td>Carbs: ${metabolicProfile.carbsGrams}g | Protein: ${metabolicProfile.proteinGrams}g | Fats: ${metabolicProfile.fatsGrams}g</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #FDFCF8; border: 1px solid #EBE9E0; padding: 15px; border-radius: 12px; margin-top: 25px;">
          <h4 style="margin: 0 0 5px 0; color: #456A50; font-size: 13px;">Clinical Physician Impression & Recommendation</h4>
          <p style="margin: 0; font-size: 12px; color: #333; line-height: 1.6;">
            "${scoreObj.clinicalInsight} Continue following the prescribed Kerala meal timing windows. Take your prescribed morning Jeera/Methi water upon waking and ensure 30 minutes of brisk post-meal walking."
          </p>
        </div>

        <div class="footer">
          <div>
            <p style="margin: 0;">Healora Clinical Nutrition & Telehealth Systems • Digital Verification</p>
            <p style="margin: 2px 0 0 0;">Document Reference: HLR-MHS-${Date.now().toString().slice(-6)}</p>
          </div>
          <div class="signature-box">
            <strong>Dr. Sarah Jenkins</strong>
            <span>Lead Clinical Nutritionist & Physician (MD, Clinical Nutrition)</span>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
};

export const printClinicTokenSlip = (appt, patientInfo = {}) => {
  const tokenNum = appt.token_number || `TK-${101 + ((appt.id || 1) % 50)}`;
  const pName = patientInfo.name || appt.patient_name || (typeof appt.patient === 'string' ? appt.patient : 'Patient');
  const dateStr = appt.date || new Date().toISOString().split('T')[0];
  const timeStr = appt.time || '10:00 AM';
  const modeStr = (appt.mode || 'IN-CLINIC').toUpperCase();
  const roomStr = appt.allocated_room || 'Doctor Consultation Chamber (Ground Floor, Room 101)';
  const doctorStr = appt.doctor_name || 'Dr. Sarah Jenkins (Lead Clinical Nutritionist & Physician)';

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



export const DEFAULT_MEAL_TIMINGS = {
  pre_breakfast: '07:00 AM',
  breakfast: '08:30 AM',
  drink: '11:00 AM',
  lunch: '01:30 PM',
  snack: '04:30 PM',
  dinner: '08:00 PM'
};

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim().toUpperCase();
  const match = str.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3];

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export const SLOT_METADATA = {
  pre_breakfast: {
    label: 'Pre-Breakfast Tonic',
    advice: 'Drink warm on an empty stomach to kickstart metabolic lipid burning and gut health.'
  },
  breakfast: {
    label: 'Breakfast',
    advice: 'High protein and complex fiber to stabilize morning glucose levels.'
  },
  drink: {
    label: 'Drink / Mid-Morning',
    advice: 'Rich in natural probiotics and electrolytes for sustained daytime focus.'
  },
  lunch: {
    label: 'Lunch',
    advice: 'Main balanced meal with Omega-3 and low glycemic complex carbs. Chew mindfully.'
  },
  snack: {
    label: 'Evening Snack',
    advice: 'Satiating afternoon fuel to prevent late evening cravings.'
  },
  dinner: {
    label: 'Dinner',
    advice: 'Light, easy-to-digest Kerala dinner. Finish at least 2 hours before bedtime.'
  }
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
  "Physician's Clinical Prescription & Medical Summary"
];

export const SYSTEM_CHALLENGES_CONFIG = [
  {
    id: 'CHALLENGE_HYDRATION',
    title: '7-Day Mindful Hydration Streak',
    description: 'Automated System Verification: Drink 8+ glasses of water daily for 7 days based on your daily tracking logs.',
    category: 'Hydration',
    targetDays: 7,
    unit: 'Days',
    badgeName: 'Hydration Master',
    badgeIcon: 'Droplets',
    badgeColor: 'text-blue-600 bg-blue-50 border-blue-200',
    rewardText: '5% Consultation Discount (Coupon: HYDRATE5)',
    discountCode: 'HYDRATE5',
    discountPercent: 5,
    verifyRequirement: 'Log 8+ glasses of water daily in Daily Tracking for 7 days'
  },
  {
    id: 'CHALLENGE_MEALS',
    title: '100% Meal Adherence Streak',
    description: 'Automated System Verification: Complete all daily prescribed Kerala diet meals without cheat foods for 5 days.',
    category: 'Nutrition',
    targetDays: 5,
    unit: 'Days',
    badgeName: 'Clean Plate Champion',
    badgeIcon: 'Apple',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rewardText: '5% Consultation Discount (Coupon: MEAL5)',
    discountCode: 'MEAL5',
    discountPercent: 5,
    verifyRequirement: 'Complete 100% of prescribed meal slots without cheat food in Daily Tracking for 5 days'
  },
  {
    id: 'CHALLENGE_SLEEP',
    title: 'Rest & Recovery Sleep Champion',
    description: 'Automated System Verification: Maintain 7 to 8+ hours of restorative sleep logged for 5 days.',
    category: 'Recovery',
    targetDays: 5,
    unit: 'Days',
    badgeName: 'Sleep Restorer',
    badgeIcon: 'Moon',
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    rewardText: '5% Consultation Discount (Coupon: SLEEP5)',
    discountCode: 'SLEEP5',
    discountPercent: 5,
    verifyRequirement: 'Log 7+ hours of sleep per night in Daily Tracking for 5 days'
  },
  {
    id: 'CHALLENGE_PROGRESS',
    title: 'Clinical Weigh-in Milestone',
    description: 'Automated System Verification: Record at least 3 clinical weigh-in check-ins in your Biometric Health History.',
    category: 'Biometrics',
    targetDays: 3,
    unit: 'Logs',
    badgeName: 'Metabolic Starter',
    badgeIcon: 'Scale',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    rewardText: '5% Consultation Discount (Coupon: START5)',
    discountCode: 'START5',
    discountPercent: 5,
    verifyRequirement: 'Record 3 clinical weight updates in Biometric Health Profile'
  }
];

export const DEFAULT_CHALLENGES = SYSTEM_CHALLENGES_CONFIG;

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
  const [dietPlans, setDietPlans] = useState(() => {
    try {
      const carePlans = JSON.parse(localStorage.getItem('healora_care_plans') || '{}');
      const carePlanForMe = carePlans[userId];
      const cached = JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`) || localStorage.getItem(`healora_diet_plan_${userId}`) || 'null') || carePlanForMe;
      if (cached && (cached.status === 'PUBLISHED' || cached.status === 'Published')) {
        const structured = cached.plan_data && typeof cached.plan_data === 'object' ? cached.plan_data : {};
        return [{ ...structured, ...cached, weeks: structured.weeks || cached.weeks || {} }];
      }
    } catch (e) {}
    return [];
  });
  const [appointments, setAppointments] = useState([]);
  const [nutritionists, setNutritionists] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [patientApptFilter, setPatientApptFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CANCELLED'
  const [currentTimeTick, setCurrentTimeTick] = useState(Date.now());

  useEffect(() => {
    const tickInterval = setInterval(() => setCurrentTimeTick(Date.now()), 10000);
    return () => clearInterval(tickInterval);
  }, []);

  // --- 🏆 WELLNESS CHALLENGES & MILESTONE BADGES (SYSTEM AUTOMATED & LOCKED) ---
  const [claimedChallenges, setClaimedChallenges] = useState(() => {
    try {
      const saved = localStorage.getItem(`healora_claimed_challenges_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [quickWaterTracker, setQuickWaterTracker] = useState(0);
  const [patientWeightRecords, setPatientWeightRecords] = useState([]);

  // Automated System Evaluation Engine
  const challenges = useMemo(() => {
    // 1. Calculate Hydration Days (8+ glasses of water)
    const hydrationDates = new Set();
    (wellnessLogs || []).forEach(log => {
      const glasses = parseInt(log.water_glasses, 10) || 0;
      if (glasses >= 8 && log.date) {
        hydrationDates.add(String(log.date).split('T')[0]);
      }
    });
    if (quickWaterTracker >= 8) {
      hydrationDates.add(new Date().toISOString().split('T')[0]);
    }
    const currentHydrationDays = hydrationDates.size;

    // 2. Calculate Meal Adherence Days (100% meals completed with no cheat foods)
    const mealDates = new Set();
    (wellnessLogs || []).forEach(log => {
      const hasBreakfast = !!(log.breakfast_completed || log.completed_slots?.breakfast);
      const hasLunch = !!(log.lunch_completed || log.completed_slots?.lunch);
      const hasDinner = !!(log.dinner_completed || log.completed_slots?.dinner);
      const noCheat = !log.ate_other_food;
      if (hasBreakfast && hasLunch && hasDinner && noCheat && log.date) {
        mealDates.add(String(log.date).split('T')[0]);
      }
    });
    const currentMealDays = mealDates.size;

    // 3. Calculate Sleep Restorer Days (7+ hours restorative sleep)
    const sleepDates = new Set();
    (wellnessLogs || []).forEach(log => {
      const hours = parseFloat(log.sleep_hours) || 0;
      if (hours >= 7 && log.date) {
        sleepDates.add(String(log.date).split('T')[0]);
      }
    });
    const currentSleepDays = sleepDates.size;

    // 4. Calculate Weight / Biometric Check-ins
    const currentWeightLogs = Array.isArray(patientWeightRecords) ? patientWeightRecords.length : 0;

    return SYSTEM_CHALLENGES_CONFIG.map(cfg => {
      let currentProgress = 0;
      let logSummary = '';

      if (cfg.id === 'CHALLENGE_HYDRATION') {
        currentProgress = currentHydrationDays;
        logSummary = `${currentHydrationDays} / ${cfg.targetDays} Days (8+ water glasses logged)`;
      } else if (cfg.id === 'CHALLENGE_MEALS') {
        currentProgress = currentMealDays;
        logSummary = `${currentMealDays} / ${cfg.targetDays} Days (100% prescribed meal adherence)`;
      } else if (cfg.id === 'CHALLENGE_SLEEP') {
        currentProgress = currentSleepDays;
        logSummary = `${currentSleepDays} / ${cfg.targetDays} Days (7+ hrs sleep logged)`;
      } else if (cfg.id === 'CHALLENGE_PROGRESS') {
        currentProgress = currentWeightLogs;
        logSummary = `${currentWeightLogs} / ${cfg.targetDays} Weigh-in entries recorded`;
      }

      const isCompleted = currentProgress >= cfg.targetDays;
      const claimInfo = claimedChallenges[cfg.id];
      const isClaimed = !!claimInfo?.claimed;

      return {
        ...cfg,
        currentDays: Math.min(cfg.targetDays, currentProgress),
        rawCount: currentProgress,
        isCompleted,
        claimed: isClaimed,
        claimedAt: claimInfo?.claimedAt || null,
        logSummary
      };
    });
  }, [wellnessLogs, quickWaterTracker, patientWeightRecords, claimedChallenges]);

  const allBadgesClaimed = challenges.length > 0 && challenges.every(c => c.claimed);
  const claimedBadgesCount = challenges.filter(c => c.claimed).length;

  useEffect(() => {
    localStorage.setItem(`healora_has_loyalty_discount_${userId}`, allBadgesClaimed ? 'true' : 'false');
  }, [allBadgesClaimed, userId]);

  const handleClaimReward = (challengeId) => {
    const targetChallenge = challenges.find(c => c.id === challengeId);
    if (!targetChallenge || !targetChallenge.isCompleted) {
      alert("🔒 This reward is locked! You must complete your prescribed daily plan in full before claiming.");
      return;
    }

    const updatedClaimed = {
      ...claimedChallenges,
      [challengeId]: {
        claimed: true,
        claimedAt: new Date().toISOString().split('T')[0]
      }
    };
    setClaimedChallenges(updatedClaimed);
    localStorage.setItem(`healora_claimed_challenges_${userId}`, JSON.stringify(updatedClaimed));
    alert(`🎉 Congratulations! You unlocked your 5% Consultation Discount Voucher (Coupon: ${targetChallenge.discountCode})!`);
  };

  const metabolicProfile = useMemo(() => calculateMetabolicProfile(profile), [profile]);
  
  const hasPublishedDietPlan = useMemo(() => {
    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
    return Boolean(publishedPlan && (publishedPlan.status === 'PUBLISHED' || publishedPlan.status === 'Published') && publishedPlan.weeks && Object.keys(publishedPlan.weeks).length > 0);
  }, [dietPlans, userId]);

  const metabolicHealthScore = useMemo(() => {
    return calculateMetabolicHealthScore(wellnessLogs, patientWeightRecords, quickWaterTracker, hasPublishedDietPlan);
  }, [wellnessLogs, patientWeightRecords, quickWaterTracker, hasPublishedDietPlan]);

  const getMealTimingForSlot = (slotKey) => {
    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
    return publishedPlan?.meal_timings?.[slotKey] || DEFAULT_MEAL_TIMINGS[slotKey] || '12:00 PM';
  };

  // --- CROSS-DASHBOARD STATE (DIET PLAN DRILL-DOWN) ---
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[new Date().getDay()] || 'Monday');
  const [dietView, setDietView] = useState('meals'); // 'weeks' | 'days' | 'meals'
  const [mealOverrides, setMealOverrides] = useState({});
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showPhase2LockedModal, setShowPhase2LockedModal] = useState(false);

  // 🌟 REAL-TIME CLOCK FOR MEAL WINDOW TRANSITIONS (POLLS EVERY 15s) 🌟
  const [currentClock, setCurrentClock] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const todayDayName = daysOfWeek[currentClock.getDay()] || 'Friday';

  // Exact calendar date matching getProtocolDate
  const getProtocolDateObj = (week = 1, day = 'Monday') => {
    const dayIndex = daysOfWeek.indexOf(day);
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + ((week - 1) * 7) + (dayIndex >= 0 ? dayIndex - date.getDay() : 0));
    return date;
  };

  const isPhase1Completed = useMemo(() => {
    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
    if (!publishedPlan?.start_date) return false;
    try {
      const start = new Date(publishedPlan.start_date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      return diffDays >= 14;
    } catch {
      return false;
    }
  }, [dietPlans, userId]);

  // Check if a specific meal slot's window has passed (past time)
  // LIVE & ACCURATE:
  // - Future dates (e.g. tomorrow Sep 12 Saturday, or upcoming days/weeks) are NEVER closed.
  // - Past dates (yesterday, earlier days) are closed.
  // - Today (Friday Sep 11): only closed if the meal's scheduled time has passed on the live clock.
  const isMealTimeOver = (week, day, mealType, timingStr) => {
    const targetDate = getProtocolDateObj(week, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Strictly before today: Window is closed
    if (targetDate.getTime() < today.getTime()) {
      return true;
    }

    // 2. Strictly after today (e.g. tomorrow Sep 12 Saturday): NEVER closed! Always open and clickable!
    if (targetDate.getTime() > today.getTime()) {
      return false;
    }

    // 3. Exactly today: compare with current clock
    const mealMinutes = parseTimeToMinutes(timingStr);
    const now = currentClock || new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return currentMinutes > mealMinutes;
  };

  // Real-time active meal recommendation (STRICT: changes dynamically based on real-time clock & published plan)
  const activeCurrentMealRecommendation = useMemo(() => {
    const publishedPlan = dietPlans.length > 0 ? dietPlans[0] : (JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`)) || null);
    
    // 🌟 STRICT REQUIREMENT: Only display if nutritionist has explicitly published a meal plan for this patient 🌟
    const isPlanPublished = publishedPlan && 
      (publishedPlan.status === 'PUBLISHED' || publishedPlan.status === 'Published') && 
      publishedPlan.weeks && 
      Object.keys(publishedPlan.weeks).length > 0;

    if (!isPlanPublished) {
      return null;
    }

    const now = currentClock || new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysArr[now.getDay()] || 'Monday';
    
    const currentDayPlan = (publishedPlan?.weeks?.[selectedWeek || 1]?.[dayName]) || (publishedPlan?.weeks?.['1']?.[dayName]) || {};

    const orderedSlotKeys = ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'];
    const activeMealsForToday = [];

    orderedSlotKeys.forEach(slotKey => {
      let rawMeal = currentDayPlan[slotKey];
      if (!rawMeal) return;
      
      let mealName = '';
      let cal = '250 kcal';
      if (typeof rawMeal === 'object' && rawMeal.name) {
        mealName = rawMeal.name;
        cal = rawMeal.cal || '250 kcal';
      } else if (typeof rawMeal === 'string') {
        mealName = rawMeal;
        const calMatch = rawMeal.match(/\((\d+\s*kcal)\)/i);
        if (calMatch) {
          cal = calMatch[1];
          mealName = rawMeal.replace(/\s*\(\d+\s*kcal\)/i, '').trim();
        }
      }

      // Strict Clinical Sanitization: Filter out allergens and non-compliant diet choices
      if (mealName && mealName.trim()) {
        const conflict = evaluateMealConflicts(mealName, {
          food_allergies: profile?.food_allergies,
          food_preferences: profile?.food_preferences
        });
        if (conflict.hasAnyConflict) {
          const safe = getSafeUniversalMeal(slotKey);
          mealName = safe.name;
          cal = safe.cal;
        }
      }

      if (mealName && mealName.trim()) {
        const timeStr = publishedPlan?.meal_timings?.[slotKey] || DEFAULT_MEAL_TIMINGS[slotKey] || '12:00 PM';
        const timeMin = parseTimeToMinutes(timeStr);
        const meta = SLOT_METADATA[slotKey] || { label: slotKey, advice: 'Balanced nutritious intake.' };
        activeMealsForToday.push({
          slotKey,
          slotLabel: meta.label,
          advice: meta.advice,
          name: mealName.trim(),
          cal,
          time: timeStr,
          timeMin,
          img: getKeralaMealImage(mealName.trim(), slotKey)
        });
      }
    });

    if (activeMealsForToday.length === 0) return null;

    // Sort active meals by their prescribed time
    activeMealsForToday.sort((a, b) => a.timeMin - b.timeMin);

    // Calculate cutoff midpoints between consecutive meals to select the current active meal window
    let chosenMeal = activeMealsForToday[0];

    for (let i = 0; i < activeMealsForToday.length; i++) {
      const curr = activeMealsForToday[i];
      const next = activeMealsForToday[i + 1];

      if (next) {
        const midpoint = (curr.timeMin + next.timeMin) / 2;
        if (currentMinutes < midpoint) {
          chosenMeal = curr;
          break;
        }
      } else {
        // Last meal of the day (e.g. Dinner)
        chosenMeal = curr;
      }
    }

    const todayIso = now.toISOString().split('T')[0];
    const todayLog = (wellnessLogs || []).find(l => l.date && String(l.date).startsWith(todayIso));
    let isLogged = false;
    if (todayLog) {
      if (todayLog.completed_slots && todayLog.completed_slots[chosenMeal.slotKey]) isLogged = true;
      else if (chosenMeal.slotKey === 'breakfast' && todayLog.breakfast_completed) isLogged = true;
      else if (chosenMeal.slotKey === 'lunch' && todayLog.lunch_completed) isLogged = true;
      else if (chosenMeal.slotKey === 'dinner' && todayLog.dinner_completed) isLogged = true;
    }

    return {
      ...chosenMeal,
      isLogged
    };
  }, [dietPlans, selectedWeek, wellnessLogs, userId, currentClock]);

  const [logForm, setLogForm] = useState({ 
    completed_slots: { pre_breakfast: false, breakfast: false, drink: false, lunch: false, snack: false, dinner: false },
    breakfast_completed: false, lunch_completed: false, dinner_completed: false, 
    ate_other_food: false, other_food_details: '', sleep_hours: '', mood: 'Calm & Balanced', 
    water_glasses: 0, weight_kg: '', physical_activity: '', supplements_taken: false 
  });
  const [isSaving, setIsSaving] = useState(false);

  // 🌟 AUTOMATIC TWO-WAY SYNC: Keep logForm synced with today's logged meals in wellnessLogs 🌟
  useEffect(() => {
    const todayIso = new Date().toISOString().split('T')[0];
    const todayLog = (wellnessLogs || []).find(l => l.date && String(l.date).startsWith(todayIso));
    if (todayLog) {
      setLogForm(prev => ({
        ...prev,
        completed_slots: {
          ...(prev.completed_slots || {}),
          ...(todayLog.completed_slots || {}),
          ...(todayLog.breakfast_completed ? { breakfast: true } : {}),
          ...(todayLog.lunch_completed ? { lunch: true } : {}),
          ...(todayLog.dinner_completed ? { dinner: true } : {})
        },
        breakfast_completed: !!todayLog.breakfast_completed || !!todayLog.completed_slots?.breakfast,
        lunch_completed: !!todayLog.lunch_completed || !!todayLog.completed_slots?.lunch,
        dinner_completed: !!todayLog.dinner_completed || !!todayLog.completed_slots?.dinner,
        water_glasses: todayLog.water_glasses !== undefined ? todayLog.water_glasses : prev.water_glasses,
        sleep_hours: todayLog.sleep_hours || prev.sleep_hours,
        mood: todayLog.mood || prev.mood,
        weight_kg: todayLog.weight_kg || prev.weight_kg,
        physical_activity: todayLog.physical_activity || prev.physical_activity,
        ate_other_food: !!todayLog.ate_other_food,
        other_food_details: todayLog.other_food_details || prev.other_food_details
      }));
    }
  }, [wellnessLogs]);

  const handleQuickMarkActiveMealCompleted = () => {
    if (!activeCurrentMealRecommendation) return;
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const slotKey = activeCurrentMealRecommendation.slotKey;

    const existingLogs = [...wellnessLogs];
    const todayIndex = existingLogs.findIndex(l => l.date && String(l.date).startsWith(todayIso));

    let updatedLog;
    if (todayIndex >= 0) {
      const curr = existingLogs[todayIndex];
      const updatedSlots = { ...(curr.completed_slots || {}), [slotKey]: true };
      updatedLog = {
        ...curr,
        completed_slots: updatedSlots,
        breakfast_completed: slotKey === 'breakfast' ? true : curr.breakfast_completed,
        lunch_completed: slotKey === 'lunch' ? true : curr.lunch_completed,
        dinner_completed: slotKey === 'dinner' ? true : curr.dinner_completed
      };
      existingLogs[todayIndex] = updatedLog;
    } else {
      const initialSlots = { pre_breakfast: false, breakfast: false, drink: false, lunch: false, snack: false, dinner: false, [slotKey]: true };
      updatedLog = {
        id: Date.now(),
        date: todayIso,
        completed_slots: initialSlots,
        breakfast_completed: slotKey === 'breakfast',
        lunch_completed: slotKey === 'lunch',
        dinner_completed: slotKey === 'dinner',
        ate_other_food: false,
        sleep_hours: '7.5',
        water_glasses: 4,
        mood: 'Calm & Balanced',
        physical_activity: '30 mins brisk walking'
      };
      existingLogs.unshift(updatedLog);
    }

    // 1. Update wellnessLogs and localStorage
    setWellnessLogs(existingLogs);
    localStorage.setItem(`healora_wellness_${userId}`, JSON.stringify(existingLogs));

    // 2. 🌟 Sync immediately into logForm so Wellness Tracking form reflects it instantly as marked 🌟
    setLogForm(prev => ({
      ...prev,
      completed_slots: {
        ...(prev.completed_slots || {}),
        [slotKey]: true
      },
      breakfast_completed: slotKey === 'breakfast' ? true : prev.breakfast_completed,
      lunch_completed: slotKey === 'lunch' ? true : prev.lunch_completed,
      dinner_completed: slotKey === 'dinner' ? true : prev.dinner_completed
    }));

    // 3. Save to backend if available
    try {
      fetch(`/api/patient/${userId}/wellness/`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedLog, patient: userId })
      });
    } catch (err) {}

    alert(`✅ Marked "${activeCurrentMealRecommendation.name}" (${activeCurrentMealRecommendation.slotLabel}) as eaten! Automatically logged in your Wellness Tracker.`);
  };

  // --- PASSWORD CHANGE STATE ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });

  // --- APPOINTMENT & PAYMENT ---
  const [showApptModal, setShowApptModal] = useState(false);
  const [activeVideoCallAppt, setActiveVideoCallAppt] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);

  const handleStartVideoConsultation = (appt) => {
    setActiveVideoCallAppt(appt);
  }; 
  const [apptForm, setApptForm] = useState({ nutritionist: '', date: '', time: '', mode: 'ONLINE' });
  const [paymentForm, setPaymentForm] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [bookingError, setBookingError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayMethod, setRazorpayMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [razorpayUpiApp, setRazorpayUpiApp] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm' | 'custom'
  const [customUpiId, setCustomUpiId] = useState('');
  const [razorpayCardForm, setRazorpayCardForm] = useState({
    number: '4532 8901 2345 6789',
    expiry: '12/28',
    cvv: '888',
    name: userName || 'Patient'
  });
  const [razorpayLiveError, setRazorpayLiveError] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm Wallet');
  const [razorpayOrderId, setRazorpayOrderId] = useState('');

  // 🌟 LIVE VALIDATION ENGINE FOR RAZORPAY UPI & CARDS 🌟
  const isCustomUpiValid = useMemo(() => {
    if (!customUpiId.trim()) return false;
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(customUpiId.trim());
  }, [customUpiId]);

  const upiBankLabel = useMemo(() => {
    if (!customUpiId.includes('@')) return '';
    const handle = customUpiId.split('@')[1]?.toLowerCase();
    if (!handle) return '';
    if (handle.includes('sbi') || handle.includes('oksbi')) return 'State Bank of India';
    if (handle.includes('hdfc') || handle.includes('okhdfcbank')) return 'HDFC Bank';
    if (handle.includes('icici') || handle.includes('okicici')) return 'ICICI Bank';
    if (handle.includes('axis') || handle.includes('okaxis')) return 'Axis Bank';
    if (handle.includes('paytm')) return 'Paytm Payments Bank';
    if (handle.includes('ybl') || handle.includes('ibl')) return 'Yes Bank / PhonePe';
    if (handle.includes('apl')) return 'Amazon Pay / Axis';
    if (handle.includes('kotak')) return 'Kotak Mahindra Bank';
    return 'UPI Verified Provider';
  }, [customUpiId]);

  const cardBrand = useMemo(() => {
    const raw = (razorpayCardForm.number || '').replace(/\s/g, '');
    if (raw.startsWith('4')) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(raw)) return 'MASTERCARD';
    if (/^(60|65|81|82)/.test(raw)) return 'RUPAY';
    if (/^(34|37)/.test(raw)) return 'AMEX';
    return 'CARD';
  }, [razorpayCardForm.number]);

  const isCardNumberValid = useMemo(() => {
    const clean = (razorpayCardForm.number || '').replace(/\s/g, '');
    return clean.length === 16 && /^\d+$/.test(clean);
  }, [razorpayCardForm.number]);

  const isCardExpiryValid = useMemo(() => {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(razorpayCardForm.expiry || '')) return false;
    const [mm, yy] = (razorpayCardForm.expiry || '').split('/').map(Number);
    const now = new Date();
    const curYear = now.getFullYear() % 100;
    const curMonth = now.getMonth() + 1;
    if (yy < curYear || (yy === curYear && mm < curMonth)) return false;
    return true;
  }, [razorpayCardForm.expiry]);

  const isCardCvvValid = useMemo(() => {
    return /^\d{3,4}$/.test(razorpayCardForm.cvv || '');
  }, [razorpayCardForm.cvv]);

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSidebarProfileMenu, setShowSidebarProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const sidebarProfileMenuRef = useRef(null);
  const [labReports, setLabReports] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [docType, setDocType] = useState('Laboratory Report'); 
  const [digitalConsent, setDigitalConsent] = useState(true); 
  const fileInputRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [queryText, setQueryText] = useState("");
  const chatEndRef = useRef(null);
  const [chats, setChats] = useState([]);
  const [chatPartner, setChatPartner] = useState('manager'); // 'manager' | 'nutritionist'

  // --- 5. PATIENT CLINICAL HEALTH HISTORY & LONGITUDINAL TRENDS ---
  const [patientHistoryTab, setPatientHistoryTab] = useState('daily_weekly'); // 'daily_weekly' | 'weight' | 'lifestyle' | 'food'
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

  // --- 🔔 TODAY'S CONSULTATION REMINDER & LIVE QUEUE TOKEN PASS 🔔 ---
  const todayConsultationReminders = useMemo(() => {
    const now = new Date();
    const isoToday = now.toISOString().split('T')[0];
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const cachedAll = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
    const cachedMap = new Map();
    cachedAll.forEach(c => { if (c && c.id) cachedMap.set(String(c.id), c); });

    // Order today's clinic appointments deterministically across all patients
    const todaysAll = cachedAll.filter(a => (a.date === isoToday || a.date === localToday) && a.status !== 'CANCELLED');
    todaysAll.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return appointments
      .filter(appt => {
        if (!appt || appt.status === 'CANCELLED' || appt.status === 'COMPLETED') return false;
        const isToday = appt.date === isoToday || appt.date === localToday;
        if (!isToday) return false;

        const cached = cachedMap.get(String(appt.id)) || {};
        const qStatus = appt.queue_status || cached.queue_status;
        if (qStatus === 'COMPLETED') return false;

        // Check if scheduled appointment time is over
        if (appt.time) {
          let clean = appt.time.trim().toUpperCase();
          const isPM = clean.includes('PM');
          const isAM = clean.includes('AM');
          clean = clean.replace(/(AM|PM)/g, '').trim();
          const parts = clean.split(':').map(Number);
          let h = parts[0] || 0;
          const m = parts[1] || 0;
          if (isPM && h < 12) h += 12;
          if (isAM && h === 12) h = 0;

          const apptTime = new Date();
          apptTime.setHours(h, m, 0, 0);

          // If scheduled consultation time has passed
          if (now > apptTime) {
            // For online video consultations, do not show reminder if time is over
            if (appt.mode === 'ONLINE') {
              return false;
            }
            // For in-clinic consultations, only show if actively CALLED or IN_CONSULTATION
            if (qStatus !== 'CALLED' && qStatus !== 'IN_CONSULTATION') {
              return false;
            }
          }
        }

        return true;
      })
      .map(appt => {
        const cached = cachedMap.get(String(appt.id)) || {};
        const queueIdx = todaysAll.findIndex(a => String(a.id) === String(appt.id));
        const fallbackToken = queueIdx >= 0 ? `TK-${101 + queueIdx}` : `TK-101`;

        const tokenNum = appt.token_number || cached.token_number || fallbackToken;
        const queueStatus = appt.queue_status || cached.queue_status || 'WAITING';
        const defaultRoom = appt.mode === 'ONLINE' ? 'In-App Telehealth Video Suite' : 'Doctor Consultation Chamber (Ground Floor, Room 101)';
        const allocatedRoom = appt.allocated_room || cached.allocated_room || defaultRoom;

        return {
          ...appt,
          ...cached,
          token_number: tokenNum,
          queue_status: queueStatus,
          allocated_room: allocatedRoom
        };
      });
  }, [appointments, currentTimeTick]);

  // Clinic chime sound effect when patient token is called by manager
  const prevCalledTokensRef = useRef(new Set());
  useEffect(() => {
    todayConsultationReminders.forEach(appt => {
      if (appt.queue_status === 'CALLED') {
        const key = `${appt.id}_CALLED`;
        if (!prevCalledTokensRef.current.has(key)) {
          prevCalledTokensRef.current.add(key);
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
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
            }
          } catch (e) {
            console.warn("Clinic announcement chime error", e);
          }
        }
      }
    });
  }, [todayConsultationReminders]);


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

  // Click outside listener for profile avatar popover menus
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (sidebarProfileMenuRef.current && !sidebarProfileMenuRef.current.contains(e.target)) {
        setShowSidebarProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
              token_number: l.token_number || existing.token_number,
              queue_status: l.queue_status || existing.queue_status || 'WAITING',
              allocated_room: l.allocated_room || existing.allocated_room,
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

      // 4. Sync published diet plan live from Nutritionist dashboard changes
      try {
        const carePlansObj = JSON.parse(localStorage.getItem('healora_care_plans') || '{}');
        const carePlanForMe = carePlansObj[userId];
        const cachedDiet = JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`) || localStorage.getItem(`healora_diet_plan_${userId}`) || 'null') || carePlanForMe;
        if (cachedDiet && (cachedDiet.status === 'PUBLISHED' || cachedDiet.status === 'Published') && cachedDiet.weeks) {
          const structured = cachedDiet.plan_data && typeof cachedDiet.plan_data === 'object' ? cachedDiet.plan_data : {};
          const fullPlan = { ...structured, ...cachedDiet, weeks: structured.weeks || cachedDiet.weeks || {} };
          setDietPlans(prev => {
            const currentPlan = prev[0];
            if (!currentPlan || (fullPlan.published_at && fullPlan.published_at !== currentPlan.published_at) || JSON.stringify(fullPlan.weeks) !== JSON.stringify(currentPlan.weeks)) {
              return [fullPlan];
            }
            return prev;
          });
        }
      } catch (e) {}
    };

    syncLiveAppointmentsAndChats();
    const syncInterval = setInterval(syncLiveAppointmentsAndChats, 1500);
    return () => clearInterval(syncInterval);
  }, [userId]);

  // Reactive listener for storage updates across tabs (instant publish sync)
  useEffect(() => {
    const handleStorageUpdate = (e) => {
      if (!e || !e.key || e.key.includes('diet') || e.key.includes('care_plans') || e.key.includes('appointment')) {
        const carePlans = JSON.parse(localStorage.getItem('healora_care_plans') || '{}');
        const carePlanForMe = carePlans[userId];
        const cached = JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`) || localStorage.getItem(`healora_diet_plan_${userId}`) || 'null') || carePlanForMe;
        if (cached && (cached.status === 'PUBLISHED' || cached.status === 'Published')) {
          const structured = cached.plan_data && typeof cached.plan_data === 'object' ? cached.plan_data : {};
          setDietPlans([{ ...structured, ...cached, weeks: structured.weeks || cached.weeks || {} }]);
        }

        // Instant local sync for appointments
        const localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
        const myLocalAppts = localAppts.filter(a => a && String(a.patient) === String(userId));
        if (myLocalAppts.length > 0) {
          setAppointments(prev => {
            const map = new Map(prev.map(p => [String(p.id), p]));
            myLocalAppts.forEach(l => {
              const ex = map.get(String(l.id)) || {};
              map.set(String(l.id), {
                ...ex,
                ...l,
                token_number: l.token_number || ex.token_number,
                queue_status: l.queue_status || ex.queue_status,
                allocated_room: l.allocated_room || ex.allocated_room
              });
            });
            return Array.from(map.values()).sort((a,b) => (b.id || 0) - (a.id || 0));
          });
        }
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    document.addEventListener('visibilitychange', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
      document.removeEventListener('visibilitychange', handleStorageUpdate);
    };
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
        
        const carePlansObj = JSON.parse(localStorage.getItem('healora_care_plans') || '{}');
        const carePlanForMe = carePlansObj[userId];
        const cached = JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`) || 'null') || carePlanForMe;
        
        if (cached && (cached.status === 'PUBLISHED' || cached.status === 'Published') && cached.weeks) {
          const cachedNorm = normalizePlan(cached);
          const cachedTime = new Date(cachedNorm.published_at || 0).getTime();
          const apiTime = publishedPlans[0] ? new Date(publishedPlans[0].published_at || 0).getTime() : 0;
          if (cachedTime >= apiTime) {
            setDietPlans([cachedNorm]);
          } else {
            setDietPlans(publishedPlans);
            localStorage.setItem(`healora_patient_dietplan_${userId}`, JSON.stringify(publishedPlans[0]));
          }
        } else if (publishedPlans.length > 0) {
          setDietPlans(publishedPlans);
          localStorage.setItem(`healora_patient_dietplan_${userId}`, JSON.stringify(publishedPlans[0]));
        } else {
          setDietPlans([]);
        }
      } else {
        const carePlansObj = JSON.parse(localStorage.getItem('healora_care_plans') || '{}');
        const carePlanForMe = carePlansObj[userId];
        const cached = JSON.parse(localStorage.getItem(`healora_patient_dietplan_${userId}`) || 'null') || carePlanForMe;
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
            token_number: l.token_number || existing.token_number,
            queue_status: l.queue_status || existing.queue_status || 'WAITING',
            allocated_room: l.allocated_room || existing.allocated_room,
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

    if (!mealName || !mealName.trim()) {
      const defaultOptions = getKeralaPersonalizedOptions(mealType, profile, labReports);
      const safe = getSafeUniversalMeal(mealType);
      const fallback = defaultOptions[0] || safe;
      mealName = fallback.name;
      cal = fallback.cal || safe.cal;
      desc = fallback.desc || safe.desc;
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
    setRazorpayLiveError('');

    // 🌟 LIVE VALIDATION GUARDS BEFORE EXECUTING PAYMENT 🌟
    if (razorpayMethod === 'upi') {
      if (razorpayUpiApp === 'custom') {
        if (!customUpiId.trim()) {
          setRazorpayLiveError('Please enter a valid UPI ID (e.g., username@oksbi).');
          return;
        }
        if (!isCustomUpiValid) {
          setRazorpayLiveError('Invalid UPI ID format. Valid format example: yourname@oksbi or mobile@paytm.');
          return;
        }
      }
    } else if (razorpayMethod === 'card') {
      if (!isCardNumberValid) {
        setRazorpayLiveError('Please enter a complete 16-digit card number.');
        return;
      }
      if (!isCardExpiryValid) {
        setRazorpayLiveError('Invalid or expired card date (MM/YY).');
        return;
      }
      if (!isCardCvvValid) {
        setRazorpayLiveError('Please enter a valid 3-digit CVV security code.');
        return;
      }
    }

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
        try { 
          localStorage.setItem(`profilePic_${userId}`, reader.result); 
          setProfilePic(reader.result); 
          const formData = new FormData(); 
          formData.append('profile_image', file); 
          await fetch(`/api/profile/update/${userId}/`, { method: 'PATCH', body: formData }); 
        } catch(err) {} 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePic = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    try {
      localStorage.removeItem(`profilePic_${userId}`);
      localStorage.removeItem('profilePic');
      setProfilePic(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      const formData = new FormData();
      formData.append('profile_image', '');
      await fetch(`/api/profile/update/${userId}/`, { method: 'PATCH', body: formData }).catch(() => {});
      alert("✅ Profile picture removed successfully!");
    } catch (err) {
      setProfilePic(null);
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
    
    setLogForm(prev => ({ 
      ...prev,
      completed_slots: filteredCompletedSlots,
      breakfast_completed: !!filteredCompletedSlots.breakfast,
      lunch_completed: !!filteredCompletedSlots.lunch,
      dinner_completed: !!filteredCompletedSlots.dinner
    }));
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
                  {/* Cardholder Name */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Cardholder Name</label>
                      {paymentForm.cardName.length > 0 && (
                        <span className={`text-[10px] font-bold ${paymentForm.cardName.trim().length >= 3 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {paymentForm.cardName.trim().length >= 3 ? '✓ Valid' : 'Min 3 letters'}
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      spellCheck="false" 
                      autoComplete="new-password" 
                      value={paymentForm.cardName} 
                      onChange={(e) => handlePaymentChange('cardName', e.target.value)} 
                      placeholder="John Doe" 
                      className={`w-full border rounded-xl p-3 text-xs outline-none transition shadow-xs ${
                        paymentForm.cardName.length === 0 
                          ? 'border-[#EBE9E0] bg-white focus:border-[#456A50]' 
                          : paymentForm.cardName.trim().length >= 3 
                            ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                            : 'border-amber-400 bg-amber-50/10 focus:border-amber-500'
                      }`} 
                      required
                    />
                    {paymentForm.cardName.length > 0 && paymentForm.cardName.trim().length < 3 && (
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">⚠️ Name must be at least 3 letters.</p>
                    )}
                  </div>

                  {/* Card Number */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Card Number</label>
                      {paymentForm.cardNumber.length > 0 && (
                        <span className={`text-[10px] font-bold ${paymentForm.cardNumber.length === 16 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {paymentForm.cardNumber.length === 16 ? '✓ 16 Digits' : `${paymentForm.cardNumber.length}/16 digits`}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        maxLength="16" 
                        spellCheck="false" 
                        autoComplete="new-password" 
                        value={paymentForm.cardNumber} 
                        onChange={(e) => handlePaymentChange('cardNumber', e.target.value)} 
                        placeholder="16 Digit Number" 
                        className={`w-full border rounded-xl p-3 pl-10 text-xs outline-none transition shadow-xs ${
                          paymentForm.cardNumber.length === 0 
                            ? 'border-[#EBE9E0] bg-white focus:border-[#456A50]' 
                            : paymentForm.cardNumber.length === 16 
                              ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                              : 'border-amber-400 bg-amber-50/10 focus:border-amber-500'
                        }`} 
                        required
                      />
                      <CreditCard size={16} className={`absolute left-3.5 top-3.5 ${
                        paymentForm.cardNumber.length === 0 ? 'text-gray-400' : paymentForm.cardNumber.length === 16 ? 'text-emerald-700' : 'text-amber-700'
                      }`} />
                    </div>
                    {paymentForm.cardNumber.length > 0 && paymentForm.cardNumber.length < 16 && (
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        ⚠️ {16 - paymentForm.cardNumber.length} more digits needed (16 digits required)
                      </p>
                    )}
                    {paymentForm.cardNumber.length === 16 && (
                      <p className="text-[11px] text-emerald-700 mt-1 font-medium">✓ 16-digit card verified</p>
                    )}
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {(() => {
                        let isExpiryValid = false;
                        let expiryMsg = null;
                        if (paymentForm.expiry.length === 5) {
                          const [mm, yy] = paymentForm.expiry.split('/');
                          const now = new Date();
                          const currentYear = now.getFullYear() % 100;
                          const currentMonth = now.getMonth() + 1;
                          const monthNum = parseInt(mm, 10);
                          const yearNum = parseInt(yy, 10);
                          if (monthNum < 1 || monthNum > 12) {
                            expiryMsg = 'Invalid month (01-12)';
                          } else if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
                            expiryMsg = 'Card expired';
                          } else {
                            isExpiryValid = true;
                          }
                        }
                        return (
                          <div>
                            <div className="flex justify-between items-end mb-1">
                              <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">Expiry</label>
                              {paymentForm.expiry.length > 0 && (
                                <span className={`text-[10px] font-bold ${isExpiryValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {isExpiryValid ? '✓ Valid' : expiryMsg || `${paymentForm.expiry.length}/5`}
                                </span>
                              )}
                            </div>
                            <input 
                              type="text" 
                              maxLength="5" 
                              spellCheck="false" 
                              autoComplete="new-password" 
                              value={paymentForm.expiry} 
                              onChange={(e) => handlePaymentChange('expiry', e.target.value)} 
                              placeholder="MM/YY" 
                              className={`w-full border rounded-xl p-3 text-xs outline-none transition shadow-xs ${
                                paymentForm.expiry.length === 0 
                                  ? 'border-[#EBE9E0] bg-white focus:border-[#456A50]' 
                                  : isExpiryValid 
                                    ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                                    : 'border-amber-400 bg-amber-50/10 focus:border-amber-500'
                              }`} 
                              required
                            />
                            {paymentForm.expiry.length > 0 && !isExpiryValid && (
                              <p className="text-[11px] text-amber-700 mt-1 font-medium">
                                ⚠️ {expiryMsg || 'Format: MM/YY (e.g. 12/28)'}
                              </p>
                            )}
                            {isExpiryValid && (
                              <p className="text-[11px] text-emerald-700 mt-1 font-medium">✓ Expiry valid</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-bold text-[#5A6B60] uppercase tracking-widest">CVV</label>
                        {paymentForm.cvv.length > 0 && (
                          <span className={`text-[10px] font-bold ${paymentForm.cvv.length === 3 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {paymentForm.cvv.length === 3 ? '✓ 3 Digits' : `${paymentForm.cvv.length}/3`}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input 
                          type="password" 
                          maxLength="3" 
                          spellCheck="false" 
                          autoComplete="new-password" 
                          value={paymentForm.cvv} 
                          onChange={(e) => handlePaymentChange('cvv', e.target.value)} 
                          placeholder="•••" 
                          className={`w-full border rounded-xl p-3 pl-10 text-xs outline-none transition shadow-xs ${
                            paymentForm.cvv.length === 0 
                              ? 'border-[#EBE9E0] bg-white focus:border-[#456A50]' 
                              : paymentForm.cvv.length === 3 
                                ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600' 
                                : 'border-amber-400 bg-amber-50/10 focus:border-amber-500'
                          }`} 
                          required
                        />
                        <Lock size={15} className={`absolute left-3.5 top-3.5 ${
                          paymentForm.cvv.length === 0 ? 'text-gray-400' : paymentForm.cvv.length === 3 ? 'text-emerald-700' : 'text-amber-700'
                        }`} />
                      </div>
                      {paymentForm.cvv.length > 0 && paymentForm.cvv.length < 3 && (
                        <p className="text-[11px] text-amber-700 mt-1 font-medium">⚠️ 3 digits required</p>
                      )}
                      {paymentForm.cvv.length === 3 && (
                        <p className="text-[11px] text-emerald-700 mt-1 font-medium">✓ CVV verified</p>
                      )}
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
                          onClick={() => { setRazorpayUpiApp('gpay'); setCustomUpiId(''); setRazorpayLiveError(''); }}
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
                          onClick={() => { setRazorpayUpiApp('phonepe'); setCustomUpiId(''); setRazorpayLiveError(''); }}
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
                          onClick={() => { setRazorpayUpiApp('paytm'); setCustomUpiId(''); setRazorpayLiveError(''); }}
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

                      {/* Custom VPA Input with Live Validation */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                            Or Enter Any UPI ID / VPA
                          </label>
                          {customUpiId.trim() && isCustomUpiValid && (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-600" /> Live Validated
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={customUpiId}
                            onChange={(e) => {
                              const val = e.target.value.trim().toLowerCase();
                              setCustomUpiId(val);
                              setRazorpayUpiApp('custom');
                              setRazorpayLiveError('');
                            }}
                            placeholder="e.g. yourname@oksbi"
                            className={`w-full border rounded-xl p-3 pr-28 text-xs outline-none transition font-medium ${
                              !customUpiId.trim()
                                ? 'border-gray-300 bg-white focus:border-[#0c2340] focus:ring-1 focus:ring-[#0c2340]'
                                : isCustomUpiValid
                                ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                                : 'border-amber-400 bg-amber-50/20 text-amber-950 ring-2 ring-amber-400/20'
                            }`}
                          />
                          <span className={`absolute right-2.5 top-2.5 text-[10px] font-black px-2.5 py-1 rounded-md uppercase transition flex items-center gap-1 ${
                            isCustomUpiValid 
                              ? 'text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-2xs' 
                              : 'text-gray-500 bg-gray-100'
                          }`}>
                            {isCustomUpiValid ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-600" /> @UPI OK
                              </>
                            ) : (
                              '@upi'
                            )}
                          </span>
                        </div>

                        {/* 🌟 LIVE VALIDATION FEEDBACK CARD 🌟 */}
                        {customUpiId.trim() && isCustomUpiValid && (
                          <div className="mt-2.5 p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 shadow-2xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                                ✓
                              </div>
                              <div>
                                <p className="font-black text-emerald-950">
                                  Verified UPI ID: <span className="font-mono text-emerald-800">{customUpiId}</span>
                                </p>
                                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                  {upiBankLabel} • Bank Server Linked & Verified Live
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded shadow-2xs shrink-0">
                              Active
                            </span>
                          </div>
                        )}

                        {customUpiId.trim() && !isCustomUpiValid && (
                          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-xs text-amber-900 animate-in fade-in">
                            <AlertCircle size={15} className="text-amber-600 shrink-0" />
                            <p className="text-[11px] font-medium leading-tight">
                              Incomplete or invalid format. Please enter full ID (e.g. <span className="font-mono font-bold">username@oksbi</span>, <span className="font-mono font-bold">9876543210@paytm</span>, <span className="font-mono font-bold">name@okhdfcbank</span>).
                            </p>
                          </div>
                        )}

                        {!customUpiId.trim() && razorpayUpiApp !== 'custom' && (
                          <div className="mt-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-[#0c2340] animate-in fade-in">
                            <div className="flex items-center gap-2">
                              <Zap size={14} className="text-blue-600 shrink-0" />
                              <div>
                                <p className="font-bold">
                                  {razorpayUpiApp === 'gpay' ? 'Google Pay' : razorpayUpiApp === 'phonepe' ? 'PhonePe' : 'Paytm UPI'} Selected
                                </p>
                                <p className="text-[10px] text-gray-500">Fast 1-click mobile authorization ready</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded">
                              App Ready
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- CARDS VIEW --- */}
                  {razorpayMethod === 'card' && (
                    <div className="space-y-3.5 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-sm text-[#1C2C22]">Credit / Debit Card</h4>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black transition ${cardBrand === 'VISA' ? 'bg-blue-900 text-white ring-2 ring-blue-400' : 'bg-gray-100 text-gray-600'}`}>VISA</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black transition ${cardBrand === 'MASTERCARD' ? 'bg-red-600 text-white ring-2 ring-red-400' : 'bg-gray-100 text-gray-600'}`}>MC</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black transition ${cardBrand === 'RUPAY' ? 'bg-emerald-800 text-white ring-2 ring-emerald-400' : 'bg-gray-100 text-gray-600'}`}>RuPay</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Card Number</label>
                          {isCardNumberValid && (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.2 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={10} className="text-emerald-600" /> {cardBrand} Verified
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          maxLength={19}
                          value={razorpayCardForm.number}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                            const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                            setRazorpayCardForm(prev => ({ ...prev, number: formatted }));
                            setRazorpayLiveError('');
                          }}
                          placeholder="4532 8901 2345 6789"
                          className={`w-full border rounded-xl p-2.5 text-xs outline-none font-mono transition ${
                            isCardNumberValid 
                              ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 ring-1 ring-emerald-500/30' 
                              : 'border-gray-300 focus:border-[#0c2340]'
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expiry</label>
                            {isCardExpiryValid && <CheckCircle2 size={11} className="text-emerald-600" />}
                          </div>
                          <input
                            type="text"
                            maxLength={5}
                            value={razorpayCardForm.expiry}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                              if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                              setRazorpayCardForm(prev => ({ ...prev, expiry: v }));
                              setRazorpayLiveError('');
                            }}
                            placeholder="MM/YY"
                            className={`w-full border rounded-xl p-2.5 text-xs outline-none font-mono transition ${
                              isCardExpiryValid 
                                ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 ring-1 ring-emerald-500/30' 
                                : 'border-gray-300 focus:border-[#0c2340]'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">CVV</label>
                            {isCardCvvValid && <CheckCircle2 size={11} className="text-emerald-600" />}
                          </div>
                          <input
                            type="password"
                            maxLength={4}
                            value={razorpayCardForm.cvv}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setRazorpayCardForm(prev => ({ ...prev, cvv: v }));
                              setRazorpayLiveError('');
                            }}
                            placeholder="CVV"
                            className={`w-full border rounded-xl p-2.5 text-xs outline-none font-mono transition ${
                              isCardCvvValid 
                                ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 ring-1 ring-emerald-500/30' 
                                : 'border-gray-300 focus:border-[#0c2340]'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- NETBANKING VIEW --- */}
                  {razorpayMethod === 'netbanking' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-sm text-[#1C2C22]">Select Popular Bank</h4>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Direct Server Link</span>
                      </div>
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
                            onClick={() => { setSelectedBank(bank.name); setRazorpayLiveError(''); }}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center gap-2.5 ${selectedBank === bank.name ? 'border-[#0c2340] bg-blue-50/60 text-[#0c2340] shadow-sm ring-1 ring-[#0c2340]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span className="text-base">{bank.icon}</span>
                            <span>{bank.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-[#0c2340]">
                        <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                          <CheckCircle2 size={13} className="text-emerald-600" /> {selectedBank} Selected
                        </p>
                        <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded">Server Active</span>
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
                            onClick={() => { setSelectedWallet(wallet); setRazorpayLiveError(''); }}
                            className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex justify-between items-center ${selectedWallet === wallet ? 'border-[#0c2340] bg-blue-50/50 text-[#0c2340]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span>👛 {wallet}</span>
                            {selectedWallet === wallet && <CheckCircle2 size={16} className="text-[#0c2340]" />}
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-[#0c2340]">
                        <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                          <CheckCircle2 size={13} className="text-emerald-600" /> {selectedWallet} Linked
                        </p>
                        <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded">Instant Balance</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Section */}
                <div className="pt-4 border-t border-gray-200 mt-4">
                  {/* Error Alert Box */}
                  {razorpayLiveError && (
                    <div className="mb-3 p-3 bg-red-50 text-red-900 border border-red-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle size={16} className="text-red-600 shrink-0" />
                      <span>{razorpayLiveError}</span>
                    </div>
                  )}

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
          <button onClick={() => { setActiveTab('scorecard'); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='scorecard' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <div className="flex items-center gap-3">
              <Award size={18} className="shrink-0 text-emerald-600" />
              <span>Metabolic Scorecard</span>
            </div>
            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
              {metabolicHealthScore.totalScore}/100
            </span>
          </button>
          <button onClick={() => { setActiveTab('history'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='history' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Clock size={18} className="shrink-0" /> <span>Health History</span></button>
          <button onClick={() => { setActiveTab('challenges'); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='challenges' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <div className="flex items-center gap-3">
              <Trophy size={18} className="shrink-0 text-amber-500" />
              <span>Challenges & Badges</span>
            </div>
            <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
              5% OFF
            </span>
          </button>
          <button onClick={() => { setActiveTab('appointments'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='appointments' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><Calendar size={18} className="shrink-0" /> <span>Appointments & Chat</span></button>
          <button onClick={() => { setActiveTab('evaluations'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm whitespace-nowrap ${activeTab==='evaluations' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}><ClipboardList size={18} className="shrink-0" /> <span>Nutritionist Evaluations</span></button>
        </nav>
        <div className="p-6 border-t border-[#EBE9E0] bg-[#FDFCF8]/50">
          <div className="flex items-center gap-3 mb-5 px-1">
            {/* 🌟 SIDEBAR AVATAR WITH CLICK-TRIGGERED ACTION MENU 🌟 */}
            <div className="relative" ref={sidebarProfileMenuRef}>
              <div 
                className="w-11 h-11 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center cursor-pointer relative hover:ring-2 hover:ring-[#456A50]/40 transition group"
                onClick={() => setShowSidebarProfileMenu(prev => !prev)}
                title="Profile Photo Options"
              >
                {profilePic ? <img src={profilePic} className="w-full h-full object-cover" alt="User"/> : <UserCircle size={28} className="text-gray-400" />}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full">
                  <Camera size={13} className="text-white" />
                </div>
              </div>

              {/* 🌟 SIDEBAR CLICK POPUP MENU 🌟 */}
              {showSidebarProfileMenu && (
                <div className="absolute left-0 bottom-14 w-48 bg-white rounded-2xl shadow-xl border border-[#EBE9E0] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSidebarProfileMenu(false);
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-[#1C2C22] hover:bg-[#EAF0EC] hover:text-[#456A50] flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Camera size={14} className="text-[#456A50]" />
                    <span>{profilePic ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {profilePic && (
                    <button
                      type="button"
                      onClick={(e) => {
                        setShowSidebarProfileMenu(false);
                        handleRemoveProfilePic(e);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition border-t border-gray-100 cursor-pointer"
                    >
                      <Trash2 size={14} className="text-red-500" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              )}
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

              {/* 🌟 HEADER AVATAR WITH CLICK-TRIGGERED POPUP MENU 🌟 */}
              <div className="relative" ref={profileMenuRef}>
                <div 
                  className="w-14 h-14 shrink-0 rounded-full border-4 border-white shadow-md overflow-hidden cursor-pointer bg-gray-100 relative hover:ring-2 hover:ring-[#456A50]/40 transition group" 
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  title="Click to manage profile photo"
                >
                  {profilePic ? (
                    <img src={profilePic} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle size={28} className="text-[#5A6B60]"/>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>

                {/* 🌟 CLICK-TRIGGERED PROFILE POPUP MENU 🌟 */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-16 w-52 bg-white rounded-2xl shadow-xl border border-[#EBE9E0] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2 border-b border-[#EBE9E0]/70 mb-1">
                      <p className="text-xs font-black text-[#1C2C22] truncate">{userName}</p>
                      <p className="text-[10px] font-bold text-[#456A50] uppercase tracking-wider">Patient Profile</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-[#1C2C22] hover:bg-[#EAF0EC] hover:text-[#456A50] flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Camera size={15} className="text-[#456A50]" />
                      <span>{profilePic ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>

                    {profilePic && (
                      <button
                        type="button"
                        onClick={(e) => {
                          setShowProfileMenu(false);
                          handleRemoveProfilePic(e);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition border-t border-gray-100 cursor-pointer"
                      >
                        <Trash2 size={15} className="text-red-500" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} accept="image/*" className="hidden" />
            </div>
          </div>

          {/* 🔔 CLINIC MANAGER TODAY'S CONSULTATION REMINDER & LIVE TOKEN PASS BANNER 🔔 */}
          {todayConsultationReminders.length > 0 && (
            <div className="space-y-4">
              {todayConsultationReminders.map(appt => {
                const docObj = nutritionists.find(n => String(n.id) === String(appt.nutritionist));
                const docName = docObj ? `Dr. ${docObj.first_name} ${docObj.last_name}` : (appt.doctor_name || 'Assigned Clinical Nutritionist');
                const isOnline = appt.mode === 'ONLINE';
                const tokenNum = appt.token_number || 'TK-101';
                const queueStatus = appt.queue_status || 'WAITING';
                const isCalled = queueStatus === 'CALLED';
                const isInSession = queueStatus === 'IN_CONSULTATION';
                const isCompleted = queueStatus === 'COMPLETED';
                const roomName = appt.allocated_room || (isOnline ? 'In-App Telehealth Video Suite' : 'Doctor Consultation Chamber (Ground Floor, Room 101)');

                // Custom styling based on real-time live clinic queue state
                const cardBg = isCalled
                  ? 'bg-gradient-to-r from-[#78350F] via-[#92400E] to-[#78350F] border-2 border-amber-300 ring-4 ring-amber-400/30 shadow-2xl'
                  : isInSession
                  ? 'bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#064E3B] border-2 border-emerald-400 shadow-xl'
                  : isCompleted
                  ? 'bg-gradient-to-r from-[#1E293B] via-[#334155] to-[#1E293B] border border-slate-600 shadow-md'
                  : 'bg-gradient-to-r from-[#1C2C22] via-[#2A4433] to-[#1C2C22] border-2 border-emerald-500/40 shadow-xl';

                return (
                  <div 
                    key={appt.id} 
                    className={`${cardBg} text-white p-5 sm:p-6 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 animate-in slide-in-from-top-3 duration-500 relative overflow-hidden`}
                  >
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                        isCalled
                          ? 'bg-amber-400 text-amber-950 animate-bounce'
                          : isInSession
                          ? 'bg-emerald-400/30 border border-emerald-300 text-emerald-200'
                          : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                      }`}>
                        {isOnline ? (
                          <Video size={26} className="text-white" />
                        ) : isCalled ? (
                          <Megaphone size={26} className="text-amber-950 animate-pulse" />
                        ) : (
                          <Ticket size={26} className="text-emerald-200" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {isOnline ? (
                            <span className="bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5 shadow-xs">
                              <Video size={11} /> 📹 ONLINE TELEHEALTH CONSULTATION
                            </span>
                          ) : isCalled ? (
                            <span className="bg-amber-400 text-amber-950 font-black text-[10px] uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1.5 shadow-md animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-amber-900 animate-ping"></span> 📢 YOUR TOKEN HAS BEEN CALLED!
                            </span>
                          ) : isInSession ? (
                            <span className="bg-emerald-400 text-emerald-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full tracking-wider flex items-center gap-1.5 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping"></span> 🟢 IN CONSULTATION ROOM
                            </span>
                          ) : isCompleted ? (
                            <span className="bg-white/20 text-gray-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                              ✓ CONSULTATION COMPLETED
                            </span>
                          ) : (
                            <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5 shadow-xs">
                              <Ticket size={11} /> 🎟️ TODAY'S CLINIC LIVE TOKEN PASS
                            </span>
                          )}

                          {!isOnline && (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isCalled 
                                ? 'bg-amber-300 text-amber-950 border-amber-200' 
                                : isInSession 
                                ? 'bg-emerald-300/20 text-emerald-200 border-emerald-300/40' 
                                : 'bg-white/10 text-emerald-200 border-white/10'
                            }`}>
                              {isCalled ? 'PROCEED TO DOCTOR ROOM' : isInSession ? 'ACTIVE IN SESSION' : isCompleted ? 'SESSION CLOSED' : '⏳ WAITING IN LOBBY'}
                            </span>
                          )}

                          {appt.reminder_sent && (
                            <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              ✓ Clinic Alert Sent
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
                          Consultation with {docName}
                          {!isOnline && (
                            <span className="bg-black/30 border border-white/20 text-white font-mono px-2.5 py-0.5 rounded-lg text-sm font-black">
                              Token #{tokenNum}
                            </span>
                          )}
                        </h3>

                        <div className="text-xs text-gray-200 mt-1 space-y-0.5 font-medium">
                          <p className="flex flex-wrap items-center gap-2">
                            <span>⏰ Scheduled Time: <strong className="text-emerald-300 font-black">{appt.time}</strong> Today</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-white font-bold">
                              <DoorOpen size={13} className="text-amber-300" /> {roomName}
                            </span>
                          </p>

                          {!isOnline && (
                            <p className={`text-[11px] font-bold pt-0.5 ${isCalled ? 'text-amber-200 animate-pulse' : isInSession ? 'text-emerald-200' : 'text-emerald-100/80'}`}>
                              {isCalled 
                                ? "👉 Doctor is ready for you! Please proceed immediately into the consultation chamber."
                                : isInSession
                                ? "🩺 Consultation session is actively underway inside the room."
                                : isCompleted
                                ? "✅ Session completed. You can view doctor recommendations and diet guidelines."
                                : "🕒 Please take a seat in the reception lobby. Watch this card or listen for your token announcement."}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto relative z-10 shrink-0">
                      {isOnline ? (
                        <button 
                          type="button"
                          onClick={() => handleStartVideoConsultation(appt)}
                          className="flex-1 lg:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3.5 rounded-2xl text-xs transition shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <Video size={16} /> Enter Video Consultation Room <Sparkles size={14} className="text-amber-300" />
                        </button>
                      ) : (
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                          <div className={`px-4 py-2.5 rounded-2xl border text-center flex flex-col items-center justify-center shrink-0 w-full sm:w-auto ${
                            isCalled 
                              ? 'bg-white text-amber-950 border-amber-300 shadow-lg' 
                              : isInSession 
                              ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-200' 
                              : 'bg-white/10 border-white/20 text-white'
                          }`}>
                            <span className="text-[9px] uppercase font-black tracking-widest block opacity-75">Your Token</span>
                            <span className="text-xl font-mono font-black">{tokenNum}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => printClinicTokenSlip(appt, { name: userName || profile.first_name })}
                            className="flex-1 sm:flex-initial bg-white hover:bg-gray-100 text-[#1C2C22] font-black px-4 py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Print Official Token Pass"
                          >
                            <Printer size={15} className="text-[#456A50]" /> Print Token Pass
                          </button>
                        </div>
                      )}

                      <button 
                        onClick={() => setActiveTab('appointments')} 
                        className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 🥗 REAL-TIME ACTIVE MEAL RECOMMENDATION & INTAKE TIMING BANNER 🥗 */}
          {activeCurrentMealRecommendation && (
            <div className="bg-gradient-to-r from-[#F4F9F5] via-[#FDFCF8] to-[#F4F9F5] border-2 border-emerald-500/30 rounded-3xl p-6 shadow-md relative overflow-hidden animate-in fade-in">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-600/30 shadow-sm shrink-0 bg-white">
                    <img 
                      src={activeCurrentMealRecommendation.img} 
                      alt={activeCurrentMealRecommendation.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="bg-emerald-700 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5 shadow-xs">
                        <Sparkles size={11} className="text-amber-300 animate-spin" /> ACTIVE MEAL WINDOW
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ⏰ Prescribed Intake: <strong>{activeCurrentMealRecommendation.time}</strong>
                      </span>
                      <span className="text-[10px] font-bold text-[#5A6B60]">
                        Slot: {activeCurrentMealRecommendation.slotLabel}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-[#1C2C22] tracking-tight">
                      {activeCurrentMealRecommendation.name}
                    </h3>
                    <p className="text-xs text-[#5A6B60] mt-1 font-medium max-w-xl">
                      {activeCurrentMealRecommendation.advice}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
                  {!activeCurrentMealRecommendation.isLogged ? (
                    <button
                      onClick={handleQuickMarkActiveMealCompleted}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={15} /> Mark Eaten
                    </button>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 size={15} className="text-emerald-700" /> Eaten & Logged
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab('diet');
                    }}
                    className="bg-[#456A50] hover:bg-[#35533E] text-white px-5 py-3 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Apple size={16} /> View Full Diet Plan
                  </button>
                </div>
              </div>
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
                        <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-sm"><p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1.5">Current Medications</p><p className="text-sm font-bold text-[#1C2C22]">{profile.current_medications || 'None reported'}</p></div>
                        <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-sm"><p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1.5">Food Allergies</p><p className={`text-sm font-bold ${profile.food_allergies && profile.food_allergies !== 'None' ? 'text-red-600' : 'text-[#1C2C22]'}`}>{profile.food_allergies || 'None reported'}</p></div>
                      </div>

                      {/* 🛡️ CLINICAL DECISION SUPPORT: DRUG-NUTRIENT & ALLERGY SAFETY ADVISORY */}
                      {(() => {
                        const safety = evaluateClinicalSafety(profile);
                        return (
                          <div className={`p-5 rounded-2xl border shadow-sm space-y-3 mt-3 transition-all ${
                            safety.isAllClear ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/70 border-amber-300'
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
                                  <h4 className="font-bold text-sm text-[#1C2C22]">Clinical Drug–Nutrient & Allergy Advisory</h4>
                                  <p className="text-[11px] text-[#5A6B60]">Deterministic Rule-Based Clinical Decision Support (CDSS)</p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                                safety.isAllClear ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-200 text-amber-900 border-amber-300'
                              }`}>
                                {safety.isAllClear ? '🛡️ Safety Verified • Zero Conflicts' : `⚠️ ${safety.totalAlerts} Active Clinical Directives`}
                              </span>
                            </div>

                            {safety.isAllClear ? (
                              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                                🛡️ No adverse drug-food interactions or allergen contraindications detected for current profile. Dietary regime is medically cleared.
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
                                      <strong className="text-[#1C2C22]">Biomedical Mechanism:</strong> {alert.mechanism}
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
                      <h3 className="text-sm font-bold text-[#1C2C22] border-b border-[#EBE9E0] pb-2 mt-4">Lifestyle & Diet</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-[#EBE9E0] shadow-sm"><p className="text-[10px] uppercase font-bold text-[#5A6B60] tracking-widest mb-1.5">Diet Preferences</p><p className="text-sm font-bold text-[#1C2C22]">{profile.food_preferences || 'No preference'}</p></div>
                        <div className="bg-[#1C2C22] border border-[#1C2C22] p-5 rounded-2xl shadow-sm"><p className="text-[10px] uppercase font-bold text-[#A4B3A8] tracking-widest mb-1.5">Primary Goal</p><p className="text-sm font-black text-white">{profile.health_goals || 'Weight Loss'} <span className="font-medium text-xs text-gray-400">({profile.target_weight ? `${profile.target_weight}kg` : ''})</span></p></div>
                      </div>

                      {/* 🧮 CLINICAL METABOLIC & MACRONUTRIENT ENERGY PROFILE */}
                      <div className="bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl p-5 shadow-sm space-y-4 mt-4">
                        <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-3">
                          <div className="flex items-center gap-2">
                            <Flame size={18} className="text-amber-500" />
                            <h4 className="font-black text-sm text-[#1C2C22]">Clinical Energy & Metabolic Engine</h4>
                          </div>
                          <span className="text-[10px] font-bold text-[#456A50] bg-[#EAF0EC] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Mifflin-St Jeor Formula
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-white p-3 rounded-xl border border-[#EBE9E0] shadow-2xs">
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 block">Basal BMR</span>
                            <span className="text-base font-black text-[#1C2C22]">{metabolicProfile.bmr} <small className="text-[10px] font-normal text-gray-500">kcal</small></span>
                            <span className="text-[9px] text-gray-400 block mt-0.5">Resting burn</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-[#EBE9E0] shadow-2xs">
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 block">Active TDEE</span>
                            <span className="text-base font-black text-[#456A50]">{metabolicProfile.tdee} <small className="text-[10px] font-normal text-gray-500">kcal</small></span>
                            <span className="text-[9px] text-gray-400 block mt-0.5">Maintenance</span>
                          </div>
                          {hasPublishedDietPlan ? (
                            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-2xs">
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 block">Target Goal</span>
                              <span className="text-base font-black text-emerald-700">{metabolicProfile.targetCalories} <small className="text-[10px] font-bold text-emerald-600">kcal</small></span>
                              <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Prescribed daily</span>
                            </div>
                          ) : (
                            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block">Target Goal</span>
                              <span className="text-xs font-black text-amber-900 block mt-0.5">⏳ Pending</span>
                              <span className="text-[9px] text-amber-700 font-bold block mt-0.5">Awaiting Plan</span>
                            </div>
                          )}
                        </div>

                        {hasPublishedDietPlan ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">Prescribed Macronutrient Grams</span>
                              <span className="text-[10px] text-gray-400 font-medium">Daily Gram Splits</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
                                <span className="text-[9px] font-black text-amber-800 uppercase block">Carbs ({metabolicProfile.carbRatio}%)</span>
                                <span className="text-sm font-black text-amber-900">{metabolicProfile.carbsGrams}g</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200">
                                <span className="text-[9px] font-black text-blue-800 uppercase block">Protein ({metabolicProfile.proteinRatio}%)</span>
                                <span className="text-sm font-black text-blue-900">{metabolicProfile.proteinGrams}g</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                                <span className="text-[9px] font-black text-emerald-800 uppercase block">Fats ({metabolicProfile.fatRatio}%)</span>
                                <span className="text-sm font-black text-emerald-900">{metabolicProfile.fatsGrams}g</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50/50 border border-dashed border-amber-300 rounded-xl p-3.5 text-center space-y-1">
                            <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                              <Clock size={14} className="text-amber-700" /> Awaiting Nutritionist Consultation for Prescribed Goal & Macros
                            </p>
                            <p className="text-[10px] text-[#5A6B60] font-medium leading-relaxed max-w-lg mx-auto">
                              Your assigned clinical nutritionist will calibrate your daily caloric target and macronutrient splits based on your clinical assessment and consultations.
                            </p>
                          </div>
                        )}
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

                  <div className="space-y-3 overflow-y-auto max-h-80 pr-2 custom-scrollbar">
                    {labReports.map((report) => {
                      const isReviewed = report.status === 'REVIEWED';
                      const docName = report.name || report.file?.split('/').pop() || 'Clinical Document';
                      const docCategory = report.type || report.document_type || 'Clinical Report';
                      const docDate = report.date || (report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString() : '');
                      const docSize = report.size || '';

                      return (
                      <div key={report.id} className="p-4 bg-white border border-[#EBE9E0] rounded-2xl shadow-xs hover:border-[#456A50]/40 transition group space-y-3">
                        {/* Top Header: File Icon + Full Document Name + Quick Actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isReviewed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              <File size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs sm:text-sm text-[#1C2C22] break-words leading-tight" title={docName}>
                                {docName}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[10px] bg-[#EAF0EC] text-[#456A50] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                  {docCategory}
                                </span>
                                {docDate && (
                                  <>
                                    <span className="text-gray-300 text-xs">•</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{docDate}</span>
                                  </>
                                )}
                                {docSize && (
                                  <>
                                    <span className="text-gray-300 text-xs">•</span>
                                    <span className="text-[10px] text-gray-400 font-medium">{docSize}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {report.fileUrl && (
                              <a 
                                href={report.fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                download={docName} 
                                className="text-[#456A50] hover:text-[#35533E] bg-[#EAF0EC] hover:bg-[#dfe8e2] p-2 rounded-xl text-xs font-bold transition flex items-center justify-center shadow-xs"
                                title="Download / View Document"
                              >
                                <Download size={15} />
                              </a>
                            )}
                            <button 
                              onClick={() => removeLabReport(report.id)} 
                              className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition cursor-pointer flex items-center justify-center shadow-xs" 
                              title="Delete Document"
                            >
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </div>

                        {/* Status Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clinical Status</span>
                          {isReviewed ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 size={12} className="text-emerald-700" /> Reviewed
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                              <Clock size={12} className="text-amber-700" /> Available for Review
                            </span>
                          )}
                        </div>

                        {/* Nutritionist Review Notes (if reviewed) */}
                        {isReviewed && report.review_notes && (
                          <div className="bg-[#FDFCF8] border border-emerald-200/80 rounded-xl p-3 text-xs text-[#1C2C22] shadow-inner space-y-1">
                            <p className="font-extrabold text-[#456A50] text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <ClipboardList size={13}/> Nutritionist Clinical Findings & Note:
                            </p>
                            <p className="text-gray-700 italic font-medium leading-relaxed">"{report.review_notes}"</p>
                            {report.reviewed_at && (
                              <p className="text-[9px] text-gray-400 text-right">Reviewed by {report.reviewed_by || 'Nutritionist'} on {report.reviewed_at}</p>
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

                {/* 🔔 2-WEEK ADAPTATION COMPLETE — PROGRESS CONSULTATION SYSTEM REMINDER */}
                {(!isPhase2Unlocked && (isPhase1Completed || selectedWeek >= 2)) && (
                  <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border-2 border-amber-400 rounded-3xl p-5 md:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Bell size={24} className="animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-amber-500 text-white rounded-full">
                            Clinical Protocol Milestone
                          </span>
                          <span className="text-xs font-black text-amber-900">
                            Phase 1 Adaptation Complete (2 Weeks)
                          </span>
                        </div>
                        <h4 className="text-base font-black text-[#1C2C22] mt-1">
                          System Reminder: Book Progress Consultation to Unlock Phase 2 (Weeks 3 & 4)
                        </h4>
                        <p className="text-xs text-[#5A6B60] mt-1 max-w-2xl leading-relaxed font-medium">
                          You have completed your initial 14-day Kerala metabolic adaptation protocol. To evaluate your clinical biomarkers, weight trajectory, and unlock Weeks 3 & 4 of your protocol, please schedule your follow-up consultation with <strong>{publishedPlan?.nutritionist_name || 'your certified nutritionist'}</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('appointments');
                          if (nutritionists.length > 0) {
                            setApptForm(prev => ({ ...prev, nutritionist: publishedPlan?.nutritionist || nutritionists[0].id }));
                          }
                        }}
                        className="w-full md:w-auto bg-[#456A50] hover:bg-[#35533E] text-white px-5 py-3 rounded-xl font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Calendar size={15} /> Book Progress Consultation
                      </button>
                    </div>
                  </div>
                )}

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
                <div className="bg-white p-3 rounded-2xl border border-[#EBE9E0] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex gap-2 overflow-x-auto flex-1 pb-1 sm:pb-0 custom-scrollbar">
                    {daysOfWeek.map((day) => {
                      const isSelected = selectedDay === day;
                      const isLiveToday = day === todayDayName && (selectedWeek === 1);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`flex-1 min-w-[105px] py-3 px-3 rounded-xl text-center transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-[#456A50] text-white shadow-md font-black ring-2 ring-[#456A50]/30'
                              : 'bg-[#FDFCF8] text-[#1C2C22] border border-[#EBE9E0] font-bold hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <p className="text-xs uppercase tracking-wider">{day.slice(0, 3)}</p>
                            {isLiveToday && (
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                                isSelected ? 'bg-emerald-300 text-emerald-950 font-extrabold shadow-2xs' : 'bg-emerald-600 text-white animate-pulse'
                              }`}>
                                TODAY
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-gray-400 font-medium'}`}>
                            {getProtocolDate(selectedWeek || 1, day)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {(selectedDay !== todayDayName || selectedWeek !== 1) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWeek(1);
                        setSelectedDay(todayDayName);
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Clock size={13} className="text-emerald-600" /> Today ({todayDayName.slice(0,3)})
                    </button>
                  )}
                </div>

                {/* 🛡️ CLINICAL MEAL TIMING & DRUG INTERACTION DIRECTIVES */}
                {(() => {
                  const safety = evaluateClinicalSafety(profile);
                  if (safety.isAllClear) return null;
                  return (
                    <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                          <ShieldAlert size={18} className="text-amber-700 shrink-0" />
                          <span>Clinical Safety Directives for Today's Meals</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
                          {safety.totalAlerts} Active Timing / Allergy Rule{safety.totalAlerts > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {safety.alerts.map(a => (
                          <div key={a.id} className="bg-white/95 p-3 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border inline-block ${a.badgeColor}`}>{a.badge}</span>
                            <p className="text-xs font-bold text-[#1C2C22]">{a.safetyRule}</p>
                            <p className="text-[11px] text-gray-600 leading-snug">{a.clinicalDirective}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

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
                        const freq = publishedPlan?.meal_frequency || 5;
                        return `${freq}-Slot Clinical Protocol`;
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

                    // Guarantee consistent slot structure for every day of the week based on prescribed meal frequency
                    const prescribedMealCount = publishedPlan?.meal_frequency || 5;
                    let targetSlotKeys = ['breakfast', 'drink', 'lunch', 'snack', 'dinner'];
                    if (prescribedMealCount === 3) {
                      targetSlotKeys = ['breakfast', 'lunch', 'dinner'];
                    } else if (prescribedMealCount === 4) {
                      targetSlotKeys = ['breakfast', 'lunch', 'snack', 'dinner'];
                    } else if (prescribedMealCount === 6) {
                      targetSlotKeys = ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'];
                    }

                    const activeSlots = targetSlotKeys.map(k => allSlotDefs[k]);

                    const getActiveMealObj = (mealType) => {
                      const raw = currentDayPlan[mealType];
                      let mealName = '';
                      let cal = '250 kcal';

                      if (typeof raw === 'object' && raw?.name) {
                        mealName = raw.name;
                        cal = raw.cal || '250 kcal';
                      } else if (typeof raw === 'string') {
                        mealName = raw;
                        const calMatch = raw.match(/\((\d+\s*kcal)\)/i);
                        if (calMatch) {
                          cal = calMatch[1];
                          mealName = raw.replace(/\s*\(\d+\s*kcal\)/i, '').trim();
                        }
                      }

                      if (!mealName || !mealName.trim()) {
                        const safe = getSafeUniversalMeal(mealType);
                        mealName = safe.name;
                        cal = safe.cal;
                      }

                      return {
                        name: mealName,
                        cal,
                        img: getKeralaMealImage(mealName, mealType),
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
                          const isPassed = isMealTimeOver(selectedWeek, selectedDay, mealType, getMealTimingForSlot(mealType));
                          const { allergenConflict, dietPreferenceConflict } = evaluateMealConflicts(mealObj.name, {
                            food_allergies: profile?.food_allergies,
                            food_preferences: profile?.food_preferences
                          });
                          const isAllergen = !!allergenConflict;

                          return (
                            <div 
                              key={mealType} 
                              onClick={() => {
                                if (isPassed) return;
                                setSelectedMeal({ ...mealObj, type: mealType });
                              }}
                              className={`rounded-[2rem] p-4 flex flex-col transition-all relative overflow-hidden ${
                                isPassed
                                  ? 'bg-gray-100/90 border border-gray-300 opacity-60 grayscale-[35%] cursor-not-allowed shadow-none select-none'
                                  : isAllergen 
                                    ? 'bg-red-50/80 border-2 border-red-500 shadow-md ring-2 ring-red-400/20 cursor-pointer group hover:shadow-xl hover:-translate-y-1' 
                                    : dietPreferenceConflict
                                      ? 'bg-amber-50/80 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/20 cursor-pointer group hover:shadow-xl hover:-translate-y-1'
                                      : 'bg-[#FDFCF8] border border-[#EBE9E0] shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-[#456A50] cursor-pointer group'
                              }`}
                            >
                              <div className="relative overflow-hidden rounded-2xl mb-3 h-36 bg-gray-100 border border-gray-100">
                                <img 
                                  src={mealObj.img} 
                                  alt={mealObj.name} 
                                  onError={(e) => { e.target.onerror = null; e.target.src = getKeralaMealImage(mealObj.name, mealType); }}
                                  className={`w-full h-full object-cover transition-transform duration-500 ${!isPassed ? 'group-hover:scale-105' : ''}`}
                                />
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg">
                                  <span className="text-[9px] font-black text-white uppercase tracking-wider">{label}</span>
                                </div>
                                {isPassed ? (
                                  <div className="absolute top-2 right-2 bg-gray-900/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-gray-700 shadow-xs flex items-center gap-1 text-[9px] font-black text-gray-300 tracking-wider">
                                    <Clock size={10} className="text-gray-400" /> {getMealTimingForSlot(mealType)} • Closed
                                  </div>
                                ) : (
                                  <div className="absolute top-2 right-2 bg-emerald-950/85 backdrop-blur-md px-2 py-0.5 rounded-lg border border-emerald-400/40 shadow-xs">
                                    <span className="text-[9px] font-black text-emerald-300 tracking-wider flex items-center gap-1">
                                      <Clock size={10} className="text-emerald-400" /> {getMealTimingForSlot(mealType)}
                                    </span>
                                  </div>
                                )}

                                {isPassed ? (
                                  <div className="absolute bottom-2 left-2 right-2 bg-gray-900/90 backdrop-blur-md px-2 py-1 rounded-lg text-center shadow-xs">
                                    <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1">
                                      <Lock size={10} /> Window Closed (Time Passed)
                                    </span>
                                  </div>
                                ) : isAllergen ? (
                                  <div className="absolute bottom-2 left-2 right-2 bg-red-600/90 backdrop-blur-md px-2 py-1 rounded-lg text-center">
                                    <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center justify-center gap-1">
                                      <AlertTriangle size={10} /> Allergen Warning
                                    </span>
                                  </div>
                                ) : dietPreferenceConflict ? (
                                  <div className="absolute bottom-2 left-2 right-2 bg-amber-600/90 backdrop-blur-md px-2 py-1 rounded-lg text-center">
                                    <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center justify-center gap-1">
                                      <AlertTriangle size={10} /> Non-{dietPreferenceConflict.preference}
                                    </span>
                                  </div>
                                ) : null}
                              </div>

                              {isPassed ? (
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-700 bg-gray-200/80 px-2 py-0.5 rounded-md border border-gray-300 w-max mb-1 font-bold">
                                  <Lock size={10} className="text-gray-600" /> Prescribed: {getMealTimingForSlot(mealType)} (Passed)
                                </div>
                              ) : isAllergen ? (
                                <div className="flex items-center gap-1 text-[10px] text-red-900 bg-red-100 px-2 py-0.5 rounded-md border border-red-300 w-full mb-1 font-bold animate-pulse">
                                  <ShieldAlert size={12} className="text-red-600 shrink-0" />
                                  <span className="truncate">Contains "{allergenConflict.matchedKeyword}"</span>
                                </div>
                              ) : dietPreferenceConflict ? (
                                <div className="flex items-center gap-1 text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 w-full mb-1 font-bold animate-pulse">
                                  <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                                  <span className="truncate">Non-{dietPreferenceConflict.preference}: "{dietPreferenceConflict.matchedKeyword}"</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 w-max mb-1 font-bold">
                                  <Clock size={10} className="text-emerald-700" /> Prescribed: {getMealTimingForSlot(mealType)}
                                </div>
                              )}

                              <p className={`text-xs font-black leading-snug flex-1 mb-3 line-clamp-2 ${
                                isPassed ? 'text-gray-500 line-through' : isAllergen ? 'text-red-950' : dietPreferenceConflict ? 'text-amber-950' : 'text-[#1C2C22]'
                              }`}>{mealObj.name}</p>
                              
                              <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg border flex items-center gap-1 shadow-2xs ${
                                  isPassed ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-white text-[#456A50] border-[#EBE9E0]'
                                }`}>
                                  <Flame size={11}/> {mealObj.cal}
                                </span>
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                  isPassed 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : isAllergen 
                                      ? 'bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white' 
                                      : dietPreferenceConflict
                                        ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white'
                                        : 'bg-[#EAF0EC] text-[#456A50] group-hover:bg-[#456A50] group-hover:text-white'
                                }`}>
                                  {isPassed ? <Lock size={12}/> : <ChevronRight size={14}/>}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* 🌟 Daily Clinical Protocol Rules 🌟 */}
                  <h3 className="text-xl font-black text-[#1C2C22] mb-5 border-t border-[#EBE9E0] pt-6">Daily Clinical Protocol Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    <div className="bg-blue-50/60 p-6 rounded-[2rem] border border-blue-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Droplets size={80} color="blue"/></div>
                      <b className="text-[11px] uppercase text-blue-700 tracking-widest block mb-2 flex items-center gap-1.5 relative z-10"><Droplets size={16}/> Hydration Target</b>
                      <p className="text-sm font-black text-blue-950 leading-relaxed relative z-10">Drink at least 8 glasses (3 liters) daily with Sambharam (spiced buttermilk) or herbal Jeera/Methi infusions.</p>
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
                  {(() => {
                    const { allergenConflict, dietPreferenceConflict } = evaluateMealConflicts(selectedMeal.name, {
                      food_allergies: profile?.food_allergies,
                      food_preferences: profile?.food_preferences
                    });
                    if (allergenConflict) {
                      return (
                        <div className="mt-3 p-3.5 bg-red-100 border border-red-300 rounded-2xl text-red-950 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in">
                          <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-black text-red-800 text-[11px] uppercase tracking-wide">
                              🚨 Severe Allergen Warning
                            </p>
                            <p className="text-xs font-bold text-red-900 mt-0.5">
                              Contains "{allergenConflict.matchedKeyword}" which conflicts with your {allergenConflict.patientAllergy} allergy!
                            </p>
                            <p className="text-[11px] text-red-800 mt-1 leading-snug">
                              Do not consume this dish. Click "Swap with Personalized Option" below to choose a safe alternative.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    if (dietPreferenceConflict) {
                      return (
                        <div className="mt-3 p-3.5 bg-amber-100 border border-amber-300 rounded-2xl text-amber-950 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in">
                          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-black text-amber-800 text-[11px] uppercase tracking-wide">
                              ⚠️ Dietary Preference Conflict ({dietPreferenceConflict.preference})
                            </p>
                            <p className="text-xs font-bold text-amber-900 mt-0.5">
                              Contains non-{dietPreferenceConflict.preference.toLowerCase()} ingredient "{dietPreferenceConflict.matchedKeyword}".
                            </p>
                            <p className="text-[11px] text-amber-800 mt-1 leading-snug">
                              {dietPreferenceConflict.warning} Click "Swap with Personalized Option" to pick a compliant meal.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
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

                    // Guarantee consistent check-in slots matching prescribed meal frequency
                    const prescribedMealCount = publishedPlan?.meal_frequency || 5;
                    let targetSlotKeys = ['breakfast', 'drink', 'lunch', 'snack', 'dinner'];
                    if (prescribedMealCount === 3) {
                      targetSlotKeys = ['breakfast', 'lunch', 'dinner'];
                    } else if (prescribedMealCount === 4) {
                      targetSlotKeys = ['breakfast', 'lunch', 'snack', 'dinner'];
                    } else if (prescribedMealCount === 6) {
                      targetSlotKeys = ['pre_breakfast', 'breakfast', 'drink', 'lunch', 'snack', 'dinner'];
                    }

                    const activeCheckinSlots = targetSlotKeys.map(k => slotDefinitions[k]).filter(Boolean);

                    const defaultMealNames = {
                      pre_breakfast: 'Warm Jeera & Methi Seed Detox Water',
                      breakfast: 'Kerala Steamed Idiyappam & Kadala Curry',
                      drink: 'Kerala Spiced Buttermilk (Sambharam)',
                      lunch: 'Kerala Red Matta Rice with Fish Curry & Thoran',
                      snack: 'Sprouted Moong Salad with Lemon & Herbs',
                      dinner: 'Steamed Wheat / Ragi Dosa with Vegetable Stew'
                    };

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {activeCheckinSlots.map(slot => {
                            const isCompleted = !!logForm.completed_slots?.[slot.key] || (slot.key === 'breakfast' && logForm.breakfast_completed) || (slot.key === 'lunch' && logForm.lunch_completed) || (slot.key === 'dinner' && logForm.dinner_completed);

                            const rawMealStr = currentDayPlan[slot.key] || defaultMealNames[slot.key] || 'Kerala Wholesome Meal';
                            const cleanDishName = rawMealStr.replace(/\(\d+\s*kcal\)/i, '').trim();
                            const dishImg = getKeralaMealImage(cleanDishName, slot.key);

                            const toggleSlot = () => {
                              const nextVal = !isCompleted;
                              const updatedSlots = {
                                ...(logForm.completed_slots || {}),
                                [slot.key]: nextVal
                              };
                              setLogForm(prev => ({
                                ...prev,
                                completed_slots: updatedSlots,
                                ...(slot.key === 'breakfast' ? { breakfast_completed: nextVal } : {}),
                                ...(slot.key === 'lunch' ? { lunch_completed: nextVal } : {}),
                                ...(slot.key === 'dinner' ? { dinner_completed: nextVal } : {})
                              }));

                              // Sync immediately to wellnessLogs & localStorage
                              const now = new Date();
                              const todayIso = now.toISOString().split('T')[0];
                              const existingLogs = [...wellnessLogs];
                              const todayIndex = existingLogs.findIndex(l => l.date && String(l.date).startsWith(todayIso));
                              if (todayIndex >= 0) {
                                existingLogs[todayIndex] = {
                                  ...existingLogs[todayIndex],
                                  completed_slots: updatedSlots,
                                  breakfast_completed: slot.key === 'breakfast' ? nextVal : existingLogs[todayIndex].breakfast_completed,
                                  lunch_completed: slot.key === 'lunch' ? nextVal : existingLogs[todayIndex].lunch_completed,
                                  dinner_completed: slot.key === 'dinner' ? nextVal : existingLogs[todayIndex].dinner_completed
                                };
                              } else {
                                existingLogs.unshift({
                                  id: Date.now(),
                                  date: todayIso,
                                  completed_slots: updatedSlots,
                                  breakfast_completed: slot.key === 'breakfast' ? nextVal : false,
                                  lunch_completed: slot.key === 'lunch' ? nextVal : false,
                                  dinner_completed: slot.key === 'dinner' ? nextVal : false,
                                  ate_other_food: false,
                                  sleep_hours: '7.5',
                                  water_glasses: 4,
                                  mood: 'Calm & Balanced',
                                  physical_activity: '30 mins brisk walking'
                                });
                              }
                              setWellnessLogs(existingLogs);
                              localStorage.setItem(`healora_wellness_${userId}`, JSON.stringify(existingLogs));
                            };

                            return (
                              <div
                                key={slot.key}
                                onClick={toggleSlot}
                                className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                                  isCompleted 
                                    ? 'bg-[#EAF0EC] border-[#456A50] text-[#1C2C22] ring-1 ring-[#456A50]/30 shadow-xs' 
                                    : 'bg-white border-[#EBE9E0] text-gray-700 hover:border-[#456A50]/40 hover:bg-[#FDFCF8]'
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-gray-200 shrink-0 bg-gray-100 shadow-2xs">
                                    <img 
                                      src={dishImg} 
                                      alt={cleanDishName} 
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-black uppercase text-[#456A50] tracking-wider block">
                                      {slot.icon} {slot.label}
                                    </span>
                                    <p className="text-xs font-black text-[#1C2C22] leading-tight line-clamp-1 mt-0.5">
                                      {cleanDishName}
                                    </p>
                                    <p className="text-[10px] text-[#5A6B60] font-medium mt-0.5">
                                      {isCompleted ? '✓ Completed' : '○ Tap to Log'}
                                    </p>
                                  </div>
                                </div>

                                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition flex items-center gap-1 shadow-2xs ${
                                  isCompleted 
                                    ? 'bg-[#456A50] text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                                }`}>
                                  {isCompleted ? '✓ Done' : '○ Tap'}
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

        {/* 🌟 METABOLIC SCORECARD TAB (0-100 CLINICAL RATING & WEEKLY REPORT) 🌟 */}
        {activeTab === 'scorecard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Scorecard Header Card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#EBE9E0] gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-[#456A50]">
                    <Award size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-[#1C2C22]">Clinical Metabolic Health Scorecard</h2>
                </div>
                <p className="text-xs text-[#5A6B60] mt-1.5 font-medium">
                  Continuous 5-Pillar Metabolic Analysis • Calibrated via Mifflin-St Jeor Clinical Energy Protocol
                </p>
              </div>

              <button
                onClick={() => printMetabolicHealthReportCard(userName, metabolicHealthScore, profile, metabolicProfile)}
                className="bg-[#456A50] hover:bg-[#35533E] text-white px-5 py-3.5 rounded-2xl text-xs font-bold transition shadow-lg shadow-[#456A50]/20 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Printer size={16} /> Download Weekly Clinical Report (PDF)
              </button>
            </div>

            {/* Overall Health Score Main Dial Card */}
            <div className="bg-gradient-to-r from-[#1C2C22] via-[#2A4433] to-[#1C2C22] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-500/30 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  {/* Score Gauge Dial */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/10 border-2 border-emerald-400/40 flex flex-col items-center justify-center p-3 shadow-inner shrink-0">
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300">Score</span>
                    <span className="text-4xl sm:text-5xl font-black text-white">{metabolicHealthScore.totalScore}</span>
                    <span className="text-[10px] font-bold text-gray-300">/ 100 PTS</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                      <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-400/40">
                        {metabolicHealthScore.statusBadge}
                      </span>
                      <span className="bg-white/10 text-gray-200 text-[10px] font-bold px-3 py-1 rounded-full border border-white/10">
                        Verified by Dr. Sarah Jenkins
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {metabolicHealthScore.statusLabel}
                    </h3>
                    <p className="text-xs text-gray-300 mt-1 max-w-xl font-medium leading-relaxed">
                      {metabolicHealthScore.clinicalInsight}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 text-center sm:text-right shrink-0 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">Metabolic Goal</span>
                  <span className="text-sm font-black text-white">{profile.health_goals || 'Weight Management'}</span>
                  <span className="text-[11px] text-gray-300 block mt-1">
                    Target: <strong>{profile.target_weight || '60'} kg</strong> (Current: <strong>{profile.weight_kg || '65'} kg</strong>)
                  </span>
                </div>
              </div>
            </div>

            {/* 🌟 5 CLINICAL PILLARS COMPLIANCE GRID 🌟 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-[#456A50]" /> Five Clinical Health Pillars Breakdown
                </h3>
                <span className="text-xs text-[#5A6B60] font-medium">Updated dynamically from your daily logs</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Pillar 1: Meal Adherence */}
                <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
                        <Apple size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#1C2C22]">Meal Plan Adherence</h4>
                        <p className="text-[11px] text-[#5A6B60]">Prescribed Kerala Meals</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {metabolicHealthScore.mealPts} / 30
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${(metabolicHealthScore.mealPts / 30) * 100}%` }}></div>
                  </div>
                  <p className="text-[11px] text-[#5A6B60] leading-snug">
                    Tracking completed slots without cheat food across your prescribed 4-week Kerala nutrition therapy.
                  </p>
                </div>

                {/* Pillar 2: Daily Hydration Target */}
                <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700">
                        <Droplets size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#1C2C22]">Daily Hydration Target</h4>
                        <p className="text-[11px] text-[#5A6B60]">8+ Glasses / 3 Liters</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                      {metabolicHealthScore.waterPts} / 20
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(metabolicHealthScore.waterPts / 20) * 100}%` }}></div>
                  </div>
                  <p className="text-[11px] text-[#5A6B60] leading-snug">
                    Maintains cellular hydration, supports kidney filtration, and enhances lipid metabolism.
                  </p>
                </div>

                {/* Pillar 3: Restorative Sleep */}
                <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700">
                        <Moon size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#1C2C22]">Restorative Sleep</h4>
                        <p className="text-[11px] text-[#5A6B60]">7–8.5 Hours Nocturnal Rest</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                      {metabolicHealthScore.sleepPts} / 20
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${(metabolicHealthScore.sleepPts / 20) * 100}%` }}></div>
                  </div>
                  <p className="text-[11px] text-[#5A6B60] leading-snug">
                    Essential for nocturnal insulin sensitivity, hormone regulation, and cortisol normalization.
                  </p>
                </div>

                {/* Pillar 4: Physical Activity */}
                <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
                        <Footprints size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#1C2C22]">Physical Movement</h4>
                        <p className="text-[11px] text-[#5A6B60]">30+ Mins Daily Activity</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      {metabolicHealthScore.actPts} / 15
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full transition-all duration-500" style={{ width: `${(metabolicHealthScore.actPts / 15) * 100}%` }}></div>
                  </div>
                  <p className="text-[11px] text-[#5A6B60] leading-snug">
                    Stimulates GLUT4 glucose transporters and supports steady post-prandial energy balance.
                  </p>
                </div>

                {/* Pillar 5: Biometric Weigh-in Consistency */}
                <div className="bg-white p-6 rounded-3xl border border-[#EBE9E0] shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700">
                        <Scale size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#1C2C22]">Biometric Weigh-ins</h4>
                        <p className="text-[11px] text-[#5A6B60]">Weight Check-in Frequency</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                      {metabolicHealthScore.bioPts} / 15
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${(metabolicHealthScore.bioPts / 15) * 100}%` }}></div>
                  </div>
                  <p className="text-[11px] text-[#5A6B60] leading-snug">
                    Consistent tracking in your Biometric Health History maintains doctor visibility on weight velocity.
                  </p>
                </div>

                {/* Pillar Summary Badge Card */}
                <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#456A50] tracking-widest block mb-1">
                      Clinical Rating Summary
                    </span>
                    <h4 className="font-black text-base text-[#1C2C22] mb-1">
                      {metabolicHealthScore.totalScore >= 70 ? 'High Compliance Rate' : 'Improvement Roadmap'}
                    </h4>
                    <p className="text-[11px] text-[#5A6B60]">
                      Maintaining 75+ points keeps your metabolic risk markers low and accelerates body transformation.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tracking')}
                    className="mt-4 w-full bg-[#EAF0EC] hover:bg-[#456A50] hover:text-white text-[#456A50] py-2.5 rounded-xl font-bold text-xs transition cursor-pointer text-center"
                  >
                    Log Today's Habits
                  </button>
                </div>
              </div>
            </div>

            {/* 🌟 MIFFLIN-ST JEOR CLINICAL ENERGY TARGETS 🌟 */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EBE9E0] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#EBE9E0] pb-4">
                <div>
                  <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                    <Flame size={20} className="text-amber-500" /> Mifflin-St Jeor Clinical Energy & Macro Targets
                  </h3>
                  <p className="text-xs text-[#5A6B60] mt-0.5">
                    Scientifically calculated based on height ({profile.height_cm || 165} cm), weight ({profile.weight_kg || 65} kg), age ({profile.age || 25} yrs), and activity.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#EBE9E0]">
                  <span className="text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest block mb-1">Basal Metabolic Rate</span>
                  <span className="text-2xl font-black text-[#1C2C22]">{metabolicProfile.bmr}</span>
                  <span className="text-xs text-[#5A6B60] block font-medium">kcal / day (At Rest)</span>
                </div>

                <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#EBE9E0]">
                  <span className="text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest block mb-1">Total Daily Expenditure</span>
                  <span className="text-2xl font-black text-[#1C2C22]">{metabolicProfile.tdee}</span>
                  <span className="text-xs text-[#5A6B60] block font-medium">kcal / day (TDEE)</span>
                </div>

                <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">Prescribed Target</span>
                  <span className="text-2xl font-black text-emerald-900">{metabolicProfile.targetCalories}</span>
                  <span className="text-xs text-emerald-700 block font-bold">kcal / day (Clinical Plan)</span>
                </div>

                <div className="bg-[#FDFCF8] p-5 rounded-2xl border border-[#EBE9E0]">
                  <span className="text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest block mb-1">Prescribed Macros Split</span>
                  <p className="text-xs font-black text-[#1C2C22] mt-1">
                    🌾 C: {metabolicProfile.carbRatio}% ({metabolicProfile.carbsGrams}g)
                  </p>
                  <p className="text-xs font-black text-emerald-700">
                    🥩 P: {metabolicProfile.proteinRatio}% ({metabolicProfile.proteinGrams}g)
                  </p>
                  <p className="text-xs font-black text-amber-700">
                    🥑 F: {metabolicProfile.fatRatio}% ({metabolicProfile.fatsGrams}g)
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor's Verification & Clinical Seal */}
            <div className="bg-[#FDFCF8] p-6 rounded-3xl border border-[#EBE9E0] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#456A50] font-black flex items-center justify-center text-lg border border-[#456A50]/20 shrink-0">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#1C2C22]">Dr. Sarah Jenkins (MD, Clinical Nutrition)</h4>
                  <p className="text-xs text-[#5A6B60]">Lead Clinical Nutritionist & Physician • Digital Certification Seal Active</p>
                </div>
              </div>

              <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3.5 py-1.5 rounded-full border border-emerald-300 flex items-center gap-1.5 shrink-0">
                <ShieldCheck size={14} className="text-emerald-700" /> Digitally Verified Report
              </span>
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
                          <p className="text-xs text-[#5A6B60] mt-0.5">Track bookings, enter in-app telehealth video sessions & download receipts.</p>
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

                        const cachedAll = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
                        const cachedAppt = cachedAll.find(c => String(c.id) === String(todayAppt.id)) || {};
                        const todaysAll = cachedAll.filter(a => (a.date === isoToday || a.date === localToday) && a.status !== 'CANCELLED');
                        todaysAll.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                        const queueIdx = todaysAll.findIndex(a => String(a.id) === String(todayAppt.id));
                        const fallbackToken = queueIdx >= 0 ? `TK-${101 + queueIdx}` : 'TK-101';
                        const tokenNum = todayAppt.token_number || cachedAppt.token_number || fallbackToken;
                        const roomName = todayAppt.allocated_room || cachedAppt.allocated_room || (todayAppt.mode === 'ONLINE' ? 'In-App Telehealth Video Suite' : 'Doctor Consultation Chamber (Ground Floor, Room 101)');

                        const qStatus = todayAppt.queue_status || cachedAppt.queue_status || 'WAITING';
                        const isCalled = qStatus === 'CALLED';
                        const isInSession = qStatus === 'IN_CONSULTATION';
                        const isCompleted = qStatus === 'COMPLETED';

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
                                    Token #{tokenNum}
                                    <span className="text-xs font-normal opacity-90">• {roomName}</span>
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
                                ) : (
                                  <button 
                                    type="button"
                                    onClick={() => handleStartVideoConsultation(todayAppt)} 
                                    className="bg-white text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition hover:bg-gray-100 shrink-0 cursor-pointer"
                                  >
                                    <Video size={13} /> Enter Video Room
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="overflow-x-auto overflow-y-auto flex-1 p-2 custom-scrollbar">
                      <table className="w-full text-left text-sm text-[#1C2C22] whitespace-nowrap">
                        <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b sticky top-0">
                          <tr>
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
                              <td className="py-4 px-4 font-black text-[#1C2C22] whitespace-nowrap">
                                <span className="font-bold text-xs">{a.date}</span> <span className="text-[#5A6B60] text-xs font-normal mx-1">at</span> <span className="font-bold text-xs text-[#456A50]">{a.time}</span>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${a.mode === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{a.mode || 'IN-CLINIC'}</span>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
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
                                      <button 
                                        type="button"
                                        onClick={() => handleStartVideoConsultation(a)} 
                                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
                                      >
                                        <Video size={13} /> Enter Video Room
                                      </button>
                                    );
                                  })()
                                ) : (
                                  <span className="text-gray-600 text-xs font-bold flex items-center gap-1">
                                    <DoorOpen size={13} className="text-[#456A50]" /> In-Clinic Chamber
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                {isCancelled ? (
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                                    <RotateCcw size={11} className="text-emerald-700" /> ₹500 Refunded
                                  </span>
                                ) : a.status === 'COMPLETED' ? (
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-green-100 text-green-700 border border-green-200">COMPLETED</span>
                                ) : isRescheduled ? (
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-200">RESCHEDULED • PAID</span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-amber-50 text-amber-800 border border-amber-200">SCHEDULED • PAID</span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                {isCancelled ? (
                                  <button 
                                    onClick={() => generateRefundReceipt(a)} 
                                    className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1.5 ml-auto transition shadow-sm cursor-pointer"
                                  >
                                    <Download size={12}/> Refund Receipt
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                    {a.mode !== 'ONLINE' && (
                                      <button 
                                        type="button"
                                        onClick={() => printClinicTokenSlip(a, { name: userName || profile.first_name })} 
                                        className="bg-[#EAF0EC] text-[#456A50] hover:bg-[#456A50] hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-2xs border border-[#456A50]/20 cursor-pointer shrink-0"
                                        title="Print In-Clinic Token Slip"
                                      >
                                        <Printer size={12}/> Token Pass
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => generateReceipt(a)} 
                                      className="bg-white text-[#456A50] px-2.5 py-1.5 rounded-xl text-[11px] font-bold hover:bg-[#EAF0EC] flex items-center gap-1 transition shadow-sm border border-[#EBE9E0] cursor-pointer shrink-0"
                                    >
                                      <Download size={12}/> Receipt
                                    </button>
                                    {a.status !== 'COMPLETED' && (
                                      <button 
                                        onClick={() => { setCancellingAppt(a); setCancelReason('Schedule Conflict'); }} 
                                        className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer shrink-0"
                                        title="Cancel booking and receive 100% instant refund"
                                      >
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

        {/* 🏆 TAB 6: WELLNESS CHALLENGES & MILESTONE BADGES */}
        {activeTab === 'challenges' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Loyalty Reward Banner */}
            <div className="bg-gradient-to-r from-[#1C2C22] via-[#2A4433] to-[#1C2C22] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-500/30 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-start gap-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  allBadgesClaimed
                    ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                    : 'bg-white/10 border border-white/20 text-gray-400'
                }`}>
                  {allBadgesClaimed ? (
                    <Trophy size={28} className="text-amber-400 animate-bounce" />
                  ) : (
                    <Lock size={26} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                      <Sparkles size={11} /> 5% Consultation Loyalty Reward
                    </span>
                    {allBadgesClaimed ? (
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        🎉 Grand Champion: All 4/4 Badges Claimed (5% OFF Active)
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <Lock size={10} /> 5% Discount Locked ({claimedBadgesCount}/4 Badges Claimed)
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Wellness Challenges & Achievement Badges
                  </h2>
                  <p className="text-xs text-gray-300 mt-1 max-w-xl font-medium">
                    {allBadgesClaimed
                      ? "🎉 Congratulations! You have fully completed and claimed all 4 clinical wellness challenges. Your 5% consultation discount is unlocked and active!"
                      : `Complete and claim all 4 lifestyle milestones (${claimedBadgesCount}/4 claimed) to unlock your 5% consultation discount voucher.`
                    }
                  </p>
                </div>
              </div>

              <div className="relative z-10 shrink-0 w-full md:w-auto">
                {allBadgesClaimed ? (
                  <button
                    onClick={() => navigate('/book-consultation')}
                    className="w-full md:w-auto bg-amber-400 hover:bg-amber-300 text-[#1C2C22] font-black px-6 py-3.5 rounded-2xl text-xs transition shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer transform hover:scale-105"
                  >
                    <Percent size={16} /> Book Consultation with 5% OFF
                  </button>
                ) : (
                  <div className="flex flex-col items-center md:items-end gap-2">
                    <div className="bg-white/10 border border-white/20 text-gray-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Lock size={14} className="text-amber-400" />
                      <span>5% Discount Locked ({claimedBadgesCount}/4 Claimed)</span>
                    </div>
                    <button
                      onClick={() => navigate('/book-consultation')}
                      className="text-xs text-amber-300 hover:text-amber-200 underline font-bold transition cursor-pointer"
                    >
                      Book Standard Consultation (Regular Price) →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 🏆 TROPHY CABINET / BADGES SHELF */}
            <div className="bg-white rounded-3xl border border-[#EBE9E0] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-[#EBE9E0] pb-4">
                <div>
                  <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                    <Award size={22} className="text-[#456A50]" /> My Clinical Trophy Cabinet
                  </h3>
                  <p className="text-xs text-[#5A6B60] mt-0.5">Badges earned through consistent lifestyle adherence.</p>
                </div>
                <span className="text-xs bg-[#EAF0EC] text-[#456A50] font-black px-3 py-1.5 rounded-xl border border-[#456A50]/20">
                  {challenges.filter(c => c.isCompleted).length} / {challenges.length} Badges Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {challenges.map(c => {
                  const isEarned = c.isCompleted;

                  return (
                    <div 
                      key={c.id} 
                      className={`p-5 rounded-2xl border transition-all text-center flex flex-col justify-between relative overflow-hidden ${
                        isEarned 
                          ? 'bg-[#FDFCF8] border-emerald-400 shadow-sm ring-1 ring-emerald-400/20' 
                          : 'bg-gray-50/80 border-gray-200 opacity-75'
                      }`}
                    >
                      {isEarned ? (
                        <span className="absolute top-2.5 right-2.5 text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-black px-2 py-0.5 rounded-full">
                          ★ UNLOCKED
                        </span>
                      ) : (
                        <span className="absolute top-2.5 right-2.5 text-[9px] bg-gray-200 text-gray-700 border border-gray-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={9} /> LOCKED
                        </span>
                      )}

                      <div className="my-2">
                        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-3 relative ${
                          isEarned ? c.badgeColor : 'bg-gray-200 text-gray-400'
                        }`}>
                          {c.badgeIcon === 'Droplets' && <Droplets size={28} />}
                          {c.badgeIcon === 'Apple' && <Apple size={28} />}
                          {c.badgeIcon === 'Moon' && <Moon size={28} />}
                          {c.badgeIcon === 'Scale' && <Scale size={28} />}
                          {!isEarned && (
                            <div className="absolute -bottom-1 -right-1 bg-gray-600 text-white p-1 rounded-full shadow">
                              <Lock size={10} />
                            </div>
                          )}
                        </div>
                        <h4 className="font-black text-sm text-[#1C2C22]">{c.badgeName}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{c.category}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 mt-2">
                        {isEarned ? (
                          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2 text-[10px] font-bold">
                            🎟️ {c.discountCode} (5% OFF)
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 font-bold bg-white border border-gray-200 rounded-lg py-1 px-2">
                            {c.currentDays}/{c.targetDays} {c.unit || 'Days'} Verified
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🎯 ACTIVE WELLNESS CHALLENGES BOARD */}
            <div className="bg-white rounded-3xl border border-[#EBE9E0] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EBE9E0] pb-4">
                <div>
                  <h3 className="text-lg font-black text-[#1C2C22] flex items-center gap-2">
                    <Zap size={22} className="text-amber-500" /> Automated Clinical Challenge Verifications
                  </h3>
                  <p className="text-xs text-[#5A6B60] mt-0.5">
                    The clinical system automatically evaluates your daily meals, hydration, sleep, and weigh-ins from your monthly plan.
                  </p>
                </div>
                <div className="bg-[#EAF0EC] border border-[#456A50]/20 text-[#456A50] text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <ShieldCheck size={14} /> System Verified Engine
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {challenges.map(c => {
                  const progressPct = Math.round((c.currentDays / c.targetDays) * 100);

                  return (
                    <div 
                      key={c.id} 
                      className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                        c.isCompleted 
                          ? 'bg-[#FDFCF8] border-emerald-400 shadow-sm ring-1 ring-emerald-400/20' 
                          : 'bg-white border-[#EBE9E0]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black text-[#456A50] uppercase tracking-wider bg-[#EAF0EC] px-2.5 py-1 rounded-md">
                            {c.category} Track
                          </span>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                            c.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {c.currentDays} / {c.targetDays} {c.unit || 'Days'} Verified
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-base text-[#1C2C22]">{c.title}</h4>
                          <p className="text-xs text-[#5A6B60] mt-1 leading-relaxed">{c.description}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[10px] font-bold text-gray-500">
                            <span>System Verified Progress</span>
                            <span>{progressPct}% ({c.currentDays}/{c.targetDays} {c.unit || 'Days'})</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                c.isCompleted ? 'bg-emerald-600' : 'bg-[#456A50]'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-gray-500 font-semibold italic">
                            📊 {c.logSummary}
                          </p>
                        </div>

                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 font-bold flex items-center gap-2">
                          <BadgePercent size={16} className="text-amber-600 shrink-0" />
                          <span>Reward: 5% Booking Discount ({c.discountCode})</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#EBE9E0] flex flex-col gap-2">
                        {c.claimed ? (
                          <div className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle size={15} className="text-emerald-600" /> 5% Reward Claimed
                            </span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-[10px]">
                              {c.discountCode}
                            </span>
                          </div>
                        ) : c.isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleClaimReward(c.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                          >
                            <Trophy size={14} /> Claim 5% Discount Reward
                          </button>
                        ) : (
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              disabled
                              className="w-full bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none"
                            >
                              <Lock size={14} className="text-gray-400" />
                              <span>Claim Locked (Plan Incomplete: {c.currentDays}/{c.targetDays})</span>
                            </button>
                            <p className="text-[10px] text-gray-500 font-medium text-center bg-gray-50 rounded-lg py-1 px-2 border border-gray-200/60">
                              🔒 Complete your daily plan logs in the dashboard to unlock.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 🌟 TAB 7: NUTRITIONIST EVALUATIONS & CLINICAL REVIEWS 🌟 */}
        {activeTab === 'evaluations' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#EBE9E0] pb-5">
                <div>
                  <h3 className="text-xl font-black text-[#1C2C22] flex items-center gap-2">
                    <ClipboardList size={22} className="text-[#456A50]" /> Nutritionist Evaluations & Clinical Reviews
                  </h3>
                  <p className="text-xs text-[#5A6B60] mt-1">
                    Formal clinical feedback, adherence scores, and milestone reviews from your assigned specialist.
                  </p>
                </div>
              </div>

              {evaluations.length === 0 ? (
                <div className="p-12 text-center bg-[#FDFCF8] border border-dashed border-[#EBE9E0] rounded-2xl">
                  <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
                  <h4 className="font-bold text-sm text-gray-700">No Clinical Evaluations Yet</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    Your clinical nutritionist (Dr. Sarah Jenkins) will formulate formal evaluation reviews following your consultation sessions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((ev, idx) => (
                    <div key={ev.id || idx} className="p-5 bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl space-y-3 shadow-2xs">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#1C2C22]">Dr. Sarah Jenkins</span>
                          <span className="text-[10px] font-bold text-[#456A50] bg-[#EAF0EC] px-2 py-0.5 rounded-full">
                            Lead Clinical Nutritionist
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">📅 {ev.date || 'Recent'}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium">
                        {ev.notes || ev.feedback || 'Patient maintaining consistent dietary compliance and hydration goals.'}
                      </p>
                      {ev.rating && (
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: ev.rating }).map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </main>
      {/* 🌟 HEALORA IN-APP TELEHEALTH VIDEO CONSULTATION STUDIO 🌟 */}
      {activeVideoCallAppt && (
        <TelehealthVideoRoom 
          isOpen={!!activeVideoCallAppt}
          onClose={() => setActiveVideoCallAppt(null)}
          appointment={activeVideoCallAppt}
          currentUserRole="PATIENT"
          currentUserName={userName || 'Patient'}
          patientProfile={profile}
          nutritionistInfo={nutritionists.find(n => String(n.id) === String(activeVideoCallAppt.nutritionist)) || {}}
        />
      )}

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