const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { awardIdeaSubmissionPoints } = require('../services/points');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  let query = supabase.from('ideas').select('*').order('created_at', { ascending: false });

  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.category) query = query.eq('category', req.query.category);
  if (req.query.priority) query = query.eq('priority', req.query.priority);
  if (req.query.projectType) query = query.eq('project_type', req.query.projectType);
  if (req.query.submittedBy) query = query.eq('submitted_by', req.query.submittedBy);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('ideas')
    .select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'Idea not found' });
  res.json(data);
});

router.post('/', authenticate, async (req, res) => {
  const { title, description, category, projectType, priority, estimatedHours, projectOwner } = req.body;
  const userId = req.user.userId;

  const { data: idea, error } = await supabase.from('ideas').insert({
    title, description, category,
    project_type: projectType || 'poc',
    priority: priority || 'medium',
    estimated_hours: estimatedHours,
    project_owner: projectOwner,
    submitted_by: userId,
    status: 'pending', size: 'micro', complexity: 'low'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('idea_members').insert({
    idea_id: idea.id, user_id: userId, role: 'owner'
  });

  if (projectOwner && projectOwner !== userId) {
    await supabase.from('idea_members').insert({
      idea_id: idea.id, user_id: projectOwner, role: 'project_owner'
    });
  }

  res.status(201).json(idea);
});

router.patch('/:id/approve', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  const { size, complexity, bidCutoffDate, expectedDeliveryDate } = req.body;

  const { data: idea } = await supabase.from('ideas').select('submitted_by').eq('id', req.params.id).single();
  if (!idea) return res.status(404).json({ error: 'Idea not found' });

  const { data, error } = await supabase.from('ideas').update({
    status: 'approved', approved_by: req.user.userId,
    size, complexity,
    bid_cutoff_date: bidCutoffDate,
    expected_delivery_date: expectedDeliveryDate,
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });

  await awardIdeaSubmissionPoints(idea.submitted_by);
  res.json(data);
});

router.patch('/:id/reject', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  const { data, error } = await supabase.from('ideas').update({
    status: 'rejected', approved_by: req.user.userId,
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id/complete', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('ideas').update({
    status: 'completed', completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
