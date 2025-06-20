const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
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

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Email generation endpoint
app.post('/generate-email', async (req, res) => {
  const {
    congress,
    billType,
    billNumber,
    resolutionNumber,
    issueTopic,
    issueSummary = '',
    userName,
    userStance,
    street,
    city,
    state,
    zipCode,
    userContext = ''
  } = req.body;

  if (!congress || !billType || !userName || !userStance || !street || !city || !state || !zipCode) {
    return res.status(400).json({
      error: 'Missing required parameters. Include congress, billType, userName, userStance, and full address.'
    });
  }

  try {
    const districtInfo = await getDistrictFromAddress(street, city, state, zipCode);
    const districtNumber = parseInt(districtInfo.district, 10);
    const repInfo = await getRepresentative(districtInfo.state, districtNumber);

    let emailContent;
    if (billType === 'issue') {
      if (!issueTopic) {
        return res.status(400).json({ error: 'Missing issueTopic for general issue flow.' });
      }
      emailContent = await generateEmailForIssue(
        issueTopic,
        userName,
        userStance,
        repInfo,
        street,
        city,
        state,
        zipCode,
        userContext,
        issueSummary
      );
    } else {
      const num = billType === 'hr' ? billNumber : resolutionNumber;
      if (!num) {
        return res.status(400).json({ error: 'Missing bill/resolution number for legislative flow.' });
      }
      emailContent = await generateEmailForBill(
        congress,
        billType,
        num,
        userName,
        userStance,
        repInfo,
        street,
        city,
        state,
        zipCode,
        userContext
      );
    }

    res.status(200).json({ emailContent });
  } catch (error) {
    console.error('Error in /generate-email route:', error);
    let message;
    if (error.message.includes('No representative')) {
      message = "We couldn't find a representative for that address.";
    } else if (error.message.includes('No address matches') || error.message.includes('No results')) {
      message = 'Address not found. Please enter a valid U.S. address.';
    } else {
      message = 'Failed to generate email.';
    }
    res.status(500).json({ error: message });
  }
});

// Contact page endpoint
app.post('/get-contact-page', async (req, res) => {
  const { street, city, state, zipCode } = req.body;
  if (!street || !city || !state || !zipCode) {
    return res.status(400).json({ error: 'Missing address fields.' });
  }
  try {
    const { state: stateAbbr, district } = await getDistrictFromAddress(street, city, state, zipCode);
    const contactPage = await getContactPage(stateAbbr, district);
    res.status(200).json({ contactPage });
  } catch (error) {
    console.error('Error in /get-contact-page:', error.message);
    res.status(500).json({ error: 'Failed to retrieve contact page.' });
  }
});

// RSS & JSON endpoints
app.get('/trending-rss.xml', async (req, res) => {
  try {
    const xml = await generateTrendingRss();
    res.type('application/rss+xml').send(xml);
  } catch (err) {
    console.error('Error generating trending RSS:', err.message);
    res.status(500).send('Failed to generate RSS feed');
  }
});

app.get('/trending-issues', async (req, res) => {
  try {
    const issues = await fetchTrendingIssues();
    res.json({ issues });
  } catch (err) {
    console.error('Error fetching trending issues:', err.message);
    res.status(500).json({ issues: [] });
  }
});

app.post('/extract-article', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url field' });
  }
  try {
    // 1️. scrape raw HTML → text
    const raw = await fetchArticleText(url);
    // 2️. generate a short headline
    const title = raw
      ? (await summarizeHeadline(raw)) || url
      : url;
    res.json({ title, summary: raw });
  } catch (err) {
    console.error('Error in /extract-article:', err);
    res.status(500).json({ error: 'Failed to extract or summarize article' });
  }
});

//Create campaign
app.post('/campaigns', async (req, res) => {
  try {
    const { title, description, issueTopic, issueSummary, createdBy } = req.body
    if (!title || !issueTopic) {
      return res.status(400).json({ error: 'Title and issueTopic are required.' })
    }
    const camp = await Campaign.create({ title, description, issueTopic, issueSummary, createdBy })
    res.status(201).json(camp)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A campaign with that title already exists.' })
    }
    console.error(err)
    res.status(500).json({ error: 'Could not create campaign.' })
  }
})

// List
app.get('/campaigns', async (_req, res) => {
  const list = await Campaign.find().sort('-createdAt').limit(20).lean()
  res.json(list)
})

// Detail
app.get('/campaigns/:slug', async (req, res) => {
  const camp = await Campaign.findOne({ slug: req.params.slug }).lean()
  if (!camp) return res.status(404).json({ error: 'Not found' })
  res.json(camp)
})

// Pre-warm RSS cache and then start server
async function startServer() {
  try {
    await generateTrendingRss();
    await fetchTrendingIssues();
    console.log('Trending feeds pre-fetched and cached');
  } catch (err) {
    console.warn('Failed to pre-fetch trending feeds:', err.message);
  }

  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

if (require.main === module) {
  startServer();
}

module.exports = app;
