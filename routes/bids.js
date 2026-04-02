const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /ideas/:ideaId/bids
router.post('/:ideaId/bids', authenticate, async (req, res) => {
  const { mode, teamMembers, committedDeliveryDate, approach } = req.body;
  const userId = req.user.userId;

  const { data: bid, error } = await supabase.from('bids').insert({
    idea_id: req.params.ideaId,
    user_id: userId,
    bid_type: mode || 'solo',
    lead_user_id: mode === 'team' ? userId : null,
    proposed_hours: 0,
    approach_note: approach || null,
    committed_date: committedDeliveryDate,
    status: 'Pending',
    bidder_name: req.user.name
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Insert team members if team bid
  if (mode === 'team' && teamMembers?.length) {
    for (const memberEmail of teamMembers) {
      const { data: memberUser } = await supabase.from('users')
        .select('id').eq('email', memberEmail).single();
      if (memberUser) {
        await supabase.from('team_members').insert({
          bid_id: bid.id, user_id: memberUser.id, confirmed: false
        });
      }
    }
  }

  res.status(201).json(mapBidToResponse(bid));
});

// GET /ideas/:ideaId/bids
router.get('/:ideaId/bids', authenticate, async (req, res) => {
  const { data: bids } = await supabase.from('bids')
    .select('*').eq('idea_id', req.params.ideaId).order('created_at', { ascending: false });

  const result = [];
  for (const bid of (bids || [])) {
    let teamMembers = [];
    if (bid.bid_type === 'team') {
      const { data: tm } = await supabase.from('team_members')
        .select('*, users(full_name, email)').eq('bid_id', bid.id);
      teamMembers = (tm || []).map(t => t.users?.email || t.user_id);
    }
    // Get bidder name
    const { data: bidder } = await supabase.from('users')
      .select('full_name, avatar_url').eq('id', bid.user_id).single();

    result.push({
      ...mapBidToResponse(bid),
      bidderName: bidder?.full_name || bid.bidder_name || 'Unknown',
      teamMembers,
      performanceScore: 50 + Math.floor(Math.random() * 50) // Demo score
    });
  }

  // Get idea for cutoff info
  const { data: idea } = await supabase.from('ideas')
    .select('bid_cutoff_date, expected_delivery_date, title').eq('id', req.params.ideaId).single();

  res.json({
    bids: result,
    cutoffDate: idea?.bid_cutoff_date || null,
    expectedDeliveryDate: idea?.expected_delivery_date || null,
    ideaTitle: idea?.title || '',
    timeRemaining: idea?.bid_cutoff_date ? Math.max(0, new Date(idea.bid_cutoff_date) - new Date()) : null
  });
});

function mapBidToResponse(bid) {
  return {
    _id: bid.id,
    id: bid.id,
    idea: bid.idea_id,
    bidder: bid.user_id,
    bidderName: bid.bidder_name || 'Unknown',
    mode: bid.bid_type,
    committedDeliveryDate: bid.committed_date,
    approach: bid.approach_note,
    status: bid.status,
    confirmationStatus: 'Confirmed',
    createdAt: bid.created_at
  };
}

module.exports = router;
