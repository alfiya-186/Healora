import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, FileText, Apple, Activity, Calendar, 
  CheckCircle2, Save, Send, LogOut, HeartPulse, UserCheck, 
  ArrowRight, Sparkles, AlertCircle, Clock, CheckCircle, Scale, 
  Flame, Stethoscope, UserCircle, Layers, Bell, MessageSquare, X, ShieldAlert, Droplets, Moon, Footprints, Star
} from 'lucide-react';

const NutritionistDashboard = () => {
  const navigate = useNavigate();
  const nutritionistName = localStorage.getItem('user_name') || 'Dr. Sarah Jenkins';
  const nutritionistId = localStorage.getItem('user_id') || 'nut_1';

  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'case', 'messages'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

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

  // --- PROGRAM-WISE SMART FOOD SUGGESTIONS DATABASE ---
  const programFoodSuggestions = {
    'Weight Management': {
      breakfast: [
        'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)',
        'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)',
        'Spinach & Mushroom Egg White Omelet (210 kcal)',
        'Green Smoothie with Spinach, Protein Powder & Almond Milk (240 kcal)',
        'Idli with Coconut Chutney (220 kcal)'
      ],
      lunch: [
        'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)',
        'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)',
        'Grilled Paneer Salad with Olive Oil Dressing (430 kcal)',
        'Chapathi with Mixed Vegetable Sabzi & Dal (390 kcal)',
        'Baked Fish with Steamed Broccoli (360 kcal)'
      ],
      snack: [
        'Handful of Raw Walnuts & Green Tea (180 kcal)',
        'Carrot & Cucumber Sticks with Hummus (150 kcal)',
        '1 Green Apple with Almond Butter (200 kcal)',
        'Roasted Makhana (Fox Nuts) (120 kcal)',
        'Sprouted Moong Salad with Lemon & Herbs (140 kcal)'
      ],
      dinner: [
        'Baked Salmon with Steamed Asparagus (450 kcal)',
        'Vegetable Soup with Grilled Tofu (340 kcal)',
        'Zucchini Noodles with Turkey/Plant Meatballs (390 kcal)',
        'Moong Dal Soup & Stir-fry Greens (310 kcal)',
        'Dosa with Tomato Chutney (280 kcal)'
      ]
    },
    'Diabetes Reversal': {
      breakfast: [
        'Avocado & Scrambled Eggs on Low-Carb Seed Toast (320 kcal)',
        'Methi Paratha (No Oil) with Low-Fat Curd (250 kcal)',
        'Moong Dal Chilla with Mint Chutney (210 kcal)',
        'Chia Seed Pudding with Almond Milk & Cinnamon (230 kcal)'
      ],
      lunch: [
        'Ragi Roti with Palak Paneer & Salad (380 kcal)',
        'Cauliflower Rice with Grilled Chicken & Avocado (410 kcal)',
        'Sprouted Brown Chana Salad with Olive Oil (340 kcal)',
        'Grilled Tofu with Roasted Broccoli & Bell Peppers (360 kcal)'
      ],
      snack: [
        'Handful of Roasted Almonds & Walnuts (190 kcal)',
        'Cucumber Slices with Greek Yogurt Dip (110 kcal)',
        'Roasted Pumpkin Seeds (140 kcal)',
        'Boiled Egg Whites (2 pcs) with Black Pepper (100 kcal)'
      ],
      dinner: [
        'Clear Chicken/Vegetable Broth with Shredded Chicken & Spinach (220 kcal)',
        'Baked Cod with Garlic Butter & Roasted Cabbage (340 kcal)',
        'Stir-fry Paneer with Broccoli & Bell Peppers (390 kcal)',
        'Lentil Soup with Steamed French Beans (290 kcal)'
      ]
    },
    'PCOS Care': {
      breakfast: [
        'Spearmint Tea & Turmeric Seed Omelet (280 kcal)',
        'Overnight Oats with Flaxseeds, Berries & Cinnamon (310 kcal)',
        'Ragi Malt with Almonds & Walnuts (260 kcal)',
        'Besan Chilla loaded with Onions and Coriander (240 kcal)'
      ],
      lunch: [
        'Red Rice with Yellow Dal & Steamed Bottle Gourd (360 kcal)',
        'Quinoa Bowl with Roasted Chickpeas & Olive Oil (400 kcal)',
        'Balanced Thali: 1 Bajra Roti, Dal, Sabzi & Salad (390 kcal)',
        'Grilled Chicken Breast with Steamed Zucchini (380 kcal)'
      ],
      snack: [
        'Spearmint Tea & Sunflower Seeds (130 kcal)',
        'Cinnamon Spiced Green Tea & Walnuts (160 kcal)',
        'Pomegranate Bowl with Chia Seeds (150 kcal)'
      ],
      dinner: [
        'Pumpkin & Lentil Soup with Herbs (280 kcal)',
        'Baked Turmeric Fish with Steamed Broccoli (390 kcal)',
        'Sautéed Tofu and Spinach with Garlic (320 kcal)',
        'Millet Khichdi with Mixed Veggies (340 kcal)'
      ]
    },
    'Muscle Building': {
      breakfast: [
        'Whole Eggs (3 pcs), Oatmeal, Peanut Butter & Banana (550 kcal)',
        'Protein Pancakes with Greek Yogurt & Honey (490 kcal)',
        'Avocado Toast with 3 Poached Eggs & Hemp Seeds (480 kcal)',
        'Paneer Paratha with Butter & Curd (520 kcal)'
      ],
      lunch: [
        'Brown Rice, Grilled Chicken Breast & Sweet Potato Mash (620 kcal)',
        'Quinoa Bowl with Lean Beef/Paneer & Mixed Veggies (590 kcal)',
        'Whole Wheat Pasta with Lean Turkey/Soy Meatballs (600 kcal)',
        'Chapathi (3 pcs) with Mutton/Paneer Curry & Dal (650 kcal)'
      ],
      snack: [
        'Greek Yogurt with Granola, Honey & Mixed Berries (320 kcal)',
        'Protein Shake with Almond Milk, Peanut Butter & Banana (380 kcal)',
        'Peanut Butter on Whole Wheat Rice Cakes (280 kcal)',
        'Handful of Mixed Nuts & Dried Fruits (250 kcal)'
      ],
      dinner: [
        'Grilled Steak/Tofu, Mashed Potatoes & Green Beans (680 kcal)',
        'Baked Salmon, Quinoa & Roasted Broccoli (640 kcal)',
        'Tofu & Chicken Stir Fry with Jasmine Rice & Cashews (610 kcal)',
        'Paneer Bhurji with 3 Multigrain Rotitas (580 kcal)'
      ]
    }
  };

  const getSuggestionsForPatient = (mealType) => {
    const program = selectedPatient?.enrolled_program || selectedPatient?.health_goals || 'Weight Management';
    const category = programFoodSuggestions[program] || programFoodSuggestions['Weight Management'];
    return category[mealType] || [];
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

    // Load Notifications
    const notifs = JSON.parse(localStorage.getItem(`healora_notifications_${nutritionistId}`)) || [];
    setNotifications(notifs);

    return () => { cancelled = true; };
  }, [nutritionistId]);

  // Load Chats
  useEffect(() => {
    const allChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
    setChats(allChats);
    if(chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, activeChatContact, chatInput]); // re-run when input changes to trigger scroll

  // Load Wellness Logs & Evaluations on patient select
  useEffect(() => {
    if (selectedPatient) {
      // Load wellness logs submitted by this patient
      const globalLogs = JSON.parse(localStorage.getItem('healora_all_wellness_logs')) || [];
      const localLogs = JSON.parse(localStorage.getItem(`healora_wellness_${selectedPatient.id}`)) || [];
      
      const mergedLogsMap = new Map();
      localLogs.forEach(l => mergedLogsMap.set(l.id, l));
      globalLogs.filter(l => String(l.patientId) === String(selectedPatient.id)).forEach(l => mergedLogsMap.set(l.id, l));
      
      setWellnessLogs(Array.from(mergedLogsMap.values()).sort((a,b) => new Date(b.date) - new Date(a.date)));

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
      patientId: activeChatContact === 'manager' ? null : activeChatContact,
      contactId: activeChatContact,
      patientName: activeChatContact !== 'manager' ? patients.find(p => p.id === activeChatContact)?.first_name : 'Manager',
      senderRole: 'NUTRITIONIST',
      text: chatInput,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    const allChats = JSON.parse(localStorage.getItem('healora_chats')) || [];
    allChats.push(newMsg);
    localStorage.setItem('healora_chats', JSON.stringify(allChats));
    setChats([...chats, newMsg]);
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
    nutrition_goal: 'Sustainable Fat Loss & Glycemic Control',
    target_calories: 1600,
    start_date: new Date().toISOString().split('T')[0],
    review_date: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
    status: 'Draft',
    activity_recommendation: '30 mins brisk walking daily + 15 min core strengthening.',
    lifestyle_recommendation: 'Hydrate 3L daily, sleep by 11 PM.',
    nutritionist_notes: 'Adjust macros depending on weekly weight response.',
    weeks: {
      1: { Sunday: { breakfast: 'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)', lunch: 'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)', snack: 'Handful of Raw Walnuts & Green Tea (180 kcal)', dinner: 'Baked Salmon with Steamed Asparagus (450 kcal)' },
           Monday: { breakfast: 'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)', lunch: 'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)', snack: 'Carrot & Cucumber Sticks with Hummus (150 kcal)', dinner: 'Vegetable Soup with Grilled Tofu (340 kcal)' },
           Tuesday: { breakfast: 'Spinach & Mushroom Egg White Omelet (210 kcal)', lunch: 'Grilled Paneer Salad with Olive Oil Dressing (430 kcal)', snack: '1 Green Apple with Almond Butter (200 kcal)', dinner: 'Zucchini Noodles with Turkey/Plant Meatballs (390 kcal)' },
           Wednesday: { breakfast: 'Green Smoothie with Spinach, Protein Powder & Almond Milk (240 kcal)', lunch: 'Chapathi with Mixed Vegetable Sabzi & Dal (390 kcal)', snack: 'Roasted Makhana (Fox Nuts) (120 kcal)', dinner: 'Moong Dal Soup & Stir-fry Greens (310 kcal)' },
           Thursday: { breakfast: 'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)', lunch: 'Baked Fish with Steamed Broccoli (360 kcal)', snack: 'Sprouted Moong Salad with Lemon & Herbs (140 kcal)', dinner: 'Dosa with Tomato Chutney (280 kcal)' },
           Friday: { breakfast: 'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)', lunch: 'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)', snack: 'Handful of Raw Walnuts & Green Tea (180 kcal)', dinner: 'Baked Salmon with Steamed Asparagus (450 kcal)' },
           Saturday: { breakfast: 'Spinach & Mushroom Egg White Omelet (210 kcal)', lunch: 'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)', snack: 'Carrot & Cucumber Sticks with Hummus (150 kcal)', dinner: 'Vegetable Soup with Grilled Tofu (340 kcal)' }
         },
      2: { Sunday: { breakfast: 'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)', lunch: 'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)', snack: 'Handful of Raw Walnuts & Green Tea (180 kcal)', dinner: 'Baked Salmon with Steamed Asparagus (450 kcal)' },
           Monday: { breakfast: 'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)', lunch: 'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)', snack: 'Carrot & Cucumber Sticks with Hummus (150 kcal)', dinner: 'Vegetable Soup with Grilled Tofu (340 kcal)' },
           Tuesday: { breakfast: 'Spinach & Mushroom Egg White Omelet (210 kcal)', lunch: 'Grilled Paneer Salad with Olive Oil Dressing (430 kcal)', snack: '1 Green Apple with Almond Butter (200 kcal)', dinner: 'Zucchini Noodles with Turkey/Plant Meatballs (390 kcal)' },
           Wednesday: { breakfast: 'Green Smoothie with Spinach, Protein Powder & Almond Milk (240 kcal)', lunch: 'Chapathi with Mixed Vegetable Sabzi & Dal (390 kcal)', snack: 'Roasted Makhana (Fox Nuts) (120 kcal)', dinner: 'Moong Dal Soup & Stir-fry Greens (310 kcal)' },
           Thursday: { breakfast: 'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)', lunch: 'Baked Fish with Steamed Broccoli (360 kcal)', snack: 'Sprouted Moong Salad with Lemon & Herbs (140 kcal)', dinner: 'Dosa with Tomato Chutney (280 kcal)' },
           Friday: { breakfast: 'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)', lunch: 'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)', snack: 'Handful of Raw Walnuts & Green Tea (180 kcal)', dinner: 'Baked Salmon with Steamed Asparagus (450 kcal)' },
           Saturday: { breakfast: 'Spinach & Mushroom Egg White Omelet (210 kcal)', lunch: 'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)', snack: 'Carrot & Cucumber Sticks with Hummus (150 kcal)', dinner: 'Vegetable Soup with Grilled Tofu (340 kcal)' }
         },
      3: { Sunday: { breakfast: 'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)', lunch: 'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)', snack: 'Handful of Raw Walnuts & Green Tea (180 kcal)', dinner: 'Baked Salmon with Steamed Asparagus (450 kcal)' },
           Monday: { breakfast: 'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)', lunch: 'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)', snack: 'Carrot & Cucumber Sticks with Hummus (150 kcal)', dinner: 'Vegetable Soup with Grilled Tofu (340 kcal)' },
           Tuesday: { breakfast: 'Spinach & Mushroom Egg White Omelet (210 kcal)', lunch: 'Grilled Paneer Salad with Olive Oil Dressing (430 kcal)', snack: '1 Green Apple with Almond Butter (200 kcal)', dinner: 'Zucchini Noodles with Turkey/Plant Meatballs (390 kcal)' },
           Wednesday: { breakfast: 'Green Smoothie with Spinach, Protein Powder & Almond Milk (240 kcal)', lunch: 'Chapathi with Mixed Vegetable Sabzi & Dal (390 kcal)', snack: 'Roasted Makhana (Fox Nuts) (120 kcal)', dinner: 'Moong Dal Soup & Stir-fry Greens (310 kcal)' },
           Thursday: { breakfast: 'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)', lunch: 'Baked Fish with Steamed Broccoli (360 kcal)', snack: 'Sprouted Moong Salad with Lemon & Herbs (140 kcal)', dinner: 'Dosa with Tomato Chutney (280 kcal)' },
           Friday: { breakfast: 'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)', lunch: 'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)', snack: 'Handful of Raw Walnuts & Green Tea (180 kcal)', dinner: 'Baked Salmon with Steamed Asparagus (450 kcal)' },
           Saturday: { breakfast: 'Spinach & Mushroom Egg White Omelet (210 kcal)', lunch: 'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)', snack: 'Carrot & Cucumber Sticks with Hummus (150 kcal)', dinner: 'Vegetable Soup with Grilled Tofu (340 kcal)' }
         },
      4: { Sunday: { breakfast: 'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)', lunch: 'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)', snack: 'Handful of Raw Walnuts & Green Tea (180 kcal)', dinner: 'Baked Salmon with Steamed Asparagus (450 kcal)' },
           Monday: { breakfast: 'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)', lunch: 'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)', snack: 'Carrot & Cucumber Sticks with Hummus (150 kcal)', dinner: 'Vegetable Soup with Grilled Tofu (340 kcal)' },
           Tuesday: { breakfast: 'Spinach & Mushroom Egg White Omelet (210 kcal)', lunch: 'Grilled Paneer Salad with Olive Oil Dressing (430 kcal)', snack: '1 Green Apple with Almond Butter (200 kcal)', dinner: 'Zucchini Noodles with Turkey/Plant Meatballs (390 kcal)' },
           Wednesday: { breakfast: 'Green Smoothie with Spinach, Protein Powder & Almond Milk (240 kcal)', lunch: 'Chapathi with Mixed Vegetable Sabzi & Dal (390 kcal)', snack: 'Roasted Makhana (Fox Nuts) (120 kcal)', dinner: 'Moong Dal Soup & Stir-fry Greens (310 kcal)' },
           Thursday: { breakfast: 'Oatmeal with Fresh Berries & Chia Seeds (290 kcal)', lunch: 'Baked Fish with Steamed Broccoli (360 kcal)', snack: 'Sprouted Moong Salad with Lemon & Herbs (140 kcal)', dinner: 'Dosa with Tomato Chutney (280 kcal)' },
           Friday: { breakfast: 'Greek Yogurt Parfait with Honey & Walnuts (260 kcal)', lunch: 'Quinoa & Grilled Chicken Salad with Lemon Vinaigrette (410 kcal)', snack: 'Handful of Raw Walnuts & Green Tea (180 kcal)', dinner: 'Baked Salmon with Steamed Asparagus (450 kcal)' },
           Saturday: { breakfast: 'Spinach & Mushroom Egg White Omelet (210 kcal)', lunch: 'Brown Rice, Lentil Dal & Steamed Greens (380 kcal)', snack: 'Carrot & Cucumber Sticks with Hummus (150 kcal)', dinner: 'Vegetable Soup with Grilled Tofu (340 kcal)' }
         }
    }
  });

  useEffect(() => {
    localStorage.setItem('healora_assessments', JSON.stringify(assessments));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem('healora_care_plans', JSON.stringify(carePlans));
  }, [carePlans]);

  const handleOpenCase = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('case');
    
    if (assessments[patient.id]) {
      setCurrentAssessment(assessments[patient.id]);
    } else {
      setCurrentAssessment({ dietary_assessment: '', lifestyle_assessment: '', physical_activity_assessment: '', nutrition_diagnosis: '' });
    }

    if (carePlans[patient.id]) {
      setMonthlyPlanData(carePlans[patient.id]);
    } else {
      const programGoals = {
        'Weight Management': 'Sustainable Fat Loss & Caloric Deficit',
        'PCOS Care': 'Hormonal Balance & Anti-Inflammatory Diet',
        'Diabetes Reversal': 'Glycemic Control & Low Carb Matrix',
        'Muscle Building': 'Hypertrophy & High Protein Matrix'
      };
      setMonthlyPlanData(prev => ({
        ...prev,
        nutrition_goal: programGoals[patient.enrolled_program || patient.health_goals] || 'Metabolic Optimization & Vitality'
      }));
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

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(p => 
      String(p.id).toLowerCase().includes(q) || 
      `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

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
          <button onClick={() => { setActiveTab('directory'); setSelectedPatient(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab==='directory' && !selectedPatient ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
            <Users size={18} /> Assigned Patients
          </button>
          {selectedPatient && (
            <button onClick={() => setActiveTab('case')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab==='case' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
              <FileText size={18} /> Patient Case File
            </button>
          )}
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeTab==='messages' ? 'bg-[#EAF0EC] text-[#456A50] font-bold shadow-sm border border-[#456A50]/20' : 'text-[#5A6B60] hover:bg-[#FDFCF8] hover:text-[#1C2C22]'}`}>
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
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition text-sm border border-red-100 shadow-sm">
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
                {activeTab === 'directory' ? 'Assigned Patient Directory' : activeTab === 'messages' ? 'Clinic & Patient Messaging' : `Patient Case: ${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
              </h1>
              <p className="text-[#5A6B60] mt-1 text-sm">
                {activeTab === 'directory' ? 'Search records, view biometrics, and build monthly care plans.' : activeTab === 'messages' ? 'Secure communication with patients and management.' : `Patient ID: #${selectedPatient?.id} | Enrolled Program: ${selectedPatient?.enrolled_program || selectedPatient?.health_goals || 'Weight Management'}`}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
                {/* 🌟 NOTIFICATIONS BUTTON 🌟 */}
                <div className="relative cursor-pointer group" onClick={() => {setShowNotifications(true); markNotificationsRead();}}>
                  <div className="bg-white border border-[#EBE9E0] p-3.5 rounded-full shadow-sm group-hover:bg-gray-50 transition"><Bell size={22} className="text-[#1C2C22]" /></div>
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FDFCF8] shadow-sm">{unreadCount}</span>}
                </div>
                
                {activeTab === 'case' && selectedPatient && (
                  <button onClick={() => { setSelectedPatient(null); setActiveTab('directory'); }} className="bg-white border border-[#EBE9E0] text-[#5A6B60] hover:text-[#1C2C22] px-5 py-3 rounded-xl font-bold text-xs shadow-sm transition">
                    ← Back to Directory
                  </button>
                )}
            </div>
          </div>

          {/* 1. ASSIGNED PATIENT DIRECTORY + SEARCH */}
          {activeTab === 'directory' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9E0] flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#1C2C22]">My Assigned Patients</h2>
                  <p className="text-xs text-[#5A6B60] mt-0.5">Showing exact logged-in patient synchronized with session storage.</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Search by name or ID..." 
                    className="w-full bg-[#FDFCF8] border border-[#EBE9E0] rounded-2xl py-3 pl-11 pr-4 text-xs outline-none focus:border-[#456A50] transition shadow-inner"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] overflow-hidden">
                <table className="w-full text-left text-sm text-[#1C2C22]">
                  <thead className="bg-[#FDFCF8] text-[10px] uppercase font-extrabold text-[#5A6B60] tracking-widest border-b">
                    <tr>
                      <th className="py-4 px-6">Patient ID</th>
                      <th className="py-4 px-6">Patient Name</th>
                      <th className="py-4 px-6">Enrolled Program</th>
                      <th className="py-4 px-6">Biometrics</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE9E0]">
                    {filteredPatients.map(patient => (
                      <tr key={patient.id} className="hover:bg-[#FDFCF8] transition group">
                        <td className="py-5 px-6 font-bold text-[#456A50]">#{patient.id}</td>
                        <td className="py-5 px-6 font-black text-[#1C2C22] flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#5A6B60] font-bold overflow-hidden shadow-sm border border-[#EBE9E0]">
                            {patient.profile_image ? <img src={patient.profile_image} className="w-full h-full object-cover" alt="Profile" /> : <UserCircle size={20}/>}
                          </div>
                          {patient.first_name || 'Patient'} {patient.last_name || ''}
                        </td>
                        <td className="py-5 px-6">
                          <span className="bg-[#EAF0EC] text-[#456A50] px-3 py-1 rounded-lg text-xs font-bold border border-[#456A50]/20">
                            {patient.enrolled_program || patient.health_goals || 'Weight Management'}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-[#5A6B60]">
                          {patient.age ? `${patient.age} yrs` : 'Age N/A'} • {patient.weight_kg ? `${patient.weight_kg} kg` : 'Weight N/A'}
                        </td>
                        <td className="py-5 px-6 text-right">
                          <button 
                            onClick={() => handleOpenCase(patient)}
                            className="bg-[#456A50] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#35533E] transition shadow-sm inline-flex items-center gap-1.5 ml-auto"
                          >
                            Open Case <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-16 text-center text-gray-400 italic">No assigned patients match your search criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. PATIENT CASE, ASSESSMENT, WELLNESS EVALUATION & CARE PLAN */}
          {activeTab === 'case' && selectedPatient && (
            <div className="space-y-8 animate-in fade-in">
              
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
                  
                  {/* Logs list */}
                  <div className="h-64 overflow-y-auto p-6 bg-[#FDFCF8]/50 custom-scrollbar space-y-4 border-b border-[#EBE9E0]">
                    {wellnessLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Activity size={32} className="mb-2 opacity-50"/>
                        <p className="text-xs italic font-medium">No wellness logs submitted yet.</p>
                      </div>
                    ) : wellnessLogs.map(log => (
                      <div key={log.id} className="bg-white border border-[#EBE9E0] p-4 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                          <p className="font-black text-[#1C2C22] text-xs">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                          {log.ate_other_food ? <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[8px] font-bold border border-red-100 uppercase tracking-widest">Ate Off-Plan</span> : <span className="bg-[#EAF0EC] text-[#456A50] px-2 py-0.5 rounded text-[8px] font-bold border border-[#456A50]/20 uppercase tracking-widest">Followed Plan</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] text-[#5A6B60]">
                          <p className="flex items-center gap-1.5"><Droplets size={12} className="text-blue-500"/><span className="text-blue-600 font-bold">{log.water_glasses} glasses</span></p>
                          <p className="flex items-center gap-1.5 truncate"><Footprints size={12} className="text-green-500 shrink-0"/><span className="truncate">{log.physical_activity || 'None'}</span></p>
                          <p className="flex items-center gap-1.5"><Moon size={12} className="text-purple-500"/><span className="text-purple-600 font-bold">{log.sleep_hours} hrs</span></p>
                          <p className="flex items-center gap-1.5 truncate"><Activity size={12} className="text-orange-500 shrink-0"/><span className="truncate">{log.mood || 'N/A'}</span></p>
                        </div>
                        {log.ate_other_food && <p className="mt-2 text-[10px] bg-red-50 p-2 rounded text-red-800 border border-red-100"><span className="font-bold">Cheat Details:</span> {log.other_food_details}</p>}
                      </div>
                    ))}
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
                    <div className="flex items-center justify-between border-b border-[#EBE9E0] pb-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1C2C22] flex items-center gap-2">
                        <Layers size={16} className="text-[#456A50]"/> Select Week & Day to Edit Daily Meals
                      </h4>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map(w => (
                          <button key={w} type="button" onClick={() => setSelectedWeek(w)} className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest transition ${selectedWeek === w ? 'bg-[#456A50] text-white shadow-xs' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Week {w}</button>
                        ))}
                      </div>
                    </div>

                    {/* Day selector pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {daysOfWeek.map(d => (
                        <button key={d} type="button" onClick={() => setSelectedDay(d)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${selectedDay === d ? 'bg-[#1C2C22] text-white' : 'bg-white border border-[#EBE9E0] text-gray-600 hover:bg-gray-50'}`}>{d}</button>
                      ))}
                    </div>

                    {/* Meal Fields with Program-Specific Suggestion Dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      
                      {/* Breakfast */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] font-bold text-orange-600 uppercase tracking-widest">🌅 Week {selectedWeek} • {selectedDay} Breakfast</label>
                        </div>
                        <select 
                          onChange={(e) => { if(e.target.value) handleMealChange('breakfast', e.target.value); }}
                          className="w-full border border-orange-200 bg-orange-50/40 rounded-xl p-2.5 text-xs font-medium text-[#1C2C22] outline-none focus:ring-1 focus:ring-orange-400 mb-1"
                        >
                          <option value="">💡 Program suggestions...</option>
                          {getSuggestionsForPatient('breakfast').map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          value={monthlyPlanData.weeks?.[selectedWeek]?.[selectedDay]?.breakfast || ''} 
                          onChange={e => handleMealChange('breakfast', e.target.value)} 
                          placeholder="Or type custom breakfast..." 
                          className="w-full border border-[#EBE9E0] bg-white rounded-xl p-3 text-xs outline-none focus:border-[#456A50] shadow-sm" 
                        />
                      </div>

                      {/* Lunch */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] font-bold text-yellow-600 uppercase tracking-widest">☀️ Week {selectedWeek} • {selectedDay} Lunch</label>
                        </div>
                        <select 
                          onChange={(e) => { if(e.target.value) handleMealChange('lunch', e.target.value); }}
                          className="w-full border border-yellow-200 bg-yellow-50/40 rounded-xl p-2.5 text-xs font-medium text-[#1C2C22] outline-none focus:ring-1 focus:ring-yellow-400 mb-1"
                        >
                          <option value="">💡 Program suggestions...</option>
                          {getSuggestionsForPatient('lunch').map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          value={monthlyPlanData.weeks?.[selectedWeek]?.[selectedDay]?.lunch || ''} 
                          onChange={e => handleMealChange('lunch', e.target.value)} 
                          placeholder="Or type custom lunch..." 
                          className="w-full border border-[#EBE9E0] bg-white rounded-xl p-3 text-xs outline-none focus:border-[#456A50] shadow-sm" 
                        />
                      </div>

                      {/* Snack */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] font-bold text-green-600 uppercase tracking-widest">🍎 Week {selectedWeek} • {selectedDay} Snack</label>
                        </div>
                        <select 
                          onChange={(e) => { if(e.target.value) handleMealChange('snack', e.target.value); }}
                          className="w-full border border-green-200 bg-green-50/40 rounded-xl p-2.5 text-xs font-medium text-[#1C2C22] outline-none focus:ring-1 focus:ring-green-400 mb-1"
                        >
                          <option value="">💡 Program suggestions...</option>
                          {getSuggestionsForPatient('snack').map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          value={monthlyPlanData.weeks?.[selectedWeek]?.[selectedDay]?.snack || ''} 
                          onChange={e => handleMealChange('snack', e.target.value)} 
                          placeholder="Or type custom snack..." 
                          className="w-full border border-[#EBE9E0] bg-white rounded-xl p-3 text-xs outline-none focus:border-[#456A50] shadow-sm" 
                        />
                      </div>

                      {/* Dinner */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] font-bold text-blue-600 uppercase tracking-widest">🌙 Week {selectedWeek} • {selectedDay} Dinner</label>
                        </div>
                        <select 
                          onChange={(e) => { if(e.target.value) handleMealChange('dinner', e.target.value); }}
                          className="w-full border border-blue-200 bg-blue-50/40 rounded-xl p-2.5 text-xs font-medium text-[#1C2C22] outline-none focus:ring-1 focus:ring-blue-400 mb-1"
                        >
                          <option value="">💡 Program suggestions...</option>
                          {getSuggestionsForPatient('dinner').map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          value={monthlyPlanData.weeks?.[selectedWeek]?.[selectedDay]?.dinner || ''} 
                          onChange={e => handleMealChange('dinner', e.target.value)} 
                          placeholder="Or type custom dinner..." 
                          className="w-full border border-[#EBE9E0] bg-white rounded-xl p-3 text-xs outline-none focus:border-[#456A50] shadow-sm" 
                        />
                      </div>

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
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {msg.senderRole === 'SYSTEM' ? (
                              <div className="bg-orange-100 text-orange-800 border border-orange-200 px-4 py-1.5 rounded-full text-[10px] font-bold my-2 shadow-sm self-center tracking-widest uppercase">{msg.text}</div>
                            ) : (
                              <div className={`max-w-[75%] p-4 rounded-3xl shadow-sm ${isMe ? 'bg-[#456A50] text-white rounded-br-sm' : 'bg-[#FDFCF8] border border-[#EBE9E0] text-[#1C2C22] rounded-bl-sm'}`}>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
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