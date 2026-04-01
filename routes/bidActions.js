const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

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
router.patch('/:id/assign', authenticate, requireRole('Manager', 'Admin'), async (req, res) => {
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

module.exports = router;
