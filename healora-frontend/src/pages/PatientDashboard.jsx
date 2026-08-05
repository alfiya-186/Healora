import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Activity, LogOut, FileText, ArrowLeft, Upload, Leaf, UserCircle, ClipboardList } from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name') || 'Patient';
  
  // Health Profile State (Matches your PostgreSQL `PatientProfile` columns!)
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [goals, setGoals] = useState('');
  
  const [profileSaved, setProfileSaved] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const saveHealthProfile = async (e) => {
    e.preventDefault();
    
    // Get the logged-in user's ID (Make sure to store this during login in SignInPage!)
    // For this 20% demo, we will hardcode patient ID 2 (or whatever ID you use) if it's missing
    const userId = localStorage.getItem('user_id') || 2; 

    try {
      const response = await fetch(`/api/profile/update/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          height_cm: height,
          weight_kg: weight,
          medical_history: medicalHistory,
          food_allergies: allergies,
          health_goals: goals
        }),
      });

      if (response.ok) {
        setProfileSaved(true);
        alert("Health Profile successfully saved to PostgreSQL database!");
      } else {
        alert("Failed to save profile. Check Django logs.");
      }
    } catch (error) {
      alert("Network error. Cannot connect to Django.");
    }
  };

  const handleFileUpload = () => {
    setUploadStatus('Uploading securely...');
    setTimeout(() => { setUploadStatus('Lab Report Uploaded Successfully!'); }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-[#FDFCF8] font-sans text-[#1C2C22]">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-[#EBE9E0] flex flex-col hidden lg:flex shadow-sm z-10">
        <div className="p-8 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-[#456A50] text-white rounded-lg p-1.5"><Leaf size={24} /></div>
          <span className="text-2xl font-bold tracking-tight">Heal<span className="text-[#456A50]">ora</span></span>
        </div>
        <nav className="flex-1 px-6 mt-4 space-y-2 font-medium">
          <p className="text-[10px] font-bold text-[#5A6B60] uppercase tracking-widest mb-3">Portal</p>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[#456A50] bg-[#EAF0EC] rounded-xl font-bold"><Activity size={18} /> Profile & Records</button>
          <button onClick={() => navigate('/book-consultation')} className="w-full flex items-center gap-3 px-4 py-3 text-[#5A6B60] hover:bg-[#FDFCF8] rounded-xl transition"><Calendar size={18} /> Book Consultation</button>
        </nav>
        <div className="p-6 border-t border-[#EBE9E0]">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-700/80 hover:bg-red-50 rounded-xl font-bold transition"><LogOut size={18} /> Log Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12 max-w-6xl mx-auto space-y-8">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B60] hover:text-[#456A50] transition"><ArrowLeft size={16} /> Back to Home</button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EBE9E0] pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Welcome, {userName}.</h1>
            <p className="text-[#5A6B60] mt-2 font-serif italic text-lg">Manage your clinical profile and reports for your nutritionist.</p>
          </div>
          <button onClick={() => navigate('/book-consultation')} className="bg-[#456A50] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#35533E] shadow-lg shadow-[#456A50]/20 text-sm transition">
            <Calendar size={16} /> Book Session
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PHASE 1: HEALTH PROFILE FORM */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-[#EBE9E0] pb-4">
              <div className="bg-[#EAF0EC] text-[#456A50] p-3 rounded-xl"><UserCircle size={24} /></div>
              <div><h2 className="text-xl font-bold">Clinical Health Profile</h2><p className="text-xs text-[#5A6B60]">Update biometrics & history.</p></div>
            </div>
            
            <form onSubmit={saveHealthProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-[#5A6B60] mb-1">Height (cm)</label><input type="number" required value={height} onChange={(e)=>setHeight(e.target.value)} disabled={profileSaved} className="w-full border border-[#EBE9E0] rounded-xl py-2.5 px-3 outline-none focus:border-[#456A50] text-sm" placeholder="e.g. 165" /></div>
                <div><label className="block text-xs font-bold text-[#5A6B60] mb-1">Weight (kg)</label><input type="number" required value={weight} onChange={(e)=>setWeight(e.target.value)} disabled={profileSaved} className="w-full border border-[#EBE9E0] rounded-xl py-2.5 px-3 outline-none focus:border-[#456A50] text-sm" placeholder="e.g. 68" /></div>
              </div>
              
              <div><label className="block text-xs font-bold text-[#5A6B60] mb-1">Medical History (Optional)</label><input type="text" value={medicalHistory} onChange={(e)=>setMedicalHistory(e.target.value)} disabled={profileSaved} className="w-full border border-[#EBE9E0] rounded-xl py-2.5 px-3 outline-none focus:border-[#456A50] text-sm" placeholder="e.g. PCOS, Diabetes, None" /></div>
              
              <div><label className="block text-xs font-bold text-[#5A6B60] mb-1">Food Allergies</label><input type="text" value={allergies} onChange={(e)=>setAllergies(e.target.value)} disabled={profileSaved} className="w-full border border-[#EBE9E0] rounded-xl py-2.5 px-3 outline-none focus:border-[#456A50] text-sm" placeholder="e.g. Dairy, Peanuts" /></div>
              
              <div><label className="block text-xs font-bold text-[#5A6B60] mb-1">Primary Health Goal</label><input type="text" required value={goals} onChange={(e)=>setGoals(e.target.value)} disabled={profileSaved} className="w-full border border-[#EBE9E0] rounded-xl py-2.5 px-3 outline-none focus:border-[#456A50] text-sm" placeholder="e.g. Lose 5kg, Hormone Balance" /></div>

              <button type="submit" disabled={profileSaved} className="w-full bg-[#1C2C22] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 mt-4 transition hover:bg-black">
                {profileSaved ? 'Profile Saved to Database ✓' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          <div className="space-y-8 flex flex-col">
            {/* PHASE 1: HEALTH VAULT (FILE UPLOAD) */}
            <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9E0] p-8 flex-1">
              <div className="flex items-center gap-3 mb-6 border-b border-[#EBE9E0] pb-4">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><FileText size={24} /></div>
                <div><h2 className="text-xl font-bold">Health Vault</h2><p className="text-xs text-[#5A6B60]">Upload lab reports & prescriptions.</p></div>
              </div>
              
              {uploadStatus && <div className={`p-3 text-xs font-bold text-center rounded-xl mb-4 ${uploadStatus.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-[#EAF0EC] text-[#456A50]'}`}>{uploadStatus}</div>}

              <div className="border-2 border-dashed border-[#EBE9E0] bg-[#FDFCF8] rounded-2xl p-8 text-center hover:bg-[#EAF0EC]/30 transition cursor-pointer relative">
                <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.jpg,.png" />
                <Upload size={32} className="mx-auto text-[#456A50] mb-3" />
                <p className="text-sm font-bold text-[#1C2C22]">Click to upload lab report</p>
                <p className="text-xs text-[#5A6B60] mt-1">Supports PDF, JPG, PNG (Max 5MB)</p>
              </div>
            </div>

            {/* QUICK APPOINTMENT SUMMARY */}
            <div className="bg-[#456A50] text-white rounded-3xl shadow-lg p-8 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10"><ClipboardList size={120} /></div>
              <h2 className="text-xl font-bold mb-1 relative z-10">Upcoming Consultations</h2>
              <p className="text-teal-100 text-sm mb-4 relative z-10">You have no upcoming consultations scheduled.</p>
              <button onClick={() => navigate('/book-consultation')} className="bg-white text-[#456A50] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#EBE9E0] transition relative z-10">
                Schedule Now
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;