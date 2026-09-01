import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { db } from '../lib/db';
import { validatePasswordStrength } from '../lib/crypto';
import AdminDonationRequests from '../components/AdminDonationRequests';
import AdminCommunities from '../components/AdminCommunities';
import DoctorCommunities from '../components/DoctorCommunities';
import AdminHelpSupportTab from '../components/AdminHelpSupportTab';
import AdminProfilePopup from '../components/AdminProfilePopup';
import SwasthyaLogo from '../components/SwasthyaLogo';
import {
  Home,
  Users,
  Heart,
  HeartHandshake,
  MessageCircle,
  HelpCircle,
  LogOut,
  Calendar,
  UserCheck,
  TrendingUp,
  UserPlus,
  Megaphone,
  Image as ImageIcon,
  ChevronDown,
  Plus,
  Check,
  X,
  Search,
  Stethoscope,
  Activity,
  AlertCircle,
  ShieldCheck,
  Clock,
  Menu,
  MoreVertical,
  Copy,
  Edit3,
  Lock,
  UserX,
  Camera,
  Upload,
} from 'lucide-react';
import '../styles/admin-dashboard.css';
import '../styles/doctor-sidebar.css';

function formatDateTime(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
}

// Automatically calculate age from Date of Birth
function calculateAgeFromDob(dobStr) {
  if (!dobStr) return '';
  const birth = new Date(dobStr);
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : '';
}

// Format exact time with seconds (e.g., 06:10:24 PM)
function formatExactTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

// Format duration with seconds precision (e.g., 1m 11s, 45s, 2h 15m 30s)
function formatExactDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

// Calculate Doctor Shift Duty, Timestamps (with seconds) and Completion Percentage
function calculateDoctorDuty(docLoginInfo) {
  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  if (!docLoginInfo) {
    return {
      isOnline: false,
      attendedToday: false,
      dutyMinutes: 0,
      dutySeconds: 0,
      dutyHoursFormatted: '0s',
      shiftCompletionPct: 0,
      shiftStatus: 'Not Attended ⚪',
      timeRangeStr: 'No shift activity today',
      shiftType: 'Hospital OPD Schedule (09:00 AM - 07:30 PM)',
      loginTimeStr: '',
      logoutTimeStr: '',
      sessions: [],
    };
  }

  const loginDate = docLoginInfo.lastLoginAt ? docLoginInfo.lastLoginAt.split('T')[0] : null;
  const loginMs = docLoginInfo.lastLoginAt ? new Date(docLoginInfo.lastLoginAt).getTime() : 0;
  const isRecent24h = loginMs > 0 && (Date.now() - loginMs) < 24 * 60 * 60 * 1000;
  const isOnline = docLoginInfo.isOnline === true;
  const wasToday = isRecent24h || loginDate === todayKey || docLoginInfo.loggedInToday === true || isOnline;

  if (!wasToday && !isOnline && !docLoginInfo.lastLoginAt) {
    return {
      isOnline: false,
      attendedToday: false,
      dutyMinutes: 0,
      dutySeconds: 0,
      dutyHoursFormatted: '0s',
      shiftCompletionPct: 0,
      shiftStatus: 'Not Attended ⚪',
      timeRangeStr: 'No shift activity today',
      shiftType: docLoginInfo.shiftType || 'Hospital OPD Schedule (09:00 AM - 07:30 PM)',
      loginTimeStr: '',
      logoutTimeStr: '',
      sessions: [],
    };
  }

  let totalSeconds = docLoginInfo.dutySecondsToday || ((docLoginInfo.dutyMinutesToday || 0) * 60) || 0;

  if (isOnline && docLoginInfo.lastLoginAt) {
    const elapsedSecs = Math.max(1, Math.round((Date.now() - new Date(docLoginInfo.lastLoginAt).getTime()) / 1000));
    const baseSessionsSecs = (docLoginInfo.sessionsToday || []).reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    totalSeconds = Math.max(totalSeconds, baseSessionsSecs + elapsedSecs);
  } else if (docLoginInfo.lastLoginAt && docLoginInfo.lastLogoutAt) {
    const diffSecs = Math.max(1, Math.round((new Date(docLoginInfo.lastLogoutAt).getTime() - new Date(docLoginInfo.lastLoginAt).getTime()) / 1000));
    const baseSessionsSecs = (docLoginInfo.sessionsToday || []).reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    totalSeconds = Math.max(totalSeconds, Math.max(diffSecs, baseSessionsSecs));
  } else if (totalSeconds === 0 && docLoginInfo.lastLoginAt) {
    totalSeconds = 60; // minimum baseline 1m
  }

  const totalMinutes = Math.round(totalSeconds / 60);
  const dutyHoursFormatted = formatExactDuration(totalSeconds);

  const targetHours = docLoginInfo.targetShiftHours || 6;
  const targetSeconds = targetHours * 3600;
  const shiftCompletionPct = Math.min(100, Math.round((totalSeconds / targetSeconds) * 100));

  const loginTime = docLoginInfo.lastLoginAt || docLoginInfo.firstLoginTodayAt;
  const loginTimeStr = formatExactTime(loginTime);
  const logoutTimeStr = formatExactTime(docLoginInfo.lastLogoutAt);

  let timeRangeStr = '';
  if (isOnline) {
    timeRangeStr = loginTimeStr ? `${loginTimeStr} — Active Now (${dutyHoursFormatted})` : `Active Now (${dutyHoursFormatted})`;
  } else if (loginTimeStr && logoutTimeStr) {
    timeRangeStr = `${loginTimeStr} — ${logoutTimeStr} (${dutyHoursFormatted})`;
  } else if (loginTimeStr) {
    timeRangeStr = `Logged in at ${loginTimeStr} (${dutyHoursFormatted})`;
  } else {
    timeRangeStr = `Logged in today (${dutyHoursFormatted})`;
  }

  let shiftStatus = 'Not Attended ⚪';
  if (isOnline) {
    shiftStatus = `Active in Shift 🟢 (${dutyHoursFormatted})`;
  } else if (shiftCompletionPct >= 80) {
    shiftStatus = 'Shift Completed ✅';
  } else if (totalSeconds > 0) {
    shiftStatus = `Attended (${dutyHoursFormatted}) ⏳`;
  } else {
    shiftStatus = 'Shift Attended 🔵';
  }

  const shiftType = docLoginInfo.shiftType || (loginTime ? (() => {
    const d = new Date(loginTime);
    const m = d.getHours() * 60 + d.getMinutes();
    if (m >= 540 && m < 750) return 'Morning OPD Session (09:00 AM - 12:30 PM)';
    if (m >= 750 && m < 960) return 'Afternoon OPD Session (12:30 PM - 04:00 PM)';
    if (m >= 960 && m <= 1170) return 'Evening OPD Session (04:00 PM - 07:30 PM)';
    return 'Hospital OPD Schedule (09:00 AM - 07:30 PM)';
  })() : 'Hospital OPD Schedule (09:00 AM - 07:30 PM)');

  return {
    isOnline,
    attendedToday: true,
    dutyMinutes: totalMinutes,
    dutySeconds: totalSeconds,
    dutyHoursFormatted,
    shiftCompletionPct,
    shiftStatus,
    timeRangeStr,
    shiftType,
    loginTimeStr,
    logoutTimeStr,
    sessions: docLoginInfo.sessionsToday || [],
  };
}

