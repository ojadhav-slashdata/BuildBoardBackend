const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /notifications — current user's notifications
router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('notifications')
    .select('*')
    .eq('user_id', req.user.userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });

  const unreadCount = (data || []).filter(n => !n.is_read).length;
  res.json({ notifications: data || [], unreadCount });
});

// PATCH /notifications/:id/read — mark as read
router.patch('/:id/read', authenticate, async (req, res) => {
  await supabase.from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.userId);
  res.json({ read: true });
});

// PATCH /notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req, res) => {
  await supabase.from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user.userId)
    .eq('is_read', false);
  res.json({ readAll: true });
});

module.exports = router;
