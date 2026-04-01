const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { awardIdeaSubmissionPoints } = require('../services/points');

const router = express.Router();

// GET /ideas — list with optional filters
router.get('/', authenticate, async (req, res) => {
  let query = supabase.from('ideas').select('*').order('created_at', { ascending: false });

  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.category) query = query.eq('category', req.query.category);
  if (req.query.projectType) query = query.eq('project_type', req.query.projectType);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Map to frontend shape
  const ideas = (data || []).map(mapIdeaToResponse);
  res.json(ideas);
});

// GET /ideas/:id — full detail with timeLogs, comments, teamMembers
router.get('/:id', authenticate, async (req, res) => {
  const { data: idea } = await supabase.from('ideas')
    .select('*').eq('id', req.params.id).single();
  if (!idea) return res.status(404).json({ error: 'Idea not found' });

  // Get time logs with user names
  const { data: logs } = await supabase.from('time_logs')
    .select('*').eq('idea_id', req.params.id).order('logged_date', { ascending: false });
  const logUserIds = [...new Set((logs || []).map(l => l.user_id))];
  const { data: logUsers } = logUserIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', logUserIds)
    : { data: [] };
  const userMap = Object.fromEntries((logUsers || []).map(u => [u.id, u.full_name]));

  const timeLogs = (logs || []).map(l => ({
    hours: l.hours,
    notes: l.description || '',
    date: l.logged_date,
    userName: userMap[l.user_id] || 'Unknown'
  }));

  // Get comments with user info
  const { data: rawComments } = await supabase.from('comments')
    .select('*').eq('idea_id', req.params.id).order('created_at', { ascending: false });
  const commentUserIds = [...new Set((rawComments || []).map(c => c.user_id))];
  const { data: commentUsers } = commentUserIds.length > 0
    ? await supabase.from('users').select('id, full_name, avatar_url').in('id', commentUserIds)
    : { data: [] };
  const commentUserMap = Object.fromEntries((commentUsers || []).map(u => [u.id, u]));

  const comments = (rawComments || []).map(c => ({
    text: c.content,
    userName: commentUserMap[c.user_id]?.full_name || 'Unknown',
    pictureUrl: commentUserMap[c.user_id]?.avatar_url || null,
    createdAt: c.created_at
  }));

  // Get team members
  const { data: members } = await supabase.from('idea_members')
    .select('user_id, role').eq('idea_id', req.params.id);
  const memberUserIds = (members || []).map(m => m.user_id);
  const { data: memberUsers } = memberUserIds.length > 0
    ? await supabase.from('users').select('id, full_name, avatar_url').in('id', memberUserIds)
    : { data: [] };

  const teamMembers = (memberUsers || []).map(u => ({
    id: u.id,
    name: u.full_name,
    pictureUrl: u.avatar_url
  }));

  // Get feedback
  const { data: feedbackData } = await supabase.from('feedbacks')
    .select('*').eq('idea_id', req.params.id);
  const feedback = (feedbackData || []).map(f => ({
    rating: f.rating,
    comment: f.comment
  }));

  res.json({
    ...mapIdeaToResponse(idea),
    timeLogs,
    comments,
    teamMembers,
    feedback
  });
});

// POST /ideas — create
router.post('/', authenticate, async (req, res) => {
  const { title, description, category, projectType, projectOwner } = req.body;
  const userId = req.user.userId;

  const { data: idea, error } = await supabase.from('ideas').insert({
    title,
    description,
    category,
    project_type: projectType || 'POC',
    priority: 'medium',
    project_owner_name: projectOwner || null,
    submitted_by: userId,
    status: 'PendingApproval',
    size: 'Micro',
    complexity: 'Low'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('idea_members').insert({
    idea_id: idea.id, user_id: userId, role: 'owner'
  });

  res.status(201).json(mapIdeaToResponse(idea));
});

// PATCH /ideas/:id/approve
router.patch('/:id/approve', authenticate, requireRole('Manager', 'Admin'), async (req, res) => {
  const { size, complexity, bidCutoffDate, expectedDeliveryDate, estimatedHours, projectType, minHours, maxHours } = req.body;

  const { data: existing } = await supabase.from('ideas').select('submitted_by').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Idea not found' });

  const { data, error } = await supabase.from('ideas').update({
    status: 'BiddingOpen',
    approved_by: req.user.userId,
    size: size || 'Micro',
    complexity: complexity || 'Low',
    bid_cutoff_date: bidCutoffDate,
    expected_delivery_date: expectedDeliveryDate,
    estimated_hours: estimatedHours || null,
    min_hours: minHours || null,
    max_hours: maxHours || null,
    ...(projectType !== undefined && { project_type: projectType }),
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });

  await awardIdeaSubmissionPoints(existing.submitted_by);
  res.json(mapIdeaToResponse(data));
});

// PATCH /ideas/:id/reject
router.patch('/:id/reject', authenticate, requireRole('Manager', 'Admin'), async (req, res) => {
  const { data, error } = await supabase.from('ideas').update({
    status: 'Rejected',
    approved_by: req.user.userId,
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(mapIdeaToResponse(data));
});

// PATCH /ideas/:id/complete
router.patch('/:id/complete', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('ideas').update({
    status: 'Completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(mapIdeaToResponse(data));
});

// Helper: map DB idea to FE response shape
function mapIdeaToResponse(idea) {
  return {
    _id: idea.id,
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    projectType: idea.project_type,
    projectOwner: idea.project_owner_name || null,
    status: idea.status,
    size: idea.size,
    complexity: idea.complexity,
    priority: idea.priority,
    submittedBy: idea.submitted_by,
    approvedBy: idea.approved_by,
    estimatedHours: idea.estimated_hours,
    actualHours: idea.actual_hours,
    pointsReward: idea.points_reward,
    bidCutoffDate: idea.bid_cutoff_date,
    expectedDeliveryDate: idea.expected_delivery_date,
    completedAt: idea.completed_at,
    createdAt: idea.created_at,
    updatedAt: idea.updated_at
  };
}

module.exports = router;
