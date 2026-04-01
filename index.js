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

const app = express();

app.use(cors());
app.use(express.json());

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
app.use('/api/bids', require('./routes/bidActions'));

const swaggerOptions = {
  customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
  customJs: [
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
    'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js'
  ]
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, swaggerOptions));
app.get('/api/swagger.json', (req, res) => res.json(swaggerDoc));
app.get('/', (req, res) => res.json({ status: 'BuildBoard API running', docs: '/docs' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
