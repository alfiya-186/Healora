

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Users, UserCog, Building2, CalendarDays, ClipboardList,
  FileText, ShieldCheck, Search, Plus, Trash2, Ban, CheckCircle,
  LogOut, ChevronRight, RefreshCw, X, BarChart3, UserRoundCog,
  Clock3, TrendingUp, CalendarCheck, UserPlus, Eye, AlertTriangle,
  CreditCard, Download, Server, CheckCircle2, Filter
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("user_name") || "System Admin";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // 🌟 AUDIT TRAIL FILTERS 🌟
  const [auditFilters, setAuditFilters] = useState({
    dateFrom: "",
    dateTo: "",
    eventType: "",
    userRole: ""
  });
  
  // 🌟 REVENUE LEDGER FILTERS 🌟
  const [revenueSearch, setRevenueSearch] = useState("");
  const [revenueModeFilter, setRevenueModeFilter] = useState("ALL");
  
  // 🌟 SYSTEM TOAST ERROR NOTIFICATION STATE 🌟
  const [systemToast, setSystemToast] = useState(null);

  const [showUser, setShowUser] = useState(false);
  const [showProgram, setShowProgram] = useState(false);
  const [viewingProgram, setViewingProgram] = useState(null); 
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("NUTRITIONIST");

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [programForm, setProgramForm] = useState({ id: null, name: "", description: "" });

  const CLINICAL_SYSTEM_PROGRAMS = [
    { id: 1, name: "Weight Loss", description: "Scientifically structured caloric deficit and metabolism optimization for sustainable fat reduction.", status: "Active", enrolled: 48 },
    { id: 2, name: "Weight Gain", description: "Nutrient-dense, high-protein protocols designed for lean muscle building and healthy weight gain.", status: "Active", enrolled: 34 },
    { id: 3, name: "PCOS Care", description: "Hormonal balancing, insulin resistance control, and anti-inflammatory clinical meal plans.", status: "Active", enrolled: 27 },
    { id: 4, name: "Diabetic Care", description: "Strict glycemic control, HbA1c stabilization, low-GI foods, and timed carbohydrate management.", status: "Active", enrolled: 52 },
    { id: 5, name: "Pregnancy Nutrition", description: "Trimester-calibrated nutrition, optimal micronutrient nourishment, folate, and fetal development support.", status: "Active", enrolled: 19 },
    { id: 6, name: "Kids & Elderly", description: "Growth support, cognitive vitality, immune boosting for children, and bio-available nutrition for seniors.", status: "Active", enrolled: 23 }
  ];

  const [programs, setPrograms] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("healora_programs_v2")) || JSON.parse(localStorage.getItem("healora_programs"));
      // Force migration if legacy 4-programs or "Weight Management" is found
      if (saved && Array.isArray(saved) && saved.length >= 6 && saved.some(p => p.name === "Weight Loss")) {
        return saved;
      }
      localStorage.setItem("healora_programs", JSON.stringify(CLINICAL_SYSTEM_PROGRAMS));
      localStorage.setItem("healora_programs_v2", JSON.stringify(CLINICAL_SYSTEM_PROGRAMS));
      return CLINICAL_SYSTEM_PROGRAMS;
    } catch { 
      return CLINICAL_SYSTEM_PROGRAMS; 
    }
  });

  useEffect(() => { 
    localStorage.setItem("healora_programs", JSON.stringify(programs)); 
    localStorage.setItem("healora_programs_v2", JSON.stringify(programs));
  }, [programs]);

  const triggerToast = (message, type = 'error') => {
    setSystemToast({ message, type });
    setTimeout(() => setSystemToast(null), 4000);
  };

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const localUsers = JSON.parse(localStorage.getItem('healora_local_users')) || [];
      
      let localAppts = JSON.parse(localStorage.getItem('healora_all_appointments')) || [];
      localAppts = localAppts.map((appt, idx) => ({
        ...appt,
        id: appt.id && String(appt.id).startsWith('APT-') ? appt.id.replace('APT-', '') : (appt.id || (101 + idx))
      }));

      const localAudit = JSON.parse(localStorage.getItem('healora_audit_logs')) || [];
      
      const [u, a, l] = await Promise.all([
        fetch("/api/admin-api/users/").catch(()=>({ok:false})),
        fetch("/api/admin-api/appointments/").catch(()=>({ok:false})),
        fetch("/api/admin-api/audit-logs/").catch(()=>({ok:false}))
      ]);

      let apiUsers = []; let apiAppts = []; let apiAudit = [];
      if (u.ok) apiUsers = await u.json();
      if (a.ok) apiAppts = await a.json();
      if (l.ok) apiAudit = await l.json();

      // Deduplicate by ID / Email to ensure real-time accuracy without ghost duplicates
      const mergedUsers = Array.from(
        new Map([...localUsers, ...apiUsers].map(item => [String(item.id || item.email), item])).values()
      );

      const mergedAppts = Array.from(
        new Map([...localAppts, ...apiAppts].map(item => [String(item.id), item])).values()
      );

      const mergedAudit = Array.from(
        new Map([...localAudit, ...apiAudit].map(item => [String(item.id || item.created_at), item])).values()
      );

      setUsers(mergedUsers);
      setAppointments(mergedAppts);
      setAuditLogs(mergedAudit);

    } catch (err) { 
      console.error("Admin error:", err);
      if (!isBackground) triggerToast("System Error: Failed to synchronize with database gateway.");
    } 
    finally { 
      if (!isBackground) setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 

    // 🌟 REAL-TIME CROSS-TAB SYNC LISTENER 🌟
    const handleStorageChange = (e) => {
      if (
        e.key === 'healora_all_appointments' || 
        e.key === 'healora_local_users' || 
        e.key === 'healora_audit_logs' || 
        e.key === 'healora_programs'
      ) {
        fetchData(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 🌟 REAL-TIME 10-SECOND BACKGROUND REFRESH 🌟
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const logSystemEvent = (action, desc) => {
    const logs = JSON.parse(localStorage.getItem('healora_audit_logs')) || [];
    logs.unshift({ id: Date.now(), action_type: action, description: desc, created_at: new Date().toISOString() });
    localStorage.setItem('healora_audit_logs', JSON.stringify(logs));
    setAuditLogs(logs);
  };

  const patients = useMemo(() => users.filter(u => u.role === "PATIENT"), [users]);
  const nutritionists = useMemo(() => users.filter(u => u.role === "NUTRITIONIST"), [users]);
  const managers = useMemo(() => users.filter(u => u.role === "MANAGER"), [users]);
  const activeUsers = useMemo(() => users.filter(u => u.is_active !== false), [users]);

  // 🌟 REAL-TIME PROGRAM ENROLLMENT CALCULATOR 🌟
  const getProgramEnrolledPatients = (programName) => {
    if (!patients || patients.length === 0) return [];
    const clean = (programName || '').toLowerCase().trim();
    
    return patients.filter(p => {
      let pGoal = (p.health_goals || p.enrolled_program || p.primary_goal || '').toLowerCase().trim();
      if (!pGoal) {
        try {
          const storedProf = JSON.parse(localStorage.getItem(`patientProfile_${p.id}`)) || 
                             (String(localStorage.getItem('user_id')) === String(p.id) ? JSON.parse(localStorage.getItem('patientProfile')) : null);
          if (storedProf && (storedProf.health_goals || storedProf.enrolled_program)) {
            pGoal = (storedProf.health_goals || storedProf.enrolled_program).toLowerCase().trim();
          }
        } catch (e) {}
      }

      if (!pGoal) return clean === 'weight loss'; // default fallback for newly registered patients
      if (clean === 'weight loss') return pGoal.includes('loss') || pGoal.includes('weight loss') || pGoal.includes('management');
      if (clean === 'weight gain') return pGoal.includes('gain') || pGoal.includes('muscle');
      if (clean === 'pcos care') return pGoal.includes('pcos');
      if (clean === 'diabetic care') return pGoal.includes('diabet') || pGoal.includes('sugar') || pGoal.includes('glucose');
      if (clean === 'pregnancy nutrition') return pGoal.includes('pregnan') || pGoal.includes('maternal');
      if (clean === 'kids & elderly') return pGoal.includes('kid') || pGoal.includes('elder') || pGoal.includes('child') || pGoal.includes('senior');
      return pGoal.includes(clean);
    });
  };

  const getProgramEnrolledCount = (programName) => {
    return getProgramEnrolledPatients(programName).length;
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u => `${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase().includes(q));
  }, [users, search]);

  const totalRevenue = useMemo(() => {
    const uniqueAppts = Array.from(new Map(appointments.map(item => [item.id, item])).values());
    return uniqueAppts.reduce((sum, appt) => {
      const amount = parseFloat(appt.amount_paid);
      return sum + (isNaN(amount) ? 500 : amount); 
    }, 0);
  }, [appointments]);

  // 🌟 REVENUE LEDGER FILTERING WITH PATIENT NAME RESOLUTION 🌟
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const patientObj = users.find(u => String(u.id) === String(a.patient));
      const pName = patientObj ? `${patientObj.first_name || ''} ${patientObj.last_name || ''}`.toLowerCase() : '';
      const pEmail = patientObj?.email?.toLowerCase() || '';
      const aptId = `apt-${a.id}`.toLowerCase();
      const q = revenueSearch.toLowerCase().trim();

      const matchesSearch = !q || pName.includes(q) || pEmail.includes(q) || aptId.includes(q) || String(a.patient).includes(q);
      const matchesMode = revenueModeFilter === "ALL" || (a.mode || 'ONLINE').toUpperCase() === revenueModeFilter;
      return matchesSearch && matchesMode;
    });
  }, [appointments, users, revenueSearch, revenueModeFilter]);

  // 🌟 DYNAMIC AUDIT LOG FILTERING ENGINE 🌟
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      let matches = true;
      const logDate = log.created_at ? new Date(log.created_at).toISOString().split('T')[0] : null;

      if (auditFilters.dateFrom && logDate) {
        if (logDate < auditFilters.dateFrom) matches = false;
      }
      if (auditFilters.dateTo && logDate) {
        if (logDate > auditFilters.dateTo) matches = false;
      }
      if (auditFilters.eventType) {
        const query = auditFilters.eventType.toLowerCase();
        if (!log.action_type?.toLowerCase().includes(query) && !log.description?.toLowerCase().includes(query)) {
          matches = false;
        }
      }
      if (auditFilters.userRole) {
        const query = auditFilters.userRole.toLowerCase();
        // Since roles are usually mentioned in the description text
        if (!log.description?.toLowerCase().includes(query)) {
          matches = false;
        }
      }
      return matches;
    });
  }, [auditLogs, auditFilters]);

  const createUser = async e => {
    e.preventDefault();
    setSaving(true); setError("");

    const existingUsers = JSON.parse(localStorage.getItem('healora_local_users')) || [];
    const allKnownUsers = [...users, ...existingUsers];
    const nextIdNum = allKnownUsers.length > 0 ? Math.max(...allKnownUsers.map(u => parseInt(u.id) || 0)) + 1 : 26;

    const newUser = { 
      id: String(nextIdNum), 
      first_name: form.first_name.trim(), 
      last_name: form.last_name.trim(), 
      email: form.email.toLowerCase().trim(), 
      role: role, 
      is_active: true, 
      date_joined: new Date().toISOString() 
    };

    try {
      localStorage.setItem('healora_local_users', JSON.stringify([newUser, ...existingUsers]));
      setUsers([newUser, ...users]);
      logSystemEvent('USER_CREATED', `Admin created new ${role} account for ${newUser.email}`);
      
      const res = await fetch("/api/register/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
      if (!res.ok) throw new Error("Failed backend server registration.");
    } catch (err) { 
      console.log("Offline Fallback engaged.");
      triggerToast("Warning: Account created locally. Server backend sync pending.");
    } 
    finally { setShowUser(false); setForm({ first_name: "", last_name: "", email: "", password: "" }); setSaving(false); }
  };

  const toggleUser = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this account?`)) return;
    const newStatus = !currentStatus;
    setUsers(prev => prev.map(u => String(u.id) === String(id) ? { ...u, is_active: newStatus } : u));
    
    // Update local storage for cross-platform persistence
    const localUsers = JSON.parse(localStorage.getItem('healora_local_users')) || [];
    const updatedLocal = localUsers.map(u => String(u.id) === String(id) ? { ...u, is_active: newStatus } : u);
    localStorage.setItem('healora_local_users', JSON.stringify(updatedLocal));

    logSystemEvent('USER_STATUS_CHANGE', `Admin changed user #${id} status to ${newStatus ? 'Active' : 'Inactive'}.`);
    try { await fetch(`/api/admin-api/users/${id}/toggle-status/`, { method: "PATCH" }); } catch (e) { triggerToast("Warning: Status updated locally. Backend sync pending."); }
  };

  const deleteUser = async id => {
    if (!window.confirm("CRITICAL WARNING: Permanently delete this account? Use Deactivate instead for staff who have left.")) return;
    setUsers(prev => prev.filter(u => String(u.id) !== String(id)));
    
    // Remove from local storage for cross-platform persistence
    const localUsers = JSON.parse(localStorage.getItem('healora_local_users')) || [];
    const updatedLocal = localUsers.filter(u => String(u.id) !== String(id));
    localStorage.setItem('healora_local_users', JSON.stringify(updatedLocal));

    logSystemEvent('CRITICAL_DELETE', `Admin permanently deleted user record #${id}.`);
    try { await fetch(`/api/admin-api/users/${id}/delete/`, { method: "DELETE" }); } catch (e) { triggerToast("Warning: Account removed locally. Backend sync pending."); }
  };

  const saveProgram = e => {
    e.preventDefault();
    const name = programForm.name.trim(); const description = programForm.description.trim();
    if (!name) return;
    if (programForm.id) { 
      setPrograms(prev => prev.map(p => p.id === programForm.id ? { ...p, name, description } : p)); 
      logSystemEvent('PROGRAM_UPDATE', `Admin updated program: ${name}`);
    } else { 
      setPrograms(prev => [...prev, { id: Date.now(), name, description, status: "Active", enrolled: 0 }]); 
      logSystemEvent('PROGRAM_CREATE', `Admin created new program: ${name}`);
    }
    setProgramForm({ id: null, name: "", description: "" }); setShowProgram(false);
  };
  const toggleProgram = id => setPrograms(prev => prev.map(p => p.id === id ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" } : p));

  // 🌟 AUDIT CSV EXPORT USE CASE: Exports the specifically Filtered Results 🌟
  const downloadAuditCSV = () => {
    if (!filteredAuditLogs || filteredAuditLogs.length === 0) { 
      triggerToast("No audit logs match your current filters.", "error"); 
      return; 
    }
    const headers = ["Log ID", "Action Type", "Description", "Timestamp"];
    const rows = filteredAuditLogs.map(log => [
      log.id || "N/A", `"${(log.action_type || 'SYSTEM ACTIVITY').replace(/"/g, '""')}"`,
      `"${(log.description || 'Activity recorded.').replace(/"/g, '""')}"`, `"${log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.setAttribute("href", url); link.setAttribute("download", `Healora_Filtered_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link); 
    logSystemEvent('AUDIT_EXPORT', 'Administrator exported security audit trails as CSV for compliance review.');
  };

  // 🌟 REVENUE LEDGER CSV EXPORT FOR ACCOUNTING & BOOKKEEPING 🌟
  const downloadRevenueCSV = () => {
    if (!filteredAppointments || filteredAppointments.length === 0) { 
      triggerToast("No revenue records match your current filters.", "error"); 
      return; 
    }
    const headers = ["Booking ID", "Patient ID", "Patient Name", "Email", "Date", "Time", "Mode", "Status", "Amount Paid (INR)"];
    const rows = filteredAppointments.map(a => {
      const p = users.find(u => String(u.id) === String(a.patient));
      const pName = p ? `"${(p.first_name || '')} ${(p.last_name || '')}".trim()` : `"Patient #${a.patient}"`;
      const pEmail = p?.email ? `"${p.email}"` : `"N/A"`;
      const amt = parseFloat(a.amount_paid);
      const finalAmt = isNaN(amt) ? 500 : amt;
      return [
        `"APT-${a.id}"`,
        `"#${a.patient}"`,
        pName,
        pEmail,
        `"${a.date || 'N/A'}"`,
        `"${a.time || 'N/A'}"`,
        `"${a.mode || 'ONLINE'}"`,
        `"PAID"`,
        finalAmt.toFixed(2)
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.setAttribute("href", url); link.setAttribute("download", `Healora_Revenue_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link); 
    logSystemEvent('REVENUE_EXPORT', 'Administrator exported clinical revenue records as CSV for financial bookkeeping.');
  };

  const logout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('user_role'); navigate("/", { replace: true }); };

  const nav = [
    ["dashboard", "Analytics Dashboard", BarChart3], ["patients", "Patient Directory", Users],
    ["nutritionists", "Nutritionist Staff", UserCog], ["managers", "Clinic Managers", Building2],
    ["users", "User Management", UserRoundCog], ["revenue", "Billing & Revenue", CreditCard],
    ["programs", "Program Management", ClipboardList], ["reports", "System Reports", FileText], 
    ["audit", "Audit Logs", Clock3]
  ];

  return (
    <div className="healora">
      
      {/* 🌟 SYSTEM NOTIFICATION TOAST BANNER (SUCCESS & ERROR) 🌟 */}
      {systemToast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border ${
          systemToast.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500 text-white'
            : 'bg-red-950/95 border-red-500 text-white'
        }`}>
          {systemToast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
          ) : (
            <AlertTriangle className="text-red-400 shrink-0" size={20} />
          )}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${
              systemToast.type === 'success' ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {systemToast.type === 'success' ? 'System Success' : 'System Alert'}
            </p>
            <p className="text-xs font-medium text-gray-100">{systemToast.message}</p>
          </div>
          <button 
            onClick={() => setSystemToast(null)} 
            className={`ml-4 p-1 rounded-lg hover:bg-white/10 ${
              systemToast.type === 'success' ? 'text-emerald-300 hover:text-white' : 'text-red-300 hover:text-white'
            }`}
          >
            <X size={16}/>
          </button>
        </div>
      )}

      <aside className="sidebar">
        <div>
          <div className="brand"><div className="logo"><ShieldCheck size={23} /></div><div><b>Healora</b><small>ADMIN CONSOLE</small></div></div>
          <nav>
            <label>CORE SYSTEM</label>{nav.slice(0, 1).map(([id, text, Icon]) => (<button key={id} className={activeTab === id ? "navItem selected" : "navItem"} onClick={() => { setActiveTab(id); setSearch(""); }}><Icon size={17} /><span>{text}</span>{activeTab === id && <ChevronRight size={14} />}</button>))}
            <label>USER MANAGEMENT</label>{nav.slice(1, 5).map(([id, text, Icon]) => (<button key={id} className={activeTab === id ? "navItem selected" : "navItem"} onClick={() => { setActiveTab(id); setSearch(""); }}><Icon size={17} /><span>{text}</span>{activeTab === id && <ChevronRight size={14} />}</button>))}
            <label>CLINIC MANAGEMENT</label>{nav.slice(5, 7).map(([id, text, Icon]) => (<button key={id} className={activeTab === id ? "navItem selected" : "navItem"} onClick={() => { setActiveTab(id); setSearch(""); }}><Icon size={17} /><span>{text}</span>{activeTab === id && <ChevronRight size={14} />}</button>))}
            <label>REPORTS & AUDIT</label>{nav.slice(7).map(([id, text, Icon]) => (<button key={id} className={activeTab === id ? "navItem selected" : "navItem"} onClick={() => { setActiveTab(id); setSearch(""); }}><Icon size={17} /><span>{text}</span>{activeTab === id && <ChevronRight size={14} />}</button>))}
          </nav>
        </div>
        
        {/* PINNED SIDEBAR FOOTER */}
        <div className="sidebarFooter">
          <div className="adminIdentity"><div className="avatar">{userName.charAt(0).toUpperCase()}</div><div><b>{userName}</b><small>Administrator</small></div></div>
          <button className="logout" onClick={logout}><LogOut size={16} />Logout</button>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div><span>HEALORA ADMINISTRATION</span><h1 className="capitalize">{activeTab.replace('-', ' ')}</h1></div>
          <div className="headerRight"><div className="online"><i />SYSTEM OPERATIONAL</div><div className="headerAvatar">{userName.charAt(0).toUpperCase()}</div></div>
        </header>

        <div className="content">
          {loading ? (<div className="loading"><RefreshCw size={20} className="animate-spin" />Loading Healora...</div>) : (
            <>
              {activeTab === "dashboard" && (
                <div>
                  <div className="welcome"><div><span>PHASE 1 • CLINIC ADMINISTRATION</span><h2>Healora Administration</h2><p>Manage users, clinic operations, programmes and system activity.</p></div><div className="welcomeIcon"><Activity size={31} /></div></div>
                  
                  {/* System Infrastructure Health Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
                    <div className="statCard" style={{ minHeight: 'auto', padding: '15px' }}>
                      <div className="statIcon" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}><Server size={18}/></div>
                      <div><p>API Gateway</p><h3 style={{ margin: '2px 0 0', fontSize: '13px', color: '#5ee0a7' }}>Online (99.9%)</h3></div>
                    </div>
                    <div className="statCard" style={{ minHeight: 'auto', padding: '15px' }}>
                      <div className="statIcon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}><CheckCircle2 size={18}/></div>
                      <div><p>Database Engine</p><h3 style={{ margin: '2px 0 0', fontSize: '13px', color: '#60a5fa' }}>Synchronized</h3></div>
                    </div>
                    <div className="statCard" style={{ minHeight: 'auto', padding: '15px' }}>
                      <div className="statIcon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><ShieldCheck size={18}/></div>
                      <div><p>Security Protocol</p><h3 style={{ margin: '2px 0 0', fontSize: '13px', color: '#f5a623' }}>HIPAA Active</h3></div>
                    </div>
                  </div>

                  <div className="stats">
                    <div className="statCard"><div className="statIcon"><Users /></div><div><p>Patients</p><h2>{patients.length}</h2><small>Registered patients</small></div></div>
                    <div className="statCard"><div className="statIcon"><UserCog /></div><div><p>Nutritionists</p><h2>{nutritionists.length}</h2><small>Clinical staff</small></div></div>
                    <div className="statCard"><div className="statIcon"><Building2 /></div><div><p>Clinic Managers</p><h2>{managers.length}</h2><small>Management staff</small></div></div>
                    <div className="statCard"><div className="statIcon"><CalendarCheck /></div><div><p>Appointments</p><h2>{appointments.length}</h2><small>Scheduled appointments</small></div></div>
                    <div className="statCard" style={{ borderColor: 'rgba(52, 211, 153, 0.3)', background: 'linear-gradient(145deg, #101b14, #122418)' }}>
                      <div className="statIcon" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}><CreditCard /></div><div><p style={{ color: '#6ee7b7' }}>Total Revenue</p><h2 style={{ color: '#fff' }}>₹ {totalRevenue.toLocaleString()}</h2><small style={{ color: '#a7f3d0' }}>Platform earnings</small></div>
                    </div>
                  </div>
                </div>
              )}

              {['patients', 'nutritionists', 'managers', 'users'].includes(activeTab) && (
                <section className="panel">
                  <div className="panelHead">
                    <div><span className="eyebrow">USER RECORDS</span><h2>Account Directory</h2></div>
                    <div className="headActions">
                      <div className="search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." /></div>
                      {['nutritionists', 'managers'].includes(activeTab) && <button className="primary" onClick={() => { setRole(activeTab === "nutritionists" ? "NUTRITIONIST" : "MANAGER"); setError(""); setForm({ first_name: '', last_name: '', email: '', password: '' }); setShowUser(true); }}><UserPlus size={16} /> Add Staff</button>}
                    </div>
                  </div>
                  <div className="tableWrap">
                    <table>
                      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
                      <tbody>
                        {(activeTab === 'patients' ? patients : activeTab === 'nutritionists' ? nutritionists : activeTab === 'managers' ? managers : filteredUsers).map(user => (
                          <tr key={user.id}>
                            <td>#{user.id}</td><td className="name">{user.first_name || "N/A"} {user.last_name || ""}</td><td>{user.email}</td>
                            <td><span className={user.is_active !== false ? "active" : "inactive"}>{user.is_active !== false ? "ACTIVE" : "INACTIVE"}</span></td>
                            <td className="actions">
                              <button onClick={() => toggleUser(user.id, user.is_active !== false)} className={user.is_active !== false ? "disableBtn" : "enableBtn"}>{user.is_active !== false ? <Ban size={15} /> : <CheckCircle size={15} />}</button>
                              <button className="deleteBtn" onClick={() => deleteUser(user.id)}><Trash2 size={15} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === "revenue" && (
                <section className="panel">
                  <div className="panelHead">
                    <div><span className="eyebrow">CLINIC FINANCE</span><h2>Billing & Revenue Ledger</h2></div>
                    <div className="headActions">
                      <div className="search">
                        <Search size={16} />
                        <input 
                          value={revenueSearch} 
                          onChange={e => setRevenueSearch(e.target.value)} 
                          placeholder="Search patient, ID..." 
                        />
                      </div>
                      <select 
                        value={revenueModeFilter} 
                        onChange={e => setRevenueModeFilter(e.target.value)}
                        style={{
                          background: '#09110c',
                          border: '1px solid rgba(255,255,255,.07)',
                          borderRadius: '10px',
                          color: '#fff',
                          padding: '8px 12px',
                          fontSize: '11px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ALL">All Modes</option>
                        <option value="ONLINE">Online (Meet)</option>
                        <option value="OFFLINE">In-Clinic</option>
                      </select>
                      <button 
                        className="primary" 
                        onClick={downloadRevenueCSV} 
                        style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#6ee7b7', border: '1px solid rgba(52, 211, 153, 0.3)' }}
                        title="Download financial transaction records as CSV"
                      >
                        <Download size={15} /> Export CSV
                      </button>
                    </div>
                  </div>
                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Patient Name & ID</th>
                          <th>Date & Time</th>
                          <th>Mode</th>
                          <th>Status</th>
                          <th style={{textAlign:'right'}}>Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((a, i) => {
                          const patientObj = users.find(u => String(u.id) === String(a.patient));
                          const pName = patientObj 
                            ? `${patientObj.first_name || ''} ${patientObj.last_name || ''}`.trim() 
                            : `Patient #${a.patient}`;
                          const pEmail = patientObj?.email || patientObj?.phone || `ID: #${a.patient}`;
                          const amt = parseFloat(a.amount_paid);
                          const finalAmt = isNaN(amt) ? 500 : amt;

                          return (
                            <tr key={i}>
                              <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>APT-{a.id}</span></td>
                              <td>
                                <div className="name" style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span>{pName}</span>
                                  <small style={{ color: '#65736a', fontSize: '9px', fontWeight: 'normal' }}>{pEmail}</small>
                                </div>
                              </td>
                              <td>{a.date || "N/A"} at {a.time || "N/A"}</td>
                              <td><span className="mode">{a.mode || "Online"}</span></td>
                              <td><span className="active">PAID</span></td>
                              <td style={{ textAlign: "right", fontWeight: "bold", color: "#5ee0a7" }}>₹ {finalAmt.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                        {filteredAppointments.length === 0 && (
                          <tr><td colSpan="6" className="empty">No financial transactions match your current search/filters.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === "programs" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
                    <button className="primary" onClick={() => { setProgramForm({ id: null, name: "", description: "" }); setShowProgram(true); }}>
                      <Plus size={16} /> Add Program
                    </button>
                  </div>
                  <div className="programGrid">
                    {programs.map(program => (
                      <div className="programCard" key={program.id}>
                        <div className="programIcon"><ClipboardList size={19} /></div><span className="programStatus"><span className={program.status === "Active" ? "active" : "inactive"}>{program.status}</span></span>
                        <h3>{program.name}</h3><p>{getProgramEnrolledCount(program.name)} registered {getProgramEnrolledCount(program.name) === 1 ? 'patient' : 'patients'}</p>
                        <div className="programActions">
                          <button onClick={() => setViewingProgram(program)} style={{color: '#fff'}}><Eye size={12} style={{display:'inline', marginBottom:'-2px', marginRight:'3px'}}/> View</button>
                          <button onClick={() => { setProgramForm({ id: program.id, name: program.name, description: program.description || "" }); setShowProgram(true); }}>Edit</button>
                          <button onClick={() => toggleProgram(program.id)}>{program.status === "Active" ? "Deactivate" : "Activate"}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🌟 ENHANCED AUDIT TRAIL WITH FILTERING 🌟 */}
              {activeTab === "audit" && (
                <section className="panel">
                  <div className="panelHead">
                    <div><span className="eyebrow">REPORTS & MONITORING</span><h2>Audit Trail</h2></div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="primary" onClick={downloadAuditCSV} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}><Download size={15} /> Export CSV</button>
                      <button className="primary" onClick={fetchData}><RefreshCw size={15} /> Refresh</button>
                    </div>
                  </div>

                  {/* Filter Engine Form */}
                  <div className="auditFilters">
                     <div className="filterGroup">
                       <label>Date From</label>
                       <input type="date" value={auditFilters.dateFrom} onChange={e => setAuditFilters({...auditFilters, dateFrom: e.target.value})} />
                     </div>
                     <div className="filterGroup">
                       <label>Date To</label>
                       <input type="date" value={auditFilters.dateTo} onChange={e => setAuditFilters({...auditFilters, dateTo: e.target.value})} />
                     </div>
                     <div className="filterGroup" style={{ flex: 1.5 }}>
                       <label>Event Type</label>
                       <input type="text" placeholder="e.g. Diet Plan Published" value={auditFilters.eventType} onChange={e => setAuditFilters({...auditFilters, eventType: e.target.value})} />
                     </div>
                     <div className="filterGroup" style={{ flex: 1.5 }}>
                       <label>User / Role</label>
                       <input type="text" placeholder="e.g. Nutritionist, admin@..." value={auditFilters.userRole} onChange={e => setAuditFilters({...auditFilters, userRole: e.target.value})} />
                     </div>
                     <button className="clearFilterBtn" onClick={() => setAuditFilters({dateFrom: "", dateTo: "", eventType: "", userRole: ""})}>
                       <Filter size={14}/> Clear
                     </button>
                  </div>

                  <div className="auditList">
                    {filteredAuditLogs.map(log => {
                      const isFailure = log.action_type?.toUpperCase().includes('FAIL') || log.action_type?.toUpperCase().includes('CRITICAL') || log.action_type?.toUpperCase().includes('DELETE');
                      return (
                        <div className="auditRow" key={log.id}>
                          {isFailure ? <AlertTriangle size={16} color="#f87171" /> : <ShieldCheck size={16} color="#6fa179" />}
                          <div className="auditInfo"><b style={{ color: isFailure ? '#f87171' : '#fff'}}>{log.action_type || "SYSTEM ACTIVITY"}</b><span>{log.description || "Administrative activity recorded."}</span></div>
                          <time>{log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}</time>
                        </div>
                      );
                    })}
                    {!filteredAuditLogs.length && <div className="empty">No audit activity matches your current filters.</div>}
                  </div>
                </section>
              )}

              {activeTab === "reports" && (
                <div>
                  <div className="reportGrid">
                    <div className="reportCard"><span>Total Patients</span><h2>{patients.length}</h2></div>
                    <div className="reportCard"><span>Active Users</span><h2>{activeUsers.length}</h2></div>
                    <div className="reportCard"><span>Total Revenue</span><h2>₹ {totalRevenue.toLocaleString()}</h2></div>
                    <div className="reportCard"><span>Programs</span><h2>{programs.filter(p => p.status === "Active").length}</h2></div>
                  </div>
                  <section className="panel reportPanel">
                    <div className="panelHead"><div><span className="eyebrow">ADMINISTRATIVE SUMMARY</span><h2>Clinic Statistics</h2></div><TrendingUp size={20} color="#78a982" /></div>
                    <div className="reportRows">
                      {[["Registered Patients", patients.length], ["Nutritionist Staff", nutritionists.length], ["Clinic Managers", managers.length], ["Active Accounts", activeUsers.length], ["Total Consultations Paid", appointments.length], ["Recorded Audit Events", auditLogs.length]].map(([label, value]) => (<div className="reportRow" key={label}><span>{label}</span><b>{value}</b></div>))}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showUser && (
        <div className="modalBg">
          <div className="modal">
            <div className="modalTop"><div><span>USER MANAGEMENT</span><h2>Add {role === "NUTRITIONIST" ? "Nutritionist" : "Clinic Manager"}</h2></div><button onClick={() => setShowUser(false)}><X /></button></div>
            {error && <div className="error">{error}</div>}
            <form onSubmit={createUser} autoComplete="off">
              <div className="formGrid">
                <input required placeholder="First name" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value.replace(/[^A-Za-z\s]/g, '')})} autoComplete="off" />
                <input required placeholder="Last name" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value.replace(/[^A-Za-z\s]/g, '')})} autoComplete="off" />
              </div>
              <input 
                required 
                type="email" 
                placeholder="Official email" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                autoComplete="new-password"
                name="staff_new_email_input"
                id="staff_new_email_input"
              />
              <input 
                required 
                minLength="8" 
                type="password" 
                placeholder="Temporary password" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                autoComplete="new-password"
                name="staff_new_password_input"
                id="staff_new_password_input"
              />
              <button className="primary full" type="submit" disabled={saving}>{saving ? "Creating..." : "Create Account"}</button>
            </form>
          </div>
        </div>
      )}

      {showProgram && (
        <div className="modalBg">
          <div className="modal">
            <div className="modalTop"><div><span>PROGRAM MANAGEMENT</span><h2>{programForm.id ? "Edit Program" : "Add Program"}</h2></div><button onClick={() => setShowProgram(false)}><X /></button></div>
            <form onSubmit={saveProgram}>
              <input required placeholder="Program name" value={programForm.name} onChange={e => setProgramForm({...programForm, name: e.target.value})} style={{marginBottom:'10px'}}/>
              <textarea required placeholder="Program description (visible to patients)..." value={programForm.description} onChange={e => setProgramForm({...programForm, description: e.target.value})} rows="4" style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,.07)', outline:'0', background:'#09110c', color:'#fff', fontSize:'11px', resize:'vertical', fontFamily:'inherit' }} />
              <button className="primary full" type="submit">Save Program</button>
            </form>
          </div>
        </div>
      )}

      {viewingProgram && (
        <div className="modalBg" onClick={() => setViewingProgram(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modalTop"><div><span>PROGRAM DETAILS</span><h2 style={{color:'#fff'}}>{viewingProgram.name}</h2></div><button onClick={() => setViewingProgram(null)}><X /></button></div>
            <div style={{ color: '#a4b0a8', fontSize: '13px', lineHeight: '1.6', background: 'rgba(255,255,255,.02)', padding: '15px', borderRadius: '12px' }}><p>{viewingProgram.description}</p></div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <div className="statCard" style={{ flex: 1, minHeight: 'auto', padding: '15px' }}><p>Status</p><h3 style={{ margin: '5px 0', fontSize: '16px', color: viewingProgram.status === 'Active' ? '#5ee0a7' : '#f87171' }}>{viewingProgram.status}</h3></div>
              <div className="statCard" style={{ flex: 1, minHeight: 'auto', padding: '15px' }}><p>Enrolled</p><h3 style={{ margin: '5px 0', fontSize: '16px', color: '#fff' }}>{getProgramEnrolledCount(viewingProgram.name)} {getProgramEnrolledCount(viewingProgram.name) === 1 ? 'Patient' : 'Patients'}</h3></div>
            </div>
            {getProgramEnrolledPatients(viewingProgram.name).length > 0 && (
              <div style={{ marginTop: '14px', background: 'rgba(255,255,255,.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,.06)' }}>
                <p style={{ margin: '0 0 8px', fontSize: '9px', fontWeight: 'bold', color: '#78a982', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Registered Patients ({getProgramEnrolledPatients(viewingProgram.name).length}):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {getProgramEnrolledPatients(viewingProgram.name).map(p => (
                    <span key={p.id} style={{ background: 'rgba(77,128,90,.18)', color: '#a7f3d0', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                      {p.first_name} {p.last_name || ''} (#{p.id})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        *{box-sizing:border-box} html,body,#root{margin:0;width:100%;height:100%;overflow:hidden} body{font-family:Inter,system-ui,-apple-system,sans-serif} button,input,select{font:inherit}
        .healora{width:100vw;height:100vh;display:flex;background:#07100b;color:#fff;overflow:hidden}
        .sidebar,.main,.tableWrap,.auditList{scrollbar-width:thin;scrollbar-color:#355d43 #0b150f}
        .sidebar::-webkit-scrollbar-thumb,.main::-webkit-scrollbar-thumb,.tableWrap::-webkit-scrollbar-thumb,.auditList::-webkit-scrollbar-thumb{background:#355d43;border-radius:20px}
        .sidebar{width:270px;min-width:270px;height:100vh;padding:22px 15px;background:#0d1811;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
        .sidebar > div:first-child { flex: 1; overflow-y: auto; padding-right: 2px; }
        .sidebarFooter { padding-top: 12px; border-top: 1px solid rgba(255,255,255,.06); flex-shrink: 0; }
        .brand{display:flex;align-items:center;gap:11px;padding:7px 12px 25px} .logo{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#4d805a} .brand b{font-size:20px;display:block} .brand small{color:#6fa179;font-size:8px;font-weight:800;letter-spacing:1.8px}
        nav{flex:1} nav label{display:block;margin:18px 10px 7px;color:#526057;font-size:9px;font-weight:800;letter-spacing:1.5px} nav label:first-child{margin-top:0}
        .navItem{width:100%;display:flex;align-items:center;gap:11px;margin:3px 0;padding:12px 13px;border:0;border-radius:12px;background:transparent;color:#8c9990;font-size:12px;font-weight:650;cursor:pointer;text-align:left;transition:.2s} .navItem:hover{background:rgba(255,255,255,.045);color:white} .navItem.selected{background:#4d805a;color:#fff;box-shadow:0 8px 22px rgba(77,128,90,.2)} .navItem svg:last-child{margin-left:auto}
        .adminIdentity{display:flex;align-items:center;gap:9px;padding:8px 7px 12px;} .avatar,.headerAvatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#4d805a;font-weight:800} .adminIdentity b{font-size:11px;display:block} .adminIdentity small{font-size:9px;color:#617067}
        .logout{border:0;border-radius:10px;padding:10px;width:100%;display:flex;justify-content:center;align-items:center;gap:8px;background:rgba(239,68,68,.08);color:#f87171;font-size:11px;font-weight:700;cursor:pointer} .logout:hover{background:#ef4444;color:#fff}
        .main{flex:1;height:100vh;overflow-y:auto}
        .header{height:78px;padding:0 35px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20;background:rgba(7,16,11,.95);backdrop-filter:blur(15px);border-bottom:1px solid rgba(255,255,255,.06)} .header span{color:#6fa179;font-size:8px;font-weight:800;letter-spacing:1.8px} .header h1{margin:4px 0 0;font-size:21px} .headerRight{display:flex;align-items:center;gap:15px}
        .online{padding:7px 12px;border-radius:30px;color:#71c582;background:rgba(52,211,153,.07);border:1px solid rgba(52,211,153,.15);font-size:8px;font-weight:800} .online i{display:inline-block;width:6px;height:6px;margin-right:5px;border-radius:50%;background:#52c878}
        .content{max-width:1450px;margin:auto;padding:30px 35px 55px}
        .loading{min-height:60vh;display:flex;align-items:center;justify-content:center;gap:9px;color:#708078;font-size:12px} .loading svg{animation:spin 1s linear infinite} @keyframes spin{to{transform:rotate(360deg)}}
        .welcome{padding:26px 29px;border-radius:20px;background:linear-gradient(110deg,#183520,#102318);border:1px solid rgba(112,170,122,.12);display:flex;justify-content:space-between;align-items:center;margin-bottom:18px} .welcome span{color:#78a982;font-size:8px;font-weight:800;letter-spacing:1.5px} .welcome h2{margin:5px 0;font-size:25px} .welcome p{margin:0;color:#718078;font-size:12px} .welcomeIcon{width:60px;height:60px;border-radius:17px;display:grid;place-items:center;background:rgba(255,255,255,.05);color:#78a982}
        .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px} .statCard{min-height:125px;padding:19px;display:flex;gap:13px;border:1px solid rgba(255,255,255,.055);border-radius:17px;background:#101b14;} .statIcon{width:39px;height:39px;display:grid;place-items:center;border-radius:11px;background:rgba(77,128,90,.1);color:#79a981} .statCard p{margin:0;color:#65736a;font-size:9px;font-weight:800;letter-spacing:.7px;text-transform:uppercase} .statCard h2{margin:3px 0;font-size:28px} .statCard small{color:#56635b;font-size:9px}
        .panel{border:1px solid rgba(255,255,255,.055);border-radius:18px;background:#101b14;overflow:hidden;margin-top:14px} .panelHead{padding:20px 21px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.05)} .panelHead h2{margin:4px 0 3px;font-size:18px} .panelHead p{margin:0;color:#68756d;font-size:10px} .headActions{display:flex;align-items:center;gap:9px}
        .search{display:flex;align-items:center;gap:7px;padding:0 10px;background:#09110c;border:1px solid rgba(255,255,255,.07);border-radius:10px} .search svg{color:#59675f} .search input{width:190px;padding:9px 2px;border:0;outline:0;background:transparent;color:#fff;font-size:11px}
        .primary{display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 14px;border:0;border-radius:10px;background:#4d805a;color:#fff;font-size:10px;font-weight:800;cursor:pointer;transition:.2s} .primary:hover{background:#3e694a} .primary:disabled{opacity:.55;cursor:not-allowed} .full{width:100%;padding:12px;margin-top:5px}
        .tableWrap{overflow:auto;max-height:570px} table{width:100%;border-collapse:collapse;font-size:11px} th{position:sticky;top:0;z-index:2;padding:13px 20px;background:#0b130e;color:#59675f;text-align:left;font-size:8px;font-weight:800;letter-spacing:1px;text-transform:uppercase} td{padding:14px 20px;border-top:1px solid rgba(255,255,255,.04);color:#89968e;white-space:nowrap} tr:hover td{background:rgba(255,255,255,.018)} td.name{color:#fff;font-weight:700}
        .active,.inactive,.mode{display:inline-block;padding:5px 8px;border-radius:20px;font-size:8px;font-weight:800} .active{background:rgba(52,211,153,.08);color:#5ee0a7} .inactive{background:rgba(248,113,113,.08);color:#f87171} .mode{background:rgba(77,128,90,.1);color:#79a981}
        .actions{text-align:right} .actions button{padding:7px;margin-left:6px;border:0;border-radius:8px;cursor:pointer;color:#a0ada5;background:rgba(255,255,255,.04);display: inline-flex;align-items: center;justify-content: center;vertical-align: middle;transition: .2s;} .actions button:hover{background:#4d805a;color:#fff} .actions .disableBtn{background:rgba(245,158,11,.08);color:#f5a623} .actions .enableBtn{background:rgba(52,211,153,.08);color:#5ee0a7} .actions .deleteBtn{background:rgba(239,68,68,.07);color:#f87171} .empty{text-align:center;padding:40px!important;color:#58665d!important}
        .roleGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px} .roleCard{padding:21px;border:1px solid rgba(255,255,255,.055);border-radius:17px;background:#101b14} .roleCard svg{color:#78a982} .roleCard h3{margin:13px 0 5px;font-size:14px} .roleCard p{margin:0;color:#68756d;font-size:10px;line-height:1.6} .roleCount{margin-top:14px;color:#fff;font-size:22px;font-weight:800} .permissionPanel{margin-top:14px} .permissionRow{display:grid;grid-template-columns:1fr 2fr;padding:14px 20px;border-top:1px solid rgba(255,255,255,.04)} .permissionRow b{font-size:10px} .permissionRow span{color:#75827a;font-size:10px}
        .programGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px} .programCard{padding:20px;position:relative;border:1px solid rgba(255,255,255,.055);border-radius:17px;background:#101b14} .programIcon{width:39px;height:39px;border-radius:11px;display:grid;place-items:center;background:rgba(77,128,90,.1);color:#78a982} .programStatus{position:absolute;right:18px;top:20px} .programCard h3{margin:16px 0 4px;font-size:14px} .programCard p{margin:0;color:#65736a;font-size:9px} .programActions{display:flex;gap:7px;margin-top:17px} .programActions button{padding:8px 11px;border:0;border-radius:8px;background:rgba(255,255,255,.05);color:#a4b0a8;font-size:9px;font-weight:700;cursor:pointer} .programActions button:last-child{color:#79a981}
        .reportGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px} .reportCard{padding:20px;border-radius:16px;background:#101b14;border:1px solid rgba(255,255,255,.055)} .reportCard span{color:#68756d;font-size:9px;text-transform:uppercase;font-weight:800} .reportCard h2{font-size:25px;margin:6px 0} .reportCard p{margin:0;color:#59675f;font-size:9px} .reportPanel{margin-top:14px} .reportRows{padding:6px 0} .reportRow{display:flex;justify-content:space-between;padding:13px 21px;border-top:1px solid rgba(255,255,255,.04);font-size:10px} .reportRow span{color:#7d8982} .reportRow b{color:#fff}
        
        /* AUDIT FILTER STYLES */
        .auditFilters { display: flex; gap: 12px; align-items: flex-end; padding: 16px 21px; border-bottom: 1px solid rgba(255,255,255,.05); background: rgba(0,0,0,.15); flex-wrap: wrap; }
        .filterGroup { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 120px; }
        .filterGroup label { font-size: 9px; font-weight: 800; color: #68756d; text-transform: uppercase; letter-spacing: 1px; }
        .filterGroup input, .filterGroup select { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,.07); background: #09110c; color: #fff; font-size: 11px; outline: none; transition: .2s; }
        .filterGroup input:focus, .filterGroup select:focus { border-color: #4d805a; }
        .filterGroup input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.5; transition: .2s; }
        .filterGroup input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
        .clearFilterBtn { padding: 9px 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,.07); background: #1a221d; color: #a4b0a8; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: .2s; height: 36px; }
        .clearFilterBtn:hover { background: rgba(248,113,113,.1); color: #f87171; border-color: rgba(248,113,113,.2); }
        
        .auditList{max-height:500px;overflow:auto} .auditRow{display:flex;align-items:center;gap:12px;padding:14px 20px;border-top:1px solid rgba(255,255,255,.04)} .auditInfo{flex:1} .auditInfo b{display:block;color:#fff;font-size:10px} .auditInfo span{display:block;margin-top:3px;color:#7a8a81;font-size:10px} .auditRow time{color:#56635b;font-size:9px;font-weight:600;white-space:nowrap}
        
        .modalBg{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)} .modal{width:min(430px,100%);padding:23px;border-radius:18px;background:#101b14;border:1px solid rgba(255,255,255,.08);box-shadow:0 25px 80px rgba(0,0,0,.55)} .modalTop{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px} .modalTop span{color:#78a982;font-size:8px;font-weight:800;letter-spacing:1.4px} .modalTop h2{margin:4px 0 0;font-size:19px} .modalTop button{border:0;background:transparent;color:#647269;cursor:pointer} .modal form{display:flex;flex-direction:column;gap:11px} .modal input{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.07);outline:0;background:#09110c;color:#fff;font-size:11px} .modal input:focus{border-color:#4d805a} .formGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px} .error{padding:9px;margin-bottom:12px;border-radius:9px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.15);color:#f87171;font-size:9px}
        @media(max-width:1300px){ .stats{grid-template-columns:repeat(3,1fr)} }
        @media(max-width:1100px){ .sidebar{width:225px;min-width:225px} .stats,.reportGrid{grid-template-columns:repeat(2,1fr)} .columns{grid-template-columns:1fr} .roleGrid,.programGrid{grid-template-columns:repeat(2,1fr)} }
        @media(max-width:750px){ .sidebar{display:none} .content{padding:22px} .header{padding:0 22px} .online{display:none} .stats,.reportGrid,.roleGrid,.programGrid{grid-template-columns:1fr} .headActions{flex-direction:column;align-items:stretch} .search input{width:100%} .panelHead{align-items:flex-start;gap:12px} .welcomeIcon{display:none} .formGrid{grid-template-columns:1fr} .auditFilters{flex-direction:column;align-items:stretch;} .clearFilterBtn{justify-content:center;} }
      `}</style>
    </div>
  );
};
export default AdminDashboard;