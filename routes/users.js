const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /users/me — current user profile
router.get('/me', authenticate, async (req, res) => {
  const { data: user } = await supabase.from('users')
    .select('*').eq('id', req.user.userId).single();
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Get profile stats
  const { data: memberOf } = await supabase.from('idea_members')
    .select('idea_id').eq('user_id', user.id);
  const ideaIds = (memberOf || []).map(m => m.idea_id);

  let ideasBuilt = 0, onTimeCount = 0, totalCompleted = 0;
  if (ideaIds.length > 0) {
    const { data: ideas } = await supabase.from('ideas')
      .select('*').in('id', ideaIds).eq('status', 'Completed');
    totalCompleted = ideas?.length || 0;
    ideasBuilt = totalCompleted;
    onTimeCount = (ideas || []).filter(i =>
      i.completed_at && i.expected_delivery_date &&
      new Date(i.completed_at) <= new Date(i.expected_delivery_date)
    ).length;
  }

  // Get feedback ratings
  const { data: feedbacks } = await supabase.from('feedbacks')
    .select('rating, idea_id');
  const userFeedbacks = (feedbacks || []).filter(f => ideaIds.includes(f.idea_id));
  const ratingMap = { Excellent: 5, Good: 4, Average: 3, Poor: 2 };
  const avgRating = userFeedbacks.length > 0
    ? userFeedbacks.reduce((s, f) => s + (ratingMap[f.rating] || 3), 0) / userFeedbacks.length
    : 0;

  res.json({
    id: user.id,
    name: user.full_name,
    email: user.email,
    pictureUrl: user.avatar_url,
    role: user.role,
    totalPoints: user.total_points,
    ideasBuilt,
    onTimePercent: totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 0,
    avgRating: Math.round(avgRating * 10) / 10,
    pointsHistory: [],
    badges: []
  });
});

// GET /users — all users (any authenticated user, for owner search)
router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('users')
    .select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  res.json(data.map(u => ({
    id: u.id, email: u.email, name: u.full_name,
    pictureUrl: u.avatar_url, role: u.role,
    department: u.department, totalPoints: u.total_points
  })));
});

// PATCH /users/:id/role
router.patch('/:id/role', authenticate, requireRole('Admin'), async (req, res) => {
  const { role } = req.body;
  const { data, error } = await supabase.from('users')
    .update({ role }).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: data.id, email: data.email, name: data.full_name,
    pictureUrl: data.avatar_url, role: data.role,
    totalPoints: data.total_points
  });
});

// GET /users/:id/points
router.get('/:id/points', authenticate, async (req, res) => {
  const { data } = await supabase.from('users')
    .select('id, total_points').eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'User not found' });
  res.json({ userId: data.id, totalPoints: data.total_points });
});

module.exports = router;
