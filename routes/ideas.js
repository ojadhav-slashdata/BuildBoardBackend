const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { awardIdeaSubmissionPoints, awardPoints } = require('../services/points');
const { notify } = require('../services/notify');

const router = express.Router();

// GET /ideas — list with optional filters
router.get('/', authenticate, async (req, res) => {
  let query = supabase.from('ideas').select('*').order('created_at', { ascending: false });

  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.category) query = query.eq('category', req.query.category);
  if (req.query.projectType) query = query.eq('project_type', req.query.projectType);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Enrich with submitter names and emails
  const submitterIds = [...new Set((data || []).map(i => i.submitted_by).filter(Boolean))];
  let usersMap = {};
  if (submitterIds.length > 0) {
    const { data: usersData } = await supabase.from('users').select('id, full_name, email').in('id', submitterIds);
    for (const u of (usersData || [])) usersMap[u.id] = { name: u.full_name, email: u.email };
  }

  // Map to frontend shape
  const ideas = (data || []).map(i => ({
    ...mapIdeaToResponse(i),
    submittedByName: usersMap[i.submitted_by]?.name || null,
    submittedByEmail: usersMap[i.submitted_by]?.email || null,
  }));
  res.json(ideas);
});

// GET /ideas/:id — full detail with timeLogs, comments, teamMembers
router.get('/:id', authenticate, async (req, res) => {
  const { data: idea } = await supabase.from('ideas')
    .select('*').eq('id', req.params.id).single();
  if (!idea) return res.status(404).json({ error: 'Idea not found' });

  // Get time logs with user names
  const { data: logs } = await supabase.from('time_logs')
    .select('*').eq('idea_id', req.params.id).order('logged_date', { ascending: false });
  const logUserIds = [...new Set((logs || []).map(l => l.user_id))];
  const { data: logUsers } = logUserIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', logUserIds)
    : { data: [] };
  const userMap = Object.fromEntries((logUsers || []).map(u => [u.id, u.full_name]));

  const timeLogs = (logs || []).map(l => ({
    hours: l.hours,
    notes: l.description || '',
    date: l.logged_date,
    userName: userMap[l.user_id] || 'Unknown'
  }));

  // Get comments with user info
  const { data: rawComments } = await supabase.from('comments')
    .select('*').eq('idea_id', req.params.id).order('created_at', { ascending: false });
  const commentUserIds = [...new Set((rawComments || []).map(c => c.user_id))];
  const { data: commentUsers } = commentUserIds.length > 0
    ? await supabase.from('users').select('id, full_name, avatar_url').in('id', commentUserIds)
    : { data: [] };
  const commentUserMap = Object.fromEntries((commentUsers || []).map(u => [u.id, u]));

  const comments = (rawComments || []).map(c => ({
    text: c.content,
    userName: commentUserMap[c.user_id]?.full_name || 'Unknown',
    pictureUrl: commentUserMap[c.user_id]?.avatar_url || null,
    createdAt: c.created_at
  }));

  // Get team members
  const { data: members } = await supabase.from('idea_members')
    .select('user_id, role').eq('idea_id', req.params.id);
  const memberUserIds = (members || []).map(m => m.user_id);
  const { data: memberUsers } = memberUserIds.length > 0
    ? await supabase.from('users').select('id, full_name, avatar_url').in('id', memberUserIds)
    : { data: [] };

  const teamMembers = (memberUsers || []).map(u => ({
    id: u.id,
    name: u.full_name,
    pictureUrl: u.avatar_url
  }));

  // Get feedback
  const { data: feedbackData } = await supabase.from('feedbacks')
    .select('*').eq('idea_id', req.params.id);
  const feedback = (feedbackData || []).map(f => ({
    rating: f.rating,
    comment: f.comment
  }));

  // Get submitter info
  let submittedByName = null, submittedByEmail = null;
  if (idea.submitted_by) {
    const { data: submitter } = await supabase.from('users').select('full_name, email').eq('id', idea.submitted_by).single();
    if (submitter) { submittedByName = submitter.full_name; submittedByEmail = submitter.email; }
  }

  res.json({
    ...mapIdeaToResponse(idea),
    submittedByName,
    submittedByEmail,
    timeLogs,
    comments,
    teamMembers,
    feedback
  });
});

