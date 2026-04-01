const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticate, async (req, res) => {
  const { data: ideas } = await supabase.from('ideas').select('*');
  const { data: timeLogs } = await supabase.from('time_logs').select('hours');
  const { data: members } = await supabase.from('idea_members').select('user_id');

  const uniqueContributors = new Set(members?.map(m => m.user_id) || []);

  res.json({
    totalIdeas: ideas?.length || 0,
    approvedIdeas: ideas?.filter(i => i.status === 'approved').length || 0,
    completedIdeas: ideas?.filter(i => i.status === 'completed').length || 0,
    inProgressIdeas: ideas?.filter(i => i.status === 'in_progress').length || 0,
    activeContributors: uniqueContributors.size,
    totalHoursLogged: timeLogs?.reduce((sum, t) => sum + t.hours, 0) || 0,
    pocCount: ideas?.filter(i => i.project_type === 'poc').length || 0,
    productCount: ideas?.filter(i => i.project_type === 'product').length || 0
  });
});

router.get('/hours', authenticate, async (req, res) => {
  const { data: ideas } = await supabase.from('ideas')
    .select('id, title, size, estimated_hours, actual_hours');
  res.json(ideas || []);
});

router.get('/leaderboard', authenticate, async (req, res) => {
  const { data: users } = await supabase.from('users')
    .select('id, full_name, avatar_url, total_points').order('total_points', { ascending: false });
  const { data: ideas } = await supabase.from('ideas').select('id, status');
  const { data: members } = await supabase.from('idea_members').select('idea_id, user_id');

  const completedIds = new Set(ideas?.filter(i => i.status === 'completed').map(i => i.id) || []);

  res.json((users || []).map(u => {
    const userIdeaIds = new Set(members?.filter(m => m.user_id === u.id).map(m => m.idea_id) || []);
    const completed = [...userIdeaIds].filter(id => completedIds.has(id)).length;
    return { ...u, ideasCompleted: completed };
  }));
});

router.get('/delivery-health', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  const { data: ideas } = await supabase.from('ideas')
    .select('*').eq('status', 'completed');

  const completed = (ideas || []).filter(i => i.completed_at && i.expected_delivery_date);
  const total = completed.length;

  let early = 0, onTime = 0, late = 0;
  for (const i of completed) {
    const c = new Date(i.completed_at);
    const e = new Date(i.expected_delivery_date);
    const dayBefore = new Date(e); dayBefore.setDate(dayBefore.getDate() - 1);
    if (c > e) late++;
    else if (c < dayBefore) early++;
    else onTime++;
  }

  res.json({
    totalCompleted: total, onTimeCount: onTime, earlyCount: early, lateCount: late,
    onTimePercentage: total > 0 ? ((early + onTime) * 100.0 / total) : 0
  });
});

router.get('/employee-hours', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  const { data: users } = await supabase.from('users').select('id, full_name');
  const { data: timeLogs } = await supabase.from('time_logs').select('*');
  const { data: members } = await supabase.from('idea_members').select('idea_id, user_id');
  const { data: ideas } = await supabase.from('ideas').select('id, title, status');

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0,0,0,0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  res.json((users || []).map(u => {
    const userLogs = (timeLogs || []).filter(t => t.user_id === u.id);
    const userIdeaIds = new Set((members || []).filter(m => m.user_id === u.id).map(m => m.idea_id));
    const activeIdea = (ideas || []).find(i => userIdeaIds.has(i.id) && i.status === 'in_progress');

    return {
      userId: u.id,
      fullName: u.full_name,
      hoursThisWeek: userLogs.filter(l => new Date(l.created_at) >= weekStart).reduce((s, l) => s + l.hours, 0),
      hoursThisMonth: userLogs.filter(l => new Date(l.created_at) >= monthStart).reduce((s, l) => s + l.hours, 0),
      hoursAllTime: userLogs.reduce((s, l) => s + l.hours, 0),
      activeIdeaId: activeIdea?.id || null,
      activeIdeaTitle: activeIdea?.title || null
    };
  }));
});

module.exports = router;
