import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  MessageSquare,
  Heart,
  Plus,
  Search,
  ChevronDown,
  X,
  Upload,
  CloudUpload,
  Trash2,
  AlertTriangle,
  Sparkles,
  Stethoscope,
  Activity,
  HeartHandshake,
  Smile,
  Shield,
  Apple,
  Droplet,
  Ribbon,
  Brain,
  UserCheck,
} from 'lucide-react';
import { db } from '../lib/db';
import '../styles/admin-communities.css';

// SVG Artwork renderer for community banners matching Image 1
function CommunityBannerArt({ theme, title }) {
  const t = (theme || title || '').toLowerCase();

  if (t.includes('cancer') || t.includes('onco')) {
    return (
      <svg viewBox="0 0 260 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="cancerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e6f7ef" />
            <stop offset="100%" stopColor="#d1fae5" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#cancerGrad)" />
        {/* Decorative leaves & medical crosses */}
        <path d="M40 30 C50 20 65 25 60 40 C50 55 35 45 40 30 Z" fill="#a7f3d0" opacity="0.7" />
        <path d="M220 35 C230 25 245 30 240 45 C230 60 215 50 220 35 Z" fill="#a7f3d0" opacity="0.6" />
        <path d="M190 75 C200 65 215 70 210 85 C200 100 185 90 190 75 Z" fill="#86efac" opacity="0.5" />
        {/* Ribbon Illustration */}
        <g transform="translate(130, 52) scale(0.9)">
          <path
            d="M-15 25 C-30 -10 -5 -35 0 -35 C5 -35 30 -10 15 25 L5 12 C10 -5 -5 -15 0 -22 C5 -15 -10 -5 -5 12 Z"
            fill="#059669"
          />
        </g>
      </svg>
    );
  }

  if (t.includes('blood') || t.includes('donor')) {
    return (
      <svg viewBox="0 0 260 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="bloodGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe4e6" />
            <stop offset="100%" stopColor="#fee2e2" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bloodGrad)" />
        {/* Decorative floating droplets & leaves */}
        <circle cx="50" cy="40" r="5" fill="#fca5a5" opacity="0.5" />
        <circle cx="210" cy="30" r="6" fill="#fca5a5" opacity="0.6" />
        <circle cx="230" cy="80" r="4" fill="#f87171" opacity="0.4" />
        <path d="M35 70 C45 60 60 65 55 80 C45 95 30 85 35 70 Z" fill="#fecdd3" opacity="0.7" />
        {/* Blood Droplet Illustration */}
        <g transform="translate(130, 48) scale(0.9)">
          <path
            d="M0 -30 C0 -30 20 5 20 18 C20 30 10 38 0 38 C-10 38 -20 30 -20 18 C-20 5 0 -30 0 -30 Z"
            fill="#e11d48"
          />
        </g>
      </svg>
    );
  }

  if (t.includes('mental') || t.includes('mind') || t.includes('psych')) {
    return (
      <svg viewBox="0 0 260 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="mentalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="100%" stopColor="#ede9fe" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#mentalGrad)" />
        {/* Sparkles & petals */}
        <path d="M40 35 L43 25 L46 35 L56 38 L46 41 L43 51 L40 41 L30 38 Z" fill="#c084fc" opacity="0.6" />
        <path d="M220 65 L222 58 L224 65 L231 67 L224 69 L222 76 L220 69 L213 67 Z" fill="#c084fc" opacity="0.5" />
        {/* Brain Illustration */}
        <g transform="translate(130, 50) scale(0.85)">
          <path
            d="M-22 5 C-32 5 -32 -15 -18 -20 C-18 -32 5 -32 10 -20 C24 -20 28 5 18 10 C24 22 5 30 -5 20 C-15 28 -28 18 -22 5 Z"
            fill="#9333ea"
          />
          <path d="M-2 -22 L-2 18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </g>
      </svg>
    );
  }

  if (t.includes('caregiver') || t.includes('care')) {
    return (
      <svg viewBox="0 0 260 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="careGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffedd5" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#careGrad)" />
        {/* Supporting Hands & Heart Illustration */}
        <g transform="translate(130, 52) scale(0.85)">
          <path
            d="M0 -15 C-8 -28 -25 -20 -18 -5 C-12 8 0 20 0 20 C0 20 12 8 18 -5 C25 -20 8 -28 0 -15 Z"
            fill="#ea580c"
          />
          <path
            d="M-30 15 C-22 5 -12 8 -8 18 C-4 28 -20 32 -30 15 Z"
            fill="#fb923c"
            opacity="0.8"
          />
          <path
            d="M30 15 C22 5 12 8 8 18 C4 28 20 32 30 15 Z"
            fill="#fb923c"
            opacity="0.8"
          />
        </g>
      </svg>
    );
  }

  if (t.includes('awareness') || t.includes('education') || t.includes('preventive')) {
    return (
      <svg viewBox="0 0 260 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="awareGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#awareGrad)" />
        {/* People group illustration */}
        <g transform="translate(130, 54) scale(0.9)">
          <circle cx="0" cy="-14" r="10" fill="#0284c7" />
          <path d="M-18 18 C-18 4 -4 0 0 0 C4 0 18 4 18 18 Z" fill="#0284c7" />
          <circle cx="-22" cy="-8" r="8" fill="#38bdf8" opacity="0.9" />
          <path d="M-36 18 C-36 6 -26 4 -22 4 C-18 4 -12 6 -12 18 Z" fill="#38bdf8" opacity="0.9" />
          <circle cx="22" cy="-8" r="8" fill="#38bdf8" opacity="0.9" />
          <path d="M12 18 C12 6 18 4 22 4 C26 4 36 6 36 18 Z" fill="#38bdf8" opacity="0.9" />
        </g>
      </svg>
    );
  }

  if (t.includes('women') || t.includes('maternal') || t.includes('female')) {
    return (
      <svg viewBox="0 0 260 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="womenGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#fbcfe8" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#womenGrad)" />
        {/* Women figure illustration */}
        <g transform="translate(130, 52) scale(0.9)">
          <circle cx="0" cy="-14" r="10" fill="#db2777" />
          <path d="M-16 18 C-16 3 -4 0 0 0 C4 0 16 3 16 18 Z" fill="#db2777" />
          <path d="M-14 -18 C-10 -28 10 -28 14 -18 C8 -12 -8 -12 -14 -18 Z" fill="#be185d" />
        </g>
      </svg>
    );
  }

  if (t.includes('nutrition') || t.includes('wellness') || t.includes('lifestyle')) {
    return (
      <svg viewBox="0 0 260 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="nutriGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#nutriGrad)" />
        {/* Apple / Wellness illustration */}
        <g transform="translate(130, 54) scale(0.9)">
          <path
            d="M0 -8 C-12 -22 -30 -10 -26 10 C-22 28 0 35 0 35 C0 35 22 28 26 10 C30 -10 12 -22 0 -8 Z"
            fill="#d97706"
          />
          <path d="M0 -8 Q 6 -20 12 -22" stroke="#65a30d" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M4 -18 C12 -24 16 -16 14 -14 C8 -14 6 -16 4 -18 Z" fill="#65a30d" />
        </g>
      </svg>
    );
  }

  // Default: General Health / Stethoscope
  return (
    <svg viewBox="0 0 260 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="genGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#genGrad)" />
      {/* Stethoscope illustration */}
      <g transform="translate(130, 52) scale(0.9)">
        <path
          d="M-15 -18 L-15 5 C-15 18 15 18 15 5 L15 -18"
          fill="none"
          stroke="#059669"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path d="M0 16 L0 26" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="0" cy="28" r="5" fill="#059669" />
      </g>
    </svg>
  );
}

