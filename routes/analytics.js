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
    .select('id, full_name, total_points, avatar_url').order('total_points', { ascending: false });

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
    leaderboard: (users || []).slice(0, 10).map(u => ({ name: u.full_name, points: u.total_points, avatar: u.avatar_url, id: u.id }))
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

// GET /analytics/executive — CEO/Executive innovation dashboard
router.get('/executive', authenticate, requireRole('Admin'), async (req, res) => {
  const { data: ideas } = await supabase.from('ideas').select('*');
  const { data: users } = await supabase.from('users').select('*');
  const { data: timeLogs } = await supabase.from('time_logs').select('*');
  const { data: bids } = await supabase.from('bids').select('*');
  const { data: feedbacks } = await supabase.from('feedbacks').select('*');
  const { data: redemptions } = await supabase.from('redemptions').select('points_spent');
  const { data: members } = await supabase.from('idea_members').select('user_id');

  const allIdeas = ideas || [];
  const allUsers = users || [];
  const allLogs = timeLogs || [];
  const allBids = bids || [];
  const allFeedbacks = feedbacks || [];

  const completed = allIdeas.filter(i => i.status === 'Completed');
  const inProgress = allIdeas.filter(i => i.status === 'InProgress');
  const totalHours = allLogs.reduce((s, l) => s + l.hours, 0);
  const uniqueContributors = new Set((members || []).map(m => m.user_id)).size;
  const participationRate = allUsers.length > 0 ? Math.round((uniqueContributors / allUsers.length) * 100) : 0;

  // On-time delivery
  const withDates = completed.filter(i => i.completed_at && i.expected_delivery_date);
  const onTime = withDates.filter(i => new Date(i.completed_at) <= new Date(i.expected_delivery_date));
  const onTimeRate = withDates.length > 0 ? Math.round((onTime.length / withDates.length) * 100) : 0;

  // Average rating
  const ratingMap = { Excellent: 5, Good: 4, Average: 3, Poor: 1 };
  const avgRating = allFeedbacks.length > 0
    ? (allFeedbacks.reduce((s, f) => s + (ratingMap[f.rating] || 3), 0) / allFeedbacks.length).toFixed(1)
    : '0';

  // Monthly trend (last 6 months)
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthIdeas = allIdeas.filter(idea => {
      const c = new Date(idea.created_at);
      return c >= d && c < nextMonth;
    });
    const monthCompleted = completed.filter(idea => {
      const c = new Date(idea.completed_at);
      return c >= d && c < nextMonth;
    });
    const monthHours = allLogs.filter(l => {
      const c = new Date(l.created_at);
      return c >= d && c < nextMonth;
    }).reduce((s, l) => s + l.hours, 0);

    monthlyTrend.push({
      month: monthNames[d.getMonth()],
      submitted: monthIdeas.length,
      completed: monthCompleted.length,
      hours: Math.round(monthHours)
    });
  }

  // Ideas by category
  const catCounts = {};
  allIdeas.forEach(i => { catCounts[i.category || 'Other'] = (catCounts[i.category || 'Other'] || 0) + 1; });
  const byCategory = Object.entries(catCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Ideas by status
  const statusCounts = {};
  allIdeas.forEach(i => { statusCounts[i.status || 'Unknown'] = (statusCounts[i.status || 'Unknown'] || 0) + 1; });
  const byStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // POC vs Full Product
  const pocCount = allIdeas.filter(i => i.project_type === 'POC').length;
  const fpCount = allIdeas.filter(i => i.project_type === 'FullProduct').length;

  // Top contributors
  const userPoints = allUsers
    .filter(u => u.total_points > 0)
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 10)
    .map(u => ({ name: u.full_name, points: u.total_points, avatar: u.avatar_url, role: u.role }));

  // Top departments
  const deptCounts = {};
  allUsers.forEach(u => {
    if (u.department) deptCounts[u.department] = (deptCounts[u.department] || 0) + u.total_points;
  });
  const byDepartment = Object.entries(deptCounts).map(([name, points]) => ({ name, points })).sort((a, b) => b.points - a.points);

  // Estimated value (rough: hours * avg hourly cost)
  const avgHourlyCost = 50; // configurable
  const estimatedValue = Math.round(totalHours * avgHourlyCost);
  const pointsRedeemed = (redemptions || []).reduce((s, r) => s + r.points_spent, 0);

  // Solo vs Team
  const soloBids = allBids.filter(b => b.bid_type === 'solo').length;
  const teamBids = allBids.filter(b => b.bid_type === 'team').length;

  // Size distribution
  const sizeCounts = {};
  allIdeas.forEach(i => { sizeCounts[i.size || 'Unknown'] = (sizeCounts[i.size || 'Unknown'] || 0) + 1; });
  const bySize = Object.entries(sizeCounts).map(([name, value]) => ({ name, value }));

  // Complexity distribution
  const complexityCounts = {};
  allIdeas.forEach(i => { complexityCounts[i.complexity || 'Unknown'] = (complexityCounts[i.complexity || 'Unknown'] || 0) + 1; });
  const byComplexity = Object.entries(complexityCounts).map(([name, value]) => ({ name, value }));

  res.json({
    overview: {
      totalIdeas: allIdeas.length,
      completedIdeas: completed.length,
      inProgressIdeas: inProgress.length,
      totalInnovationHours: Math.round(totalHours),
      totalParticipants: uniqueContributors,
      totalEmployees: allUsers.length,
      participationRate,
      onTimeDeliveryRate: onTimeRate,
      averageRating: parseFloat(avgRating),
      totalPointsAwarded: allUsers.reduce((s, u) => s + u.total_points, 0),
      pointsRedeemed,
      estimatedBusinessValue: estimatedValue,
      soloBids, teamBids,
      pocCount, fullProductCount: fpCount,
    },
    monthlyTrend,
    byCategory,
    byStatus,
    bySize,
    byComplexity,
    byDepartment,
    topContributors: userPoints,
  });
});

module.exports = router;
