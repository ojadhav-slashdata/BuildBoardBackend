const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:ideaId/members', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('idea_members')
    .select('*').eq('idea_id', req.params.ideaId);
  if (error) return res.status(500).json({ error: error.message });

  // Access control: only members, managers, admins
  const isMember = data.some(m => m.user_id === req.user.userId);
  if (!isMember && !['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(data);
});

module.exports = router;