function getDoctorLoginState(doc, doctorLoginsMap) {
  if (!doc) return null;
  let map = doctorLoginsMap || {};
  try {
    const raw = localStorage.getItem('swasthya_doctor_logins');
    if (raw) map = { ...map, ...JSON.parse(raw) };
  } catch (e) {}

  const nameNorm = (doc.name || '').toLowerCase().trim();
  const nameClean = nameNorm.replace(/^dr\.\s*|^dr\s*/i, '').trim();
  const nameSlug = nameClean.replace(/[^a-z0-9]+/g, '-');
  const nameAlpha = nameClean.replace(/[^a-z0-9]/g, '');
  const docId = String(doc.id || doc.doctor_id || '').toLowerCase().trim();
  const docUsername = (doc.username || '').toLowerCase().trim();
  const docEmail = (doc.email || '').toLowerCase().trim();
  const emailPrefix = docEmail.split('@')[0]?.trim();

  // Direct lookup of all normalized alias variants
  const keysToTest = [
    docId,
    docUsername,
    `dr.${docUsername}`,
    `dr${docUsername}`,
    nameNorm,
    nameClean,
    `dr. ${nameClean}`,
    `dr ${nameClean}`,
    `dr-${nameSlug}`,
    nameSlug,
    `dr${nameAlpha}`,
    nameAlpha,
    docEmail,
    emailPrefix,
    doc.professionalId ? String(doc.professionalId).toLowerCase().trim() : null
  ].filter(Boolean);

  for (const k of keysToTest) {
    if (map[k]) return map[k];
  }

  // Iterative lookup over all registered keys
  for (const key of Object.keys(map)) {
    const entry = map[key];
    if (!entry) continue;
    const kClean = String(key).toLowerCase().replace(/^dr\.\s*|^dr\s*|[^a-z0-9]/g, '');
    if (nameAlpha && (kClean === nameAlpha || kClean.includes(nameAlpha) || nameAlpha.includes(kClean))) {
      return entry;
    }
  }

  return null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, session } = useSession();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('home');

  // Sidebar collapse state (matches Doctor Portal hamburger pattern)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cached staff fallback for immediate 0ms rendering
  const cachedStaff = useMemo(() => {
    return session?.staff || (() => {
      try {
        return JSON.parse(localStorage.getItem('swasthya_session') || '{}').staff;
      } catch {
        return null;
      }
    })();
  }, [session?.staff]);

  // Hospital & Admin Info (Real Administrator resolution from database / session)
  const [hospital, setHospital] = useState(() => ({
    id: cachedStaff?.hospital_id || 'sms-jaipur',
    name: cachedStaff?.hospital_name || 'Sawai Man Singh Hospital',
    city: cachedStaff?.city || 'Jaipur',
  }));

  const [adminStaffUser, setAdminStaffUser] = useState(null);

  const adminName = cachedStaff?.name || session?.staff?.name || adminStaffUser?.name || 'Hospital Administrator';
  const adminRole = (cachedStaff?.role || session?.staff?.role) === 'admin' ? 'Administrator' : (cachedStaff?.department || 'Administrator');
  const adminFirstName = adminName.split(' ')[0] || adminName;
  const adminInitials = adminName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Date Filter State (Defaults to Today's date or 'all')
  const todayDateKey = new Date().toISOString().split('T')[0];
  const yesterdayDateKey = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState('all');
  const [showDatePickerMenu, setShowDatePickerMenu] = useState(false);

  // Chart Timeframe Filter: 'week' | 'month' | 'year'
  const [trendRange, setTrendRange] = useState('week');

  // Live Database Metrics & Lists (100% Real Database records)
  const [stats, setStats] = useState({
    totalAppointments: 0,
    patientsServed: 0,
    activeDoctors: 0,
    totalDonations: 0,
  });

  const [appointmentsList, setAppointmentsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [communitiesList, setCommunitiesList] = useState([]);
  const [doctorLogins, setDoctorLogins] = useState({});

  // UI Dropdowns & Modals
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Manage Doctors UI State
  const [docSearch, setDocSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [specFilter, setSpecFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dutyFilter, setDutyFilter] = useState('all'); // 'all' | 'online' | 'attended' | 'not_logged_in'
  const [docPage, setDocPage] = useState(1);
  const docPageSize = 7;

  // 3-Dots Action Dropdown Menu
  const [openMenuDocId, setOpenMenuDocId] = useState(null);

  // Edit Doctor Modal State (No password modification by admin)
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [managingLeaveDoctor, setManagingLeaveDoctor] = useState(null);
  const [doctorLeavesList, setDoctorLeavesList] = useState([]);
  const [newLeaveDate, setNewLeaveDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newLeaveReason, setNewLeaveReason] = useState('Annual Leave');
  const [newLeaveNotes, setNewLeaveNotes] = useState('');
  const [editingDoctor, setEditingDoctor] = useState({
    id: '',
    name: '',
    dob: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    system: 'Allopathy',
    speciality: '',
    degrees: '',
    experience: '',
    registrationNumber: '',
    avatar_url: '',
    is_active: true,
  });

  // New Doctor Form State matching Add Doctor Modal UI
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    dob: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    system: '',
    speciality: '',
    degrees: '',
    experience: '',
    registrationNumber: '',
    professionalId: '',
    avatar_url: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginHelpModal, setShowLoginHelpModal] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showBannersModal, setShowBannersModal] = useState(false);

  // Announcement Form State
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementType, setAnnouncementType] = useState('General Notice');

  // Load real data from live database tables
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        { data: apptsData },
        { data: docsData },
        { data: commsData },
        { data: donData },
        { data: hospData },
        { data: staffData },
        { data: loginsData },
        { data: leavesData },
      ] = await Promise.all([
        db.appointments.getAllForAdmin({ limit: 500 }),
        db.doctors.getAllForAdmin(),
        db.communities.getDirectory(),
        db.donations.getAllRequests(),
        db.hospitals.getAll(),
        db.staff.getAll(),
        db.staff.getDoctorDailyLogins(),
        db.doctorLeaves.getAll(),
      ]);

      if (leavesData) {
        setDoctorLeavesList(leavesData);
      }

      const targetHospId = session?.staff?.hospital_id || cachedStaff?.hospital_id || 'sms-jaipur';
      const targetHospName = session?.staff?.hospital_name || cachedStaff?.hospital_name || 'Sawai Man Singh Hospital';

      if (hospData && hospData.length > 0) {
        const foundHospital = hospData.find(h => 
          (targetHospId && (h.id === targetHospId || String(h.id).toLowerCase().includes(String(targetHospId).toLowerCase()))) ||
          (targetHospName && h.name && (h.name.toLowerCase().includes(targetHospName.toLowerCase()) || targetHospName.toLowerCase().includes(h.name.toLowerCase())))
        );
        if (foundHospital) {
          setHospital(foundHospital);
        }
      }

      if (loginsData) {
        setDoctorLogins(loginsData);
      }

      if (staffData && staffData.length > 0) {
        const targetUsername = session?.staff?.username || cachedStaff?.username;
        const foundAdmin = staffData.find(s => s.role === 'admin' && (!targetUsername || s.username === targetUsername));
        if (foundAdmin) setAdminStaffUser(foundAdmin);
      }

      const allAppointments = apptsData || [];
      const rawDoctors = docsData || [];
      const allCommunities = commsData || [];
      const allDonations = donData || [];

      // Filter doctors for this hospital from the real database
      const currentHospId = targetHospId;
      const currentHospName = targetHospName;
      const hospitalDocs = rawDoctors.filter(d => {
        const dHospId = d.hospital_id || d.hospitals?.id;
        const dHospName = d.hospital_name || d.hospitalName || d.hospital || d.hospitals?.name;
        if (dHospId && (dHospId === currentHospId || String(dHospId).toLowerCase().includes(String(currentHospId).toLowerCase()))) return true;
        if (dHospName && currentHospName && (String(dHospName).toLowerCase().includes(String(currentHospName).toLowerCase()) || String(currentHospName).toLowerCase().includes(String(dHospName).toLowerCase()))) return true;
        return false;
      });

      // No fallback to all doctors. If this hospital has 0 doctors, it has 0 doctors.
      const resolvedDoctors = hospitalDocs;
      const hospitalDocIds = new Set(resolvedDoctors.map(d => String(d.id || d.doctor_id)).filter(Boolean));
      const hospitalDocNames = new Set(resolvedDoctors.map(d => (d.name || '').toLowerCase().trim()).filter(Boolean));

      // Strictly isolate appointments: An appointment is ONLY valid if its DOCTOR belongs to this hospital.
      const hospitalAppointments = allAppointments.filter(apt => {
        const docId = String(apt.doctor_id || apt.doctorId || apt.doctors?.id || '');
        if (docId && hospitalDocIds.has(docId)) return true;

        const docName = (apt.doctor_name || apt.doctorName || apt.doctors?.name || '').toLowerCase().trim();
        if (docName && hospitalDocNames.has(docName)) return true;

        // If we don't recognize the doctor as belonging to this hospital, reject the appointment.
        return false;
      });

      // Strictly use ONLY the appointments for this hospital
      const effectiveAppointments = hospitalAppointments;

      setAppointmentsList(effectiveAppointments);
      setDoctorsList(resolvedDoctors);
      setCommunitiesList(allCommunities);

      // Compute Real Genuine Metrics for THIS hospital from Database
      const totalAppointments = effectiveAppointments.length;
      const patientsServed = effectiveAppointments.filter(
        a => a.status === 'completed' || a.status === 'in_consultation'
      ).length;
      const activeDoctors = resolvedDoctors.filter(d => d.is_active !== false).length;

      // Sum actual verified donation contributions
      let totalDonations = 0;
      allDonations.forEach(req => {
        if (req.amount_received) totalDonations += Number(req.amount_received);
        else if (req.amount_raised) totalDonations += Number(req.amount_raised);
        (req.donation_contributions || []).forEach(c => {
          if (c.amount_inr) totalDonations += Number(c.amount_inr);
        });
      });

      setStats({
        totalAppointments,
        patientsServed,
        activeDoctors,
        totalDonations,
      });
    } catch (err) {
      console.warn('Error loading live admin data:', err);
      setError('Unable to load database metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleSync = async () => {
      try {
        const { data } = await db.staff.getDoctorDailyLogins();
        if (data) setDoctorLogins(data);
      } catch (e) {}
    };

    const interval = setInterval(handleSync, 2000);
    window.addEventListener('swasthya_doctor_status_changed', handleSync);
    window.addEventListener('swasthya_doctor_leave_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('swasthya_doctor_status_changed', handleSync);
      window.removeEventListener('swasthya_doctor_leave_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Doctors Summary Metrics (Card 1: Total Doctors, Card 2: Online Now, Card 3: Attended Today, Card 4: Not Logged In Today)
  const docMetrics = useMemo(() => {
    const total = doctorsList.length;
    let allopathy = 0;
    let ayurveda = 0;
    let activeRoster = 0;
    let onlineNow = 0;
    let attendedToday = 0;
    let totalDutyMinutes = 0;
    let totalShiftPctSum = 0;

    doctorsList.forEach(d => {
      const sys = d.system || (d.speciality?.toLowerCase().includes('ayur') ? 'Ayurveda' : 'Allopathy');
      if (sys === 'Ayurveda') ayurveda++;
      else allopathy++;
      if (d.is_active !== false) activeRoster++;

      const docLoginInfo = getDoctorLoginState(d, doctorLogins);
      const duty = calculateDoctorDuty(docLoginInfo);
      if (duty.isOnline) onlineNow++;
      if (duty.attendedToday) {
        attendedToday++;
        totalDutyMinutes += duty.dutyMinutes;
        totalShiftPctSum += duty.shiftCompletionPct;
      }
    });

    const notLoggedInToday = Math.max(0, total - attendedToday);
    const avgShiftCompletionPct = attendedToday > 0 ? Math.round(totalShiftPctSum / attendedToday) : 0;
    const totHrs = Math.floor(totalDutyMinutes / 60);
    const totMins = totalDutyMinutes % 60;
    const totalDutyHoursFormatted = totHrs > 0 ? `${totHrs}h ${totMins}m` : `${totMins}m`;

    const alloPct = total > 0 ? ((allopathy / total) * 100).toFixed(1) : '0';
    const ayurPct = total > 0 ? ((ayurveda / total) * 100).toFixed(1) : '0';

    return {
      total,
      allopathy,
      ayurveda,
      active: activeRoster,
      onlineNow,
      attendedToday,
      notLoggedInToday,
      loggedInToday: attendedToday,
      totalDutyMinutes,
      avgShiftCompletionPct,
      totalDutyHoursFormatted,
      alloPct,
      ayurPct,
    };
  }, [doctorsList, doctorLogins]);

  // Dynamic Specializations Set from Database
  const specializationsList = useMemo(() => {
    const set = new Set();
    doctorsList.forEach(d => {
      if (d.speciality) set.add(d.speciality);
    });
    return Array.from(set);
  }, [doctorsList]);

  // Filtered Doctors List based on search, department, specialization, status, and duty status
  const filteredDoctors = useMemo(() => {
    return doctorsList.filter(doc => {
      // 0. Duty / Shift Attendance Filter
      if (dutyFilter !== 'all') {
        const docLoginInfo = getDoctorLoginState(doc, doctorLogins);
        const isOnline = docLoginInfo?.isOnline === true;
        const attended = docLoginInfo?.loggedInToday === true;

        if (dutyFilter === 'online' && !isOnline) return false;
        if (dutyFilter === 'attended' && !attended) return false;
        if (dutyFilter === 'not_logged_in' && attended) return false;
      }
      // 1. Text Search
      if (docSearch.trim()) {
        const q = docSearch.toLowerCase().trim();
        const matchName = doc.name?.toLowerCase().includes(q);
        const matchEmail = (doc.email || doc.username || '')?.toLowerCase().includes(q);
        const matchDept = (doc.speciality || doc.system || '')?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept) return false;
      }
      // 2. Department Filter
      if (deptFilter !== 'All') {
        const sys = doc.system || (doc.speciality?.toLowerCase().includes('ayur') ? 'Ayurveda' : 'Allopathy');
        if (sys.toLowerCase() !== deptFilter.toLowerCase()) return false;
      }
      // 3. Specialization Filter
      if (specFilter !== 'All') {
        if (doc.speciality !== specFilter) return false;
      }
      // 4. Status Filter
      if (statusFilter !== 'All') {
        const isActive = doc.is_active !== false;
        if (statusFilter === 'Active' && !isActive) return false;
        if (statusFilter === 'Inactive' && isActive) return false;
      }
      return true;
    });
  }, [doctorsList, docSearch, deptFilter, specFilter, statusFilter, dutyFilter, doctorLogins]);

  // Paginated Doctors
  const totalDocPages = Math.max(1, Math.ceil(filteredDoctors.length / docPageSize));
  const paginatedDoctors = useMemo(() => {
    const start = (docPage - 1) * docPageSize;
    return filteredDoctors.slice(start, start + docPageSize);
  }, [filteredDoctors, docPage, docPageSize]);

  // Copy Professional ID to clipboard
  const handleCopyId = id => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Filtered Appointments based on selectedDate
  const filteredAppointments = useMemo(() => {
    if (selectedDate === 'all') return appointmentsList;
    return appointmentsList.filter(apt => {
      const d = apt.date || apt.booked_at?.split('T')[0] || apt.created_at?.split('T')[0];
      return d === selectedDate;
    });
  }, [appointmentsList, selectedDate]);

  // Dynamic Date-Filtered Metrics
  const dateMetrics = useMemo(() => {
    const totalActiveRoster = docMetrics.active || stats.activeDoctors || 0;
    const appts = selectedDate === 'all' ? appointmentsList : filteredAppointments;
    const totalAppointments = appts.length;
    const patientsServed = appts.filter(
      a => a.status === 'completed' || a.status === 'in_consultation'
    ).length;

    const onlineNowCount = docMetrics.onlineNow || 0;
    const loggedInTodayCount = docMetrics.loggedInToday || 0;

    return {
      totalAppointments,
      patientsServed,
      activeDoctors: totalActiveRoster,
      onlineNow: onlineNowCount,
      loggedInToday: loggedInTodayCount,
      totalDonations: stats.totalDonations,
    };
  }, [filteredAppointments, selectedDate, stats, docMetrics, appointmentsList]);

  // Real Database Breakdown of Ayurvedic vs Allopathic Appointments
  const typeBreakdown = useMemo(() => {
    let ayurvedic = 0;
    let allopathic = 0;

    const sourceList = filteredAppointments.length > 0 ? filteredAppointments : appointmentsList;

    sourceList.forEach(apt => {
      const system = apt.doctors?.system || (apt.doctors?.speciality?.toLowerCase().includes('ayur') ? 'Ayurveda' : 'Allopathy');
      if (system === 'Ayurveda') ayurvedic++;
      else allopathic++;
    });

    const total = ayurvedic + allopathic;
    const ayurCount = ayurvedic;
    const alloCount = allopathic;
    const ayurPct = total > 0 ? Math.round((ayurCount / total) * 100) : 0;
    const alloPct = total > 0 ? 100 - ayurPct : 0;

    return { total, ayurCount, alloCount, ayurPct, alloPct };
  }, [filteredAppointments, appointmentsList]);

  // Dynamic Trend based on dropdown (This Week / This Month / This Year)
  const overviewTrend = useMemo(() => {
    const anchorDate = selectedDate !== 'all' ? new Date(`${selectedDate}T00:00:00`) : new Date('2026-08-30T00:00:00');

    if (trendRange === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const counts = new Array(12).fill(0);

      appointmentsList.forEach(apt => {
        const dStr = apt.date || apt.booked_at || apt.created_at;
        if (dStr) {
          const mIdx = new Date(dStr).getMonth();
          if (mIdx >= 0 && mIdx < 12) counts[mIdx]++;
        }
      });

      const maxVal = Math.max(...counts, 4);
      const points = months.map((m, idx) => {
        const val = counts[idx];
        const x = 25 + idx * 41;
        const y = 120 - Math.round((val / maxVal) * 85);
        return { display: m, val, x, y };
      });

      let pathD = '';
      points.forEach((pt, i) => {
        if (i === 0) pathD += `M ${pt.x} ${pt.y}`;
        else {
          const prev = points[i - 1];
          const cx1 = prev.x + 20;
          const cy1 = prev.y;
          const cx2 = pt.x - 20;
          const cy2 = pt.y;
          pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
        }
      });

      const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z` : '';
      return { points, pathD, areaD };
    }

    if (trendRange === 'month') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const counts = [0, 0, 0, 0];

      appointmentsList.forEach(apt => {
        const dStr = apt.date || apt.booked_at || apt.created_at;
        if (dStr) {
          const day = new Date(dStr).getDate();
          const wIdx = Math.min(3, Math.floor((day - 1) / 7));
          counts[wIdx]++;
        }
      });

      const maxVal = Math.max(...counts, 4);
      const points = weeks.map((w, idx) => {
        const val = counts[idx];
        const x = 40 + idx * 135;
        const y = 120 - Math.round((val / maxVal) * 85);
        return { display: w, val, x, y };
      });

      let pathD = '';
      points.forEach((pt, i) => {
        if (i === 0) pathD += `M ${pt.x} ${pt.y}`;
        else {
          const prev = points[i - 1];
          const cx1 = prev.x + 60;
          const cy1 = prev.y;
          const cx2 = pt.x - 60;
          const cy2 = pt.y;
          pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
        }
      });

      const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z` : '';
      return { points, pathD, areaD };
    }

    // Default: 'week' (Past 7 Days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() - (6 - i));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return {
        dateStr,
        dayName: days[d.getDay()],
        display: `${days[d.getDay()]} ${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
        isCurrent: dateStr === selectedDate,
      };
    });

    appointmentsList.forEach(apt => {
      const aptDate = apt.date || apt.booked_at?.split('T')[0] || apt.created_at?.split('T')[0];
      const matchIdx = past7Days.findIndex(p => p.dateStr === aptDate);
      if (matchIdx !== -1) {
        counts[matchIdx]++;
      }
    });

    const maxVal = Math.max(...counts, 4);
    const points = past7Days.map((p, idx) => {
      const val = counts[idx];
      const x = 30 + idx * 72;
      const y = 120 - Math.round((val / maxVal) * 85);
      return { ...p, val, x, y };
    });

    let pathD = '';
    points.forEach((pt, i) => {
      if (i === 0) pathD += `M ${pt.x} ${pt.y}`;
      else {
        const prev = points[i - 1];
        const cx1 = prev.x + 35;
        const cy1 = prev.y;
        const cx2 = pt.x - 35;
        const cy2 = pt.y;
        pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
      }
    });

    const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z` : '';
    return { points, pathD, areaD };
  }, [appointmentsList, selectedDate, trendRange]);

  // Available dates found in real database appointments with counts
  const availableDatesMap = useMemo(() => {
    const map = {};
    appointmentsList.forEach(apt => {
      const d = apt.date || apt.booked_at?.split('T')[0] || apt.created_at?.split('T')[0];
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [appointmentsList]);

  // Handle Add Doctor Submit with complete validation & database persistence
  const handleAddDoctorSubmit = async e => {
    e.preventDefault();
    if (!newDoctor.name.trim()) {
      alert('Please enter doctor full name');
      return;
    }
    if (newDoctor.password && newDoctor.confirmPassword && newDoctor.password !== newDoctor.confirmPassword) {
      alert('Passwords do not match. Please verify.');
      return;
    }
    if (newDoctor.password) {
      const check = validatePasswordStrength(newDoctor.password);
      if (!check.isValid) {
        alert(check.message || 'Password must be at least 8 characters long with letters and numbers.');
        return;
      }
    }

    try {
      const cleanProfId = newDoctor.professionalId
        ? newDoctor.professionalId.toLowerCase().replace(/[^a-z0-9]/g, '')
        : newDoctor.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      const assignedUsername = `dr.${cleanProfId}`;
      const assignedEmail = newDoctor.email || `dr${cleanProfId}@swasthyasetu.ac.in`;

      const { error: dErr } = await db.doctors.createDoctor({
        name: newDoctor.name.startsWith('Dr.') ? newDoctor.name : `Dr. ${newDoctor.name}`,
        degrees: newDoctor.degrees || 'MBBS, MD',
        speciality: newDoctor.speciality || 'General Physician',
        system: newDoctor.system || 'Allopathy',
        experience: parseInt(newDoctor.experience, 10) || 5,
        age: parseInt(newDoctor.age, 10) || 35,
        gender: newDoctor.gender || 'Female',
        hospitalId: hospital?.id || session?.staff?.hospital_id || 'sms-jaipur',
        hospitalName: hospital?.name || session?.staff?.hospital_name || 'Sawai Man Singh Hospital',
        email: assignedEmail,
        phone: newDoctor.phone || null,
        username: assignedUsername,
        avatarUrl: newDoctor.avatar_url || null,
        registrationNumber: newDoctor.registrationNumber || null,
        dob: newDoctor.dob || null,
        initialPassword: newDoctor.password || `${assignedUsername}123`,
      });

      if (dErr) {
        alert(`Error registering doctor: ${dErr.message}`);
        return;
      }

      setShowAddDoctorModal(false);
      setNewDoctor({
        name: '',
        dob: '',
        age: '',
        gender: '',
        phone: '',
        email: '',
        system: '',
        speciality: '',
        degrees: '',
        experience: '',
        registrationNumber: '',
        professionalId: '',
        avatar_url: '',
        password: '',
        confirmPassword: '',
      });

      alert(`Doctor ${newDoctor.name} successfully registered in database! Credentials generated.`);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to create doctor:', err);
      alert('Unable to save doctor to database.');
    }
  };

  // Handle Edit Doctor (Admin can edit doctor details, but CANNOT view or edit doctor's password)
  const handleEditDoctorSubmit = async e => {
    e.preventDefault();
    if (!editingDoctor.name?.trim()) return;

    try {
      const updates = {
        name: editingDoctor.name.startsWith('Dr.') ? editingDoctor.name : `Dr. ${editingDoctor.name}`,
        degrees: editingDoctor.degrees || 'MBBS, MD',
        speciality: editingDoctor.speciality || 'General Physician',
        system: editingDoctor.system || 'Allopathy',
        experience: parseInt(editingDoctor.experience, 10) || 5,
        age: parseInt(editingDoctor.age, 10) || 35,
        gender: editingDoctor.gender || 'Female',
        phone: editingDoctor.phone || null,
        email: editingDoctor.email || null,
        avatar_url: editingDoctor.avatar_url || null,
        is_active: editingDoctor.is_active !== false,
      };

      const { error: updErr } = await db.doctors.updateDoctor(editingDoctor.id, updates);
      if (updErr) {
        alert(`Error updating doctor: ${updErr.message}`);
        return;
      }

      setShowEditDoctorModal(false);
      setOpenMenuDocId(null);
      alert(`Doctor ${editingDoctor.name} profile updated successfully in database!`);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to update doctor:', err);
      alert('Unable to update doctor in database.');
    }
  };

  // Toggle Doctor Active / Inactive Status directly
  const handleToggleDoctorStatus = async doc => {
    try {
      const newStatus = doc.is_active === false ? true : false;
      await db.doctors.updateDoctor(doc.id, { is_active: newStatus });
      setOpenMenuDocId(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleLogout = () => {
    logout?.();
    navigate('/auth?role=admin');
  };

  return (
    <div
      className="admin-shell"
      onClick={() => {
        if (openMenuDocId) setOpenMenuDocId(null);
        if (showProfileMenu) setShowProfileMenu(false);
      }}
    >
      {/* ── 1. Left Sidebar (matches Doctor Portal hamburger pattern) ── */}
      <aside className={`dp-side ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="dp-brand">
          <div className="dp-brand-logo">
            <SwasthyaLogo size={42} />
          </div>
          <button
            type="button"
            className="dp-hamburger"
            onClick={() => setSidebarCollapsed(v => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu />
          </button>
        </div>

        <div className="dp-side-title">Admin Portal</div>

        <nav>
          <button
            type="button"
            className={`dp-nav-btn ${activeTab === 'home' ? 'on' : ''}`}
            onClick={() => setActiveTab('home')}
            title="Home"
          >
            <Home />
            <span>Home</span>
          </button>
          <button
            type="button"
            className={`dp-nav-btn ${activeTab === 'doctors' ? 'on' : ''}`}
            onClick={() => setActiveTab('doctors')}
            title="Manage Doctors"
          >
            <Users />
            <span>Manage Doctors</span>
          </button>
          <button
            type="button"
            className={`dp-nav-btn ${activeTab === 'donations' ? 'on' : ''}`}
            onClick={() => setActiveTab('donations')}
            title="Donations"
          >
            <Heart />
            <span>Donations</span>
          </button>
          <button
            type="button"
            className={`dp-nav-btn ${activeTab === 'communities' ? 'on' : ''}`}
            onClick={() => setActiveTab('communities')}
            title="Communities"
          >
            <MessageCircle />
            <span>Communities</span>
          </button>
          <button
            type="button"
            className={`dp-nav-btn ${activeTab === 'help' ? 'on' : ''}`}
            onClick={() => setActiveTab('help')}
            title="Help & Support"
          >
            <HelpCircle />
            <span>Help & Support</span>
          </button>
        </nav>

        <button className="dp-out" onClick={handleLogout} title="Logout">
          <LogOut />
          <span>Logout</span>
        </button>
      </aside>

      {/* ── 2. Main Content Area ── */}
      <main className="admin-main">
        {/* ── Top Header Row (Language selector removed) ── */}
        <header className="admin-header">
          <h1 className="admin-hospital-title">
            {hospital.city ? `${hospital.name}, ${hospital.city}` : hospital.name || 'AIIMS New Delhi'}
          </h1>

          <div className="admin-header-actions">
            {/* Admin Profile Pill */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="admin-profile-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
              >
                <div className="admin-avatar-badge">{adminInitials}</div>
                <div className="admin-profile-info">
                  <span className="admin-profile-name">{adminName}</span>
                  <span className="admin-profile-role">{adminRole}</span>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {showProfileMenu && (
                <AdminProfilePopup
                  adminName={adminName}
                  adminRole={adminRole}
                  adminInitials={adminInitials}
                  hospital={hospital}
                  session={session}
                  onClose={() => setShowProfileMenu(false)}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </header>

        {/* ── TAB 1: HOME (100% REAL DATABASE DATA) ── */}
        {activeTab === 'home' && (
          <>
            {/* Greeting & Date Filter Row */}
            <div className="admin-greeting-row">
              <div>
                <h2 className="admin-greeting-title">Welcome back, {adminFirstName}! 👋</h2>
                <p className="admin-greeting-sub">
                  {selectedDate === 'all'
                    ? "Here's the comprehensive live overview across all records at your hospital."
                    : `Here's what's happening at your hospital on ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
                </p>
              </div>

              {/* Interactive Calendar / Date Selector Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="admin-date-picker-btn"
                  onClick={() => setShowDatePickerMenu(!showDatePickerMenu)}
                  title="Filter dashboard by date"
                >
                  <Calendar size={15} color="#087d43" />
                  <span>
                    {selectedDate === 'all'
                      ? 'All Dates (Live Overview)'
                      : new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                  </span>
                  <ChevronDown size={14} color="#64748b" />
                </button>

                {showDatePickerMenu && (
                  <div className="admin-datepicker-dropdown">
                    <div className="admin-dp-head">
                      <span className="admin-dp-title">
                        <Calendar size={14} color="#087d43" />
                        <span>Filter Hospital Date</span>
                      </span>
                      <button
                        type="button"
                        className="admin-dp-close"
                        onClick={() => setShowDatePickerMenu(false)}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="admin-dp-presets">
                      {/* Preset 1: Today */}
                      <button
                        type="button"
                        className={`admin-dp-preset-btn ${selectedDate === todayDateKey ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDate(todayDateKey);
                          setShowDatePickerMenu(false);
                        }}
                      >
                        <span>📅 Today ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})</span>
                        <span className="admin-dp-preset-badge">
                          {availableDatesMap[todayDateKey] || 0} appts
                        </span>
                      </button>

                      {/* Preset 2: Yesterday */}
                      <button
                        type="button"
                        className={`admin-dp-preset-btn ${selectedDate === yesterdayDateKey ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDate(yesterdayDateKey);
                          setShowDatePickerMenu(false);
                        }}
                      >
                        <span>⏪ Yesterday ({new Date(Date.now() - 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})</span>
                        <span className="admin-dp-preset-badge">
                          {availableDatesMap[yesterdayDateKey] || 0} appts
                        </span>
                      </button>

                      {/* Preset 3: All Dates */}
                      <button
                        type="button"
                        className={`admin-dp-preset-btn ${selectedDate === 'all' ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDate('all');
                          setShowDatePickerMenu(false);
                        }}
                      >
                        <span>📊 All Dates (Full Overview)</span>
                        <span className="admin-dp-preset-badge">{appointmentsList.length} total</span>
                      </button>
                    </div>

                    <div>
                      <label className="admin-dp-custom-label">Select Specific Date</label>
                      <input
                        type="date"
                        className="admin-dp-input"
                        value={selectedDate === 'all' ? '' : selectedDate}
                        onChange={e => {
                          if (e.target.value) {
                            setSelectedDate(e.target.value);
                            setShowDatePickerMenu(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 4 Top Stat Metric Cards (Dynamic Live Database Numbers) ── */}
            <div className="admin-metrics-grid">
              {/* Card 1: Total Appointments */}
              <div className="admin-metric-card">
                <div className="admin-metric-icon-wrap green">
                  <Calendar size={26} />
                </div>
                <div className="admin-metric-content">
                  <div className="admin-metric-number">{dateMetrics.totalAppointments}</div>
                  <div className="admin-metric-label">
                    {selectedDate === 'all' ? 'Total Appointments' : 'Date Appointments'}
                  </div>
                  <div className="admin-metric-trend">
                    <TrendingUp size={12} />
                    <span>Live Database Queue</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Patients Served */}
              <div className="admin-metric-card">
                <div className="admin-metric-icon-wrap blue">
                  <Users size={26} />
                </div>
                <div className="admin-metric-content">
                  <div className="admin-metric-number">{dateMetrics.patientsServed}</div>
                  <div className="admin-metric-label">
                    {selectedDate === 'all' ? 'Patients Served' : 'Consultations Done'}
                  </div>
                  <div className="admin-metric-trend">
                    <TrendingUp size={12} />
                    <span>Completed Status</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Doctors Online Now (Live Session & Shift Record) */}
              <div className="admin-metric-card">
                <div className="admin-metric-icon-wrap purple">
                  <UserCheck size={26} />
                </div>
                <div className="admin-metric-content">
                  <div className="admin-metric-number">{dateMetrics.onlineNow}</div>
                  <div className="admin-metric-label">Doctors Online Now</div>
                  <div className="admin-metric-trend">
                    <TrendingUp size={12} />
                    <span>{dateMetrics.loggedInToday} attended today • {dateMetrics.activeDoctors} in roster</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Total Donations */}
              <div className="admin-metric-card">
                <div className="admin-metric-icon-wrap orange">
                  <HeartHandshake size={26} />
                </div>
                <div className="admin-metric-content">
                  <div className="admin-metric-number">
                    ₹{dateMetrics.totalDonations.toLocaleString('en-IN')}
                  </div>
                  <div className="admin-metric-label">Total Donations</div>
                  <div className="admin-metric-trend">
                    <TrendingUp size={12} />
                    <span>Verified Hospital Contributions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Middle Row: Real Trend Chart + Donut ── */}
            <div className="admin-mid-grid">
              {/* Box 1: Appointments Overview Dynamic Spline Area Chart with Dropdown */}
              <div className="admin-card-box">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">
                    <Calendar size={16} color="#087d43" />
                    <span>Appointments Overview</span>
                  </h3>
                  {/* Timeframe Dropdown (This Week / This Month / This Year) */}
                  <select
                    className="admin-filter-select"
                    value={trendRange}
                    onChange={e => setTrendRange(e.target.value)}
                  >
                    <option value="week">For This Week</option>
                    <option value="month">For This Month</option>
                    <option value="year">For This Year</option>
                  </select>
                </div>

                <div className="admin-chart-wrap">
                  <svg className="admin-chart-svg" viewBox="0 0 500 140" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Area Fill */}
                    {overviewTrend.areaD && <path d={overviewTrend.areaD} fill="url(#greenGrad)" />}

                    {/* Green Spline Curve Line */}
                    {overviewTrend.pathD && (
                      <path
                        d={overviewTrend.pathD}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Data Points and Value Badges */}
                    {overviewTrend.points.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.isCurrent ? 6 : 4}
                          fill={pt.isCurrent ? '#087d43' : '#047857'}
                          stroke={pt.isCurrent ? '#ffffff' : 'none'}
                          strokeWidth={pt.isCurrent ? 2 : 0}
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 9}
                          fontSize="10"
                          fontWeight="700"
                          fill={pt.isCurrent ? '#087d43' : '#0f172a'}
                          textAnchor="middle"
                        >
                          {pt.val}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* X Axis Labels */}
                  <div className="admin-chart-x-axis">
                    {overviewTrend.points.map((p, idx) => (
                      <span
                        key={idx}
                        className="admin-chart-x-label"
                        style={{
                          fontSize: '11px',
                          fontWeight: p.isCurrent ? 800 : 500,
                          color: p.isCurrent ? '#087d43' : '#64748b',
                        }}
                      >
                        {p.display}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 2: Appointment by Type Donut Chart */}
              <div className="admin-card-box">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">Appointment by Type</h3>
                </div>

                <div className="admin-donut-container">
                  <div className="admin-donut-graphic">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      {/* Base Track */}
                      <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                      {/* Allopathic Segment (Blue) */}
                      {typeBreakdown.total > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="14"
                          strokeDasharray="301.6"
                          strokeDashoffset={301.6 * (1 - typeBreakdown.alloPct / 100)}
                          transform="rotate(-90 60 60)"
                          strokeLinecap="round"
                        />
                      )}
                      {/* Ayurvedic Segment (Green) */}
                      {typeBreakdown.total > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="14"
                          strokeDasharray="301.6"
                          strokeDashoffset={301.6 * (1 - typeBreakdown.ayurPct / 100)}
                          transform={`rotate(${typeBreakdown.alloPct * 3.6 - 90} 60 60)`}
                          strokeLinecap="round"
                        />
                      )}
                    </svg>

                    <div className="admin-donut-center">
                      <span className="admin-donut-center-num">{typeBreakdown.total}</span>
                      <span className="admin-donut-center-label">Total</span>
                    </div>
                  </div>

                  <div className="admin-donut-legend">
                    <div className="admin-donut-legend-item">
                      <div className="admin-donut-legend-dot green" />
                      <div className="admin-donut-legend-text">
                        <span className="admin-donut-legend-title">Ayurvedic</span>
                        <span className="admin-donut-legend-val">
                          {typeBreakdown.ayurCount} ({typeBreakdown.ayurPct}%)
                        </span>
                      </div>
                    </div>

                    <div className="admin-donut-legend-item">
                      <div className="admin-donut-legend-dot blue" />
                      <div className="admin-donut-legend-text">
                        <span className="admin-donut-legend-title">Allopathic</span>
                        <span className="admin-donut-legend-val">
                          {typeBreakdown.alloCount} ({typeBreakdown.alloPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bottom Row: Recent Appointments (Full Width) ── */}
            <div className="admin-bottom-grid">
              <div className="admin-card-box">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">Recent Appointments</h3>
                </div>

                <div className="admin-table-wrap">
                  {filteredAppointments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                      <Calendar size={32} color="#087d43" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                        No appointments recorded for this view in the database.
                      </p>
                      {selectedDate !== 'all' && (
                        <button
                          type="button"
                          className="admin-view-all-btn"
                          style={{ margin: '0 auto' }}
                          onClick={() => setSelectedDate('all')}
                        >
                          View All Dates
                        </button>
                      )}
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Token No.</th>
                          <th>Patient Name</th>
                          <th>Doctor</th>
                          <th>Department</th>
                          {selectedDate === 'all' && <th>Date</th>}
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.slice(0, 10).map((row, idx) => {
                          const tokenStr =
                            row.token_number || row.id?.slice(0, 8) || `#${String(idx + 1).padStart(3, '0')}`;
                          const patientName = row.patients?.name || 'Patient';
                          const docName = row.doctors?.name || 'Dr. Assigned';
                          const deptStr =
                            row.doctors?.speciality ||
                            (row.doctors?.system === 'Ayurveda' ? 'Ayurveda' : 'Allopathy') ||
                            'General Medicine';
                          
                          const tokenDateMatch = String(row.token_number || '').match(/APT-(\d{4})(\d{2})(\d{2})-/);
                          const inferredTokenDate = tokenDateMatch ? `${tokenDateMatch[1]}-${tokenDateMatch[2]}-${tokenDateMatch[3]}` : '';
                          const rawDateStr = row.date || row.booked_at?.split('T')[0] || inferredTokenDate || row.created_at?.split('T')[0] || '';
                          
                          let formattedDate = '—';
                          if (rawDateStr) {
                            try {
                              const [y, m, d] = rawDateStr.split('-').map(Number);
                              if (y && m && d) {
                                const dObj = new Date(y, m - 1, d);
                                formattedDate = dObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                              } else {
                                const dObj = new Date(rawDateStr);
                                formattedDate = !isNaN(dObj.getTime())
                                  ? dObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : rawDateStr;
                              }
                            } catch {
                              formattedDate = rawDateStr;
                            }
                          }

                          const timeStr = row.time_label || row.time_24 || '10:00 AM';
                          const rawStatus = (row.status || 'upcoming').toLowerCase();
                          
                          const now = new Date();
                          const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                          const currentMins = now.getHours() * 60 + now.getMinutes();

                          const parseSlotMins = (tStr, t24) => {
                            if (t24 && typeof t24 === 'string' && t24.includes(':')) {
                              const [h, m] = t24.split(':').map(Number);
                              if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
                            }
                            if (tStr && typeof tStr === 'string') {
                              const match = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                              if (match) {
                                let h = parseInt(match[1], 10);
                                const m = parseInt(match[2], 10);
                                const mer = (match[3] || '').toUpperCase();
                                if (mer === 'PM' && h < 12) h += 12;
                                if (mer === 'AM' && h === 12) h = 0;
                                return h * 60 + m;
                              }
                            }
                            return 600;
                          };

                          const slotMins = parseSlotMins(row.time_label, row.time_24 || row.time);
                          const isPastDateTime = (rawDateStr && rawDateStr < todayKey) || (rawDateStr === todayKey && slotMins <= currentMins);

                          let statusClass = 'upcoming';
                          let statusLabel = 'Upcoming';

                          if (rawStatus === 'completed') {
                            statusClass = 'completed';
                            statusLabel = 'Completed';
                          } else if (rawStatus === 'in_consultation' || rawStatus === 'in-progress') {
                            statusClass = 'in-progress';
                            statusLabel = 'In Progress';
                          } else if (rawStatus === 'cancelled' || isPastDateTime || rawStatus === 'missed' || rawStatus === 'expired' || rawStatus === 'not_consulted') {
                            statusClass = 'cancelled';
                            statusLabel = isPastDateTime ? 'Not Consulted (Missed)' : 'Cancelled';
                          } else {
                            statusClass = 'upcoming';
                            statusLabel = 'Upcoming';
                          }
                          const dotColor =
                            idx % 3 === 0 ? '#10b981' : idx % 3 === 1 ? '#2563eb' : '#7c3aed';

                          return (
                            <tr key={row.id || idx}>
                              <td>
                                <div className="admin-token-col">
                                  <div className="admin-token-dot" style={{ background: dotColor }} />
                                  <span>{tokenStr}</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>{patientName}</td>
                              <td>{docName}</td>
                              <td>{deptStr}</td>
                              {selectedDate === 'all' && (
                                <td style={{ fontWeight: 600, color: '#1e293b' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <Calendar size={13} color="#087d43" />
                                    <span>{formattedDate}</span>
                                  </div>
                                </td>
                              )}
                              <td>{timeStr}</td>
                              <td>
                                <span className={`admin-status-badge ${statusClass}`}>{statusLabel}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 2: MANAGE DOCTORS (EXACT PIXEL-PERFECT UI FROM SCREENSHOT 1) ── */}
        {activeTab === 'doctors' && (
          <div>
            {/* Header: Title + Add New Doctor Button */}
            <div className="doc-mgmt-header-row">
              <div>
                <h2 className="doc-mgmt-title">Manage Doctors</h2>
                <p className="doc-mgmt-sub">Add, view, edit or manage doctors and their portal access.</p>
              </div>

              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => setShowAddDoctorModal(true)}
              >
                <Plus size={16} />
                <span>Add New Doctor</span>
              </button>
            </div>

            {/* 4 Summary Metric Cards: Total Roster, Online Now, Attended Today, Not Logged In Today */}
            <div className="doc-metrics-grid">
              {/* Card 1: Total Hospital Doctors */}
              <div className="doc-metric-card" style={{ cursor: 'pointer' }} onClick={() => { setDutyFilter('all'); setDocPage(1); }}>
                <div className="doc-metric-icon-circle green">
                  <Users size={24} />
                </div>
                <div>
                  <div className="doc-metric-val">{docMetrics.total}</div>
                  <div className="doc-metric-label">Total Hospital Doctors</div>
                  <div className="doc-metric-subtext">{docMetrics.allopathy} Allopathy • {docMetrics.ayurveda} Ayurveda</div>
                </div>
              </div>

              {/* Card 2: Doctors Online Now (Live Session) */}
              <div className="doc-metric-card" style={{ cursor: 'pointer', border: dutyFilter === 'online' ? '2px solid #10b981' : undefined }} onClick={() => { setDutyFilter('online'); setDocPage(1); }}>
                <div className="doc-metric-icon-circle teal" style={{ background: '#ecfdf5', color: '#047857' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <div className="doc-metric-val" style={{ color: '#047857' }}>{docMetrics.onlineNow}</div>
                  <div className="doc-metric-label">🟢 Online Now (Live)</div>
                  <div className="doc-metric-subtext" style={{ color: '#059669', fontWeight: 600 }}>Active in consultation now</div>
                </div>
              </div>

              {/* Card 3: Attended Today's Shift */}
              <div className="doc-metric-card" style={{ cursor: 'pointer', border: dutyFilter === 'attended' ? '2px solid #3b82f6' : undefined }} onClick={() => { setDutyFilter('attended'); setDocPage(1); }}>
                <div className="doc-metric-icon-circle blue">
                  <UserCheck size={24} />
                </div>
                <div>
                  <div className="doc-metric-val" style={{ color: '#1d4ed8' }}>{docMetrics.attendedToday}</div>
                  <div className="doc-metric-label">🔵 Attended Today's Shift</div>
                  <div className="doc-metric-subtext">
                    {docMetrics.attendedToday > 0 
                      ? `${docMetrics.avgShiftCompletionPct}% avg shift fulfilled (${docMetrics.totalDutyHoursFormatted} on duty)`
                      : '0% daily roster attendance'}
                  </div>
                </div>
              </div>

              {/* Card 4: Not Logged In Today */}
              <div className="doc-metric-card" style={{ cursor: 'pointer', border: dutyFilter === 'not_logged_in' ? '2px solid #f59e0b' : undefined }} onClick={() => { setDutyFilter('not_logged_in'); setDocPage(1); }}>
                <div className="doc-metric-icon-circle orange" style={{ background: '#fffbeb', color: '#b45309' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div className="doc-metric-val" style={{ color: '#b45309' }}>{docMetrics.notLoggedInToday}</div>
                  <div className="doc-metric-label">⚪ Not Logged In Today</div>
                  <div className="doc-metric-subtext highlight" style={{ color: '#b45309' }}>Pending / absent today</div>
                </div>
              </div>
            </div>

            {/* Quick Attendance & Duty Status Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '0 0 1rem 0', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginRight: '4px' }}>Filter by Duty:</span>
              
              <button
                type="button"
                onClick={() => { setDutyFilter('all'); setDocPage(1); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: dutyFilter === 'all' ? '1.5px solid #087d43' : '1px solid #e2e8f0',
                  background: dutyFilter === 'all' ? '#eaf7f0' : '#ffffff',
                  color: dutyFilter === 'all' ? '#087d43' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>All Doctors</span>
                <span style={{ background: dutyFilter === 'all' ? '#087d43' : '#f1f5f9', color: dutyFilter === 'all' ? '#ffffff' : '#64748b', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{docMetrics.total}</span>
              </button>

              <button
                type="button"
                onClick={() => { setDutyFilter('online'); setDocPage(1); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: dutyFilter === 'online' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  background: dutyFilter === 'online' ? '#ecfdf5' : '#ffffff',
                  color: dutyFilter === 'online' ? '#047857' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2.5px rgba(16,185,129,0.25)' }} />
                <span>🟢 Online Now</span>
                <span style={{ background: dutyFilter === 'online' ? '#047857' : '#f1f5f9', color: dutyFilter === 'online' ? '#ffffff' : '#64748b', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{docMetrics.onlineNow}</span>
              </button>

              <button
                type="button"
                onClick={() => { setDutyFilter('attended'); setDocPage(1); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: dutyFilter === 'attended' ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                  background: dutyFilter === 'attended' ? '#eff6ff' : '#ffffff',
                  color: dutyFilter === 'attended' ? '#1d4ed8' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🔵 Attended Today</span>
                <span style={{ background: dutyFilter === 'attended' ? '#1d4ed8' : '#f1f5f9', color: dutyFilter === 'attended' ? '#ffffff' : '#64748b', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{docMetrics.attendedToday}</span>
              </button>

              <button
                type="button"
                onClick={() => { setDutyFilter('not_logged_in'); setDocPage(1); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: dutyFilter === 'not_logged_in' ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                  background: dutyFilter === 'not_logged_in' ? '#fffbeb' : '#ffffff',
                  color: dutyFilter === 'not_logged_in' ? '#b45309' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>⚪ Not Logged In Today</span>
                <span style={{ background: dutyFilter === 'not_logged_in' ? '#b45309' : '#f1f5f9', color: dutyFilter === 'not_logged_in' ? '#ffffff' : '#64748b', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{docMetrics.notLoggedInToday}</span>
              </button>
            </div>

            {/* Filter & Search Bar (Reset button removed as requested) */}
            <div className="doc-filter-bar">
              {/* Search Box */}
              <div className="doc-search-box">
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search by name, email or department..."
                  value={docSearch}
                  onChange={e => {
                    setDocSearch(e.target.value);
                    setDocPage(1);
                  }}
                />
              </div>

              {/* Department Dropdown */}
              <div className="doc-filter-group">
                <span className="doc-filter-label">Department</span>
                <select
                  className="doc-filter-select"
                  value={deptFilter}
                  onChange={e => {
                    setDeptFilter(e.target.value);
                    setDocPage(1);
                  }}
                >
                  <option value="All">All</option>
                  <option value="Allopathy">Allopathy</option>
                  <option value="Ayurveda">Ayurveda</option>
                </select>
              </div>

              {/* Specialization Dropdown */}
              <div className="doc-filter-group">
                <span className="doc-filter-label">Specialization</span>
                <select
                  className="doc-filter-select"
                  value={specFilter}
                  onChange={e => {
                    setSpecFilter(e.target.value);
                    setDocPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {specializationsList.map(spec => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Dropdown */}
              <div className="doc-filter-group">
                <span className="doc-filter-label">Status</span>
                <select
                  className="doc-filter-select"
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setDocPage(1);
                  }}
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Manage Doctors Table */}
            <div className="doc-table-card">
              <div className="doc-table-wrap">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th>Doctor Name</th>
                      <th>Department</th>
                      <th>Specialization</th>
                      <th>Professional ID</th>
                      <th>Duty Status</th>
                      <th>Last Activity / Shift</th>
                      <th style={{ textAlign: 'center', width: '80px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDoctors.length > 0 ? (
                      paginatedDoctors.map((doc, idx) => {
                        const rowNum = (docPage - 1) * docPageSize + idx + 1;
                        const initials = doc.name
                          ? doc.name
                              .replace(/^Dr\.\s*/i, '')
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : 'DR';

                        const deptClass =
                          doc.department?.toLowerCase() === 'ayurveda' ||
                          (doc.system === 'Ayurveda' || doc.speciality?.toLowerCase().includes('ayur'))
                            ? 'ayurveda'
                            : 'allopathy';
                        const deptLabel = deptClass === 'ayurveda' ? 'Ayurveda' : 'Allopathy';

                        const profEmail =
                          doc.email ||
                          doc.username ||
                          `dr${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@swasthyasetu.ac.in`;

                        const isMenuOpen = openMenuDocId === (doc.id || idx);

                        const docLoginInfo = getDoctorLoginState(doc, doctorLogins);
                        const dutyInfo = calculateDoctorDuty(docLoginInfo);

                        return (
                          <tr key={doc.id || idx}>
                            <td style={{ color: '#64748b', fontWeight: 600 }}>{rowNum}</td>
                            <td>
                              <div className="doc-name-cell">
                                {doc.avatar_url || doc.avatar || doc.image ? (
                                  <img
                                    src={doc.avatar_url || doc.avatar || doc.image}
                                    alt={doc.name}
                                    className="doc-avatar-photo"
                                  />
                                ) : (
                                  <div
                                    className={`doc-avatar-initials ${
                                      idx % 3 === 0 ? 'green' : idx % 3 === 1 ? 'blue' : 'purple'
                                    }`}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <div>
                                  <div className="doc-name-title">{doc.name}</div>
                                  <div className="doc-name-deg">{doc.degrees || 'MBBS, MD'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`doc-dept-pill ${deptClass}`}>{deptLabel}</span>
                            </td>
                            <td style={{ color: '#334155', fontWeight: 500 }}>
                              {doc.speciality || (deptClass === 'ayurveda' ? 'Ayurvedic Physician' : 'General Physician')}
                            </td>
                            <td>
                              <div className="doc-prof-id">
                                <span>{profEmail}</span>
                                <button
                                  type="button"
                                  className="doc-copy-btn"
                                  title="Copy Professional ID"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleCopyId(profEmail);
                                  }}
                                >
                                  {copiedId === profEmail ? (
                                    <Check size={13} color="#087d43" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td>
                              {(() => {
                                const todayKey = (() => {
                                  const d = new Date();
                                  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                })();
                                const cleanDocId = String(doc.id || doc.doctor_id || '').toLowerCase().trim();
                                const cleanDocName = String(doc.name || '').toLowerCase().replace(/^dr\.\s*|^dr\s*/i, '').trim();
                                const onLeaveToday = (doctorLeavesList || []).find(l => {
                                  if (l.date !== todayKey) return false;
                                  const lDocId = String(l.doctor_id || l.doctorId || '').toLowerCase().trim();
                                  const lDocName = String(l.doctor_name || l.doctorName || '').toLowerCase().replace(/^dr\.\s*|^dr\s*/i, '').trim();
                                  return lDocId === cleanDocId || lDocName === cleanDocName || cleanDocId.includes(lDocId) || (lDocId && cleanDocId.includes(lDocId));
                                });

                                if (onLeaveToday) {
                                  return (
                                    <span
                                      className="doc-status-badge"
                                      style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: '700' }}
                                      title={`On Leave: ${onLeaveToday.reason || 'Scheduled Holiday'}`}
                                    >
                                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#dc2626' }} />
                                      On Leave ({onLeaveToday.reason || 'Holiday'})
                                    </span>
                                  );
                                }

                                return (
                                  <span
                                    className={`doc-status-badge ${doc.is_active === false ? 'inactive' : dutyInfo.isOnline ? 'on-duty' : ''}`}
                                    style={
                                      doc.is_active === false
                                        ? { background: '#f1f5f9', color: '#64748b' }
                                        : dutyInfo.isOnline
                                        ? { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }
                                        : dutyInfo.attendedToday
                                        ? { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
                                        : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
                                    }
                                  >
                                    <span
                                      style={{
                                        width: '7px',
                                        height: '7px',
                                        borderRadius: '50%',
                                        background:
                                          doc.is_active === false
                                            ? '#94a3b8'
                                            : dutyInfo.isOnline
                                            ? '#10b981'
                                            : dutyInfo.attendedToday
                                            ? '#3b82f6'
                                            : '#cbd5e1',
                                        boxShadow: dutyInfo.isOnline ? '0 0 0 3px rgba(16,185,129,0.25)' : 'none'
                                      }}
                                    />
                                    {doc.is_active === false
                                      ? 'Deactivated'
                                      : dutyInfo.isOnline
                                      ? 'Online Now'
                                      : dutyInfo.attendedToday
                                      ? 'Shift Attended'
                                      : 'Not Logged In'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={{ fontSize: '12px', color: '#334155', minWidth: '240px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '700', 
                                    color: dutyInfo.isOnline ? '#047857' : dutyInfo.shiftCompletionPct >= 80 ? '#1d4ed8' : dutyInfo.attendedToday ? '#b45309' : '#64748b' 
                                  }}>
                                    {dutyInfo.shiftStatus}
                                  </span>
                                  {dutyInfo.attendedToday && (
                                    <span style={{ 
                                      fontSize: '10.5px', 
                                      fontWeight: '700', 
                                      padding: '1px 6px', 
                                      borderRadius: '10px',
                                      background: dutyInfo.shiftCompletionPct >= 80 ? '#dbeafe' : dutyInfo.isOnline ? '#d1fae5' : '#fef3c7',
                                      color: dutyInfo.shiftCompletionPct >= 80 ? '#1e40af' : dutyInfo.isOnline ? '#065f46' : '#92400e'
                                    }}>
                                      {dutyInfo.dutyHoursFormatted}
                                    </span>
                                  )}
                                  {dutyInfo.sessions && dutyInfo.sessions.length > 1 && (
                                    <span style={{ 
                                      fontSize: '10px', 
                                      fontWeight: '600', 
                                      padding: '1px 5px', 
                                      borderRadius: '8px',
                                      background: '#f1f5f9',
                                      color: '#475569'
                                    }}>
                                      {dutyInfo.sessions.length} sessions
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: '11.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                  <Clock size={12} color={dutyInfo.isOnline ? '#10b981' : '#64748b'} />
                                  <span style={{ fontWeight: 600 }}>{dutyInfo.timeRangeStr}</span>
                                </div>

                                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '500' }}>
                                  <span style={{ color: '#0f766e', fontWeight: '600' }}>OPD Slot Window:</span> {dutyInfo.shiftType}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="doc-actions-cell" style={{ justifyContent: 'center' }}>
                                <div className="doc-action-menu-wrap">
                                  <button
                                    type="button"
                                    className="doc-action-btn"
                                    title="Doctor Options"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setOpenMenuDocId(isMenuOpen ? null : (doc.id || idx));
                                    }}
                                  >
                                    <MoreVertical size={16} />
                                  </button>

                                  {isMenuOpen && (
                                    <div className="doc-action-menu-dropdown">
                                      <button
                                        type="button"
                                        className="doc-action-menu-item"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setManagingLeaveDoctor(doc);
                                          setOpenMenuDocId(null);
                                          setShowLeaveModal(true);
                                        }}
                                      >
                                        <Calendar size={14} color="#0284c7" />
                                        <span>Manage Leave</span>
                                      </button>

                                      <button
                                        type="button"
                                        className="doc-action-menu-item"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setEditingDoctor({
                                            id: doc.id,
                                            name: doc.name || '',
                                            dob: doc.dob || '',
                                            age: String(doc.age || ''),
                                            gender: doc.gender || '',
                                            phone: doc.phone || '',
                                            email: doc.email || '',
                                            system: doc.system || 'Allopathy',
                                            speciality: doc.speciality || '',
                                            degrees: doc.degrees || '',
                                            experience: String(doc.experience || ''),
                                            registrationNumber: doc.registrationNumber || doc.registration_number || '',
                                            avatar_url: doc.avatar_url || doc.avatar || doc.image || '',
                                            is_active: doc.is_active !== false,
                                          });
                                          setOpenMenuDocId(null);
                                          setShowEditDoctorModal(true);
                                        }}
                                      >
                                        <Edit3 size={14} color="#087d43" />
                                        <span>Edit Doctor Details</span>
                                      </button>

                                      <button
                                        type="button"
                                        className={`doc-action-menu-item ${doc.is_active !== false ? 'danger' : ''}`}
                                        onClick={e => {
                                          e.stopPropagation();
                                          handleToggleDoctorStatus(doc);
                                        }}
                                      >
                                        {doc.is_active !== false ? (
                                          <>
                                            <UserX size={14} />
                                            <span>Deactivate Access</span>
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck size={14} color="#16a34a" />
                                            <span>Activate Access</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                          <Users size={32} color="#087d43" style={{ marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                            No doctors match the selected search & filter criteria.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredDoctors.length > 0 && (
                <div className="doc-pagination-row">
                  <div className="doc-pagination-count">
                    Showing {(docPage - 1) * docPageSize + 1} to{' '}
                    {Math.min(docPage * docPageSize, filteredDoctors.length)} of {filteredDoctors.length} doctors
                  </div>

                  <div className="doc-pagination-controls">
                    <button
                      type="button"
                      className="doc-page-btn"
                      disabled={docPage === 1}
                      onClick={() => setDocPage(p => Math.max(1, p - 1))}
                    >
                      &lt;
                    </button>

                    {Array.from({ length: totalDocPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`doc-page-btn ${docPage === pageNum ? 'active' : ''}`}
                        onClick={() => setDocPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="doc-page-btn"
                      disabled={docPage === totalDocPages}
                      onClick={() => setDocPage(p => Math.min(totalDocPages, p + 1))}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom About Doctor Access Banner */}
            <div className="doc-access-banner">
              <div className="doc-access-left">
                <div style={{ color: '#2563eb', marginTop: '2px' }}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <div className="doc-access-title">About Doctor Access</div>
                  <p className="doc-access-text">
                    Admin sets the Professional ID and initial credentials for each doctor to access the Swasthya Setu portal.
                    Doctors can log in using these credentials to manage their availability and consultations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="doc-access-action-btn"
                onClick={() => setShowLoginHelpModal(true)}
              >
                <HelpCircle size={15} />
                <span>How Doctor Login Works</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: DONATIONS ── */}
        {activeTab === 'donations' && (
          <AdminDonationRequests
            staffId={session?.staff?.id || 'admin-root'}
            hospitalId={hospital.id}
            hospitalName={hospital.name}
            hospitalCity={hospital.city || 'Jaipur'}
          />
        )}

        {/* ── TAB 4: COMMUNITIES ── */}
        {activeTab === 'communities' && (
          <AdminCommunities staffId={session?.staff?.id || 'admin-root'} />
        )}

        {/* ── TAB 5: HELP & SUPPORT ── */}
        {activeTab === 'help' && (
          <AdminHelpSupportTab
            hospital={hospital}
            session={session}
          />
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
         MODAL 1: ADD NEW DOCTOR (EXACT PIXEL-PERFECT UI + AUTO AGE CALCULATION)
         ══════════════════════════════════════════════════════════════════════ */}
      {showAddDoctorModal && (
        <div
          className="admin-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowAddDoctorModal(false);
          }}
        >
          <div className="admin-modal-card admin-modal-card-lg">
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setShowAddDoctorModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="admin-modal-title">Add New Doctor</h2>
            <p className="admin-modal-desc">
              Enter doctor details and create portal access credentials.
            </p>

            <form onSubmit={handleAddDoctorSubmit} className="admin-modal-form">
              {/* Section 1: Personal Information */}
              <div className="doc-modal-section">
                <div className="doc-modal-section-title">
                  <UserCheck size={16} color="#087d43" />
                  <span>Personal Information</span>
                </div>

                {/* Doctor Photo / Image Upload Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'grid', placeItems: 'center', flexShrink: 0, border: '2px solid #cbd5e1' }}>
                    {newDoctor.avatar_url ? (
                      <img src={newDoctor.avatar_url} alt="Doctor Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} color="#64748b" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      Doctor Profile Photo (Optional)
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label className="doc-photo-upload-btn">
                        <Upload size={13} />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => {
                                setNewDoctor(prev => ({ ...prev, avatar_url: ev.target.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="Or paste photo image URL (https://...)"
                        className="admin-form-input"
                        style={{ flex: 1, minWidth: '180px', padding: '6px 10px', fontSize: '12px' }}
                        value={newDoctor.avatar_url}
                        onChange={e => setNewDoctor(prev => ({ ...prev, avatar_url: e.target.value }))}
                      />

                      {newDoctor.avatar_url && (
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => setNewDoctor(prev => ({ ...prev, avatar_url: '' }))}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 1: Full Name, DOB, Age (Auto-detected), Gender */}
                <div className="doc-form-row-4">
                  <div className="admin-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      className="admin-form-input"
                      value={newDoctor.name}
                      onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={newDoctor.dob}
                      onChange={e => {
                        const dobVal = e.target.value;
                        const detectedAge = calculateAgeFromDob(dobVal);
                        setNewDoctor(prev => ({
                          ...prev,
                          dob: dobVal,
                          age: detectedAge || prev.age,
                        }));
                      }}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Age *</label>
                    <input
                      type="number"
                      min="20"
                      max="95"
                      placeholder="Age"
                      className="admin-form-input"
                      value={newDoctor.age}
                      onChange={e => setNewDoctor({ ...newDoctor, age: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Gender *</label>
                    <select
                      className="admin-form-select"
                      value={newDoctor.gender}
                      onChange={e => setNewDoctor({ ...newDoctor, gender: e.target.value })}
                    >
                      <option value="">Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Mobile Number, Email Address */}
                <div className="doc-form-row-2">
                  <div className="admin-form-group">
                    <label>Mobile Number *</label>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <select
                        className="admin-form-select"
                        style={{ width: '75px', flexShrink: 0 }}
                        defaultValue="+91"
                      >
                        <option value="+91">+91</option>
                      </select>
                      <input
                        type="tel"
                        required
                        placeholder="Enter mobile number"
                        className="admin-form-input"
                        style={{ flex: 1 }}
                        value={newDoctor.phone}
                        onChange={e => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter email address"
                      className="admin-form-input"
                      value={newDoctor.email}
                      onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Information */}
              <div className="doc-modal-section">
                <div className="doc-modal-section-title">
                  <Stethoscope size={16} color="#087d43" />
                  <span>Professional Information</span>
                </div>

                <div className="doc-form-row-3">
                  <div className="admin-form-group">
                    <label>Department (Allopathy / Ayurveda) *</label>
                    <select
                      required
                      className="admin-form-select"
                      value={newDoctor.system}
                      onChange={e => setNewDoctor({ ...newDoctor, system: e.target.value })}
                    >
                      <option value="">Select department</option>
                      <option value="Allopathy">Allopathy</option>
                      <option value="Ayurveda">Ayurveda</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Specialization *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter specialization"
                      className="admin-form-input"
                      value={newDoctor.speciality}
                      onChange={e => setNewDoctor({ ...newDoctor, speciality: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Qualification *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MBBS, MD, BAMS"
                      className="admin-form-input"
                      value={newDoctor.degrees}
                      onChange={e => setNewDoctor({ ...newDoctor, degrees: e.target.value })}
                    />
                  </div>
                </div>

                <div className="doc-form-row-2">
                  <div className="admin-form-group">
                    <label>Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter years of experience"
                      className="admin-form-input"
                      value={newDoctor.experience}
                      onChange={e => setNewDoctor({ ...newDoctor, experience: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Registration Number</label>
                    <input
                      type="text"
                      placeholder="Enter registration number"
                      className="admin-form-input"
                      value={newDoctor.registrationNumber}
                      onChange={e => setNewDoctor({ ...newDoctor, registrationNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Portal Access Credentials */}
              <div className="doc-modal-section">
                <div className="doc-modal-section-title">
                  <ShieldCheck size={16} color="#087d43" />
                  <span>Portal Access Credentials</span>
                </div>
                <p className="doc-modal-section-sub">
                  These credentials will be used by the doctor to log in the Swasthya Setu portal.
                </p>

                <div className="doc-form-row-2" style={{ marginBottom: '12px' }}>
                  <div className="admin-form-group">
                    <label>Professional ID (Email) *</label>
                    <div className="doc-field-prefix-wrap">
                      <span className="doc-field-prefix">dr.</span>
                      <input
                        type="text"
                        required
                        placeholder="Enter unique ID"
                        value={newDoctor.professionalId}
                        onChange={e => setNewDoctor({ ...newDoctor, professionalId: e.target.value })}
                      />
                      <span className="doc-field-suffix">@swasthyasetu.ac.in</span>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter password"
                        className="admin-form-input"
                        style={{ width: '100%', paddingRight: '36px' }}
                        value={newDoctor.password}
                        onChange={e => setNewDoctor({ ...newDoctor, password: e.target.value })}
                      />
                      <button
                        type="button"
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <AlertCircle size={15} /> : <Check size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="doc-form-row-2">
                  <div className="admin-form-group">
                    <label>Confirm Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm password"
                        className="admin-form-input"
                        style={{ width: '100%', paddingRight: '36px' }}
                        value={newDoctor.confirmPassword}
                        onChange={e => setNewDoctor({ ...newDoctor, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <AlertCircle size={15} /> : <Check size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Password requirement checklist box */}
                  <div className="doc-pw-rules-box">
                    <div>Password must contain:</div>
                    <div className="doc-pw-rules-grid">
                      <div className={`doc-pw-rule-item ${newDoctor.password.length >= 8 ? 'valid' : ''}`}>
                        <span>○</span> At least 8 characters
                      </div>
                      <div className={`doc-pw-rule-item ${/\d/.test(newDoctor.password) ? 'valid' : ''}`}>
                        <span>○</span> One number
                      </div>
                      <div className={`doc-pw-rule-item ${/[A-Z]/.test(newDoctor.password) ? 'valid' : ''}`}>
                        <span>○</span> One uppercase letter
                      </div>
                      <div className={`doc-pw-rule-item ${/[!@#$%^&*]/.test(newDoctor.password) ? 'valid' : ''}`}>
                        <span>○</span> One special character
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowAddDoctorModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  <Plus size={16} />
                  <span>Add Doctor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         MODAL 2: EDIT DOCTOR DETAILS (NO PASSWORD EDITING BY ADMIN)
         ══════════════════════════════════════════════════════════════════════ */}
      {showEditDoctorModal && (
        <div
          className="admin-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowEditDoctorModal(false);
          }}
        >
          <div className="admin-modal-card admin-modal-card-lg">
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setShowEditDoctorModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="admin-modal-title">Edit Doctor Details</h2>
            <p className="admin-modal-desc">
              Update doctor profile and clinical specifications.
            </p>

            {/* Note: Admin cannot view or edit doctor passwords */}
            <div className="doc-security-note">
              <Lock size={16} color="#854d0e" />
              <span>
                <b>Security & Privacy Note:</b> Doctor portal passwords are confidential and cannot be viewed or edited by administrators. Doctors manage their passwords independently.
              </span>
            </div>

            <form onSubmit={handleEditDoctorSubmit} className="admin-modal-form">
              {/* Section 1: Personal Information */}
              <div className="doc-modal-section">
                <div className="doc-modal-section-title">
                  <UserCheck size={16} color="#087d43" />
                  <span>Personal Information</span>
                </div>

                {/* Doctor Photo / Image Upload Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'grid', placeItems: 'center', flexShrink: 0, border: '2px solid #cbd5e1' }}>
                    {editingDoctor.avatar_url ? (
                      <img src={editingDoctor.avatar_url} alt="Doctor Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} color="#64748b" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      Doctor Profile Photo (Optional)
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label className="doc-photo-upload-btn">
                        <Upload size={13} />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => {
                                setEditingDoctor(prev => ({ ...prev, avatar_url: ev.target.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="Or paste photo image URL (https://...)"
                        className="admin-form-input"
                        style={{ flex: 1, minWidth: '180px', padding: '6px 10px', fontSize: '12px' }}
                        value={editingDoctor.avatar_url}
                        onChange={e => setEditingDoctor(prev => ({ ...prev, avatar_url: e.target.value }))}
                      />

                      {editingDoctor.avatar_url && (
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => setEditingDoctor(prev => ({ ...prev, avatar_url: '' }))}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="doc-form-row-4">
                  <div className="admin-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Doctor name"
                      className="admin-form-input"
                      value={editingDoctor.name}
                      onChange={e => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={editingDoctor.dob}
                      onChange={e => {
                        const dobVal = e.target.value;
                        const detectedAge = calculateAgeFromDob(dobVal);
                        setEditingDoctor(prev => ({
                          ...prev,
                          dob: dobVal,
                          age: detectedAge || prev.age,
                        }));
                      }}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      min="20"
                      max="95"
                      placeholder="Age"
                      className="admin-form-input"
                      value={editingDoctor.age}
                      onChange={e => setEditingDoctor({ ...editingDoctor, age: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Gender</label>
                    <select
                      className="admin-form-select"
                      value={editingDoctor.gender}
                      onChange={e => setEditingDoctor({ ...editingDoctor, gender: e.target.value })}
                    >
                      <option value="">Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="doc-form-row-2">
                  <div className="admin-form-group">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="Mobile number"
                      className="admin-form-input"
                      value={editingDoctor.phone}
                      onChange={e => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Email address"
                      className="admin-form-input"
                      value={editingDoctor.email}
                      onChange={e => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Information */}
              <div className="doc-modal-section">
                <div className="doc-modal-section-title">
                  <Stethoscope size={16} color="#087d43" />
                  <span>Professional Information</span>
                </div>

                <div className="doc-form-row-3">
                  <div className="admin-form-group">
                    <label>Department</label>
                    <select
                      className="admin-form-select"
                      value={editingDoctor.system}
                      onChange={e => setEditingDoctor({ ...editingDoctor, system: e.target.value })}
                    >
                      <option value="Allopathy">Allopathy</option>
                      <option value="Ayurveda">Ayurveda</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Specialization</label>
                    <input
                      type="text"
                      placeholder="Specialization"
                      className="admin-form-input"
                      value={editingDoctor.speciality}
                      onChange={e => setEditingDoctor({ ...editingDoctor, speciality: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Qualification</label>
                    <input
                      type="text"
                      placeholder="Qualifications"
                      className="admin-form-input"
                      value={editingDoctor.degrees}
                      onChange={e => setEditingDoctor({ ...editingDoctor, degrees: e.target.value })}
                    />
                  </div>
                </div>

                <div className="doc-form-row-2">
                  <div className="admin-form-group">
                    <label>Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Experience in years"
                      className="admin-form-input"
                      value={editingDoctor.experience}
                      onChange={e => setEditingDoctor({ ...editingDoctor, experience: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Registration Number</label>
                    <input
                      type="text"
                      placeholder="Registration Number"
                      className="admin-form-input"
                      value={editingDoctor.registrationNumber}
                      onChange={e => setEditingDoctor({ ...editingDoctor, registrationNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowEditDoctorModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         MODAL 2B: MANAGE DOCTOR LEAVE / HOLIDAY
         ══════════════════════════════════════════════════════════════════════ */}
      {showLeaveModal && managingLeaveDoctor && (
        <div
          className="admin-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowLeaveModal(false);
          }}
        >
          <div className="admin-modal-card admin-modal-card-lg" style={{ maxWidth: '620px' }}>
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setShowLeaveModal(false)}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: '#e0f2fe', color: '#0284c7', display: 'grid', placeItems: 'center'
              }}>
                <Calendar size={22} />
              </div>
              <div>
                <h2 className="admin-modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                  Manage Leave & Holiday Roster
                </h2>
                <p className="admin-modal-desc" style={{ margin: '2px 0 0 0' }}>
                  Dr. {managingLeaveDoctor.name?.replace(/^dr\.\s*|^dr\s*/i, '')} • {managingLeaveDoctor.speciality || 'General Medicine'}
                </p>
              </div>
            </div>

            {/* Explanatory banner */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12.5px',
              color: '#0369a1',
              margin: '12px 0 18px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={16} color="#0284c7" style={{ flexShrink: 0 }} />
              <span>
                When a doctor is on leave, their appointment slots in the <b>Patient Dashboard</b> automatically become blocked and unclickable with a holiday notice.
              </span>
            </div>

            {/* Schedule New Leave Form */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} color="#0284c7" />
                <span>Schedule New Doctor Leave</span>
              </div>

              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!newLeaveDate) return;
                  const res = await db.doctorLeaves.setLeave({
                    doctorId: managingLeaveDoctor.id || managingLeaveDoctor.doctor_id,
                    doctorName: managingLeaveDoctor.name,
                    hospitalId: managingLeaveDoctor.hospital_id || hospital?.id,
                    hospitalName: managingLeaveDoctor.hospitalName || managingLeaveDoctor.hospital_name || hospital?.name,
                    date: newLeaveDate,
                    reason: newLeaveReason,
                    notes: newLeaveNotes,
                  });
                  if (res.error) {
                    alert('Error scheduling leave: ' + (res.error.message || res.error));
                    return;
                  }
                  const { data: updated } = await db.doctorLeaves.getAll();
                  setDoctorLeavesList(updated || []);
                  setNewLeaveNotes('');
                  alert(`Leave scheduled for Dr. ${managingLeaveDoctor.name} on ${newLeaveDate}. Slots are now blocked for patients.`);
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Leave Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()}
                    value={newLeaveDate}
                    onChange={e => setNewLeaveDate(e.target.value)}
                    className="admin-form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                    Select Leave Reason *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px' }}>
                    {[
                      { val: 'Annual Leave', label: 'Annual Leave', icon: '🏖️' },
                      { val: 'Sick / Medical Leave', label: 'Medical Leave', icon: '💊' },
                      { val: 'Academic Conference', label: 'Conference', icon: '🎓' },
                      { val: 'Official Hospital Holiday', label: 'Hospital Off', icon: '🏛️' },
                      { val: 'Personal Emergency', label: 'Emergency', icon: '🚨' }
                    ].map(r => {
                      const isSel = newLeaveReason === r.val;
                      return (
                        <button
                          key={r.val}
                          type="button"
                          onClick={() => setNewLeaveReason(r.val)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: isSel ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: isSel ? '#eff6ff' : '#ffffff',
                            color: isSel ? '#0369a1' : '#334155',
                            fontWeight: isSel ? '800' : '600',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            boxShadow: isSel ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>{r.icon}</span>
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
                          {isSel && <Check size={13} color="#0284c7" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Remarks / Public Notice (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Attending National Pulmonology Symposium"
                    value={newLeaveNotes}
                    onChange={e => setNewLeaveNotes(e.target.value)}
                    className="admin-form-input"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="admin-btn-primary"
                  style={{ width: '100%', padding: '9px', fontSize: '13px', justifyContent: 'center' }}
                >
                  <Calendar size={15} />
                  <span>Confirm & Block Patient Slots for Date</span>
                </button>
              </form>
            </div>

            {/* List of active leaves for this doctor */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                Scheduled Leaves for Dr. {managingLeaveDoctor.name?.replace(/^dr\.\s*|^dr\s*/i, '')}
              </div>

              {(() => {
                const cleanDocId = String(managingLeaveDoctor.id || managingLeaveDoctor.doctor_id || '').toLowerCase().trim();
                const cleanDocName = String(managingLeaveDoctor.name || '').toLowerCase().replace(/^dr\.\s*|^dr\s*/i, '').trim();
                const docLeaves = (doctorLeavesList || []).filter(l => {
                  const lDocId = String(l.doctor_id || l.doctorId || '').toLowerCase().trim();
                  const lDocName = String(l.doctor_name || l.doctorName || '').toLowerCase().replace(/^dr\.\s*|^dr\s*/i, '').trim();
                  return lDocId === cleanDocId || lDocName === cleanDocName || cleanDocId.includes(lDocId) || (lDocId && cleanDocId.includes(lDocId));
                });

                if (docLeaves.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '12.5px' }}>
                      No upcoming leaves scheduled. Doctor is on full active duty.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {docLeaves.map(leave => (
                      <div
                        key={leave.id || leave.date}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '12.5px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{leave.date}</span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '8px',
                            background: '#fee2e2',
                            color: '#991b1b'
                          }}>
                            {leave.reason || 'Leave'}
                          </span>
                          {leave.notes && (
                            <span style={{ color: '#64748b', fontSize: '11.5px' }}>— {leave.notes}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Cancel leave for ${leave.date} and unlock slots?`)) return;
                            await db.doctorLeaves.cancelLeave(leave.id, leave.doctor_id, leave.date);
                            const { data: updated } = await db.doctorLeaves.getAll();
                            setDoctorLeavesList(updated || []);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Revoke Leave & Reopen Slots"
                        >
                          <Trash2 size={13} />
                          <span>Cancel Leave</span>
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="admin-modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setShowLeaveModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: How Doctor Login Works ── */}
      {showLoginHelpModal && (
        <div
          className="admin-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowLoginHelpModal(false);
          }}
        >
          <div className="admin-modal-card">
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setShowLoginHelpModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="admin-modal-title">How Doctor Login Works</h2>
            <p className="admin-modal-desc">
              Overview of physician credentials and secure portal onboarding.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7', color: '#166534', fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>1</div>
                <div>
                  <b>Administrator Onboards Physician</b>
                  <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px' }}>Admin registers the doctor with their Department, Specialization, and generates their unique Professional ID (e.g. <code>dr.ananya@swasthyasetu.ac.in</code>).</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>2</div>
                <div>
                  <b>Doctor Signs in to Physician Portal</b>
                  <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px' }}>Doctor navigates to the Physician Portal login page, inputs their professional ID or username, and logs in securely.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f3e8ff', color: '#7e22ce', fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>3</div>
                <div>
                  <b>Live Queue & Smart AYUSH Integration</b>
                  <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px' }}>Once authenticated, the doctor has instant access to today's patient queue, AI pre-consultation summaries, slot management, and AYUSH cross-consultations.</p>
                </div>
              </div>
            </div>

            <div className="admin-modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => setShowLoginHelpModal(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 4: Add Announcement ── */}
      {showAnnouncementModal && (
        <div
          className="admin-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowAnnouncementModal(false);
          }}
        >
          <div className="admin-modal-card">
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setShowAnnouncementModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="admin-modal-title">Publish Hospital Announcement</h2>
            <p className="admin-modal-desc">
              Broadcast critical notices to patient queues and physician triage boards.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                alert('Announcement published successfully to hospital kiosk & portals!');
                setShowAnnouncementModal(false);
              }}
              className="admin-modal-form"
            >
              <div className="admin-form-group">
                <label>Announcement Type</label>
                <select
                  className="admin-form-select"
                  value={announcementType}
                  onChange={e => setAnnouncementType(e.target.value)}
                >
                  <option value="General Notice">General Notice</option>
                  <option value="Emergency Alert">Emergency / Triage Alert</option>
                  <option value="OPD Schedule Update">OPD Schedule Update</option>
                  <option value="Health Camp">Free Community Health Camp</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Announcement Message</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Write the announcement description..."
                  className="admin-form-textarea"
                  value={announcementText}
                  onChange={e => setAnnouncementText(e.target.value)}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowAnnouncementModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  <Megaphone size={16} /> Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 5: Manage Banners ── */}
      {showBannersModal && (
        <div
          className="admin-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowBannersModal(false);
          }}
        >
          <div className="admin-modal-card">
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setShowBannersModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="admin-modal-title">Manage Hospital Banners</h2>
            <p className="admin-modal-desc">
              Configure promotional and public health awareness banners for portals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <img
                  src="/doctor_team_community.jpg"
                  alt=""
                  style={{ width: '60px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: '12.5px', color: '#0f172a' }}>Doctor Team & Community Banner</b>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Active on Doctor Portal</div>
                </div>
                <span className="admin-status-badge completed">Active</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <img
                  src="/community_hero_mental.jpg"
                  alt=""
                  style={{ width: '60px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: '12.5px', color: '#0f172a' }}>Mental Health & Wellness Hero</b>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Active on Patient Portal</div>
                </div>
                <span className="admin-status-badge completed">Active</span>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setShowBannersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
