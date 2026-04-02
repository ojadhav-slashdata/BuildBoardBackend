const supabase = require('../db');

// Calculate performance score for a bid
async function calculatePerformanceScore(userId) {
  // Get user's past completed ideas
  const { data: memberOf } = await supabase.from('idea_members')
    .select('idea_id').eq('user_id', userId);

  if (!memberOf || memberOf.length === 0) return 50; // New builder default

  const ideaIds = memberOf.map(m => m.idea_id);
  const { data: ideas } = await supabase.from('ideas')
    .select('*').in('id', ideaIds).eq('status', 'Completed');

  if (!ideas || ideas.length === 0) return 50;

  // On-time delivery rate
  const withDates = ideas.filter(i => i.completed_at && i.expected_delivery_date);
  const onTime = withDates.filter(i => new Date(i.completed_at) <= new Date(i.expected_delivery_date));
  const onTimeRate = withDates.length > 0 ? onTime.length / withDates.length : 0.5;

  // Average feedback rating
  const { data: feedbacks } = await supabase.from('feedbacks')
    .select('rating').in('idea_id', ideaIds);
  const ratingMap = { Excellent: 5, Good: 4, Average: 3, Poor: 1 };
  const avgRating = feedbacks && feedbacks.length > 0
    ? feedbacks.reduce((s, f) => s + (ratingMap[f.rating] || 3), 0) / feedbacks.length
    : 3;

  // Completion rate
  const completionRate = ideas.length / Math.max(memberOf.length, 1);

  // Score: weighted average (0-100)
  const score = Math.round(
    (onTimeRate * 40) + // 40% weight on-time delivery
    (avgRating / 5 * 35) + // 35% weight on ratings
    (completionRate * 25)   // 25% weight on completion rate
  );

  return Math.min(100, Math.max(0, score));
}

// Auto-assign the best bid when cutoff passes
async function autoAssignBid(ideaId) {
  const { data: idea } = await supabase.from('ideas')
    .select('*').eq('id', ideaId).single();

  if (!idea || idea.status !== 'BiddingOpen') return null;

  const { data: bids } = await supabase.from('bids')
    .select('*').eq('idea_id', ideaId).eq('status', 'Pending');

  if (!bids || bids.length === 0) {
    // No bids received — mark as Expired
    await supabase.from('ideas').update({ status: 'Expired', updated_at: new Date().toISOString() }).eq('id', ideaId);
    return { status: 'Expired', reason: 'No bids received before cutoff' };
  }

  // Calculate scores for all bids
  const scoredBids = [];
  for (const bid of bids) {
    const score = await calculatePerformanceScore(bid.user_id);

    // For team bids, average team members' scores
    let teamScore = score;
    if (bid.bid_type === 'team') {
      const { data: members } = await supabase.from('team_members')
        .select('user_id').eq('bid_id', bid.id).eq('confirmed', true);
      if (members && members.length > 0) {
        const memberScores = await Promise.all(
          members.map(m => calculatePerformanceScore(m.user_id))
        );
        teamScore = Math.round(memberScores.reduce((a, b) => a + b, 0) / memberScores.length);
      }
    }

    // Bonus for early delivery commitment
    let deliveryBonus = 0;
    if (bid.committed_date && idea.expected_delivery_date) {
      const committed = new Date(bid.committed_date);
      const expected = new Date(idea.expected_delivery_date);
      if (committed <= expected) {
        const daysEarly = Math.floor((expected - committed) / (1000 * 60 * 60 * 24));
        deliveryBonus = Math.min(daysEarly * 2, 20); // Max 20 bonus for early
      } else {
        deliveryBonus = -10; // Penalty for late commitment
      }
    }

    const finalScore = teamScore + deliveryBonus;

    // Update bid with score
    await supabase.from('bids')
      .update({ performance_score: finalScore })
      .eq('id', bid.id);

    scoredBids.push({ ...bid, performance_score: finalScore });
  }

  // Sort by score descending
  scoredBids.sort((a, b) => b.performance_score - a.performance_score);
  const winner = scoredBids[0];

  // Assign the winner
  await supabase.from('bids').update({ status: 'Won' }).eq('id', winner.id);

  // Mark others as Not Selected
  for (const bid of scoredBids.slice(1)) {
    await supabase.from('bids').update({ status: 'Not Selected' }).eq('id', bid.id);
  }

  // Update idea
  await supabase.from('ideas').update({
    status: 'InProgress',
    auto_assigned: true,
    winner_bid_id: winner.id,
    updated_at: new Date().toISOString()
  }).eq('id', ideaId);

  // Add winner (and team) to idea_members
  let memberIds = [winner.user_id];
  if (winner.bid_type === 'team') {
    const { data: tm } = await supabase.from('team_members')
      .select('user_id').eq('bid_id', winner.id).eq('confirmed', true);
    if (tm) memberIds = [...new Set([...memberIds, ...tm.map(t => t.user_id)])];
  }

  const { data: existing } = await supabase.from('idea_members')
    .select('user_id').eq('idea_id', ideaId);
  const existingSet = new Set((existing || []).map(m => m.user_id));

  for (const uid of memberIds) {
    if (existingSet.has(uid)) continue;
    await supabase.from('idea_members').insert({
      idea_id: ideaId, user_id: uid, role: 'contributor'
    });
  }

  return {
    winnerId: winner.id,
    winnerUserId: winner.user_id,
    score: winner.performance_score,
    allBids: scoredBids.map(b => ({
      id: b.id,
      userId: b.user_id,
      bidderName: b.bidder_name,
      score: b.performance_score,
      mode: b.bid_type,
      committedDate: b.committed_date,
      status: b.id === winner.id ? 'Won' : 'Not Selected'
    }))
  };
}

// Check all ideas past bid cutoff and auto-assign
async function checkAndAutoAssign() {
  const { data: ideas } = await supabase.from('ideas')
    .select('id, bid_cutoff_date')
    .eq('status', 'BiddingOpen');

  if (!ideas) return [];

  const now = new Date();
  const results = [];

  for (const idea of ideas) {
    if (idea.bid_cutoff_date && new Date(idea.bid_cutoff_date) <= now) {
      const result = await autoAssignBid(idea.id);
      if (result) results.push({ ideaId: idea.id, ...result });
    }
  }

  return results;
}

module.exports = { calculatePerformanceScore, autoAssignBid, checkAndAutoAssign };
