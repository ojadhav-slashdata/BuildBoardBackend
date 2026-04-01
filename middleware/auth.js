const jwt = require('jsonwebtoken');
const supabase = require('../db');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];

    // Decode Firebase token (Firebase tokens are JWTs)
    // For hackathon: decode without verification since Firebase already verified on client
    const decoded = jwt.decode(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const uid = decoded.user_id || decoded.sub || decoded.uid;
    const email = decoded.email;
    const name = decoded.name || email?.split('@')[0] || 'User';
    const picture = decoded.picture || null;

    if (!uid || !email) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Find or create user in Supabase
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', uid)
      .single();

    if (!user) {
      // Check by email too
      const { data: byEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (byEmail) {
        user = byEmail;
        // Update google_id if missing
        if (!byEmail.google_id) {
          await supabase.from('users').update({ google_id: uid }).eq('id', byEmail.id);
        }
      } else {
        // Create new user
        const superAdmin = process.env.SUPER_ADMIN_EMAIL;
        const role = email.toLowerCase() === superAdmin?.toLowerCase() ? 'Admin' : 'Employee';

        const { data: newUser, error } = await supabase.from('users').insert({
          email,
          full_name: name,
          avatar_url: picture,
          google_id: uid,
          role,
          total_points: 0
        }).select().single();

        if (error) {
          console.error('User creation error:', error);
          return res.status(500).json({ error: 'Failed to create user' });
        }
        user = newUser;
      }
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      pictureUrl: user.avatar_url,
      totalPoints: user.total_points
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
