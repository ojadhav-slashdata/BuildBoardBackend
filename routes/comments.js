const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/:ideaId/comments', authenticate, async (req, res) => {
  const { text } = req.body;
  const { data, error } = await supabase.from('comments').insert({
    idea_id: req.params.ideaId, user_id: req.user.userId, content: text
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({
    text: data.content,
    userName: req.user.name,
    pictureUrl: req.user.pictureUrl,
    createdAt: data.created_at
  });
});

router.get('/:ideaId/comments', authenticate, async (req, res) => {
  const { data: comments } = await supabase.from('comments')
    .select('*').eq('idea_id', req.params.ideaId).order('created_at', { ascending: false });

  const userIds = [...new Set((comments || []).map(c => c.user_id))];
  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name, avatar_url').in('id', userIds)
    : { data: [] };
  const userMap = Object.fromEntries((users || []).map(u => [u.id, u]));

  res.json((comments || []).map(c => ({
    text: c.content,
    userName: userMap[c.user_id]?.full_name || 'Unknown',
    pictureUrl: userMap[c.user_id]?.avatar_url || null,
    createdAt: c.created_at
  })));
});

module.exports = router;
