const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/:ideaId/timelogs', authenticate, async (req, res) => {
  const { hours, notes } = req.body;

  const { data, error } = await supabase.from('time_logs').insert({
    idea_id: req.params.ideaId, user_id: req.user.userId,
    hours, description: notes || '', logged_date: new Date().toISOString().split('T')[0]
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Update actual hours
  const { data: logs } = await supabase.from('time_logs')
    .select('hours').eq('idea_id', req.params.ideaId);
  const totalHours = (logs || []).reduce((sum, l) => sum + l.hours, 0);
  await supabase.from('ideas').update({ actual_hours: totalHours }).eq('id', req.params.ideaId);

  res.status(201).json({
    hours: data.hours,
    notes: data.description,
    date: data.logged_date,
    userName: req.user.name
  });
});

router.get('/:ideaId/timelogs', authenticate, async (req, res) => {
  const { data: logs } = await supabase.from('time_logs')
    .select('*').eq('idea_id', req.params.ideaId).order('logged_date', { ascending: false });

  const userIds = [...new Set((logs || []).map(l => l.user_id))];
  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', userIds)
    : { data: [] };
  const userMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));

  res.json((logs || []).map(l => ({
    hours: l.hours,
    notes: l.description,
    date: l.logged_date,
    userName: userMap[l.user_id] || 'Unknown'
  })));
});

module.exports = router;
