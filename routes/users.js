const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase.from('users')
    .select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  res.json(data.map(u => ({
    id: u.id, email: u.email, fullName: u.full_name,
    avatarUrl: u.avatar_url, role: u.role,
    department: u.department, totalPoints: u.total_points
  })));
});

router.patch('/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  const { role } = req.body;
  const { data, error } = await supabase.from('users')
    .update({ role }).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: data.id, email: data.email, fullName: data.full_name,
    avatarUrl: data.avatar_url, role: data.role,
    department: data.department, totalPoints: data.total_points
  });
});

router.get('/:id/points', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('users')
    .select('id, total_points').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'User not found' });
  res.json({ userId: data.id, totalPoints: data.total_points });
});

module.exports = router;
