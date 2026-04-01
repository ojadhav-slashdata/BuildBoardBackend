const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/:ideaId/bids', authenticate, async (req, res) => {
  const { proposedHours, approachNote, committedDate, bidType, leadUserId, teamMemberIds } = req.body;
  const userId = req.user.userId;

  const { data: bid, error } = await supabase.from('bids').insert({
    idea_id: req.params.ideaId,
    user_id: userId,
    bid_type: bidType || 'solo',
    lead_user_id: bidType === 'team' ? (leadUserId || userId) : null,
    proposed_hours: proposedHours,
    approach_note: approachNote,
    committed_date: committedDate,
    status: 'pending'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  let teamMembers = null;
  if (bidType === 'team' && teamMemberIds?.length) {
    const inserts = teamMemberIds.map(memberId => ({
      bid_id: bid.id, user_id: memberId, confirmed: memberId === userId
    }));
    const { data: tm } = await supabase.from('team_members').insert(inserts).select();
    teamMembers = tm;
  }

  res.status(201).json({ ...bid, teamMembers });
});

router.get('/:ideaId/bids', authenticate, async (req, res) => {
  const { data: bids, error } = await supabase.from('bids')
    .select('*').eq('idea_id', req.params.ideaId).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const result = [];
  for (const bid of bids) {
    let teamMembers = null;
    if (bid.bid_type === 'team') {
      const { data: tm } = await supabase.from('team_members')
        .select('*').eq('bid_id', bid.id);
      teamMembers = tm;
    }
    result.push({ ...bid, teamMembers });
  }

  res.json(result);
});

module.exports = router;
