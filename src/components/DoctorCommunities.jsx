import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertCircle, ArrowLeft, Baby, Bell, Brain, Briefcase, Building2,
  Check, ChevronDown, ChevronRight, ChevronUp, Copy, Droplet, Eye, EyeOff,
  Globe, Heart, HeartHandshake, Image as ImageIcon, LayoutGrid, Leaf, Lock, LogOut, Mail,
  MessageCircle, MoreHorizontal, MoreVertical, Pencil, PlaySquare, Plus, RefreshCw,
  Repeat, Ribbon, Search, Send, Share2, ShieldCheck, Sparkles, Stethoscope, Trash2,
  Upload, User, Users, Vote, Wind, X
} from 'lucide-react';
import { db } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import aiTranslationService from '../engine/AiTranslationService';
import '../styles/doctor-communities.css';

const THEMES = {
  blood: { color: '#dc2626', soft: '#fff1f2', icon: Droplet, bannerImg: '/doctor_team_community.jpg' },
  general: { color: '#087d43', soft: '#eaf7f2', icon: Stethoscope, bannerImg: '/doctor_team_community.jpg' },
  mental: { color: '#7c3aed', soft: '#f4f0ff', icon: Brain, bannerImg: '/community_hero_mental.jpg' },
  'mental-health': { color: '#7c3aed', soft: '#f4f0ff', icon: Brain, bannerImg: '/community_hero_mental.jpg' },
  caregiver: { color: '#ea580c', soft: '#fff7ed', icon: HeartHandshake, bannerImg: '/doctor_team_community.jpg' },
  geriatrics: { color: '#0284c7', soft: '#e0f2fe', icon: Users, bannerImg: '/doctor_team_community.jpg' },
  senior: { color: '#0284c7', soft: '#e0f2fe', icon: Users, bannerImg: '/doctor_team_community.jpg' },
  cancer: { color: '#08765d', soft: '#eaf8f2', icon: Ribbon, bannerImg: '/doctor_team_community.jpg' },
  diabetes: { color: '#7c3aed', soft: '#f5f3ff', icon: Activity, bannerImg: '/doctor_team_community.jpg' },
  cardiac: { color: '#e11d48', soft: '#fff1f2', icon: Heart, bannerImg: '/doctor_team_community.jpg' },
  maternal: { color: '#db2777', soft: '#fdf2f8', icon: Baby, bannerImg: '/doctor_team_community.jpg' },
  'maternal-child': { color: '#db2777', soft: '#fdf2f8', icon: Baby, bannerImg: '/doctor_team_community.jpg' },
  respiratory: { color: '#0284c7', soft: '#f0f9ff', icon: Wind, bannerImg: '/doctor_team_community.jpg' },
  ayush: { color: '#15803d', soft: '#f0fdf4', icon: Leaf, bannerImg: '/doctor_team_community.jpg' },
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
];

const formatCount = value => {
  if (!value && value !== 0) return '0';
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN').format(value);
};

const countOf = (row, key) => Number(row?.[key]?.[0]?.count || 0);

