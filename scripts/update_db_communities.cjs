const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'db.js');
let code = fs.readFileSync(filePath, 'utf8');

const updatedCommunitiesCode = `
const DEFAULT_COMMUNITIES = [
  {
    id: 'c0000001-0001-0001-0001-000000000001',
    title: 'Mental Health & Wellness',
    category: 'Mental Health',
    theme_key: 'mental',
    disease_key: 'mental',
    tagline: 'You are not alone. We listen. We support. We care.',
    description: 'A safe and supportive space to share, learn and grow together. Let us break the stigma and build a mentally healthier world.',
    is_verified: true,
    is_active: true,
    sort_order: 1,
    eligible_specialities: ['Psychiatry', 'Clinical Psychology', 'Counseling', 'Mind-Body Medicine'],
    patient_community_memberships: [{ count: 1240 }],
    community_posts: [{ count: 18 }],
    community_professionals: [{ count: 24 }]
  },
  {
    id: 'c0000001-0002-0002-0002-000000000002',
    title: 'Diabetes & Metabolic Wellness',
    category: 'Chronic Conditions',
    theme_key: 'diabetes',
    disease_key: 'diabetes',
    tagline: 'Empowering healthy living through nutrition, exercise, and clinical monitoring.',
    description: 'Evidence-based glycemic control guidance, dietary plans, insulin management, and peer encouragement for diabetic patients.',
    is_verified: true,
    is_active: true,
    sort_order: 2,
    eligible_specialities: ['Endocrinology', 'Diabetology', 'General Medicine', 'Clinical Nutrition'],
    patient_community_memberships: [{ count: 2150 }],
    community_posts: [{ count: 32 }],
    community_professionals: [{ count: 38 }]
  },
  {
    id: 'c0000001-0003-0003-0003-000000000003',
    title: 'Maternal & Child Care',
    category: 'Women & Children',
    theme_key: 'maternal',
    disease_key: 'maternal',
    tagline: 'Comprehensive care for mothers and little ones at every step.',
    description: 'Prenatal wellness, safe delivery awareness, postnatal recovery, newborn immunization, and pediatric nutrition guidance.',
    is_verified: true,
    is_active: true,
    sort_order: 3,
    eligible_specialities: ['Obstetrics & Gynecology', 'Pediatrics', 'Neonatology', 'Lactation Consulting'],
    patient_community_memberships: [{ count: 1890 }],
    community_posts: [{ count: 26 }],
    community_professionals: [{ count: 29 }]
  },
  {
    id: 'c0000001-0004-0004-0004-000000000004',
    title: 'Heart Health Circle',
    category: 'Cardiology',
    theme_key: 'cardiac',
    disease_key: 'cardiac',
    tagline: 'Protecting your heart with preventive cardiology and post-op care.',
    description: 'Managing hypertension, cholesterol, coronary wellness, and rehabilitation routines led by verified cardiologists.',
    is_verified: true,
    is_active: true,
    sort_order: 4,
    eligible_specialities: ['Cardiology', 'Cardiothoracic Surgery', 'Preventive Cardiology'],
    patient_community_memberships: [{ count: 1420 }],
    community_posts: [{ count: 19 }],
    community_professionals: [{ count: 22 }]
  },
  {
    id: 'c0000001-0005-0005-0005-000000000005',
    title: 'Cancer Warriors Network',
    category: 'Oncology',
    theme_key: 'cancer',
    disease_key: 'cancer',
    tagline: 'Standing strong with cancer patients and families with hope and courage.',
    description: 'Oncology care navigation, chemotherapy support, radiation therapy insights, and survivor stories.',
    is_verified: true,
    is_active: true,
    sort_order: 5,
    eligible_specialities: ['Medical Oncology', 'Surgical Oncology', 'Radiation Oncology', 'Palliative Care'],
    patient_community_memberships: [{ count: 980 }],
    community_posts: [{ count: 15 }],
    community_professionals: [{ count: 19 }]
  },
  {
    id: 'c0000001-0006-0006-0006-000000000006',
    title: 'AYUSH & Integrative Healing',
    category: 'AYUSH / Alternative',
    theme_key: 'ayush',
    disease_key: 'ayush',
    tagline: 'Ancient wisdom meets modern evidence for holistic well-being.',
    description: 'Ayurvedic Rasayana, Dinacharya, herbal formulations, Yoga therapy, and Panchakarma lifestyle management.',
    is_verified: true,
    is_active: true,
    sort_order: 6,
    eligible_specialities: ['Ayurveda', 'Panchakarma', 'Kayachikitsa', 'Yoga & Naturopathy'],
    patient_community_memberships: [{ count: 1640 }],
    community_posts: [{ count: 24 }],
    community_professionals: [{ count: 31 }]
  },
  {
    id: 'c0000001-0007-0007-0007-000000000007',
    title: 'Respiratory & Asthma Health',
    category: 'Pulmonology',
    theme_key: 'respiratory',
    disease_key: 'respiratory',
    tagline: 'Breathing easy through clear air, inhaler techniques, and allergy care.',
    description: 'Guidance on managing asthma, COPD, seasonal allergies, post-viral respiratory recovery, and breathing exercises.',
    is_verified: true,
    is_active: true,
    sort_order: 7,
    eligible_specialities: ['Pulmonology', 'Chest Medicine', 'Respiratory Therapy', 'Allergy & Immunology'],
    patient_community_memberships: [{ count: 1110 }],
    community_posts: [{ count: 14 }],
    community_professionals: [{ count: 18 }]
  },
  {
    id: 'c0000001-0008-0008-0008-000000000008',
    title: 'Senior Wellness & Care',
    category: 'Geriatrics',
    theme_key: 'senior',
    disease_key: 'geriatrics',
    tagline: 'Dignified, healthy, and joyous golden years for our elders.',
    description: 'Joint mobility, dementia care, fall prevention, balanced nutrition, and medication management for seniors.',
    is_verified: true,
    is_active: true,
    sort_order: 8,
    eligible_specialities: ['Geriatrics', 'Orthopedics', 'Neurology', 'Physiotherapy'],
    patient_community_memberships: [{ count: 870 }],
    community_posts: [{ count: 12 }],
    community_professionals: [{ count: 15 }]
  },
  {
    id: 'c0000001-0009-0009-0009-000000000009',
    title: 'Caregivers Sanctuary',
    category: 'Support & Caregiving',
    theme_key: 'caregiver',
    disease_key: 'caregiver',
    tagline: 'Caring for those who care for others.',
    description: 'Burnout prevention, peer coping circles, respite care tips, and emotional resilience for family caregivers.',
    is_verified: true,
    is_active: true,
    sort_order: 9,
    eligible_specialities: ['Psychiatry', 'Social Work', 'Palliative Care', 'Nursing'],
    patient_community_memberships: [{ count: 750 }],
    community_posts: [{ count: 10 }],
    community_professionals: [{ count: 14 }]
  },
  {
    id: 'c0000001-0010-0010-0010-000000000010',
    title: 'Blood & Hematology Network',
    category: 'Hematology',
    theme_key: 'blood',
    disease_key: 'blood',
    tagline: 'Every drop counts. Life-saving blood donation and anemia awareness.',
    description: 'Emergency blood drives, thalassemia support, anemia prevention, and voluntary donor mobilization.',
    is_verified: true,
    is_active: true,
    sort_order: 10,
    eligible_specialities: ['Hematology', 'Transfusion Medicine', 'General Medicine'],
    patient_community_memberships: [{ count: 2300 }],
    community_posts: [{ count: 35 }],
    community_professionals: [{ count: 42 }]
  }
];

const DEFAULT_POSTS = [
  {
    id: 'p0000001-0001-0001-0001-000000000001',
    community_id: 'c0000001-0001-0001-0001-000000000001',
    doctor_id: 'd0000001-0002-0002-0002-000000000001',
    title: '5 Daily Grounding Techniques for Anxiety Relief',
    body: 'When experiencing high anxiety or acute stress, the 5-4-3-2-1 sensory grounding method helps restore vagal tone and lowers heart rate. Acknowledge 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 slow breath.',
    post_type: 'Clinical Guidance',
    media_url: null,
    media_type: null,
    poll_data: {
      question: 'How often do you take a 5-minute mindful breathing break during stressful days?',
      options: [
        { id: 'opt-1', text: 'Daily without fail', votes: 142 },
        { id: 'opt-2', text: 'A few times a week', votes: 88 },
        { id: 'opt-3', text: 'Rarely, but want to start', votes: 210 },
        { id: 'opt-4', text: 'Never tried grounding', votes: 45 }
      ],
      totalVotes: 485,
      votedUsers: {}
    },
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    doctors: {
      name: 'Dr. Ananya Sharma',
      degrees: 'MBBS, MD (Psychiatry)',
      speciality: 'Psychiatrist',
      avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
      hospitals: { name: 'Sawai Man Singh Hospital', city: 'Jaipur' }
    },
    community_post_reactions: [{ count: 68 }],
    community_post_comments: [{ count: 14 }]
  },
  {
    id: 'p0000001-0002-0002-0002-000000000002',
    community_id: 'c0000001-0001-0001-0001-000000000001',
    doctor_id: 'd0000001-0001-0001-0001-000000000001',
    title: 'Recognizing Early Signs of Clinical Burnout',
    body: 'Emotional exhaustion, depersonalization, and decreased sense of accomplishment are clinical markers of burnout. Prioritize micro-rest periods and consult your healthcare provider if sleep disturbance persists over 2 weeks.',
    post_type: 'General Discussion',
    media_url: '/community_hero_mental.jpg',
    media_type: 'image',
    poll_data: null,
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    published_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    doctors: {
      name: 'Dr. Randeep Guleria',
      degrees: 'MBBS, MD (General Medicine)',
      speciality: 'General Physician',
      avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
      hospitals: { name: 'AIIMS New Delhi', city: 'New Delhi' }
    },
    community_post_reactions: [{ count: 124 }],
    community_post_comments: [{ count: 28 }]
  }
];

const communities = {
  async getDirectory() {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('communities')
        .select('*, patient_community_memberships(count), community_posts(count), community_professionals(count)')
        .eq('is_active', true).order('sort_order').order('title');
      if (!error && data && data.length > 0) return { data, error: null };
    }
    const local = lsRead('swasthya_communities');
    if (local && local.length > 0) return { data: local, error: null };
    lsWrite('swasthya_communities', DEFAULT_COMMUNITIES);
    return { data: DEFAULT_COMMUNITIES, error: null };
  },

  async getImpact() {
    if (USE_SUPABASE()) {
      try {
        const tables = ['patient_community_memberships', 'community_posts', 'community_post_reactions', 'community_professionals'];
        const results = await Promise.all(tables.map(table => supabase.from(table).select('*', { count: 'exact', head: true })));
        const firstError = results.find(result => result.error)?.error || null;
        if (!firstError) {
          return {
            data: {
              professionals: results[3].count || 240,
              communitiesCount: 10,
              discussions: results[1].count || 82,
              responses: results[2].count || 640,
              members: results[0].count || 14200
            },
            error: null
          };
        }
      } catch (e) {}
    }
    return {
      data: {
        professionals: 248,
        communitiesCount: 10,
        discussions: 94,
        responses: 840,
        members: 15600
      },
      error: null
    };
  },

  async getMemberships(patientId) {
    if (!patientId) return { data: [], error: null };
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('patient_community_memberships').select('community_id').eq('patient_id', patientId);
      if (!error) return { data: data || [], error: null };
    }
    const localMembers = lsRead('swasthya_community_memberships') || [];
    return { data: localMembers.filter(m => m.patient_id === patientId), error: null };
  },

  async setMembership(patientId, communityId, joined) {
    if (!patientId) return { data: null, error: new Error('Session is required') };
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('set_community_membership', { p_patient_id: patientId, p_community_id: communityId, p_joined: joined });
      if (!error) return { data, error: null };
    }
    let localMembers = lsRead('swasthya_community_memberships') || [];
    if (joined) {
      if (!localMembers.some(m => m.patient_id === patientId && m.community_id === communityId)) {
        localMembers.push({ patient_id: patientId, community_id: communityId, created_at: new Date().toISOString() });
      }
    } else {
      localMembers = localMembers.filter(m => !(m.patient_id === patientId && m.community_id === communityId));
    }
    lsWrite('swasthya_community_memberships', localMembers);
    return { data: true, error: null };
  },

  async getPosts(communityId) {
    let supabasePosts = [];
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('community_posts')
        .select('*, doctors(name,degrees,speciality,avatar_url,hospitals(name,city)), community_post_reactions(count), community_post_comments(count)')
        .eq('community_id', communityId).eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      if (!error && data && data.length > 0) supabasePosts = data;
    }
    const localPosts = lsRead('swasthya_community_posts') || DEFAULT_POSTS;
    const filteredLocal = localPosts.filter(p => p.community_id === communityId);
    // Merge Supabase and local posts with deduplication
    const mergedMap = new Map();
    [...supabasePosts, ...filteredLocal].forEach(p => {
      if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
    });
    return { data: Array.from(mergedMap.values()), error: null };
  },

  async publishDoctorPost({ doctor, staffId, communityId, title, body, postType, mediaUrl, mediaType, pollData }) {
    const newPost = {
      id: uuid(),
      community_id: communityId,
      doctor_id: staffId || doctor?.id || 'd0000001-0002-0002-0002-000000000001',
      title: title || null,
      body: body || '',
      post_type: postType || 'Clinical Guidance',
      media_url: mediaUrl || null,
      media_type: mediaType || (mediaUrl ? 'image' : null),
      poll_data: pollData || null,
      status: 'published',
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      doctors: {
        name: doctor?.name || 'Dr. Ananya Sharma',
        degrees: doctor?.degrees || 'MBBS, MD',
        speciality: doctor?.speciality || doctor?.specialty || 'General Physician',
        avatar_url: doctor?.avatar_url || doctor?.avatar || 'https://randomuser.me/api/portraits/women/44.jpg',
        hospitals: {
          name: doctor?.hospitalName || doctor?.hospitals?.name || 'Sawai Man Singh Hospital',
          city: doctor?.city || doctor?.hospitals?.city || 'Jaipur'
        }
      },
      community_post_reactions: [{ count: 0 }],
      community_post_comments: [{ count: 0 }]
    };

    if (USE_SUPABASE()) {
      try {
        await supabase.from('community_posts').insert({
          id: newPost.id,
          community_id: communityId,
          doctor_id: newPost.doctor_id,
          title: newPost.title,
          body: newPost.body,
          post_type: newPost.post_type,
          media_url: newPost.media_url,
          status: 'published'
        });
      } catch (e) {}
    }

    const localPosts = lsRead('swasthya_community_posts') || DEFAULT_POSTS;
    localPosts.unshift(newPost);
    lsWrite('swasthya_community_posts', localPosts);
    return { data: newPost, error: null };
  },

  async votePoll({ communityId, postId, optionId, userId }) {
    const localPosts = lsRead('swasthya_community_posts') || DEFAULT_POSTS;
    const postIdx = localPosts.findIndex(p => p.id === postId);
    if (postIdx === -1) return { data: null, error: new Error('Post not found') };
    
    const post = localPosts[postIdx];
    if (!post.poll_data) return { data: null, error: new Error('No poll attached') };

    const poll = post.poll_data;
    if (!poll.votedUsers) poll.votedUsers = {};
    const previousVote = poll.votedUsers[userId];

    poll.options = poll.options.map(opt => {
      let v = opt.votes || 0;
      if (previousVote === opt.id) v = Math.max(0, v - 1);
      if (opt.id === optionId) v += 1;
      return { ...opt, votes: v };
    });

    poll.votedUsers[userId] = optionId;
    poll.totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    localPosts[postIdx] = { ...post, poll_data: poll };
    lsWrite('swasthya_community_posts', localPosts);
    return { data: localPosts[postIdx], error: null };
  },

  async getPatientReactions(patientId, postIds) {
    if (!patientId || !postIds?.length) return { data: [], error: null };
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('community_post_reactions')
        .select('post_id,reaction_type').eq('patient_id', patientId).in('post_id', postIds);
      if (!error) return { data: data || [], error: null };
    }
    const localReactions = lsRead('swasthya_post_reactions') || [];
    return { data: localReactions.filter(r => r.patient_id === patientId && postIds.includes(r.post_id)), error: null };
  },

  async toggleReaction(patientId, postId, reactionType = 'helpful') {
    if (!patientId) return { data: null, error: new Error('Session is required') };
    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.rpc('set_community_post_reaction', { p_patient_id: patientId, p_post_id: postId, p_reaction_type: reactionType });
        if (!error) return { data, error: null };
      } catch (e) {}
    }
    let localReactions = lsRead('swasthya_post_reactions') || [];
    const exists = localReactions.some(r => r.patient_id === patientId && r.post_id === postId);
    if (exists) {
      localReactions = localReactions.filter(r => !(r.patient_id === patientId && r.post_id === postId));
    } else {
      localReactions.push({ patient_id: patientId, post_id: postId, reaction_type: reactionType, created_at: new Date().toISOString() });
    }
    lsWrite('swasthya_post_reactions', localReactions);
    return { data: !exists, error: null };
  },

  async getComments(postId) {
    let supabaseComments = [];
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('community_post_comments')
        .select('*, patients(name)')
        .eq('post_id', postId).eq('status', 'published').order('created_at');
      if (!error && data) supabaseComments = data;
    }
    const localComments = lsRead('swasthya_post_comments') || [];
    const filteredLocal = localComments.filter(c => c.post_id === postId);
    return { data: [...supabaseComments, ...filteredLocal], error: null };
  },

  async addComment(patientId, postId, body, authorName) {
    if (!patientId) return { data: null, error: new Error('Session is required') };
    const newComment = {
      id: uuid(),
      post_id: postId,
      patient_id: patientId,
      body: body?.trim() || '',
      patients: { name: authorName || 'Community Member' },
      status: 'published',
      created_at: new Date().toISOString()
    };
    if (USE_SUPABASE()) {
      try {
        await supabase.rpc('add_community_post_comment', { p_patient_id: patientId, p_post_id: postId, p_body: body });
      } catch (e) {}
    }
    const localComments = lsRead('swasthya_post_comments') || [];
    localComments.push(newComment);
    lsWrite('swasthya_post_comments', localComments);
    return { data: newComment, error: null };
  }
};
`;

const startMarker = 'const communities = {';
const endMarker = 'const donations = {';

const sIdx = code.indexOf(startMarker);
const eIdx = code.indexOf(endMarker);

if (sIdx !== -1 && eIdx !== -1) {
  code = code.slice(0, sIdx) + updatedCommunitiesCode.trim() + '\n\n' + code.slice(eIdx);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully updated communities database layer in src/lib/db.js');
} else {
  console.error('Could not locate start/end markers in db.js');
}
