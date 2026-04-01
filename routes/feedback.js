const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');
const { awardPoints } = require('../services/points');

const router = express.Router();

router.post('/:ideaId/feedback', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  const { data, error } = await supabase.from('feedbacks').insert({
    idea_id: req.params.ideaId, user_id: req.user.userId, rating, comment
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Auto-award points on feedback
  await awardPoints(req.params.ideaId, rating);
  res.status(201).json(data);
});

module.exports = router;
