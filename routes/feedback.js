const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');
const { awardPoints } = require('../services/points');
const { notifyMultiple } = require('../services/notify');

const router = express.Router();

router.post('/:ideaId/feedback', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  const { data, error } = await supabase.from('feedbacks').insert({
    idea_id: req.params.ideaId, user_id: req.user.userId, rating, comment
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Auto-award points on feedback
  await awardPoints(req.params.ideaId, rating);

  // Get assigned builders
  const { data: assignedBids } = await supabase.from('bids')
    .select('user_id').eq('idea_id', req.params.ideaId).in('status', ['Won', 'assigned']);
  if (assignedBids?.length) {
    const { data: ideaData } = await supabase.from('ideas').select('title').eq('id', req.params.ideaId).single();
    await notifyMultiple(
      assignedBids.map(b => b.user_id),
      `Delivery Rated: ${rating}`,
      `Your work on "${ideaData?.title}" was rated ${rating}. Points have been awarded!`,
      'feedback', req.params.ideaId
    );
  }

  res.status(201).json(data);
});

module.exports = router;
