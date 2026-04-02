require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');

const authRoutes = require('./routes/auth');
const ideasRoutes = require('./routes/ideas');
const bidsRoutes = require('./routes/bids');
const timelogsRoutes = require('./routes/timelogs');
const commentsRoutes = require('./routes/comments');
const feedbackRoutes = require('./routes/feedback');
const membersRoutes = require('./routes/members');
const usersRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const pointsRoutes = require('./routes/points');
const rewardsRoutes = require('./routes/rewards');
const projectsRoutes = require('./routes/projects');
const notificationsRoutes = require('./routes/notifications');
const departmentLeadsRoutes = require('./routes/departmentLeads');

const { runMigrations, getMigrationSQL } = require('./migrate');

const app = express();

app.use(cors());
app.use(express.json());

// Run migrations on startup
runMigrations().catch(err => console.error('[migrate] Failed:', err.message));

// Check bid cutoffs every 5 minutes
const { checkAndAutoAssign } = require('./services/bidAutoAssign');
setInterval(async () => {
  try {
    const results = await checkAndAutoAssign();
    if (results.length > 0) console.log(`[auto-assign] Assigned ${results.length} idea(s)`);
  } catch (err) {
    console.error('[auto-assign] Error:', err.message);
  }
}, 5 * 60 * 1000);

app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/ideas', bidsRoutes);
app.use('/api/ideas', timelogsRoutes);
app.use('/api/ideas', commentsRoutes);
app.use('/api/ideas', feedbackRoutes);
app.use('/api/ideas', membersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', pointsRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/bids', require('./routes/bidActions'));
app.use('/api/projects', projectsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/department-leads', departmentLeadsRoutes);

const swaggerOptions = {
  customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
  customJs: [
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js'
  ]
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, swaggerOptions));
app.get('/api/swagger.json', (req, res) => res.json(swaggerDoc));

// Migration endpoints
app.get('/api/migrate/status', async (req, res) => {
  const status = await runMigrations();
  res.json(status);
});

app.get('/api/migrate/sql', (req, res) => {
  res.type('text/plain').send(getMigrationSQL());
});

app.get('/', (req, res) => res.json({ status: 'BuildBoard API running', docs: '/docs' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
