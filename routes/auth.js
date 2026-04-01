const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken, audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    const allowedDomain = process.env.ALLOWED_DOMAIN;
    if (allowedDomain) {
      const emailDomain = payload.email.split('@')[1];
      if (emailDomain.toLowerCase() !== allowedDomain.toLowerCase()) {
        return res.status(401).json({ error: 'Email domain not allowed' });
      }
    }

    let { data: user } = await supabase.from('users')
      .select('*').eq('google_id', payload.sub).single();

    if (!user) {
      const superAdmin = process.env.SUPER_ADMIN_EMAIL;
      const role = payload.email.toLowerCase() === superAdmin?.toLowerCase() ? 'admin' : 'employee';

      const { data: newUser, error } = await supabase.from('users').insert({
        email: payload.email,
        full_name: payload.name,
        avatar_url: payload.picture,
        google_id: payload.sub,
        role, total_points: 0
      }).select().single();

      if (error) return res.status(500).json({ error: error.message });
      user = newUser;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id, email: user.email, fullName: user.full_name,
        avatarUrl: user.avatar_url, role: user.role,
        department: user.department, totalPoints: user.total_points
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const { data: user, error } = await supabase.from('users')
    .select('*').eq('id', req.user.userId).single();
  if (error || !user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id, email: user.email, fullName: user.full_name,
    avatarUrl: user.avatar_url, role: user.role,
    department: user.department, totalPoints: user.total_points
  });
});

module.exports = router;
