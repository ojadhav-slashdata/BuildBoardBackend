const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /notifications — current user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });

    const unreadCount = (data || []).filter(n => !n.is_read).length;
    res.json({ notifications: data || [], unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /notifications/read-all — mark all as read (MUST be before /:id routes)
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.userId)
      .eq('is_read', false);
    res.json({ readAll: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /notifications/:id/read — mark single as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);
    res.json({ read: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