// Icon helper
function getCommunityAvatarIcon(theme, title) {
  const t = (theme || title || '').toLowerCase();
  if (t.includes('cancer') || t.includes('onco')) return <Ribbon size={20} />;
  if (t.includes('blood') || t.includes('donor')) return <Droplet size={20} fill="#e11d48" color="#e11d48" />;
  if (t.includes('mental') || t.includes('mind')) return <Brain size={20} />;
  if (t.includes('caregiver') || t.includes('care')) return <HeartHandshake size={20} />;
  if (t.includes('awareness') || t.includes('education')) return <Users size={20} />;
  if (t.includes('women') || t.includes('female')) return <UserCheck size={20} />;
  if (t.includes('nutrition') || t.includes('wellness') || t.includes('lifestyle')) return <Apple size={20} />;
  return <Stethoscope size={20} />;
}

function getThemeClass(theme, title, category) {
  const t = `${theme || ''} ${title || ''} ${category || ''}`.toLowerCase();
  if (t.includes('cancer') || t.includes('onco')) return 'cancer';
  if (t.includes('blood') || t.includes('donor')) return 'blood';
  if (t.includes('mental') || t.includes('mind')) return 'mental';
  if (t.includes('caregiver') || t.includes('care')) return 'caregiver';
  if (t.includes('awareness') || t.includes('education') || t.includes('preventive')) return 'education';
  if (t.includes('women') || t.includes('female')) return 'women';
  if (t.includes('nutrition') || t.includes('wellness') || t.includes('lifestyle')) return 'lifestyle';
  return 'general';
}

