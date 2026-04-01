const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/:ideaId/timelogs', authenticate, async (req, res) => {
  const { hours, description, loggedDate } = req.body;

  const { data, error } = await supabase.from('time_logs').insert({
    idea_id: req.params.ideaId, user_id: req.user.userId,
    hours, description, logged_date: loggedDate
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Update actual hours on idea
  const { data: logs } = await supabase.from('time_logs')
    .select('hours').eq('idea_id', req.params.ideaId);
  const totalHours = logs?.reduce((sum, l) => sum + l.hours, 0) || 0;
  await supabase.from('ideas').update({ actual_hours: totalHours }).eq('id', req.params.ideaId);

  res.status(201).json(data);
});

router.get('/:ideaId/timelogs', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('time_logs')
    .select('*').eq('idea_id', req.params.ideaId).order('logged_date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
