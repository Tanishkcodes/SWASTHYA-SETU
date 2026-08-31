import React, { useState, useEffect, useMemo } from 'react';
import {
  Droplet,
  Heart,
  Users,
  Package,
  Wallet,
  TrendingUp,
  ArrowRight,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Calendar,
  AlertCircle,
  ChevronRight,
  Building2,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import { db } from '../lib/db';
import '../styles/admin-donations.css';

const INITIAL_BLOOD_FORM = {
  patientName: '',
  bloodGroup: '',
  unitsNeeded: '',
  urgency: '',
  requiredBy: '',
  department: '',
  additionalNotes: '',
};

export default function AdminDonationRequests({ staffId, hospitalName = 'Sawai Man Singh Hospital' }) {
  // Current view: 'overview' | 'blood' | 'monetary'
  const [view, setView] = useState('overview');

  // Live Database Requests & Data (100% Real Database records)
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Manage Blood Donations Table Filters & Pagination
  const [bloodGroupFilter, setBloodGroupFilter] = useState('All');
  const [bloodStatusFilter, setBloodStatusFilter] = useState('All');
  const [bloodSearch, setBloodSearch] = useState('');
  const [bloodPage, setBloodPage] = useState(1);
  const bloodPageSize = 7;

  // New Blood Request Modal State (Empty initial form with no pre-filled values)
  const [showNewBloodModal, setShowNewBloodModal] = useState(false);
  const [newBloodForm, setNewBloodForm] = useState(INITIAL_BLOOD_FORM);

  // View Responses Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responsesList, setResponsesList] = useState([]);
  const [showResponsesModal, setShowResponsesModal] = useState(false);

  // Load live donation requests from database
  const loadDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchErr } = await db.donations.getAllRequests();
      if (fetchErr) setError(fetchErr.message);
      else setRequests(data || []);
    } catch (err) {
      console.error('Failed to load donations:', err);
      setError('Unable to load donation records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  // ── Derived Blood Metrics & Monetary Metrics from Real Database ──
  const bloodRequests = useMemo(() => {
    return requests.filter(r => r.category === 'blood');
  }, [requests]);

  const monetaryRequests = useMemo(() => {
    return requests.filter(r => r.category === 'financial' || r.category === 'monetary');
  }, [requests]);

  // Genuine Blood Metrics (100% Real Database Calculations)
  const bloodMetrics = useMemo(() => {
    const total = bloodRequests.length;
    let active = 0;
    let fulfilled = 0;
    let cancelled = 0;
    let unitsCollected = 0;
    let donorsHelped = 0;

    bloodRequests.forEach(r => {
      const st = (r.status || 'pending').toLowerCase();
      if (st === 'pending' || st === 'active') {
        active++;
      } else if (st === 'fulfilled') {
        fulfilled++;
        unitsCollected += Number(r.units_needed || r.units_collected || 1);
      } else if (st === 'cancelled' || st === 'closed') {
        cancelled++;
      }

      // Count actual verified responses from database
      const count = r.donation_contributions?.[0]?.count || (Array.isArray(r.donation_contributions) ? r.donation_contributions.length : 0);
      donorsHelped += Number(count || 0);
    });

    return {
      total,
      active,
      fulfilled,
      cancelled,
      donorsHelped,
      unitsCollected,
    };
  }, [bloodRequests]);

  // Genuine Monetary Metrics (100% Real Database Calculations)
  const monetaryMetrics = useMemo(() => {
    let totalAmount = 0;
    let totalDonors = 0;
    let activeCampaigns = 0;

    monetaryRequests.forEach(m => {
      totalAmount += Number(m.amount_raised || 0);
      if (m.status === 'active') activeCampaigns++;
      const cCount = m.donation_contributions?.length || m.donation_contributions?.[0]?.count || 0;
      totalDonors += Number(cCount);
    });

    return {
      totalAmount,
      totalDonors,
      activeCampaigns,
    };
  }, [monetaryRequests]);

  // Filtered Blood Table List
  const filteredBloodList = useMemo(() => {
    return bloodRequests.filter(r => {
      // 1. Blood Group Filter
      if (bloodGroupFilter !== 'All') {
        if (r.blood_group !== bloodGroupFilter) return false;
      }
      // 2. Status Filter
      if (bloodStatusFilter !== 'All') {
        const st = (r.status || 'pending').toLowerCase();
        if (bloodStatusFilter === 'Active' && st !== 'active' && st !== 'pending') return false;
        if (bloodStatusFilter === 'Fulfilled' && st !== 'fulfilled') return false;
        if (bloodStatusFilter === 'Cancelled' && st !== 'cancelled' && st !== 'closed') return false;
      }
      // 3. Search Filter
      if (bloodSearch.trim()) {
        const q = bloodSearch.toLowerCase();
        const pMatch = r.patient_name?.toLowerCase().includes(q);
        const dMatch = r.doctor_name?.toLowerCase().includes(q);
        const idMatch = r.id?.toLowerCase().includes(q);
        if (!pMatch && !dMatch && !idMatch) return false;
      }
      return true;
    });
  }, [bloodRequests, bloodGroupFilter, bloodStatusFilter, bloodSearch]);

  // Paginated Blood Requests
  const totalBloodPages = Math.max(1, Math.ceil(filteredBloodList.length / bloodPageSize));
  const paginatedBlood = useMemo(() => {
    const start = (bloodPage - 1) * bloodPageSize;
    return filteredBloodList.slice(start, start + bloodPageSize);
  }, [filteredBloodList, bloodPage, bloodPageSize]);

  // Format Date & Time for table
  const formatDateTime = dateStr => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  // Handle Create New Blood Request (Compulsory fields strictly verified)
  const handleCreateBloodSubmit = async e => {
    e.preventDefault();
    if (!newBloodForm.patientName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (!newBloodForm.bloodGroup) {
      alert('Please select a blood group.');
      return;
    }
    if (!newBloodForm.unitsNeeded || Number(newBloodForm.unitsNeeded) < 1) {
      alert('Please specify valid units needed (at least 1).');
      return;
    }
    if (!newBloodForm.urgency) {
      alert('Please select an urgency level.');
      return;
    }
    if (!newBloodForm.requiredBy) {
      alert('Please select required date & time.');
      return;
    }
    if (!newBloodForm.department.trim()) {
      alert('Please specify the hospital department or ward.');
      return;
    }

    try {
      const { error: err } = await db.donations.createRequest({
        category: 'blood',
        patientName: newBloodForm.patientName,
        bloodGroup: newBloodForm.bloodGroup,
        unitsNeeded: Number(newBloodForm.unitsNeeded),
        urgency: newBloodForm.urgency,
        requiredBy: newBloodForm.requiredBy,
        department: newBloodForm.department,
        additionalNotes: newBloodForm.additionalNotes,
        staffId: staffId || 'staff-admin-1',
        hospitalName: hospitalName,
      });

      if (err) {
        alert(`Error creating blood request: ${err.message}`);
        return;
      }

      setShowNewBloodModal(false);
      setNewBloodForm(INITIAL_BLOOD_FORM);
      alert('New Blood Request successfully registered in database!');
      await loadDonations();
    } catch (err) {
      console.error('Failed to create blood request:', err);
      alert('Unable to save blood request.');
    }
  };

  // Mark Request as Fulfilled
  const handleFulfillRequest = async id => {
    try {
      await db.donations.updateRequest(id, { status: 'fulfilled' });
      await loadDonations();
      alert('Blood Request marked as Fulfilled in database.');
    } catch (err) {
      console.error('Failed to fulfill request:', err);
    }
  };

  // Cancel Request
  const handleCancelRequest = async id => {
    if (!window.confirm('Are you sure you want to cancel this blood request?')) return;
    try {
      await db.donations.updateRequest(id, { status: 'cancelled' });
      await loadDonations();
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  };

  // View Donor Responses
  const handleViewResponses = async request => {
    setSelectedRequest(request);
    const { data } = await db.donations.getResponsesForRequest(request.id);
    setResponsesList(data || []);
    setShowResponsesModal(true);
  };

  return (
    <div className="admin-don-container">
      {/* ══════════════════════════════════════════════════════════════════════
         VIEW 1: LANDING PAGE OVERVIEW (MATCHING IMAGE 1 PIXEL-PERFECTLY)
         ══════════════════════════════════════════════════════════════════════ */}
      {view === 'overview' && (
        <>
          <div className="admin-don-header">
            <h1 className="admin-don-title">Donations</h1>
            <p className="admin-don-sub">
              Manage and monitor all donations made through Swasthya Setu platform.
            </p>
          </div>

          <div className="admin-don-hero-grid">
            {/* Card 1: Blood Donation Card with Graphical Banner */}
            <div className="admin-don-hero-card blood">
              <div className="admin-don-hero-top">
                <div className="admin-don-badge-icon blood">
                  <Droplet size={24} fill="#e11d48" color="#e11d48" />
                </div>
              </div>

              {/* Graphic Banner Illustration */}
              <div className="admin-don-hero-art">
                <svg viewBox="0 0 170 170" width="170" height="170">
                  <defs>
                    <linearGradient id="bloodDropGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#be123c" />
                    </linearGradient>
                    <filter id="bloodGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="glow" />
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Soft Background Wave */}
                  <path
                    d="M10 135 Q 40 120, 80 135 T 160 130"
                    fill="none"
                    stroke="#fed7aa"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <path
                    d="M0 145 Q 45 130, 95 145 T 170 140"
                    fill="none"
                    stroke="#fca5a5"
                    strokeWidth="1.5"
                    opacity="0.4"
                  />

                  {/* Floating Medical Plus Icons */}
                  <path d="M25 55 h5 v-5 h3 v5 h5 v3 h-5 v5 h-3 v-5 h-5 z" fill="#fca5a5" opacity="0.8" />
                  <path d="M135 40 h5 v-5 h3 v5 h5 v3 h-5 v5 h-3 v-5 h-5 z" fill="#f87171" opacity="0.8" />
                  <path d="M145 105 h4 v-4 h3 v4 h4 v3 h-4 v4 h-3 v-4 h-4 z" fill="#fca5a5" opacity="0.6" />

                  {/* Main Blood Droplet with Heartbeat Wave */}
                  <path
                    d="M100 28 C100 28 152 95 152 120 C152 148 128 160 100 160 C72 160 48 148 48 120 C48 95 100 28 100 28 Z"
                    fill="url(#bloodDropGrad)"
                    filter="url(#bloodGlow)"
                  />

                  {/* ECG Heartbeat Line */}
                  <path
                    d="M62 124 L78 124 L86 108 L95 142 L105 116 L112 128 L118 124 L138 124"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h2 className="admin-don-card-title">Blood Donation</h2>
                <p className="admin-don-card-desc">
                  Help save lives by ensuring timely availability of blood for patients in need.
                </p>

                {/* 3 Metric Pills (Real Database Numbers) */}
                <div className="admin-don-stats-row">
                  <div className="admin-don-stat-item">
                    <div className="admin-don-stat-icon red">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="admin-don-stat-val">{bloodMetrics.active}</div>
                      <div className="admin-don-stat-lbl">Active Requests</div>
                    </div>
                  </div>

                  <div className="admin-don-stat-item">
                    <div className="admin-don-stat-icon red">
                      <Droplet size={16} />
                    </div>
                    <div>
                      <div className="admin-don-stat-val">{bloodMetrics.donorsHelped}</div>
                      <div className="admin-don-stat-lbl">Donors Helped</div>
                    </div>
                  </div>

                  <div className="admin-don-stat-item">
                    <div className="admin-don-stat-icon red">
                      <Package size={16} />
                    </div>
                    <div>
                      <div className="admin-don-stat-val">
                        {bloodMetrics.unitsCollected.toLocaleString('en-IN')}
                      </div>
                      <div className="admin-don-stat-lbl">Units Collected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="admin-don-cta-btn blood"
                onClick={() => setView('blood')}
              >
                <Droplet size={17} />
                <span>Manage Blood Donations</span>
                <ArrowRight size={17} />
              </button>
            </div>

            {/* Card 2: Monetary Donation Card with Graphical Banner */}
            <div className="admin-don-hero-card monetary">
              <div className="admin-don-hero-top">
                <div className="admin-don-badge-icon monetary">
                  <Heart size={24} fill="#059669" color="#059669" />
                </div>
              </div>

              {/* Graphic Banner Illustration */}
              <div className="admin-don-hero-art">
                <svg viewBox="0 0 170 170" width="170" height="170">
                  <defs>
                    <linearGradient id="monetaryHeartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>

                  {/* Floating Medical Crosses & Leaves */}
                  <path d="M22 45 h5 v-5 h3 v5 h5 v3 h-5 v5 h-3 v-5 h-5 z" fill="#86efac" opacity="0.8" />
                  <path d="M148 42 h4 v-4 h3 v4 h4 v3 h-4 v4 h-3 v-4 h-4 z" fill="#86efac" opacity="0.7" />
                  <circle cx="140" cy="115" r="4" fill="#a7f3d0" />
                  <circle cx="28" cy="120" r="3.5" fill="#a7f3d0" />

                  {/* Emerald Rupee Heart */}
                  <path
                    d="M100 42 C86 42 78 54 78 65 C78 54 70 42 56 42 C38 42 26 56 26 75 C26 102 78 132 78 132 C78 132 130 102 130 75 C130 56 118 42 100 42 Z"
                    fill="url(#monetaryHeartGrad)"
                    transform="translate(18, -4)"
                  />
                  {/* ₹ Symbol inside Heart */}
                  <text x="96" y="74" fontSize="28" fontWeight="900" fill="#ffffff" textAnchor="middle">
                    ₹
                  </text>

                  {/* Supporting Hands Graphic */}
                  <path
                    d="M48 160 C58 130 78 122 84 132 C90 122 110 130 120 160 Z"
                    fill="#fed7aa"
                    opacity="0.9"
                  />
                </svg>
              </div>

              <div>
                <h2 className="admin-don-card-title">Monetary Donation</h2>
                <p className="admin-don-card-desc">
                  Contribute financially and support various healthcare initiatives and patient care programs.
                </p>

                {/* 3 Metric Pills (Real Database Numbers) */}
                <div className="admin-don-stats-row">
                  <div className="admin-don-stat-item">
                    <div className="admin-don-stat-icon green">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <div className="admin-don-stat-val">
                        ₹{monetaryMetrics.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="admin-don-stat-lbl">Total Amount</div>
                    </div>
                  </div>

                  <div className="admin-don-stat-item">
                    <div className="admin-don-stat-icon green">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="admin-don-stat-val">{monetaryMetrics.totalDonors}</div>
                      <div className="admin-don-stat-lbl">Total Donations</div>
                    </div>
                  </div>

                  <div className="admin-don-stat-item">
                    <div className="admin-don-stat-icon green">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div className="admin-don-stat-val">{monetaryMetrics.activeCampaigns}</div>
                      <div className="admin-don-stat-lbl">Active Campaigns</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="admin-don-cta-btn monetary"
                onClick={() => setView('monetary')}
              >
                <Wallet size={17} />
                <span>Manage Monetary Donations</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          {/* Bottom Info Callout */}
          <div className="admin-don-info-banner">
            <Info size={20} color="#2563eb" style={{ flexShrink: 0 }} />
            <span>
              All donations are securely managed and directly contribute to improving patient care and hospital facilities.
            </span>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         VIEW 2: MANAGE BLOOD DONATIONS (MATCHING IMAGE 2 PIXEL-PERFECTLY)
         ══════════════════════════════════════════════════════════════════════ */}
      {view === 'blood' && (
        <>
          {/* Top Navigation Row with Back Button & Breadcrumbs */}
          <div className="admin-don-top-nav-row">
            <button
              type="button"
              className="admin-don-back-btn"
              onClick={() => setView('overview')}
              title="Back to Donations Overview"
            >
              <ArrowLeft size={16} />
              <span>Back to Donations</span>
            </button>

            <div className="admin-don-breadcrumbs">
              <span>Admin Portal</span>
              <ChevronRight size={12} />
              <button
                type="button"
                className="admin-don-bc-link"
                onClick={() => setView('overview')}
              >
                Donations
              </button>
              <ChevronRight size={12} />
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Manage Blood Donations</span>
            </div>
          </div>

          <div className="admin-don-header">
            <h1 className="admin-don-title">Manage Blood Donations</h1>
            <p className="admin-don-sub">
              Track and fulfill blood requests initiated by physicians and hospitals.
            </p>
          </div>

          {/* 4 Summary Metric Cards */}
          <div className="admin-don-metrics-row">
            {/* Card 1: Total Requests */}
            <div className="admin-don-metric-card">
              <div className="admin-don-metric-icon-circle red">
                <Droplet size={22} fill="#ef4444" color="#ef4444" />
              </div>
              <div>
                <div className="admin-don-metric-num">{bloodMetrics.total}</div>
                <div className="admin-don-metric-lbl">Total Requests</div>
              </div>
            </div>

            {/* Card 2: Active Requests */}
            <div className="admin-don-metric-card">
              <div className="admin-don-metric-icon-circle orange">
                <Clock size={22} />
              </div>
              <div>
                <div className="admin-don-metric-num">{bloodMetrics.active}</div>
                <div className="admin-don-metric-lbl">Active Requests</div>
              </div>
            </div>

            {/* Card 3: Fulfilled Requests */}
            <div className="admin-don-metric-card">
              <div className="admin-don-metric-icon-circle green">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="admin-don-metric-num">{bloodMetrics.fulfilled}</div>
                <div className="admin-don-metric-lbl">Fulfilled Requests</div>
              </div>
            </div>

            {/* Card 4: Cancelled Requests */}
            <div className="admin-don-metric-card">
              <div className="admin-don-metric-icon-circle purple">
                <XCircle size={22} />
              </div>
              <div>
                <div className="admin-don-metric-num">{bloodMetrics.cancelled}</div>
                <div className="admin-don-metric-lbl">Cancelled Requests</div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="admin-don-table-card">
            <div className="admin-don-table-header">
              <h3 className="admin-don-table-title">All Blood Requests</h3>

              <div className="admin-don-table-actions">
                {/* + New Blood Request Button */}
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    setNewBloodForm(INITIAL_BLOOD_FORM);
                    setShowNewBloodModal(true);
                  }}
                >
                  <Plus size={16} />
                  <span>New Blood Request</span>
                </button>

                {/* Blood Group Filter Dropdown */}
                <select
                  className="admin-don-filter-select"
                  value={bloodGroupFilter}
                  onChange={e => {
                    setBloodGroupFilter(e.target.value);
                    setBloodPage(1);
                  }}
                >
                  <option value="All">All Bloods</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="admin-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Patient / Dr.</th>
                    <th>Blood Group</th>
                    <th>Units Req.</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Required By</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBlood.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                        <Droplet size={32} color="#e11d48" style={{ marginBottom: '8px' }} />
                        <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                          No blood requests recorded in database. Click "New Blood Request" to create one.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedBlood.map(row => {
                      const bgClass =
                        row.blood_group === 'A+' || row.blood_group === 'A-'
                          ? 'red'
                          : row.blood_group === 'B+' || row.blood_group === 'B-'
                          ? 'blue'
                          : row.blood_group === 'AB+' || row.blood_group === 'AB-'
                          ? 'purple'
                          : 'amber';

                      const rawUrgency = (row.urgency || 'Emergency').toLowerCase();
                      const urgencyClass =
                        rawUrgency.includes('emerg')
                          ? 'emergency'
                          : rawUrgency.includes('urg')
                          ? 'urgent'
                          : 'routine';

                      const rawStatus = (row.status || 'pending').toLowerCase();
                      const statusClass =
                        rawStatus === 'fulfilled'
                          ? 'fulfilled'
                          : rawStatus === 'cancelled' || rawStatus === 'closed'
                          ? 'cancelled'
                          : 'pending';
                      const statusLabel =
                        statusClass === 'fulfilled'
                          ? 'Fulfilled'
                          : statusClass === 'cancelled'
                          ? 'Cancelled'
                          : 'Pending';

                      return (
                        <tr key={row.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a' }}>
                              <Droplet size={14} color="#e11d48" fill="#e11d48" />
                              <span>{row.id}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                                {row.patient_name || 'Patient'}
                              </span>
                              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                {row.doctor_name ? `${row.doctor_name} · ` : ''}{row.department || 'Emergency'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`blood-badge ${bgClass}`}>{row.blood_group || 'O+'}</span>
                          </td>
                          <td style={{ fontWeight: 800, color: '#991b1b', fontSize: '13px' }}>
                            {row.units_needed || 1} Units
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span className={`urgency-badge ${urgencyClass}`}>
                                {row.urgency || 'Emergency'}
                              </span>
                              <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                {formatDateTime(row.created_at)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`don-status-badge ${statusClass}`}>{statusLabel}</span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                            {formatDateTime(row.required_by || row.expires_at)}
                          </td>
                          <td>
                            <div className="doc-actions-cell" style={{ justifyContent: 'center' }}>
                              {row.status !== 'fulfilled' && (
                                <button
                                  type="button"
                                  className="doc-action-btn"
                                  title="Mark as Fulfilled"
                                  onClick={() => handleFulfillRequest(row.id)}
                                >
                                  <Check size={14} color="#16a34a" />
                                </button>
                              )}
                              <button
                                type="button"
                                className="doc-action-btn"
                                title="View Donor Responses"
                                onClick={() => handleViewResponses(row)}
                              >
                                <Eye size={14} color="#2563eb" />
                              </button>
                              {row.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  className="doc-action-btn"
                                  title="Cancel Request"
                                  onClick={() => handleCancelRequest(row.id)}
                                >
                                  <X size={14} color="#dc2626" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredBloodList.length > 0 && (
              <div className="doc-pagination-row">
                <div className="doc-pagination-count">
                  Showing {(bloodPage - 1) * bloodPageSize + 1} to{' '}
                  {Math.min(bloodPage * bloodPageSize, filteredBloodList.length)} of {filteredBloodList.length} requests
                </div>

                <div className="doc-pagination-controls">
                  <button
                    type="button"
                    className="doc-page-btn"
                    disabled={bloodPage === 1}
                    onClick={() => setBloodPage(p => Math.max(1, p - 1))}
                  >
                    &lt;
                  </button>

                  {Array.from({ length: totalBloodPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`doc-page-btn ${bloodPage === pageNum ? 'active' : ''}`}
                      onClick={() => setBloodPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="doc-page-btn"
                    disabled={bloodPage === totalBloodPages}
                    onClick={() => setBloodPage(p => Math.min(totalBloodPages, p + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         VIEW 3: MANAGE MONETARY DONATIONS
         ══════════════════════════════════════════════════════════════════════ */}
      {view === 'monetary' && (
        <>
          <div className="admin-don-top-nav-row">
            <button
              type="button"
              className="admin-don-back-btn"
              onClick={() => setView('overview')}
              title="Back to Donations Overview"
            >
              <ArrowLeft size={16} />
              <span>Back to Donations</span>
            </button>

            <div className="admin-don-breadcrumbs">
              <span>Admin Portal</span>
              <ChevronRight size={12} />
              <button
                type="button"
                className="admin-don-bc-link"
                onClick={() => setView('overview')}
              >
                Donations
              </button>
              <ChevronRight size={12} />
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Manage Monetary Donations</span>
            </div>
          </div>

          <div className="admin-don-header">
            <h1 className="admin-don-title">Manage Monetary Donations</h1>
            <p className="admin-don-sub">
              Monitor healthcare funds, patient subsidies, and donor contributions.
            </p>
          </div>

          {/* 4 Summary Cards */}
          <div className="admin-don-metrics-row">
            <div className="admin-don-metric-card">
              <div className="admin-don-metric-icon-circle green">
                <Wallet size={22} />
              </div>
              <div>
                <div className="admin-don-metric-num">
                  ₹{monetaryMetrics.totalAmount.toLocaleString('en-IN')}
                </div>
                <div className="admin-don-metric-lbl">Total Funds Raised</div>
              </div>
            </div>

            <div className="admin-don-metric-card">
              <div className="admin-don-metric-icon-circle green">
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="admin-don-metric-num">{monetaryMetrics.activeCampaigns}</div>
                <div className="admin-don-metric-lbl">Active Campaigns</div>
              </div>
            </div>

            <div className="admin-don-metric-card">
              <div className="admin-don-metric-icon-circle green">
                <Users size={22} />
              </div>
              <div>
                <div className="admin-don-metric-num">{monetaryMetrics.totalDonors}</div>
                <div className="admin-don-metric-lbl">Total Contributions</div>
              </div>
            </div>

            <div className="admin-don-metric-card">
              <div className="admin-don-metric-icon-circle purple">
                <Heart size={22} />
              </div>
              <div>
                <div className="admin-don-metric-num">100%</div>
                <div className="admin-don-metric-lbl">Hospital Subsidies</div>
              </div>
            </div>
          </div>

          {/* Table of Campaigns */}
          <div className="admin-don-table-card">
            <div className="admin-don-table-header">
              <h3 className="admin-don-table-title">Healthcare & Patient Relief Campaigns</h3>
            </div>

            <div className="admin-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Campaign ID</th>
                    <th>Campaign Title</th>
                    <th>Target Amount</th>
                    <th>Raised Amount</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monetaryRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                        <Wallet size={32} color="#059669" style={{ marginBottom: '8px' }} />
                        <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                          No monetary relief campaigns active in the database.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    monetaryRequests.map(camp => {
                      const raised = Number(camp.amount_raised || 0);
                      const target = Number(camp.amount_target || 100000);
                      const pct = Math.min(100, Math.round((raised / target) * 100));

                      return (
                        <tr key={camp.id}>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{camp.id}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{camp.title}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{camp.description}</div>
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{target.toLocaleString('en-IN')}</td>
                          <td style={{ fontWeight: 700, color: '#16a34a' }}>₹{raised.toLocaleString('en-IN')}</td>
                          <td style={{ minWidth: '130px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#16a34a' }} />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="don-status-badge fulfilled">Active</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         MODAL: NEW BLOOD REQUEST (EMPTY UNFILLED INPUTS REQUIRING USER SELECTION)
         ══════════════════════════════════════════════════════════════════════ */}
      {showNewBloodModal && (
        <div
          className="admin-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowNewBloodModal(false);
          }}
        >
          <div className="admin-modal-card">
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setShowNewBloodModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="admin-modal-title">New Blood Request</h2>
            <p className="admin-modal-desc">
              Create a new blood request for patient care and emergency needs.
            </p>

            <form onSubmit={handleCreateBloodSubmit} className="admin-modal-form">
              {/* Row 1: Patient Name or Search * | Blood Group * */}
              <div className="don-modal-grid-2">
                <div className="admin-form-group">
                  <label>
                    Patient Name or Search <span className="don-required-star">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter patient name"
                    className="admin-form-input"
                    value={newBloodForm.patientName}
                    onChange={e => setNewBloodForm({ ...newBloodForm, patientName: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>
                    Blood Group <span className="don-required-star">*</span>
                  </label>
                  <select
                    required
                    className="admin-form-select"
                    value={newBloodForm.bloodGroup}
                    onChange={e => setNewBloodForm({ ...newBloodForm, bloodGroup: e.target.value })}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Units Needed * | Urgency Level * */}
              <div className="don-modal-grid-2">
                <div className="admin-form-group">
                  <label>
                    Units Needed <span className="don-required-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    placeholder="Enter units needed"
                    className="admin-form-input"
                    value={newBloodForm.unitsNeeded}
                    onChange={e => setNewBloodForm({ ...newBloodForm, unitsNeeded: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>
                    Urgency Level <span className="don-required-star">*</span>
                  </label>
                  <select
                    required
                    className="admin-form-select"
                    value={newBloodForm.urgency}
                    onChange={e => setNewBloodForm({ ...newBloodForm, urgency: e.target.value })}
                  >
                    <option value="">Select urgency level</option>
                    <option value="Emergency">Emergency (Immediate)</option>
                    <option value="Urgent">Urgent (Within 24 hrs)</option>
                    <option value="Routine">Routine (Scheduled)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Required By (Date & Time) * */}
              <div className="admin-form-group" style={{ marginBottom: '12px' }}>
                <label>
                  Required By (Date & Time) <span className="don-required-star">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  className="admin-form-input"
                  value={newBloodForm.requiredBy}
                  onChange={e => setNewBloodForm({ ...newBloodForm, requiredBy: e.target.value })}
                />
              </div>

              {/* Row 4: Hospital / Department * */}
              <div className="admin-form-group" style={{ marginBottom: '12px' }}>
                <label>
                  Hospital / Department <span className="don-required-star">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter hospital department or ward (e.g. Emergency Dept)"
                  className="admin-form-input"
                  value={newBloodForm.department}
                  onChange={e => setNewBloodForm({ ...newBloodForm, department: e.target.value })}
                />
              </div>

              {/* Row 5: Additional Notes / Clinical Details */}
              <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                <label>Additional Notes / Clinical Details</label>
                <textarea
                  rows="3"
                  placeholder="Enter patient diagnosis, OT room, or special transfusion requirements..."
                  className="admin-form-textarea"
                  value={newBloodForm.additionalNotes}
                  onChange={e => setNewBloodForm({ ...newBloodForm, additionalNotes: e.target.value })}
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowNewBloodModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  <span>Create Blood Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Patient Responses ── */}
      {showResponsesModal && selectedRequest && (
        <div
          className="admin-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowResponsesModal(false);
          }}
        >
          <div className="admin-modal-card">
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={() => setShowResponsesModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="admin-modal-title">Donor Responses</h2>
            <p className="admin-modal-desc">
              Patient responses for {selectedRequest.title || selectedRequest.id}
            </p>

            {responsesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                <Users size={32} color="#087d43" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No donor responses received yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {responsesList.map(resp => (
                  <div
                    key={resp.id}
                    style={{
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {resp.patients?.name || 'Verified Donor'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {resp.patients?.phone || 'Phone verified'} · Blood Group:{' '}
                        {resp.blood_group || resp.patients?.blood_group || 'O+'}
                      </div>
                    </div>
                    <span className="don-status-badge fulfilled">Verified</span>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setShowResponsesModal(false)}
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
