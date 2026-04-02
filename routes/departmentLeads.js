const express = require('express');
const supabase = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /department-leads — list all category leads
router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('department_leads')
    .select('*').order('category', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });

  // Enrich with user names
  const result = [];
  for (const dl of (data || [])) {
    const { data: user } = await supabase.from('users')
      .select('id, full_name, email, avatar_url').eq('id', dl.lead_user_id).single();
    result.push({
      id: dl.id,
      category: dl.category,
      leadUserId: dl.lead_user_id,
      leadName: user?.full_name || 'Unknown',
      leadEmail: user?.email || '',
      leadAvatar: user?.avatar_url || null,
      updatedAt: dl.updated_at,
    });
  }
  res.json(result);
});

// PUT /department-leads/:category — assign/update lead for a category (Admin only)
router.put('/:category', authenticate, requireRole('Admin'), async (req, res) => {
  const { leadUserId } = req.body;
  const category = req.params.category;

  if (!leadUserId) return res.status(400).json({ error: 'leadUserId is required' });

  // Upsert
  const { data: existing } = await supabase.from('department_leads')
    .select('id').eq('category', category).single();

  let result;
  if (existing) {
    const { data, error } = await supabase.from('department_leads')
      .update({ lead_user_id: leadUserId, updated_at: new Date().toISOString() })
      .eq('category', category).select().single();
    if (error) return res.status(500).json({ error: error.message });
    result = data;
  } else {
    const { data, error } = await supabase.from('department_leads')
      .insert({ category, lead_user_id: leadUserId }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    result = data;
  }

  // Get user info
  const { data: user } = await supabase.from('users')
    .select('full_name, email').eq('id', leadUserId).single();

  res.json({
    id: result.id, category, leadUserId,
    leadName: user?.full_name || 'Unknown', leadEmail: user?.email || '',
  });
});

// DELETE /department-leads/:category — remove lead (Admin only)
router.delete('/:category', authenticate, requireRole('Admin'), async (req, res) => {
  await supabase.from('department_leads').delete().eq('category', req.params.category);
  res.json({ deleted: true });
});

module.exports = router;
