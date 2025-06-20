/* server.js */
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const { createLogger, transports, format } = require('winston');
const rateLimit = require('express-rate-limit');

const { generateEmailForBill } = require('./utils/generateEmailForBill');
const { generateEmailForIssue } = require('./utils/generateEmailForIssue');
const { getDistrictFromAddress } = require('./utils/getDistrict');
const { getRepresentative } = require('./utils/getRepresentative');
const { connectDB } = require('./utils/db');
const { getContactPage } = require('./utils/getContactPage');
const { generateTrendingRss, fetchTrendingIssues } = require('./utils/trendingRss');
const fetchArticleText = require('./utils/rssHelperModules/fetchArticleText');
const summarizeHeadline = require('./utils/rssHelperModules/summarizeHeadline');
const Campaign = require('./utils/models/Campaign');

// Load environment
dotenv.config();

// Initialize Express
const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;

// Winston logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [new transports.Console()]
});

// HTTP request logging
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// JSON body parsing
app.use(express.json());

// CORS & origin validation
const allowedOrigins = ['https://civicecho.org', 'https://www.civicecho.org'];
app.use((req, res, next) => {
  const origin = req.get('Origin') || '';
  if (origin && !allowedOrigins.includes(origin)) {
    logger.warn('Blocked invalid origin', { origin, path: req.path });
    return res.status(403).json({ error: 'Forbidden: Invalid origin' });
  }
  next();
});
app.use(cors({ origin: allowedOrigins, optionsSuccessStatus: 200 }));

// Rate limiting
const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Connect to MongoDB
connectDB().catch(err => {
  logger.error('DB connection failed', { message: err.message });
  process.exit(1);
});

// Healthcheck
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Validation chains
const emailValidation = [
  body('congress').isInt({ min: 1 }),
  body('userName').isString().trim().notEmpty(),
  body('billType').isIn(['hr', 'hres', 'issue']),
  body('street').notEmpty(),
  body('city').notEmpty(),
  body('state').notEmpty(),
  body('zipCode').notEmpty()
];

// Routes
app.post('/generate-email', emailLimiter, emailValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const { congress, billType, billNumber, resolutionNumber, issueTopic = '', issueSummary = '', userName, userStance, street, city, state, zipCode, userContext = '' } = req.body;
    const districtInfo = await getDistrictFromAddress(street, city, state, zipCode);
    const repInfo = await getRepresentative(districtInfo.state, parseInt(districtInfo.district, 10));
    let emailContent;
    if (billType === 'issue') {
      emailContent = await generateEmailForIssue(issueTopic, userName, userStance, repInfo, street, city, state, zipCode, userContext, issueSummary);
    } else {
      const num = billType === 'hr' ? billNumber : resolutionNumber;
      emailContent = await generateEmailForBill(congress, billType, num, userName, userStance, repInfo, street, city, state, zipCode, userContext);
    }
    res.json({ emailContent });
  } catch (err) {
    next(err);
  }
});

app.post('/get-contact-page', emailLimiter, [
  body('street').notEmpty(),
  body('city').notEmpty(),
  body('state').notEmpty(),
  body('zipCode').notEmpty()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const { state: st, district } = await getDistrictFromAddress(req.body.street, req.body.city, req.body.state, req.body.zipCode);
    const contactPage = await getContactPage(st, district);
    res.json({ contactPage });
  } catch (err) {
    next(err);
  }
});

app.post('/extract-article', emailLimiter, [body('url').isURL()], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const raw = await fetchArticleText(req.body.url);
    const title = raw ? (await summarizeHeadline(raw)) || req.body.url : req.body.url;
    res.json({ title, summary: raw });
  } catch (err) {
    next(err);
  }
});

app.post('/campaigns', emailLimiter, [body('title').notEmpty(), body('issueTopic').notEmpty()], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const camp = await Campaign.create(req.body);
    res.status(201).json(camp);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Duplicate campaign' });
    next(err);
  }
});

app.get('/campaigns', async (req, res, next) => {
  try { const list = await Campaign.find().sort('-createdAt').limit(20); res.json(list); } catch (err) { next(err); }
});
app.get('/campaigns/:slug', async (req, res, next) => {
  try {
    const camp = await Campaign.findOne({ slug: req.params.slug });
    if (!camp) return res.status(404).json({ error: 'Not found' });
    res.json(camp);
  } catch (err) { next(err); }
});

app.get('/trending-rss.xml', async (req, res, next) => {
  try { res.type('application/rss+xml').send(await generateTrendingRss()); } catch (err) { next(err); }
});
app.get('/trending-issues', async (req, res, next) => {
  try { res.json({ issues: await fetchTrendingIssues() }); } catch (err) { next(err); }
});

// Centralized error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
app.listen(port, () => logger.info(`Server running on port ${port}`));

module.exports = app;
