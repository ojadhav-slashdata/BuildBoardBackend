const express = require('express');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /projects — list projects the user is a member of (or all for Admin)
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const isAdmin = req.user.role === 'Admin';

  const { data: ideas } = await supabase.from('ideas')
    .select('*').in('status', ['InProgress', 'Completed', 'PendingReview'])
    .order('updated_at', { ascending: false });

  const projects = [];
  for (const idea of (ideas || [])) {
    const { data: members } = await supabase.from('idea_members')
      .select('user_id, role').eq('idea_id', idea.id);
    const memberIds = (members || []).map(m => m.user_id);

    // Only show projects where user is a member, project owner, or admin
    if (!isAdmin && !memberIds.includes(userId) && idea.submitted_by !== userId) continue;
    const { data: users } = memberIds.length > 0
      ? await supabase.from('users').select('id, full_name, avatar_url').in('id', memberIds)
      : { data: [] };

    const { count: taskCount } = await supabase.from('project_tasks')
      .select('id', { count: 'exact', head: true }).eq('idea_id', idea.id);
    const { count: doneCount } = await supabase.from('project_tasks')
      .select('id', { count: 'exact', head: true }).eq('idea_id', idea.id).eq('status', 'done');
    const { count: msgCount } = await supabase.from('project_messages')
      .select('id', { count: 'exact', head: true }).eq('idea_id', idea.id);

    const totalHours = idea.actual_hours || 0;

    projects.push({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      status: idea.status,
      size: idea.size,
      complexity: idea.complexity,
      projectType: idea.project_type,
      projectOwner: idea.project_owner_name,
      expectedDelivery: idea.expected_delivery_date,
      completedAt: idea.completed_at,
      totalHours,
      estimatedHours: idea.estimated_hours || idea.max_hours,
      taskCount: taskCount || 0,
      tasksDone: doneCount || 0,
      messageCount: msgCount || 0,
      members: (users || []).map(u => ({ id: u.id, name: u.full_name, avatar: u.avatar_url })),
    });
  }

  res.json(projects);
});

// GET /projects/:id — full project workspace data
router.get('/:id', authenticate, async (req, res) => {
  const ideaId = req.params.id;

  const { data: idea } = await supabase.from('ideas').select('*').eq('id', ideaId).single();
  if (!idea) return res.status(404).json({ error: 'Project not found' });

  // Members
  const { data: members } = await supabase.from('idea_members').select('user_id, role').eq('idea_id', ideaId);
  const memberIds = (members || []).map(m => m.user_id);
  const { data: users } = memberIds.length > 0
    ? await supabase.from('users').select('id, full_name, avatar_url, email').in('id', memberIds)
    : { data: [] };
  const memberList = (members || []).map(m => {
    const u = (users || []).find(u => u.id === m.user_id);
    return { id: m.user_id, name: u?.full_name, avatar: u?.avatar_url, email: u?.email, role: m.role };
  });

  // Tasks
  const { data: tasks } = await supabase.from('project_tasks')
    .select('*').eq('idea_id', ideaId).order('order', { ascending: true });
  const taskList = [];
  for (const t of (tasks || [])) {
    const assignee = t.assigned_to ? (users || []).find(u => u.id === t.assigned_to) : null;
    const creator = (users || []).find(u => u.id === t.created_by);
    taskList.push({
      ...t,
      assigneeName: assignee?.full_name || null,
      assigneeAvatar: assignee?.avatar_url || null,
      creatorName: creator?.full_name || null,
    });
  }

  // Messages (latest 50)
  const { data: messages } = await supabase.from('project_messages')
    .select('*').eq('idea_id', ideaId).order('created_at', { ascending: true }).limit(50);
  const msgList = (messages || []).map(m => {
    const u = (users || []).find(u => u.id === m.user_id);
    return { ...m, userName: u?.full_name, userAvatar: u?.avatar_url };
  });

  // Links
  const { data: links } = await supabase.from('project_links')
    .select('*').eq('idea_id', ideaId).order('created_at', { ascending: false });

  // Requirements
  const { data: requirements } = await supabase.from('project_requirements')
    .select('*').eq('idea_id', ideaId).order('created_at', { ascending: true });
  const reqList = (requirements || []).map(r => {
    const assignee = r.assigned_to ? (users || []).find(u => u.id === r.assigned_to) : null;
    return { ...r, assigneeName: assignee?.full_name || null };
  });

  // Time logs
  const { data: timeLogs } = await supabase.from('time_logs')
    .select('*').eq('idea_id', ideaId).order('logged_date', { ascending: false }).limit(20);
  const logList = (timeLogs || []).map(l => {
    const u = (users || []).find(u => u.id === l.user_id);
    return { ...l, userName: u?.full_name };
  });

  const totalHours = (timeLogs || []).reduce((s, l) => s + l.hours, 0);

  res.json({
    project: {
      id: idea.id, title: idea.title, description: idea.description,
      status: idea.status, size: idea.size, complexity: idea.complexity,
      projectType: idea.project_type, projectOwner: idea.project_owner_name,
      expectedDelivery: idea.expected_delivery_date, completedAt: idea.completed_at,
      estimatedHours: idea.estimated_hours || idea.max_hours,
      totalHours, category: idea.category,
    },
    members: memberList,
    tasks: taskList,
    messages: msgList,
    links: links || [],
    requirements: reqList,
    timeLogs: logList,
  });
});