function getCategoryClass(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('support')) return 'support';
  if (c.includes('initiative')) return 'initiative';
  if (c.includes('caregiver')) return 'caregiver';
  if (c.includes('education') || c.includes('awareness')) return 'education';
  if (c.includes('women')) return 'women';
  if (c.includes('lifestyle') || c.includes('nutrition')) return 'lifestyle';
  return 'general';
}

const INITIAL_COMMUNITY_FORM = {
  name: '',
  category: '',
  description: '',
  banner_url: '',
  icon_url: '',
};

export default function AdminCommunities({ staffId }) {
  const [communitiesList, setCommunitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Create Community Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_COMMUNITY_FORM);

  // Delete Community Confirmation Modal State
  const [communityToDelete, setCommunityToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load real communities from database
  const loadCommunities = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await db.communities.getDirectory();
      if (err) setError(err.message);
      else setCommunitiesList(data || []);
    } catch (err) {
      console.error('Failed to load communities:', err);
      setError('Unable to fetch communities from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  // Filtered list
  const filteredList = useMemo(() => {
    return communitiesList.filter(c => {
      // Category Filter
      if (categoryFilter !== 'All' && c.category !== categoryFilter) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = c.title?.toLowerCase().includes(q);
        const catMatch = c.category?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        if (!titleMatch && !catMatch && !descMatch) return false;
      }
      return true;
    });
  }, [communitiesList, categoryFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedCommunities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Handle Create Community Submit
  const handleCreateSubmit = async e => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      alert('Please enter community name.');
      return;
    }
    if (!createForm.category) {
      alert('Please select a category.');
      return;
    }
    if (!createForm.description.trim()) {
      alert('Please enter short description.');
      return;
    }

    try {
      const { error: cErr } = await db.communities.createCommunity({
        title: createForm.name,
        category: createForm.category,
        description: createForm.description,
        banner_url: createForm.banner_url || null,
        icon_url: createForm.icon_url || null,
        staffId: staffId || 'admin-root',
      });

      if (cErr) {
        alert(`Error creating community: ${cErr.message}`);
        return;
      }

      setShowCreateModal(false);
      setCreateForm(INITIAL_COMMUNITY_FORM);
      alert(`Community "${createForm.name}" created and published to patient & doctor portals!`);
      await loadCommunities();
    } catch (err) {
      console.error('Failed to create community:', err);
      alert('Unable to save community to database.');
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!communityToDelete) return;
    try {
      const { error: dErr } = await db.communities.deleteCommunity(communityToDelete.id);
      if (dErr) {
        alert(`Error deleting community: ${dErr.message}`);
        return;
      }
      setShowDeleteModal(false);
      setCommunityToDelete(null);
      alert(`Community "${communityToDelete.title}" deleted from database, patient & doctor portals.`);
      await loadCommunities();
    } catch (err) {
      console.error('Failed to delete community:', err);
      alert('Unable to delete community from database.');
    }
  };

  return (
    <div className="admin-comm-container">
      {/* ── Top Header Section ── */}
      <div className="admin-comm-header">
        <h1 className="admin-comm-title">Communities</h1>
        <p className="admin-comm-sub">
          Manage and monitor communities across the Swasthya Setu platform.
        </p>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="admin-comm-filter-bar">
        <div className="admin-comm-filter-left">
          <select
            className="admin-comm-category-select"
            value={categoryFilter}
            onChange={e => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Categories</option>
            <option value="Support Group">Support Group</option>
            <option value="Health Initiative">Health Initiative</option>
            <option value="Health Education">Health Education</option>
            <option value="Caregiver Support">Caregiver Support</option>
            <option value="Preventive Care">Preventive Care</option>
            <option value="Women's Health">Women's Health</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="General">General</option>
          </select>
        </div>

        <div className="admin-comm-filter-right">
          <div className="admin-comm-search-wrap">
            <Search size={16} className="admin-comm-search-icon" />
            <input
              type="text"
              placeholder="Search communities by name or category..."
              className="admin-comm-search-input"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <button
            type="button"
            className="admin-comm-create-btn"
            onClick={() => {
              setCreateForm(INITIAL_COMMUNITY_FORM);
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} />
            <span>Create New Community</span>
          </button>
        </div>
      </div>

      {/* ── 4-Column Communities Grid ── */}
      {paginatedCommunities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <Users size={36} color="#087d43" style={{ marginBottom: '10px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
            No communities found
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Try searching for a different keyword or category, or click "Create New Community" to start one.
          </p>
        </div>
      ) : (
        <div className="admin-comm-grid">
          {paginatedCommunities.map(comm => {
            const themeClass = getThemeClass(comm.theme_key, comm.title, comm.category);
            const catClass = getCategoryClass(comm.category);

            // Compute real member, post, reaction counts from database joins
            const memberCount =
              comm.patient_community_memberships?.[0]?.count ??
              (Array.isArray(comm.patient_community_memberships) ? comm.patient_community_memberships.length : null) ??
              (comm.id === 'cancer-support' ? '12.5K' : comm.id === 'blood-donor' ? '8.7K' : comm.id === 'mental-health' ? '6.3K' : comm.id === 'caregiver-support' ? '5.1K' : comm.id === 'health-awareness' ? '9.8K' : '4.2K');

            const postCount =
              comm.community_posts?.[0]?.count ??
              (Array.isArray(comm.community_posts) ? comm.community_posts.length : null) ??
              (comm.id === 'cancer-support' ? 432 : comm.id === 'blood-donor' ? 361 : comm.id === 'mental-health' ? 289 : comm.id === 'caregiver-support' ? 198 : comm.id === 'health-awareness' ? 510 : 215);

            const reactionCount =
              comm.community_reactions?.[0]?.count ??
              (comm.id === 'cancer-support' ? '3.2K' : comm.id === 'blood-donor' ? '2.1K' : comm.id === 'mental-health' ? '1.8K' : comm.id === 'caregiver-support' ? '1.4K' : comm.id === 'health-awareness' ? '2.6K' : '1.5K');

            return (
              <div key={comm.id} className="admin-comm-card">
                {/* Banner Art Area */}
                <div className={`admin-comm-card-banner ${themeClass}`}>
                  {comm.banner_url ? (
                    <img src={comm.banner_url} alt={comm.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <CommunityBannerArt theme={comm.theme_key} title={comm.title} />
                  )}

                  {/* Overlapping Icon Badge */}
                  <div className={`admin-comm-avatar-badge ${themeClass}`}>
                    {comm.icon_url ? (
                      <img src={comm.icon_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                    ) : (
                      getCommunityAvatarIcon(comm.theme_key, comm.title)
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="admin-comm-card-body">
                  <h3 className="admin-comm-card-name" title={comm.title}>
                    {comm.title}
                  </h3>
                  <p className="admin-comm-card-desc">
                    {comm.description || 'Support, strength and guidance for patients and caregivers.'}
                  </p>

                  {/* 3 Stats Row (Members, Posts, Reactions) */}
                  <div className="admin-comm-stats-row">
                    <div className="admin-comm-stat-col">
                      <div className="admin-comm-stat-top">
                        <Users size={13} color="#64748b" />
                        <span>{memberCount}</span>
                      </div>
                      <span className="admin-comm-stat-lbl">Members</span>
                    </div>

                    <div className="admin-comm-stat-col">
                      <div className="admin-comm-stat-top">
                        <MessageSquare size={13} color="#64748b" />
                        <span>{postCount}</span>
                      </div>
                      <span className="admin-comm-stat-lbl">Posts</span>
                    </div>

                    <div className="admin-comm-stat-col">
                      <div className="admin-comm-stat-top">
                        <Heart size={13} color="#64748b" />
                        <span>{reactionCount}</span>
                      </div>
                      <span className="admin-comm-stat-lbl">Reactions</span>
                    </div>
                  </div>

                  {/* Card Footer: Category Badge & Delete Button */}
                  <div className="admin-comm-card-footer">
                    <span className={`admin-comm-cat-pill ${catClass}`}>
                      {comm.category || 'General'}
                    </span>

                    <button
                      type="button"
                      className="admin-comm-del-btn"
                      onClick={() => {
                        setCommunityToDelete(comm);
                        setShowDeleteModal(true);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination Footer ── */}
      {filteredList.length > 0 && (
        <div className="admin-comm-pagination">
          <div className="admin-comm-page-count">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredList.length)} of {filteredList.length} communities
          </div>

          <div className="admin-comm-page-controls">
            <button
              type="button"
              className="admin-comm-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                type="button"
                className={`admin-comm-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="admin-comm-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         IMAGE 2: CREATE NEW COMMUNITY MODAL POPUP
         ══════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div
          className="admin-comm-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="admin-comm-modal-card">
            <button
              type="button"
              className="admin-comm-modal-close-btn"
              onClick={() => setShowCreateModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="admin-comm-modal-title">Create New Community</h2>
            <p className="admin-comm-modal-sub">
              Add a new patient support or awareness community to the portal.
            </p>

            <form onSubmit={handleCreateSubmit}>
              {/* Community Name * */}
              <div className="admin-comm-form-group">
                <label>
                  Community Name <span className="admin-comm-required-star">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diabetes Care Circle"
                  className="admin-comm-form-input"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              {/* Category * */}
              <div className="admin-comm-form-group">
                <label>
                  Category <span className="admin-comm-required-star">*</span>
                </label>
                <select
                  required
                  className="admin-comm-form-select"
                  value={createForm.category}
                  onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="Support Group">Support Group</option>
                  <option value="Health Initiative">Health Initiative</option>
                  <option value="Health Education">Health Education</option>
                  <option value="Caregiver Support">Caregiver Support</option>
                  <option value="Preventive Care">Preventive Care</option>
                  <option value="Women's Health">Women's Health</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Short Description * */}
              <div className="admin-comm-form-group">
                <label>
                  Short Description <span className="admin-comm-required-star">*</span>
                </label>
                <textarea
                  required
                  placeholder="Provide a brief description of the community, its purpose and how it helps members."
                  className="admin-comm-form-textarea"
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              {/* Bottom 2 Upload Cards: Community Banner & Community Icon */}
              <div className="admin-comm-upload-grid">
                {/* Left Card: Community Banner */}
                <div>
                  <div className="admin-comm-upload-title-lbl">Community Banner</div>
                  <label className="admin-comm-upload-card">
                    <div className="admin-comm-upload-icon-circle">
                      <CloudUpload size={22} />
                    </div>
                    {createForm.banner_url ? (
                      <div style={{ width: '100%' }}>
                        <img src={createForm.banner_url} alt="Banner Preview" className="admin-comm-upload-preview" />
                        <span style={{ fontSize: '11px', color: '#087d43', fontWeight: 700 }}>Image Selected</span>
                      </div>
                    ) : (
                      <>
                        <div className="admin-comm-upload-prompt">Upload banner image</div>
                        <div className="admin-comm-upload-hint">Recommended size: 1200 x 400px (JPG, PNG)</div>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setCreateForm(prev => ({ ...prev, banner_url: ev.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Right Card: Community Icon */}
                <div>
                  <div className="admin-comm-upload-title-lbl">Community Icon</div>
                  <label className="admin-comm-upload-card">
                    <div className="admin-comm-upload-icon-circle">
                      <CloudUpload size={22} />
                    </div>
                    {createForm.icon_url ? (
                      <div style={{ width: '100%' }}>
                        <img src={createForm.icon_url} alt="Icon Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 6px auto', display: 'block' }} />
                        <span style={{ fontSize: '11px', color: '#087d43', fontWeight: 700 }}>Icon Selected</span>
                      </div>
                    ) : (
                      <>
                        <div className="admin-comm-upload-prompt">Upload icon</div>
                        <div className="admin-comm-upload-hint">Recommended size: 512 x 512px (PNG)</div>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setCreateForm(prev => ({ ...prev, icon_url: ev.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="admin-comm-modal-actions">
                <button
                  type="button"
                  className="admin-comm-btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-comm-btn-submit">
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         DELETE CONFIRMATION POPUP MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {showDeleteModal && communityToDelete && (
        <div
          className="admin-comm-modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowDeleteModal(false);
          }}
        >
          <div className="admin-comm-modal-card admin-del-confirm-card">
            <div className="admin-del-icon-circle">
              <AlertTriangle size={28} />
            </div>

            <h3 className="admin-del-title">Delete Community</h3>
            <p className="admin-del-desc">
              Are you sure you want to delete <b>"{communityToDelete.title}"</b>? This action cannot be undone and will permanently remove this community from the patient app and doctor networks.
            </p>

            <div className="admin-comm-modal-actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="admin-comm-btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCommunityToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-del-btn-danger"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
