const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/:ideaId/comments', authenticate, async (req, res) => {
  const { content } = req.body;
  const { data, error } = await supabase.from('comments').insert({
    idea_id: req.params.ideaId, user_id: req.user.userId, content
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/:ideaId/comments', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('comments')
    .select('*').eq('idea_id', req.params.ideaId).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
