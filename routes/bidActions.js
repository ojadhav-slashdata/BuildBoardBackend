const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.patch('/:id/assign', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  const { data: bid } = await supabase.from('bids').select('*').eq('id', req.params.id).single();
  if (!bid) return res.status(404).json({ error: 'Bid not found' });

  await supabase.from('bids').update({ status: 'assigned' }).eq('id', req.params.id);
  await supabase.from('ideas').update({
    status: 'in_progress', updated_at: new Date().toISOString()
  }).eq('id', bid.idea_id);

  let memberIds = [bid.user_id];
  if (bid.bid_type === 'team') {
    const { data: tm } = await supabase.from('team_members')
      .select('user_id').eq('bid_id', bid.id).eq('confirmed', true);
    if (tm) memberIds = [...new Set([...memberIds, ...tm.map(t => t.user_id)])];
  }

  const { data: existingMembers } = await supabase.from('idea_members')
    .select('user_id').eq('idea_id', bid.idea_id);
  const existingIds = new Set(existingMembers?.map(m => m.user_id) || []);

  for (const memberId of memberIds) {
    if (existingIds.has(memberId)) continue;
    await supabase.from('idea_members').insert({
      idea_id: bid.idea_id, user_id: memberId, role: 'contributor'
    });
  }

  const updated = { ...bid, status: 'assigned' };
  let teamMembers = null;
  if (bid.bid_type === 'team') {
    const { data: tm } = await supabase.from('team_members').select('*').eq('bid_id', bid.id);
    teamMembers = tm;
  }

  res.json({ ...updated, teamMembers });
});

module.exports = router;