// === TASKS CRUD ===

router.post('/:id/tasks', authenticate, async (req, res) => {
  const { title, description, priority, assignedTo, dueDate } = req.body;
  const { data, error } = await supabase.from('project_tasks').insert({
    idea_id: req.params.id, title, description,
    priority: priority || 'medium', assigned_to: assignedTo || null,
    due_date: dueDate || null, created_by: req.user.userId, status: 'todo'
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id/tasks/:taskId', authenticate, async (req, res) => {
  const updates = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.priority !== undefined) updates.priority = req.body.priority;
  if (req.body.assignedTo !== undefined) updates.assigned_to = req.body.assignedTo;
  if (req.body.order !== undefined) updates.order = req.body.order;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('project_tasks')
    .update(updates).eq('id', req.params.taskId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id/tasks/:taskId', authenticate, async (req, res) => {
  await supabase.from('project_tasks').delete().eq('id', req.params.taskId);
  res.json({ deleted: true });
});

// === MESSAGES ===

router.post('/:id/messages', authenticate, async (req, res) => {
  const { content, channel, messageType, metadata } = req.body;
  const { data, error } = await supabase.from('project_messages').insert({
    idea_id: req.params.id, user_id: req.user.userId,
    content, channel: channel || 'general',
    message_type: messageType || 'message',
    metadata: metadata || null
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Get user info
  const { data: user } = await supabase.from('users')
    .select('full_name, avatar_url').eq('id', req.user.userId).single();
  res.status(201).json({ ...data, userName: user?.full_name, userAvatar: user?.avatar_url });
});

router.get('/:id/messages', authenticate, async (req, res) => {
  const channel = req.query.channel || null;
  let query = supabase.from('project_messages')
    .select('*').eq('idea_id', req.params.id).order('created_at', { ascending: true });
  if (channel) query = query.eq('channel', channel);

  const { data } = await query;
  const userIds = [...new Set((data || []).map(m => m.user_id))];
  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name, avatar_url').in('id', userIds)
    : { data: [] };
  const userMap = Object.fromEntries((users || []).map(u => [u.id, u]));

  res.json((data || []).map(m => ({
    ...m, userName: userMap[m.user_id]?.full_name, userAvatar: userMap[m.user_id]?.avatar_url
  })));
});

// === LINKS ===

router.post('/:id/links', authenticate, async (req, res) => {
  const { title, url, linkType } = req.body;
  const { data, error } = await supabase.from('project_links').insert({
    idea_id: req.params.id, title, url,
    link_type: linkType || 'other', added_by: req.user.userId
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/:id/links/:linkId', authenticate, async (req, res) => {
  await supabase.from('project_links').delete().eq('id', req.params.linkId);
  res.json({ deleted: true });
});

// === REQUIREMENTS ===

router.post('/:id/requirements', authenticate, async (req, res) => {
  const { title, description, priority, assignedTo } = req.body;
  const { data, error } = await supabase.from('project_requirements').insert({
    idea_id: req.params.id, title, description,
    priority: priority || 'must_have', assigned_to: assignedTo || null,
    created_by: req.user.userId, status: 'open'
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id/requirements/:reqId', authenticate, async (req, res) => {
  const updates = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.assignedTo !== undefined) updates.assigned_to = req.body.assignedTo;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('project_requirements')
    .update(updates).eq('id', req.params.reqId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
