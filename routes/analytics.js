const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /analytics/overview — portal metrics
router.get('/overview', authenticate, async (req, res) => {
  const { data: ideas } = await supabase.from('ideas').select('status');

  res.json({
    openIdeas: (ideas || []).filter(i => i.status === 'PendingApproval').length,
    inProgress: (ideas || []).filter(i => i.status === 'InProgress').length,
    biddingOpen: (ideas || []).filter(i => i.status === 'BiddingOpen').length,
    completed: (ideas || []).filter(i => i.status === 'Completed').length
  });
});

// GET /analytics/dashboard — full analytics (all authenticated users)
router.get('/dashboard', authenticate, async (req, res) => {
  const { data: ideas } = await supabase.from('ideas').select('*');
  const { data: bids } = await supabase.from('bids').select('bid_type, status');
  const { data: timeLogs } = await supabase.from('time_logs').select('hours, created_at');
  const { data: members } = await supabase.from('idea_members').select('user_id');
  const { data: users } = await supabase.from('users')
    .select('id, full_name, total_points').order('total_points', { ascending: false });

  const allIdeas = ideas || [];
  const completed = allIdeas.filter(i => i.status === 'Completed');
  const onTime = completed.filter(i =>
    i.completed_at && i.expected_delivery_date &&
    new Date(i.completed_at) <= new Date(i.expected_delivery_date)
  );
  const late = completed.filter(i =>
    i.completed_at && i.expected_delivery_date &&
    new Date(i.completed_at) > new Date(i.expected_delivery_date)
  );
  const early = completed.filter(i =>
    i.completed_at && i.expected_delivery_date &&
    new Date(i.completed_at) < new Date(new Date(i.expected_delivery_date).setDate(new Date(i.expected_delivery_date).getDate() - 1))
  );

  // Ideas by category
  const catCounts = {};
  allIdeas.forEach(i => { catCounts[i.category || 'Other'] = (catCounts[i.category || 'Other'] || 0) + 1; });
  const ideasByCategory = Object.entries(catCounts).map(([category, count]) => ({ category, count }));

  // Hours this month
  const now = new Date();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const hoursThisMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLogs = (timeLogs || []).filter(l => {
      const ld = new Date(l.created_at);
      return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
    });
    hoursThisMonth.push({
      name: monthNames[d.getMonth()],
      hours: monthLogs.reduce((s, l) => s + l.hours, 0)
    });
  }

  // Avg hours by size
  const sizeHours = {};
  const sizeCounts = {};
  allIdeas.filter(i => i.actual_hours).forEach(i => {
    sizeHours[i.size] = (sizeHours[i.size] || 0) + i.actual_hours;
    sizeCounts[i.size] = (sizeCounts[i.size] || 0) + 1;
  });
  const avgHoursBySize = Object.keys(sizeHours).map(size => ({
    size, hours: Math.round(sizeHours[size] / sizeCounts[size])
  }));

  const activeBuilders = new Set((members || []).map(m => m.user_id)).size;
  const allBids = bids || [];

  res.json({
    totalIdeas: allIdeas.length,
    completed: completed.length,
    onTimePercent: completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 0,
    activeBuilders,
    ideasByCategory,
    hoursThisMonth,
    avgHoursBySize,
    pocCount: allIdeas.filter(i => i.project_type === 'POC').length,
    fullProductCount: allIdeas.filter(i => i.project_type === 'FullProduct').length,
    teamBids: allBids.filter(b => b.bid_type === 'team').length,
    soloBids: allBids.filter(b => b.bid_type === 'solo').length,
    earlyDeliveries: early.length,
    lateDeliveries: late.length,
    leaderboard: (users || []).slice(0, 10).map(u => ({ name: u.full_name, points: u.total_points }))
  });
});

// GET /analytics/activity — recent activity feed
router.get('/activity', authenticate, async (req, res) => {
  const activities = [];

  // Get recently completed ideas
  const { data: completedIdeas } = await supabase.from('ideas')
    .select('title, completed_at, submitted_by').eq('status', 'Completed')
    .order('completed_at', { ascending: false }).limit(3);

  for (const idea of (completedIdeas || [])) {
    const { data: user } = await supabase.from('users').select('full_name').eq('id', idea.submitted_by).single();
    activities.push({
      type: 'completed',
      text: `${idea.title} marked complete by ${user?.full_name || 'Unknown'}`,
      time: idea.completed_at
    });
  }

  // Get recently approved ideas
  const { data: approvedIdeas } = await supabase.from('ideas')
    .select('title, updated_at').eq('status', 'BiddingOpen')
    .order('updated_at', { ascending: false }).limit(3);

  for (const idea of (approvedIdeas || [])) {
    activities.push({
      type: 'approved',
      text: `${idea.title} approved and open for bidding`,
      time: idea.updated_at
    });
  }

  // Get recent bids
  const { data: recentBids } = await supabase.from('bids')
    .select('idea_id, user_id, created_at, bid_type').order('created_at', { ascending: false }).limit(3);

  for (const bid of (recentBids || [])) {
    const { data: user } = await supabase.from('users').select('full_name').eq('id', bid.user_id).single();
    const { data: idea } = await supabase.from('ideas').select('title').eq('id', bid.idea_id).single();
    activities.push({
      type: 'bid',
      text: `${user?.full_name || 'Someone'} placed a ${bid.bid_type} bid on ${idea?.title || 'an idea'}`,
      time: bid.created_at
    });
  }

  // Sort by time descending
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  res.json(activities.slice(0, 10));
});

module.exports = router;