function timeAgo(value) {
  if (!value) return 'Just now';
  const delta = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const minutes = Math.round(Math.abs(delta) / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function DoctorCommunities({ doctor, onLogout, onBack }) {
  const { currentLang, setCurrentLang } = useLanguage();
  const [communities, setCommunities] = useState([]);
  const [impact, setImpact] = useState({
    professionals: 0,
    communitiesCount: 0,
    discussions: 0,
    responses: 0,
    members: 0,
  });
  const [joined, setJoined] = useState([]);
  const [selected, setSelected] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reactions, setReactions] = useState({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // UI Modals
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // New Doctor Post Form State
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostType, setNewPostType] = useState('General Discussion');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Attachment states (Image, Video, Poll)
  const [attachMode, setAttachMode] = useState('none'); // 'none' | 'image' | 'video' | 'poll'
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const doctorId = doctor?.id || 'd0000001-0002-0002-0002-000000000001';

  // Load live community catalog and platform impact from database
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: dirData, error: dirErr }, { data: impData, error: impErr }, { data: memData }] = await Promise.all([
        db.communities.getDirectory(),
        db.communities.getImpact(),
        db.communities.getMemberships(doctorId),
      ]);

      if (dirData && dirData.length > 0) setCommunities(dirData);
      if (impData) setImpact(impData);
      if (memData) setJoined(memData.map(m => m.community_id));
      if (dirErr || impErr) setError((dirErr || impErr)?.message || '');
    } catch (err) {
      console.warn('Load community error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [doctorId]);

  // Handle back navigation from detail view
  const handleBackFromDetail = () => {
    setSelected(null);
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  // Open community detail view & update history
  const openCommunity = async (comm) => {
    setSelected(comm);
    window.location.hash = `community-${comm.id}`;
    setFeedLoading(true);
    setError('');
    try {
      const { data: postData, error: pErr } = await db.communities.getPosts(comm.id);
      setPosts(postData || []);
      if (pErr) setError(pErr.message);

      if (postData?.length) {
        const { data: mine } = await db.communities.getPatientReactions(doctorId, postData.map(p => p.id));
        setReactions(Object.fromEntries((mine || []).map(m => [m.post_id, m.reaction_type])));
      }
    } catch (err) {
      console.warn('Open community error:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#community-')) {
        const id = hash.replace('#community-', '');
        const found = communities.find(c => c.id === id);
        if (found) {
          openCommunity(found);
          return;
        }
      }
      setSelected(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [communities]);

  // Toggle Doctor Reaction on a Post
  const toggleReaction = async (post) => {
    const isReacted = Boolean(reactions[post.id]);
    const { data, error: rErr } = await db.communities.toggleReaction(doctorId, post.id, 'helpful');
    if (rErr) {
      setToast(rErr.message);
      return;
    }
    setReactions(prev => ({
      ...prev,
      [post.id]: data ? 'helpful' : undefined,
    }));
    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? {
              ...p,
              community_post_reactions: [
                {
                  count: Math.max(0, countOf(p, 'community_post_reactions') + (isReacted ? -1 : 1)),
                },
              ],
            }
          : p
      )
    );
  };

  // Comments Management
  const openComments = async (post) => {
    setCommentPost(post);
    setCommentLoading(true);
    setCommentText('');
    try {
      const { data, error: cErr } = await db.communities.getComments(post.id);
      setComments(data || []);
      if (cErr) setError(cErr.message);
    } catch (err) {
      console.warn('Get comments error:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const authorName = doctor?.name || 'Dr. Verified Clinician';
      const { data, error: addErr } = await db.communities.addComment(
        doctorId,
        commentPost.id,
        commentText.trim(),
        authorName
      );
      if (addErr) {
        setToast(addErr.message);
        return;
      }
      setCommentText('');
      const { data: updatedComments } = await db.communities.getComments(commentPost.id);
      setComments(updatedComments || []);
      setPosts(prev =>
        prev.map(p =>
          p.id === commentPost.id
            ? {
                ...p,
                community_post_comments: [
                  { count: countOf(p, 'community_post_comments') + 1 },
                ],
              }
            : p
        )
      );
      setToast('Comment posted successfully');
    } catch (err) {
      console.warn('Add comment error:', err);
    }
  };

  // Handle Image Selection
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaUrl(event.target.result);
      setMediaType('image');
      setToast('Image attached!');
    };
    reader.readAsDataURL(file);
  };

  // Handle Video Selection
  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaUrl(event.target.result);
      setMediaType('video');
      setToast('Video attached!');
    };
    reader.readAsDataURL(file);
  };

  // Handle Poll Options
  const handleAddPollOption = () => {
    if (pollOptions.length >= 5) {
      setToast('Maximum 5 options allowed');
      return;
    }
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (idx) => {
    if (pollOptions.length <= 2) {
      setToast('A poll must have at least 2 options');
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const handlePollOptionChange = (idx, val) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  // Vote on a Poll
  const handleVotePoll = async (post, optionId) => {
    try {
      const { data, error: vErr } = await db.communities.votePoll({
        communityId: selected.id,
        postId: post.id,
        optionId,
        userId: doctorId,
      });
      if (vErr) {
        setToast(vErr.message);
        return;
      }
      if (data) {
        setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, poll_data: data.poll_data } : p)));
        setToast('Vote recorded!');
      }
    } catch (err) {
      console.warn('Vote poll error:', err);
    }
  };

  // Publish Doctor Post to the Database (connected end-to-end with Patient Portal)
  const handlePublishPost = async (e) => {
    e.preventDefault();
    if (!newPostBody.trim() && !pollQuestion.trim()) return;

    setSubmittingPost(true);
    try {
      let finalPollData = null;
      if (attachMode === 'poll' && pollQuestion.trim()) {
        const validOptions = pollOptions.filter(o => o.trim());
        if (validOptions.length < 2) {
          setToast('Please provide at least 2 poll options');
          setSubmittingPost(false);
          return;
        }
        finalPollData = {
          question: pollQuestion.trim(),
          options: validOptions.map((opt, i) => ({
            id: `opt-${i + 1}`,
            text: opt.trim(),
            votes: 0,
          })),
          totalVotes: 0,
          votedUsers: {},
        };
      }

      const currentDoctorId = doctor?.id || doctor?.doctor_id || 'd0000001-0002-0002-0002-000000000001';
      const { data: newPost, error: pErr } = await db.communities.publishDoctorPost({
        doctor,
        doctorId: currentDoctorId,
        staffId: doctor?.staff_id || currentDoctorId,
        communityId: selected.id,
        title: pollQuestion.trim() || null,
        body: newPostBody.trim(),
        postType: newPostType,
        mediaUrl: mediaUrl.trim() || null,
        mediaType: mediaUrl.trim() ? mediaType : null,
        pollData: finalPollData,
      });

      if (pErr) {
        setToast(pErr.message || 'Failed to publish post');
      } else if (newPost) {
        setPosts(prev => [newPost, ...prev]);
        setNewPostBody('');
        setMediaUrl('');
        setAttachMode('none');
        setPollQuestion('');
        setPollOptions(['', '']);
        setToast('Clinical guidance posted to community feed!');
        // Update live counters
        setImpact(prev => ({
          ...prev,
          discussions: prev.discussions + 1,
        }));
      }
    } catch (err) {
      console.warn('Publish post error:', err);
      setToast('Network error while publishing post');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Share Community Link
  const handleShare = async (comm) => {
    const url = `${window.location.origin}/physician#community-${comm.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: comm.title,
          text: comm.description,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setToast('Community link copied to clipboard!');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setToast('Link copied to clipboard!');
    }
  };

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Categories list
  const categories = useMemo(() => {
    const list = ['all', ...new Set(communities.map(c => c.category).filter(Boolean))];
    return list;
  }, [communities]);

  // Filtered communities list for directory view
  const filtered = useMemo(() => {
    return communities.filter(item => {
      const matchCat = category === 'all' || item.category === category;
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [communities, category, query]);

  const selectedTheme = selected ? (THEMES[selected.theme_key] || THEMES[selected.disease_key] || THEMES.general) : THEMES.general;
  const SelectedIcon = selectedTheme.icon;

  return (
    <div className="doc-comm-container">
      {/* Hidden File Inputs for Image / Video Uploads */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleVideoFileChange}
      />

      {/* ── Top Header Bar ── */}
      <div className="doc-comm-top-row">
        <div className="doc-comm-heading">
          <div className="doc-comm-breadcrumb">
            <button type="button" onClick={() => (onBack ? onBack() : window.history.back())}>
              Doctor Portal
            </button>{' '}
            /{' '}
            {selected ? (
              <>
                <button type="button" onClick={handleBackFromDetail}>
                  Communities
                </button>{' '}
                / <span>{selected.title}</span>
              </>
            ) : (
              <span>Communities</span>
            )}
          </div>
          {!selected && (
            <>
              <h1 className="doc-comm-title">Healthcare Communities</h1>
              <p className="doc-comm-subtitle">
                Connect with verified medical practitioners, share evidence-based guidelines, and support patient health circles.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Main Content: Detail View vs Directory Grid ── */}
      {selected ? (
        /* ═════════════════════════════════════════════════════════════════════
           COMMUNITY DETAIL VIEW (MATCHING ARCHITECTURE MOCKUP 2 EXACTLY)
           ═════════════════════════════════════════════════════════════════════ */
        <div
          className="doc-comm-detail-view"
          style={{
            '--comm-color': selectedTheme.color,
            '--comm-soft': selectedTheme.soft,
          }}
        >
          {/* Back to Communities Navigation Button */}
          <button
            type="button"
            className="doc-comm-back-nav-btn"
            onClick={handleBackFromDetail}
          >
            <ArrowLeft size={16} />
            <span>Back to Communities</span>
          </button>

          {/* 1. Community Hero Banner Card */}
          <div className="doc-comm-view-banner">
            <div className="doc-comm-view-banner-left">
              <div className="doc-comm-view-banner-icon">
                <SelectedIcon size={38} />
              </div>
              <div className="doc-comm-view-banner-meta">
                <span className="doc-comm-verified-badge">
                  <ShieldCheck size={14} /> Verified Community
                </span>
                <h1 className="doc-comm-view-title">{selected.title}</h1>
                <div className="doc-comm-view-tagline">
                  {selected.tagline || 'You are not alone. We listen. We support. We care.'}
                </div>
                <p className="doc-comm-view-desc">
                  {selected.description ||
                    'A safe and supportive space to share, learn and grow together. Let us break the stigma and build a mentally healthier world.'}
                </p>

                {/* Stats row chips */}
                <div className="doc-comm-view-stats-row">
                  <div className="doc-comm-view-stat-chip">
                    <Users size={20} />
                    <div>
                      <b>{formatCount(countOf(selected, 'patient_community_memberships'))}</b>
                      <span>Members</span>
                    </div>
                  </div>

                  <div className="doc-comm-view-stat-chip">
                    <Ribbon size={20} />
                    <div>
                      <b>{formatCount(countOf(selected, 'community_professionals'))}</b>
                      <span>Doctors & Experts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Banner Graphic */}
            <div className="doc-comm-view-banner-right">
              <img
                src={selectedTheme.bannerImg || '/community_hero_mental.jpg'}
                alt={selected.title}
                className="doc-comm-view-banner-img"
              />
            </div>
          </div>

          {/* 2. Create Post Section */}
          <div className="doc-comm-create-box">
            <h3 className="doc-comm-create-box-title">Create Post</h3>
            <form onSubmit={handlePublishPost}>
              <div className="doc-comm-create-input-row">
                <textarea
                  rows={2}
                  className="doc-comm-create-textarea"
                  placeholder="Share your thoughts, ask a question or offer support..."
                  value={newPostBody}
                  onChange={e => setNewPostBody(e.target.value)}
                  required={attachMode !== 'poll'}
                />
                <select
                  className="doc-comm-create-type-select"
                  value={newPostType}
                  onChange={e => setNewPostType(e.target.value)}
                >
                  <option value="General Discussion">General Discussion</option>
                  <option value="Clinical Guidance">Clinical Guidance</option>
                  <option value="Case Study & Research">Case Study & Research</option>
                  <option value="Patient Awareness">Patient Awareness</option>
                  <option value="Nutrition & Lifestyle">Nutrition & Lifestyle</option>
                </select>
              </div>

              {/* Image Attachment Box */}
              {attachMode === 'image' && (
                <div className="doc-comm-attachment-card">
                  <div className="doc-comm-attachment-header">
                    <span className="doc-comm-attachment-title">
                      <ImageIcon size={16} color="#0284c7" /> Attach Image
                    </span>
                    <button
                      type="button"
                      className="doc-comm-remove-attach-btn"
                      onClick={() => {
                        setAttachMode('none');
                        setMediaUrl('');
                      }}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="doc-comm-attach-input-row">
                    <button
                      type="button"
                      className="doc-comm-attach-file-btn"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <Upload size={14} /> Choose File
                    </button>
                    <input
                      type="url"
                      className="doc-comm-attach-text-input"
                      placeholder="Or paste image URL (https://...)"
                      value={mediaUrl}
                      onChange={e => {
                        setMediaUrl(e.target.value);
                        setMediaType('image');
                      }}
                    />
                  </div>
                  {mediaUrl && (
                    <img src={mediaUrl} alt="Preview" className="doc-comm-media-preview" />
                  )}
                </div>
              )}

              {/* Video Attachment Box */}
              {attachMode === 'video' && (
                <div className="doc-comm-attachment-card">
                  <div className="doc-comm-attachment-header">
                    <span className="doc-comm-attachment-title">
                      <PlaySquare size={16} color="#7c3aed" /> Attach Video
                    </span>
                    <button
                      type="button"
                      className="doc-comm-remove-attach-btn"
                      onClick={() => {
                        setAttachMode('none');
                        setMediaUrl('');
                      }}
                      title="Remove video"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="doc-comm-attach-input-row">
                    <button
                      type="button"
                      className="doc-comm-attach-file-btn"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Upload size={14} /> Upload Video File
                    </button>
                    <input
                      type="url"
                      className="doc-comm-attach-text-input"
                      placeholder="Or paste video link / MP4 URL (https://...)"
                      value={mediaUrl}
                      onChange={e => {
                        setMediaUrl(e.target.value);
                        setMediaType('video');
                      }}
                    />
                  </div>
                  {mediaUrl && (
                    <video controls src={mediaUrl} className="doc-comm-media-preview" style={{ maxHeight: '200px' }} />
                  )}
                </div>
              )}

              {/* Poll Creation Box */}
              {attachMode === 'poll' && (
                <div className="doc-comm-attachment-card">
                  <div className="doc-comm-attachment-header">
                    <span className="doc-comm-attachment-title">
                      <Vote size={16} color="#ea580c" /> Create Interactive Poll
                    </span>
                    <button
                      type="button"
                      className="doc-comm-remove-attach-btn"
                      onClick={() => {
                        setAttachMode('none');
                        setPollQuestion('');
                        setPollOptions(['', '']);
                      }}
                      title="Cancel poll"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <input
                    type="text"
                    className="doc-comm-attach-text-input"
                    placeholder="Poll Question (e.g. Do you practice daily mindfulness or breathing exercises?)"
                    value={pollQuestion}
                    onChange={e => setPollQuestion(e.target.value)}
                    required
                  />

                  <div className="doc-comm-poll-box">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="doc-comm-poll-opt-row">
                        <span className="doc-comm-poll-opt-num">#{idx + 1}</span>
                        <input
                          type="text"
                          className="doc-comm-attach-text-input"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={e => handlePollOptionChange(idx, e.target.value)}
                          required
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            className="doc-comm-remove-attach-btn"
                            onClick={() => handleRemovePollOption(idx)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <button
                        type="button"
                        className="doc-comm-poll-add-btn"
                        onClick={handleAddPollOption}
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="doc-comm-create-toolbar">
                <div className="doc-comm-create-tools">
                  <button
                    type="button"
                    className={`doc-comm-tool-btn ${attachMode === 'image' ? 'active' : ''}`}
                    onClick={() => {
                      setAttachMode(attachMode === 'image' ? 'none' : 'image');
                      setMediaType('image');
                    }}
                  >
                    <ImageIcon size={16} color="#0284c7" />
                    <span>Image</span>
                  </button>

                  <button
                    type="button"
                    className={`doc-comm-tool-btn ${attachMode === 'video' ? 'active' : ''}`}
                    onClick={() => {
                      setAttachMode(attachMode === 'video' ? 'none' : 'video');
                      setMediaType('video');
                    }}
                  >
                    <PlaySquare size={16} color="#7c3aed" />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    className={`doc-comm-tool-btn ${attachMode === 'poll' ? 'active' : ''}`}
                    onClick={() => {
                      setAttachMode(attachMode === 'poll' ? 'none' : 'poll');
                    }}
                  >
                    <Vote size={16} color="#ea580c" />
                    <span>Poll</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="doc-comm-submit-post-btn"
                  disabled={submittingPost || (!newPostBody.trim() && !pollQuestion.trim())}
                >
                  <Send size={15} />
                  <span>{submittingPost ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. Discussions Feed Section */}
          <div className="doc-comm-posts-feed">
            {feedLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px' }}>
                <RefreshCw size={28} className="spin" color="#087d43" />
                <p style={{ marginTop: '10px', fontSize: '13.5px', color: '#64748b' }}>
                  Loading discussions from database...
                </p>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <Stethoscope size={40} color="#087d43" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                  No discussions published yet
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Be the first doctor to publish a clinical note, video, or poll in this community!
                </p>
              </div>
            ) : (
              posts.map((post) => {
                const author = post.doctors;
                const isReacted = Boolean(reactions[post.id]);
                const authorAvatar =
                  author?.avatar_url || 'https://randomuser.me/api/portraits/women/44.jpg';
                const poll = post.poll_data;
                const userVotedOpt = poll?.votedUsers?.[doctorId];

                return (
                  <article key={post.id} className="doc-comm-post-card-clean">
                    {/* Main Column: Author, Content, Interactive Polls & Actions */}
                    <div className="doc-comm-post-main-col">
                      <div>
                        <div className="doc-comm-post-header">
                          <div className="doc-comm-post-avatar-wrap">
                            <img src={authorAvatar} alt="" />
                          </div>
                          <div className="doc-comm-post-header-meta">
                            <div className="doc-comm-post-author-row">
                              <b>{author?.name || 'Dr. Verified Clinician'}</b>
                              <Check
                                size={14}
                                strokeWidth={3}
                                style={{
                                  background: '#2563eb',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  padding: '2px',
                                }}
                              />
                            </div>
                            <span className="doc-comm-post-meta-sub">
                              {[
                                author?.speciality || 'General Physician',
                                author?.hospitals?.name || 'Sawai Man Singh Hospital',
                                author?.hospitals?.city || 'Jaipur',
                                timeAgo(post.published_at || post.created_at),
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </span>
                          </div>
                        </div>

                        {post.title && !poll && <h4 className="doc-comm-post-heading">{post.title}</h4>}
                        {post.body && <p className="doc-comm-post-text">{post.body}</p>}

                        {/* Interactive Poll Display if present */}
                        {poll && (
                          <div className="doc-comm-poll-display">
                            <div className="doc-comm-poll-question">
                              <Vote size={17} color="#087d43" />
                              <span>{poll.question}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {poll.options?.map(opt => {
                                const total = poll.totalVotes || 0;
                                const votes = opt.votes || 0;
                                const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                                const isSelected = userVotedOpt === opt.id;

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`doc-comm-poll-option-btn ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleVotePoll(post, opt.id)}
                                  >
                                    <div className="doc-comm-poll-fill" style={{ width: `${pct}%` }} />
                                    <span className="doc-comm-poll-opt-label">
                                      {isSelected && <Check size={14} color="#087d43" strokeWidth={3} />}
                                      {opt.text}
                                    </span>
                                    <span className="doc-comm-poll-opt-pct">
                                      {pct}% ({votes})
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="doc-comm-poll-total">
                              {poll.totalVotes || 0} total vote{(poll.totalVotes || 0) === 1 ? '' : 's'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons row */}
                      <div className="doc-comm-post-actions-row">
                        <button
                          type="button"
                          className={`doc-comm-post-stat-btn ${isReacted ? 'active' : ''}`}
                          onClick={() => toggleReaction(post)}
                        >
                          <Heart
                            size={16}
                            fill={isReacted ? '#e63946' : 'none'}
                            color={isReacted ? '#e63946' : 'currentColor'}
                          />
                          <span>{formatCount(countOf(post, 'community_post_reactions'))}</span>
                        </button>

                        <button
                          type="button"
                          className="doc-comm-post-stat-btn"
                          onClick={() => openComments(post)}
                        >
                          <MessageCircle size={16} />
                          <span>{formatCount(countOf(post, 'community_post_comments'))}</span>
                        </button>

                        <button
                          type="button"
                          className="doc-comm-post-stat-btn"
                          onClick={() => handleShare(selected)}
                        >
                          <Repeat size={16} />
                          <span>{formatCount(Math.floor(countOf(post, 'community_post_reactions') / 3))}</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Uploaded Image or Video from Doctor */}
                    {post.media_url && (
                      <div className="doc-comm-post-right-media-box">
                        {post.media_type === 'video' ? (
                          <video controls src={post.media_url} className="doc-comm-post-right-img" />
                        ) : (
                          <img src={post.media_url} alt="Attached Media" className="doc-comm-post-right-img" />
                        )}
                        <button
                          type="button"
                          className="doc-comm-post-more-btn"
                          onClick={() => handleShare(selected)}
                          title="Share"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════════
           STANDARD DIRECTORY VIEW (MATCHING ARCHITECTURE MOCKUP 1)
           ═════════════════════════════════════════════════════════════════════ */
        <>
          {/* Back to Appointments / Dashboard Button */}
          <button
            type="button"
            className="doc-comm-back-nav-btn"
            onClick={() => (onBack ? onBack() : window.history.back())}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          {/* Hero Banner Section */}
          <div className="doc-comm-hero">
            {/* Left Card */}
            <div className="doc-comm-hero-left">
              <div className="doc-comm-hero-copy">
                <h2>Stronger Communities, Better Healthcare 💚</h2>
                <p>Together, we can create a healthier, kinder and more supportive world.</p>
              </div>
              <div className="doc-comm-hero-img-wrap">
                <img
                  src="/doctor_team_community.jpg"
                  alt="Doctor Team"
                  className="doc-comm-hero-img"
                />
              </div>
            </div>

            {/* Right Community Impact Card */}
            <div className="doc-comm-impact-card">
              <div className="doc-comm-impact-title">Our Community Impact</div>
              <div className="doc-comm-impact-grid">
                {/* Metric 1 */}
                <div className="doc-comm-impact-item">
                  <div className="doc-comm-impact-icon green">
                    <Users size={20} />
                  </div>
                  <div className="doc-comm-impact-meta">
                    <b>{formatCount(impact.professionals)}</b>
                    <span>Healthcare Professionals Across {formatCount(impact.communitiesCount)} communities</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="doc-comm-impact-item">
                  <div className="doc-comm-impact-icon red">
                    <MessageCircle size={20} />
                  </div>
                  <div className="doc-comm-impact-meta">
                    <b>{formatCount(impact.discussions)}</b>
                    <span>Discussions Started</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="doc-comm-impact-item">
                  <div className="doc-comm-impact-icon blue">
                    <HeartHandshake size={20} />
                  </div>
                  <div className="doc-comm-impact-meta">
                    <b>{formatCount(impact.responses)}</b>
                    <span>Helpful Responses</span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="doc-comm-impact-item">
                  <div className="doc-comm-impact-icon orange">
                    <Users size={20} />
                  </div>
                  <div className="doc-comm-impact-meta">
                    <b>{formatCount(impact.members)}</b>
                    <span>Active Members</span>
                  </div>
                </div>
              </div>

              <div className="doc-comm-impact-footer">
                <small>Small acts, big impact.</small>
                <span>Thank you for being the change! 💚</span>
              </div>
            </div>
          </div>

          {/* Popular Communities Section Header & Search/Filter */}
          <div className="doc-comm-section-header">
            <h2 className="doc-comm-section-title">Popular Communities</h2>
            <div className="doc-comm-filter-row">
              {/* Search Bar */}
              <div className="doc-comm-search-wrap">
                <Search size={18} />
                <input
                  type="text"
                  className="doc-comm-search-input"
                  placeholder="Search communities or topics..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    style={{ background: 'transparent', border: 0, cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Filter Dropdown */}
              <div className="doc-comm-cat-select-wrap">
                <button
                  type="button"
                  className="doc-comm-cat-btn"
                  onClick={() => setShowCatMenu(!showCatMenu)}
                >
                  <LayoutGrid size={16} color="#087d43" />
                  <span>{category === 'all' ? 'All Categories' : category}</span>
                  <ChevronDown size={14} color="#64748b" />
                </button>

                {showCatMenu && (
                  <div className="doc-comm-cat-dropdown">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`doc-comm-cat-opt ${category === cat ? 'active' : ''}`}
                        onClick={() => {
                          setCategory(cat);
                          setShowCatMenu(false);
                        }}
                      >
                        {cat === 'all' ? 'All Categories' : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 5-Column Community Grid ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px' }}>
              <RefreshCw size={32} className="spin" color="#087d43" />
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
                Fetching verified communities from database...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px' }}>
              <Users size={44} color="#94a3b8" />
              <h3 style={{ fontSize: '17px', color: '#0f172a', margin: '10px 0 4px 0' }}>
                No communities found
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Try adjusting your search keywords or category filters.
              </p>
            </div>
          ) : (
            <div className="doc-comm-grid">
              {filtered.map(item => {
                const theme = THEMES[item.theme_key] || THEMES[item.disease_key] || THEMES.general;
                const IconComponent = theme.icon;
                const memberCount = countOf(item, 'patient_community_memberships');

                return (
                  <article key={item.id} className="doc-comm-card">
                    <div
                      className="doc-comm-card-icon-wrap"
                      style={{ background: theme.soft, color: theme.color }}
                    >
                      <IconComponent size={28} />
                    </div>

                    <h3 className="doc-comm-card-title">{item.title}</h3>
                    <p className="doc-comm-card-desc">{item.description}</p>

                    <div className="doc-comm-card-members">
                      <Users size={15} color="#087d43" />
                      <span>{formatCount(memberCount)} Members</span>
                    </div>

                    <button
                      type="button"
                      className="doc-comm-card-btn"
                      onClick={() => openCommunity(item)}
                    >
                      <span>View Community</span>
                      <ChevronRight size={15} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Comments Modal ── */}
      {commentPost && (
        <div
          className="doc-comm-modal-overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setCommentPost(null);
          }}
        >
          <div className="doc-comm-modal-card">
            <button
              type="button"
              className="doc-comm-modal-close"
              onClick={() => setCommentPost(null)}
            >
              <X size={18} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0' }}>
              Discussion Comments
            </h2>

            {commentLoading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <RefreshCw size={24} className="spin" color="#087d43" />
              </div>
            ) : comments.length === 0 ? (
              <p style={{ fontSize: '13.5px', color: '#64748b', textAlign: 'center', padding: '20px' }}>
                No comments yet. Be the first to share clinical perspective!
              </p>
            ) : (
              <div className="doc-comm-comment-list">
                {comments.map(c => (
                                    <div key={c.id} className="doc-comm-comment-item">
                    <b>{c.patients?.name || 'Community Member'}</b>
                    <p>{c.body}</p>
                    <small>{timeAgo(c.created_at)}</small>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                rows={3}
                className="doc-comm-create-textarea"
                placeholder="Write a clinical comment or advisory..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                required
              />
              <button
                type="submit"
                style={{
                  alignSelf: 'flex-end',
                  background: '#087d43',
                  color: '#ffffff',
                  border: 0,
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Post Comment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
