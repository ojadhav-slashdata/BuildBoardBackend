const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');
const { calculatePerformanceScore } = require('../services/bidAutoAssign');
const { notify } = require('../services/notify');

const router = express.Router();

// POST /ideas/:ideaId/bids — place a bid
router.post('/:ideaId/bids', authenticate, async (req, res) => {
  const { mode, teamMembers, committedDeliveryDate, approach, lateJustification } = req.body;
  const userId = req.user.userId;
  const ideaId = req.params.ideaId;

  // Validation 1: Check idea exists and is open for bidding
  const { data: idea } = await supabase.from('ideas')
    .select('*').eq('id', ideaId).single();

  if (!idea) return res.status(404).json({ error: 'Idea not found' });

  if (idea.status !== 'BiddingOpen') {
    return res.status(400).json({ error: 'This idea is not open for bidding', status: idea.status });
  }

  // Validation 2: Check bid deadline hasn't passed
  if (idea.bid_cutoff_date) {
    const cutoffTime = new Date(idea.bid_cutoff_date).getTime();
    if (cutoffTime > 0 && cutoffTime < Date.now()) {
      return res.status(400).json({ error: 'Bidding deadline has passed', cutoffDate: idea.bid_cutoff_date });
    }
  }

  // Validation 3: Check user hasn't already bid on this idea
  const { data: existingBids } = await supabase.from('bids')
    .select('id').eq('idea_id', ideaId).eq('user_id', userId);

  if (existingBids && existingBids.length > 0) {
    return res.status(400).json({ error: 'You have already placed a bid on this idea' });
  }

  // Calculate real performance score
  const score = await calculatePerformanceScore(userId);

  const { data: bid, error } = await supabase.from('bids').insert({
    idea_id: ideaId,
    user_id: userId,
    bid_type: mode || 'solo',
    lead_user_id: mode === 'team' ? userId : null,
    proposed_hours: 0,
    approach_note: approach || null,
    committed_date: committedDeliveryDate,
    status: 'Pending',
    bidder_name: req.user.name,
    performance_score: score,
    late_justification: lateJustification || null
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Notify idea owner
  await notify(idea.submitted_by, 'New Bid Received', `${req.user.name} placed a ${mode || 'solo'} bid on your idea "${idea.title}".`, 'bid', ideaId);

  // Insert team members if team bid
  let teamMembersList = [];
  if (mode === 'team' && teamMembers?.length) {
    for (const memberEmail of teamMembers) {
      const { data: memberUser } = await supabase.from('users')
        .select('id, full_name').eq('email', memberEmail).single();
      if (memberUser) {
        await supabase.from('team_members').insert({
          bid_id: bid.id, user_id: memberUser.id, confirmed: false
        });
        teamMembersList.push({ id: memberUser.id, name: memberUser.full_name, confirmed: false });
      }
    }
  }

  res.status(201).json({ ...mapBidToResponse(bid), performanceScore: score, teamMembers: teamMembersList });
});

// GET /ideas/:ideaId/bids — list all bids with real scores
router.get('/:ideaId/bids', authenticate, async (req, res) => {
  const { data: bids } = await supabase.from('bids')
    .select('*').eq('idea_id', req.params.ideaId).order('performance_score', { ascending: false });

  const { data: idea } = await supabase.from('ideas')
    .select('bid_cutoff_date, expected_delivery_date, title, status').eq('id', req.params.ideaId).single();

  const result = [];
  for (const bid of (bids || [])) {
    let teamMembers = [];
    if (bid.bid_type === 'team') {
      const { data: tm } = await supabase.from('team_members')
        .select('user_id, confirmed').eq('bid_id', bid.id);
      for (const t of (tm || [])) {
        const { data: u } = await supabase.from('users').select('full_name, email').eq('id', t.user_id).single();
        teamMembers.push({ id: t.user_id, name: u?.full_name, email: u?.email, confirmed: t.confirmed });
      }
    }

    const { data: bidder } = await supabase.from('users')
      .select('full_name, avatar_url').eq('id', bid.user_id).single();

    // Calculate days vs expected
    const daysVsExpected = bid.committed_date && idea?.expected_delivery_date
      ? Math.round((new Date(idea.expected_delivery_date) - new Date(bid.committed_date)) / (1000*60*60*24))
      : 0;

    result.push({
      ...mapBidToResponse(bid),
      bidderName: bidder?.full_name || bid.bidder_name || 'Unknown',
      bidderAvatar: bidder?.avatar_url,
      performanceScore: bid.performance_score || 0,
      teamMembers,
      daysVsExpected,
      isWithinDeadline: daysVsExpected >= 0,
      lateJustification: bid.late_justification
    });
  }

  res.json({
    bids: result,
    cutoffDate: idea?.bid_cutoff_date || null,
    expectedDeliveryDate: idea?.expected_delivery_date || null,
    ideaTitle: idea?.title || '',
    ideaStatus: idea?.status || '',
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
    createdAt: bid.created_at,
    performanceScore: bid.performance_score || 0
  };
}

module.exports = router;