// POST /ideas — create
router.post('/', authenticate, async (req, res) => {
  const { title, description, category, projectType, projectOwner, businessValue, resources, challenges, attachment, attachmentName } = req.body;
  const userId = req.user.userId;

  // Upload attachment to Supabase Storage if provided as base64
  let attachmentUrl = null;
  let storedAttachmentName = attachmentName || null;
  if (attachment && attachment.startsWith('data:')) {
    try {
      const matches = attachment.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = attachmentName ? attachmentName.split('.').pop() : 'bin';
        const filePath = `ideas/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, buffer, { contentType: mimeType, upsert: false });

        if (uploadError) {
          console.error('[attachment] Upload failed:', uploadError.message);
        } else {
          const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
          attachmentUrl = urlData.publicUrl;
        }
      }
    } catch (err) {
      console.error('[attachment] Processing failed:', err.message);
    }
  } else if (attachment) {
    // Already a URL (not base64)
    attachmentUrl = attachment;
  }

  const { data: idea, error } = await supabase.from('ideas').insert({
    title,
    description,
    category,
    project_type: projectType || 'POC',
    priority: 'medium',
    project_owner_name: projectOwner || null,
    business_value: businessValue || null,
    resources: resources || null,
    challenges: challenges || null,
    attachment_url: attachmentUrl,
    attachment_name: storedAttachmentName,
    submitted_by: userId,
    status: 'PendingApproval',
    size: 'Micro',
    complexity: 'Low'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('idea_members').insert({
    idea_id: idea.id, user_id: userId, role: 'owner'
  });

  res.status(201).json(mapIdeaToResponse(idea));
});

// PATCH /ideas/:id/approve
router.patch('/:id/approve', authenticate, requireRole('Admin'), async (req, res) => {
  const { size, complexity, bidCutoffDate, expectedDeliveryDate, estimatedHours, projectType, minHours, maxHours, projectOwner } = req.body;

  const { data: existing } = await supabase.from('ideas').select('submitted_by').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Idea not found' });

  const { data, error } = await supabase.from('ideas').update({
    status: 'BiddingOpen',
    approved_by: req.user.userId,
    size: size || 'Micro',
    complexity: complexity || 'Low',
    bid_cutoff_date: bidCutoffDate,
    expected_delivery_date: expectedDeliveryDate,
    estimated_hours: estimatedHours || null,
    min_hours: minHours || null,
    max_hours: maxHours || null,
    ...(projectType !== undefined && { project_type: projectType }),
    ...(projectOwner !== undefined && { project_owner_name: projectOwner }),
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });

  await awardIdeaSubmissionPoints(existing.submitted_by);
  await notify(existing.submitted_by, 'Idea Approved!', `Your idea "${data.title}" has been approved and is now open for bidding.`, 'approval', req.params.id);
  res.json(mapIdeaToResponse(data));
});

// PATCH /ideas/:id/reject
router.patch('/:id/reject', authenticate, requireRole('Admin'), async (req, res) => {
  const { comment } = req.body;
  const { data, error } = await supabase.from('ideas').update({
    status: 'Rejected',
    approved_by: req.user.userId,
    rejection_comment: comment || null,
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  await notify(data.submitted_by, 'Idea Not Approved', `Your idea "${data.title}" was not approved. ${comment ? 'Reason: ' + comment : 'Check with your manager for details.'}`, 'warning', req.params.id);
  res.json(mapIdeaToResponse(data));
});

// PATCH /ideas/:id/edit — admin edit idea details (dates, size, complexity, owner)
router.patch('/:id/edit', authenticate, requireRole('Admin'), async (req, res) => {
  const { size, complexity, bidCutoffDate, expectedDeliveryDate, estimatedHours, minHours, maxHours, projectOwner, projectType } = req.body;

  const updates = { updated_at: new Date().toISOString() };
  if (size !== undefined) updates.size = size;
  if (complexity !== undefined) updates.complexity = complexity;
  if (bidCutoffDate !== undefined) updates.bid_cutoff_date = bidCutoffDate;
  if (expectedDeliveryDate !== undefined) updates.expected_delivery_date = expectedDeliveryDate;
  if (estimatedHours !== undefined) updates.estimated_hours = estimatedHours;
  if (minHours !== undefined) updates.min_hours = minHours;
  if (maxHours !== undefined) updates.max_hours = maxHours;
  if (projectOwner !== undefined) updates.project_owner_name = projectOwner;
  if (projectType !== undefined) updates.project_type = projectType;

  const { data, error } = await supabase.from('ideas')
    .update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.json(mapIdeaToResponse(data));
});

// PATCH /ideas/:id/send-for-review
router.patch('/:id/send-for-review', authenticate, async (req, res) => {
  const { data: existing } = await supabase.from('ideas').select('status, submitted_by, title').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Idea not found' });
  if (existing.status !== 'InProgress') return res.status(400).json({ error: 'Only InProgress ideas can be sent for review' });

  const { data, error } = await supabase.from('ideas').update({
    status: 'PendingReview',
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Notify admin
  const { data: admins } = await supabase.from('users').select('id').in('role', ['Admin', 'admin']);
  for (const admin of (admins || [])) {
    await notify(admin.id, 'Project ready for review', `"${existing.title}" has been submitted for review.`, 'info', req.params.id);
  }

  res.json(mapIdeaToResponse(data));
});

// PATCH /ideas/:id/complete — mark as completed and award points
router.patch('/:id/complete', authenticate, async (req, res) => {
  const { data: existing } = await supabase.from('ideas').select('status').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Idea not found' });

  const { data, error } = await supabase.from('ideas').update({
    status: 'Completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Award points to bid winner and team members
  try {
    await awardPoints(req.params.id, 'Good');
    // Notify team members
    const { data: members } = await supabase.from('idea_members').select('user_id').eq('idea_id', req.params.id);
    for (const m of (members || [])) {
      await notify(m.user_id, 'Project Completed!', `"${data.title}" has been marked as completed. Points have been awarded!`, 'approval', req.params.id);
    }
  } catch (err) {
    console.error('[complete] Points award failed:', err.message);
  }

  res.json(mapIdeaToResponse(data));
});

// DELETE /ideas/:id — admin delete idea and all related data
router.delete('/:id', authenticate, requireRole('Admin'), async (req, res) => {
  const ideaId = req.params.id;

  // Delete related data first (foreign key order)
  await supabase.from('notifications').delete().eq('idea_id', ideaId);
  await supabase.from('feedbacks').delete().eq('idea_id', ideaId);
  await supabase.from('comments').delete().eq('idea_id', ideaId);
  await supabase.from('time_logs').delete().eq('idea_id', ideaId);
  await supabase.from('idea_members').delete().eq('idea_id', ideaId);
  await supabase.from('point_batches').delete().eq('idea_id', ideaId);
  await supabase.from('project_tasks').delete().eq('idea_id', ideaId);
  await supabase.from('project_messages').delete().eq('idea_id', ideaId);
  await supabase.from('project_links').delete().eq('idea_id', ideaId);
  await supabase.from('project_requirements').delete().eq('idea_id', ideaId);
  await supabase.from('extension_requests').delete().eq('idea_id', ideaId);
  await supabase.from('bids').delete().eq('idea_id', ideaId);

  const { error } = await supabase.from('ideas').delete().eq('id', ideaId);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Idea deleted successfully' });
});

// Helper: map DB idea to FE response shape
function mapIdeaToResponse(idea) {
  return {
    _id: idea.id,
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    projectType: idea.project_type,
    projectOwner: idea.project_owner_name || null,
    status: idea.status,
    size: idea.size,
    complexity: idea.complexity,
    priority: idea.priority,
    submittedBy: idea.submitted_by,
    approvedBy: idea.approved_by,
    estimatedHours: idea.estimated_hours,
    actualHours: idea.actual_hours,
    pointsReward: idea.points_reward,
    bidCutoffDate: idea.bid_cutoff_date,
    expectedDeliveryDate: idea.expected_delivery_date,
    completedAt: idea.completed_at,
    createdAt: idea.created_at,
    updatedAt: idea.updated_at,
    businessValue: idea.business_value,
    resources: idea.resources,
    challenges: idea.challenges,
    rejectionComment: idea.rejection_comment,
    attachmentUrl: idea.attachment_url,
    attachmentName: idea.attachment_name
  };
}

module.exports = router;
