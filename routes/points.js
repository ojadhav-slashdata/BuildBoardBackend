const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/milestones/ready', authenticate, requireRole('hr', 'admin'), async (req, res) => {
  const { data, error } = await supabase.from('milestones')
    .select('*').eq('is_claimed', false);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
