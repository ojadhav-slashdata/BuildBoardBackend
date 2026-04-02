const supabase = require('../db');

const BASE_POINTS = {
  Micro: 10, Small: 25, Medium: 50, Large: 100, XL: 200, Enterprise: 400,
  micro: 10, small: 25, medium: 50, large: 100, xl: 200, enterprise: 400
};

const COMPLEXITY_BONUS = {
  Low: 0, Medium: 20, High: 50, Innovative: 100,
  low: 0, medium: 20, high: 50, innovative: 100
};

const FEEDBACK_POINTS = {
  Excellent: 50, Good: 25, Average: 10, Poor: 0,
  excellent: 50, good: 25, average: 10, poor: 0
};

function getDeliveryMultiplier(completedAt, expectedDeliveryDate) {
  if (!completedAt || !expectedDeliveryDate) return 1.0;
  const completed = new Date(completedAt);
  const expected = new Date(expectedDeliveryDate);
  const dayBefore = new Date(expected);
  dayBefore.setDate(dayBefore.getDate() - 1);

  if (completed <= expected) return completed < dayBefore ? 1.25 : 1.0;
  return 0.0;
}

function calculatePoints(idea, feedbackRating, teamSize) {
  const basePoints = BASE_POINTS[idea.size] || 0;
  const complexityBonus = COMPLEXITY_BONUS[idea.complexity] || 0;
  const deliveryMultiplier = getDeliveryMultiplier(idea.completed_at, idea.expected_delivery_date);
  const deliveryPoints = Math.floor((basePoints + complexityBonus) * deliveryMultiplier);
  const feedbackPts = FEEDBACK_POINTS[feedbackRating] || 0;
  const totalPoints = deliveryPoints + feedbackPts;
  const perMemberPoints = teamSize > 0 ? totalPoints / teamSize : totalPoints;

  return {
    basePoints, complexityBonus, deliveryMultiplier, deliveryPoints,
    feedbackPoints: feedbackPts, totalPoints, perMemberPoints, teamSize
  };
}

async function awardPoints(ideaId, feedbackRating) {
  const { data: idea } = await supabase.from('ideas').select('*').eq('id', ideaId).single();
  if (!idea) return;

  const { data: bids } = await supabase.from('bids').select('*').eq('idea_id', ideaId).in('status', ['assigned', 'Won']);
  const assignedBid = bids?.[0];
  if (!assignedBid) return;

  let memberIds = [assignedBid.user_id];
  if (assignedBid.bid_type === 'team') {
    const { data: teamMembers } = await supabase.from('team_members')
      .select('user_id').eq('bid_id', assignedBid.id).eq('confirmed', true);
    if (teamMembers) {
      const tmIds = teamMembers.map(tm => tm.user_id);
      memberIds = [...new Set([...memberIds, ...tmIds])];
    }
  }

  const breakdown = calculatePoints(idea, feedbackRating, memberIds.length);
  const pointsPerMember = Math.floor(breakdown.perMemberPoints);

  for (const userId of memberIds) {
    const { data: user } = await supabase.from('users').select('total_points').eq('id', userId).single();
    if (!user) continue;
    const newTotal = user.total_points + pointsPerMember;
    await supabase.from('users').update({ total_points: newTotal }).eq('id', userId);
    // Create point batch for expiry tracking
    await supabase.from('point_batches').insert({
      user_id: userId,
      points: pointsPerMember,
      remaining: pointsPerMember,
      source: idea.title,
      idea_id: ideaId,
      earned_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Update redeemable points
    await supabase.from('users').update({ redeemable_points: newTotal }).eq('id', userId);
    await checkMilestones(userId, newTotal);
  }

  await supabase.from('ideas').update({ points_reward: Math.floor(breakdown.totalPoints) }).eq('id', ideaId);
}

async function awardIdeaSubmissionPoints(userId) {
  const { data: user } = await supabase.from('users').select('total_points').eq('id', userId).single();
  if (!user) return;
  const newTotal = user.total_points + 5;
  await supabase.from('users').update({ total_points: newTotal }).eq('id', userId);
  await supabase.from('point_batches').insert({
    user_id: userId,
    points: 5,
    remaining: 5,
    source: 'Idea submission bonus',
    earned_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  });
  await supabase.from('users').update({ redeemable_points: newTotal }).eq('id', userId);
  await checkMilestones(userId, newTotal);
}

async function checkMilestones(userId, totalPoints) {
  const thresholds = [2000, 4000, 6000, 8000, 10000];
  for (const threshold of thresholds) {
    if (totalPoints < threshold) break;
    const { data: existing } = await supabase.from('milestones')
      .select('id').eq('user_id', userId).eq('points_required', threshold);
    if (existing && existing.length > 0) continue;
    await supabase.from('milestones').insert({
      user_id: userId, title: `Reached ${threshold} points!`,
      points_required: threshold, reward_description: 'Pending HR review', is_claimed: false
    });
  }
}

module.exports = { calculatePoints, awardPoints, awardIdeaSubmissionPoints };
