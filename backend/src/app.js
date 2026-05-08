const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { errorHandler } = require('./middlewares/errorHandler');
const swaggerSpec = require('./swagger/swagger');

const app = express();

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX),
  message: { error: 'Too many requests, please try again later.' }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
const corsOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const experienceRoutes = require('./routes/experience.routes');
const educationRoutes = require('./routes/education.routes');
const certificationRoutes = require('./routes/certification.routes');
const projectRoutes = require('./routes/project.routes');
const skillRoutes = require('./routes/skill.routes');
const languageRoutes = require('./routes/language.routes');
const socialLinkRoutes = require('./routes/socialLink.routes');
const repositoryRoutes = require('./routes/repository.routes');
const categoryRoutes = require('./routes/category.routes');
const contactRoutes = require('./routes/contact.routes');
const uploadRoutes = require('./routes/upload.routes');
const settingRoutes = require('./routes/setting.routes');
const publicRoutes = require('./routes/public.routes');
const statsRoutes = require('./routes/stats.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/social-links', socialLinkRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
