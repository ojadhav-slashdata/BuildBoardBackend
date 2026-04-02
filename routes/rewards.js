const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /rewards — catalog
router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('rewards')
    .select('*').eq('available', true).order('points_cost', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });

  const grouped = {};
  for (const r of (data || [])) {
    if (!grouped[r.tier]) grouped[r.tier] = [];
    grouped[r.tier].push(r);
  }
  res.json({ rewards: data, byTier: grouped });
});

// GET /rewards/balance — user's point balances + expiry info
router.get('/balance', authenticate, async (req, res) => {
  const userId = req.user.userId;

  const { data: user } = await supabase.from('users')
    .select('total_points').eq('id', userId).single();

  // Get point batches
  const { data: batches } = await supabase.from('point_batches')
    .select('*').eq('user_id', userId).gt('remaining', 0)
    .order('earned_at', { ascending: true });

  // Calculate redeemable (non-expired)
  const now = new Date();
  const activeBatches = (batches || []).filter(b => new Date(b.expires_at) > now);
  const redeemable = activeBatches.reduce((s, b) => s + b.remaining, 0);

  // Expiring within 90 days
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringSoon = activeBatches
    .filter(b => new Date(b.expires_at) <= in90Days)
    .reduce((s, b) => s + b.remaining, 0);

  // Get active goal
  const { data: goals } = await supabase.from('savings_goals')
    .select('*, rewards(*)').eq('user_id', userId).eq('is_active', true).limit(1);
  const activeGoal = goals?.[0] || null;

  res.json({
    lifetimeEarned: user?.total_points || 0,
    redeemable,
    expiringSoon,
    batches: activeBatches.map(b => ({
      id: b.id,
      points: b.remaining,
      source: b.source,
      earnedAt: b.earned_at,
      expiresAt: b.expires_at,
      daysRemaining: Math.max(0, Math.ceil((new Date(b.expires_at) - now) / (1000*60*60*24)))
    })),
    activeGoal: activeGoal ? {
      id: activeGoal.id,
      reward: activeGoal.rewards,
      targetPoints: activeGoal.target_points,
      currentPoints: redeemable,
      remaining: Math.max(0, activeGoal.target_points - redeemable)
    } : null
  });
});

// POST /rewards/redeem — instant redemption
router.post('/redeem', authenticate, async (req, res) => {
  const { rewardId, platform, email } = req.body;
  const userId = req.user.userId;

  // Get reward
  const { data: reward } = await supabase.from('rewards')
    .select('*').eq('id', rewardId).single();
  if (!reward) return res.status(404).json({ error: 'Reward not found' });

  // Get user's available batches (oldest first)
  const now = new Date();
  const { data: batches } = await supabase.from('point_batches')
    .select('*').eq('user_id', userId).gt('remaining', 0)
    .order('earned_at', { ascending: true });

  const activeBatches = (batches || []).filter(b => new Date(b.expires_at) > now);
  const available = activeBatches.reduce((s, b) => s + b.remaining, 0);

  if (available < reward.points_cost) {
    return res.status(400).json({ error: 'Insufficient points', available, required: reward.points_cost });
  }

  // Deduct points from oldest batches first
  let remaining = reward.points_cost;
  for (const batch of activeBatches) {
    if (remaining <= 0) break;
    const deduct = Math.min(batch.remaining, remaining);
    await supabase.from('point_batches')
      .update({ remaining: batch.remaining - deduct })
      .eq('id', batch.id);
    remaining -= deduct;
  }

  // Create redemption record
  const { data: redemption, error } = await supabase.from('redemptions').insert({
    user_id: userId,
    reward_id: rewardId,
    points_spent: reward.points_cost,
    platform: platform || null,
    delivery_email: email || req.user.email,
    status: 'Pending'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Update user's redeemable points
  const newAvailable = available - reward.points_cost;
  await supabase.from('users').update({ redeemable_points: newAvailable }).eq('id', userId);

  res.json({
    redemption,
    reward,
    pointsAfter: newAvailable,
    message: 'Redeemed! HR notified. Voucher delivered within 24 hours.'
  });
});

// POST /rewards/goal — set savings goal
router.post('/goal', authenticate, async (req, res) => {
  const { rewardId } = req.body;
  const userId = req.user.userId;

  // Deactivate current goal
  await supabase.from('savings_goals').update({ is_active: false })
    .eq('user_id', userId).eq('is_active', true);

  const { data: reward } = await supabase.from('rewards')
    .select('points_cost').eq('id', rewardId).single();
  if (!reward) return res.status(404).json({ error: 'Reward not found' });

  const { data: goal, error } = await supabase.from('savings_goals').upsert({
    user_id: userId,
    reward_id: rewardId,
    target_points: reward.points_cost,
    is_active: true
  }, { onConflict: 'user_id,reward_id' }).select('*, rewards(*)').single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(goal);
});

// DELETE /rewards/goal — remove current goal
router.delete('/goal', authenticate, async (req, res) => {
  await supabase.from('savings_goals').update({ is_active: false })
    .eq('user_id', req.user.userId).eq('is_active', true);
  res.json({ message: 'Goal removed' });
});

// GET /rewards/redemptions — user's redemption history
router.get('/redemptions', authenticate, async (req, res) => {
  const { data } = await supabase.from('redemptions')
    .select('*, rewards(title, icon, tier)')
    .eq('user_id', req.user.userId)
    .order('created_at', { ascending: false });
  res.json(data || []);
});

module.exports = router;
