const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = [];

    // 1. Recent bid results for user
    const { data: bids } = await supabase
      .from('bids')
      .select('status, created_at, idea_id')
      .eq('user_id', userId)
      .in('status', ['Won', 'Not Selected'])
      .order('created_at', { ascending: false })
      .limit(5);

    // Get idea titles for bids
    if (bids && bids.length > 0) {
      const ideaIds = [...new Set(bids.map(b => b.idea_id))];
      const { data: ideas } = await supabase
        .from('ideas')
        .select('id, title')
        .in('id', ideaIds);
      const ideaMap = Object.fromEntries((ideas || []).map(i => [i.id, i.title]));

      bids.forEach(b => {
        const title = ideaMap[b.idea_id] || 'an idea';
        notifications.push({
          type: 'bid',
          message: b.status === 'Won'
            ? `Your bid on "${title}" was selected!`
            : `Your bid on "${title}" was not selected`,
          timestamp: b.created_at,
          ideaId: b.idea_id
        });
      });
    }

    // 2. Recent status updates for ideas user submitted
    const { data: myIdeas } = await supabase
      .from('ideas')
      .select('id, title, status, updated_at')
      .eq('submitted_by', userId)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (myIdeas) {
      myIdeas.forEach(i => {
        notifications.push({
          type: 'idea',
          message: `"${i.title}" is now ${i.status}`,
          timestamp: i.updated_at,
          ideaId: i.id
        });
      });
    }

    // 3. Recent comments on ideas where user is submitter or has bid
    const { data: userBids } = await supabase
      .from('bids')
      .select('idea_id')
      .eq('user_id', userId);

    const myIdeaIds = (myIdeas || []).map(i => i.id);
    const bidIdeaIds = (userBids || []).map(b => b.idea_id);
    const allIdeaIds = [...new Set([...myIdeaIds, ...bidIdeaIds])];

    if (allIdeaIds.length > 0) {
      const { data: comments } = await supabase
        .from('comments')
        .select('content, created_at, user_id, idea_id')
        .in('idea_id', allIdeaIds)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (comments && comments.length > 0) {
        const commenterIds = [...new Set(comments.map(c => c.user_id))];
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', commenterIds);
        const userMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));

        comments.forEach(c => {
          const name = userMap[c.user_id] || 'Someone';
          const preview = c.content.length > 40 ? c.content.slice(0, 40) + '...' : c.content;
          notifications.push({
            type: 'comment',
            message: `${name} commented: "${preview}"`,
            timestamp: c.created_at,
            ideaId: c.idea_id
          });
        });
      }
    }

    // Sort by timestamp descending, return top 10
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(notifications.slice(0, 10));
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
