const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { notify, notifyMultiple } = require('../services/notify');

const router = express.Router();

// GET /bids/dashboard — Manager's bid dashboard across all ideas
router.get('/dashboard', authenticate, requireRole('Admin'), async (req, res) => {
  try {
  // Get all ideas that have bids or are in bidding
  const { data: ideas, error: ideasErr } = await supabase.from('ideas')
    .select('*')
    .in('status', ['BiddingOpen', 'BiddingClosed', 'InProgress', 'Completed'])
    .order('updated_at', { ascending: false });
  if (ideasErr) return res.status(500).json({ error: ideasErr.message });

  const dashboard = [];
  for (const idea of (ideas || [])) {
    const { data: bids } = await supabase.from('bids')
      .select('*').eq('idea_id', idea.id).order('performance_score', { ascending: false });

    if (!bids || bids.length === 0) continue;

    const winner = bids.find(b => b.status === 'Won');
    const bidSummaries = [];

    for (const bid of bids) {
      const { data: bidder } = await supabase.from('users')
        .select('full_name, avatar_url').eq('id', bid.user_id).single();

      const daysVsExpected = bid.committed_date && idea.expected_delivery_date
        ? Math.round((new Date(idea.expected_delivery_date) - new Date(bid.committed_date)) / (1000*60*60*24))
        : 0;

      bidSummaries.push({
        id: bid.id,
        bidder: bidder?.full_name || bid.bidder_name || 'Unknown',
        bidderAvatar: bidder?.avatar_url,
        mode: bid.bid_type,
        score: bid.performance_score || 0,
        committedDate: bid.committed_date,
        daysVsExpected,
        isWithinDeadline: daysVsExpected >= 0,
        status: bid.status,
        approach: bid.approach_note,
        isWinner: bid.id === winner?.id,
        isAutoAssigned: bid.is_auto_assigned || idea.auto_assigned
      });
    }

    dashboard.push({
      idea: {
        id: idea.id,
        title: idea.title,
        status: idea.status,
        size: idea.size,
        complexity: idea.complexity,
        projectType: idea.project_type,
        cutoffDate: idea.bid_cutoff_date,
        expectedDeliveryDate: idea.expected_delivery_date,
        autoAssigned: idea.auto_assigned
      },
      totalBids: bids.length,
      winner: winner ? bidSummaries.find(b => b.isWinner) : null,
      bids: bidSummaries
    });
  }

  // Algorithm explanation
  const algorithm = {
    name: 'BuildBoard Bid Ranking Algorithm',
    version: '1.0',
    factors: [
      { name: 'On-time Delivery Rate', weight: '40%', description: 'Percentage of past ideas delivered on or before committed date' },
      { name: 'Manager Rating Average', weight: '35%', description: 'Average of all past manager ratings (Poor=1, Average=3, Good=4, Excellent=5)' },
      { name: 'Completion Rate', weight: '25%', description: 'Ratio of completed ideas to total ideas participated in' },
      { name: 'Early Delivery Bonus', weight: '+2 pts/day', description: 'Up to +20 bonus for committing to deliver before deadline' },
      { name: 'Late Commitment Penalty', weight: '-10 pts', description: 'Penalty for committing to deliver after expected deadline' },
    ],
    formula: 'Score = (OnTimeRate × 40) + (AvgRating/5 × 35) + (CompletionRate × 25) + DeliveryBonus',
    newBuilderDefault: 50,
    teamScoring: 'Average of all confirmed team member scores'
  };

  res.json({ dashboard, algorithm, totalIdeasWithBids: dashboard.length });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /bids/mine — current user's bids
router.get('/mine', authenticate, async (req, res) => {
  const { data: bids } = await supabase.from('bids')
    .select('*').eq('user_id', req.user.userId).order('created_at', { ascending: false });

  const result = [];
  for (const bid of (bids || [])) {
    const { data: idea } = await supabase.from('ideas')
      .select('title').eq('id', bid.idea_id).single();
    result.push({
      _id: bid.id,
      id: bid.id,
      idea: bid.idea_id,
      ideaTitle: idea?.title || 'Unknown',
      bidder: bid.user_id,
      bidderName: bid.bidder_name || req.user.name,
      mode: bid.bid_type,
      committedDeliveryDate: bid.committed_date,
      approach: bid.approach_note,
      status: bid.status,
      confirmationStatus: 'Confirmed',
      createdAt: bid.created_at
    });
  }

  res.json(result);
});

// PATCH /bids/:id/assign
router.patch('/:id/assign', authenticate, requireRole('Admin'), async (req, res) => {
  const { data: bid } = await supabase.from('bids').select('*').eq('id', req.params.id).single();
  if (!bid) return res.status(404).json({ error: 'Bid not found' });

  // Mark this bid as Won
  await supabase.from('bids').update({ status: 'Won' }).eq('id', req.params.id);

  // Mark other bids as Not Selected
  await supabase.from('bids').update({ status: 'Not Selected' })
    .eq('idea_id', bid.idea_id).neq('id', req.params.id);

  // Update idea to InProgress
  await supabase.from('ideas').update({
    status: 'InProgress', updated_at: new Date().toISOString()
  }).eq('id', bid.idea_id);

  // Add bid members to idea_members
  let memberIds = [bid.user_id];
  if (bid.bid_type === 'team') {
    const { data: tm } = await supabase.from('team_members')
      .select('user_id').eq('bid_id', bid.id).eq('confirmed', true);
    if (tm) memberIds = [...new Set([...memberIds, ...tm.map(t => t.user_id)])];
  }

  const { data: existingMembers } = await supabase.from('idea_members')
    .select('user_id').eq('idea_id', bid.idea_id);
  const existingIds = new Set((existingMembers || []).map(m => m.user_id));

  for (const memberId of memberIds) {
    if (existingIds.has(memberId)) continue;
    await supabase.from('idea_members').insert({
      idea_id: bid.idea_id, user_id: memberId, role: 'contributor'
    });
  }

  const { data: idea } = await supabase.from('ideas').select('title').eq('id', bid.idea_id).single();

  // Notify winner
  await notify(bid.user_id, 'You Won the Bid!', `Your bid on "${idea?.title || 'an idea'}" has been selected. Time to build!`, 'assignment', bid.idea_id);

  // Notify other bidders
  const { data: otherBids } = await supabase.from('bids')
    .select('user_id').eq('idea_id', bid.idea_id).neq('id', req.params.id);
  if (otherBids?.length) {
    await notifyMultiple(
      otherBids.map(b => b.user_id),
      'Bid Not Selected',
      `Another bid was selected for "${idea?.title || 'an idea'}". Keep bidding on other ideas!`,
      'info', bid.idea_id
    );
  }

  res.json({ ...bid, status: 'Won' });
});

// PATCH /bids/:id/confirm
router.patch('/:id/confirm', authenticate, async (req, res) => {
  await supabase.from('team_members')
    .update({ confirmed: true })
    .eq('bid_id', req.params.id)
    .eq('user_id', req.user.userId);
  res.json({ status: 'Confirmed' });
});

// PATCH /bids/:id/decline
router.patch('/:id/decline', authenticate, async (req, res) => {
  await supabase.from('team_members')
    .update({ confirmed: false })
    .eq('bid_id', req.params.id)
    .eq('user_id', req.user.userId);
  res.json({ status: 'Declined' });
});

const { autoAssignBid, checkAndAutoAssign, calculatePerformanceScore } = require('../services/bidAutoAssign');

// POST /bids/auto-assign/:ideaId — manually trigger auto-assign for an idea
router.post('/auto-assign/:ideaId', authenticate, requireRole('Admin'), async (req, res) => {
  const result = await autoAssignBid(req.params.ideaId);
  if (!result) return res.status(400).json({ error: 'No eligible bids or idea not in BiddingOpen status' });
  res.json(result);
});

// POST /bids/check-cutoffs — check all ideas past cutoff and auto-assign
router.post('/check-cutoffs', authenticate, requireRole('Admin'), async (req, res) => {
  const results = await checkAndAutoAssign();
  res.json({ assigned: results.length, results });
});

// GET /bids/results/:ideaId — get bid results with scores and winner
router.get('/results/:ideaId', authenticate, async (req, res) => {
  const { data: idea } = await supabase.from('ideas')
    .select('*').eq('id', req.params.ideaId).single();
  if (!idea) return res.status(404).json({ error: 'Idea not found' });

  const { data: bids } = await supabase.from('bids')
    .select('*').eq('idea_id', req.params.ideaId).order('performance_score', { ascending: false });

  const result = [];
  for (const bid of (bids || [])) {
    const { data: user } = await supabase.from('users')
      .select('full_name, avatar_url').eq('id', bid.user_id).single();

    let teamMembers = [];
    if (bid.bid_type === 'team') {
      const { data: tm } = await supabase.from('team_members')
        .select('user_id, confirmed').eq('bid_id', bid.id);
      for (const t of (tm || [])) {
        const { data: tmUser } = await supabase.from('users')
          .select('full_name').eq('id', t.user_id).single();
        teamMembers.push({ userId: t.user_id, name: tmUser?.full_name, confirmed: t.confirmed });
      }
    }

    // Calculate why this bid won/lost
    const isWinner = bid.status === 'Won';
    const isWithinDeadline = bid.committed_date && idea.expected_delivery_date
      ? new Date(bid.committed_date) <= new Date(idea.expected_delivery_date) : true;
    const daysVsExpected = bid.committed_date && idea.expected_delivery_date
      ? Math.round((new Date(idea.expected_delivery_date) - new Date(bid.committed_date)) / (1000*60*60*24)) : 0;

    result.push({
      id: bid.id,
      bidder: user?.full_name || bid.bidder_name || 'Unknown',
      bidderAvatar: user?.avatar_url,
      mode: bid.bid_type,
      committedDate: bid.committed_date,
      approach: bid.approach_note,
      score: bid.performance_score || 0,
      status: bid.status,
      isWinner,
      isWithinDeadline,
      daysVsExpected,
      isAutoAssigned: bid.is_auto_assigned || idea.auto_assigned,
      teamMembers,
      reasons: isWinner ? [
        `Highest performance score: ${bid.performance_score}/100`,
        isWithinDeadline ? `Delivery ${daysVsExpected} days before deadline` : 'Committed to deliver on time',
        bid.bid_type === 'team' ? 'Team bid with confirmed members' : 'Solo bid — full commitment'
      ] : [
        `Performance score: ${bid.performance_score}/100`,
        !isWithinDeadline ? 'Delivery date exceeds expected deadline' : null,
        bid.performance_score < (result[0]?.score || 0) ? 'Lower score than winning bid' : null
      ].filter(Boolean)
    });
  }

  res.json({
    idea: {
      id: idea.id,
      title: idea.title,
      status: idea.status,
      expectedDeliveryDate: idea.expected_delivery_date,
      bidCutoffDate: idea.bid_cutoff_date,
      size: idea.size,
      complexity: idea.complexity,
      autoAssigned: idea.auto_assigned
    },
    bids: result,
    winner: result.find(b => b.isWinner) || null
  });
});

module.exports = router;
