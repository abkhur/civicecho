const axios = require('axios');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
require('dotenv').config();

const Representative = require('../models/Representative'); 

// Only valid U.S. states
const validStates = new Set([
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]);

async function findContactPage(websiteUrl) {
  try {
    const res = await axios.get(websiteUrl, { timeout: 2000 });
    const $ = cheerio.load(res.data);
    const base = new URL(websiteUrl);

    const links = $('a[href]')
      .map((_, el) => $(el).attr('href'))
      .get()
      .filter(href => /contact/i.test(href));

    const scoredLinks = [];

    for (const href of links) {
      const fullUrl = href.startsWith('http') ? href
                    : href.startsWith('/') ? `${base.origin}${href}`
                    : `${base.origin}/${href}`;

      const normalized = normalizeUrl(fullUrl);

      let score = 0;
      let isSimple = false;

      if (/\/contact(-us)?\/?$/.test(href)) score += 10;
      if (/email-me|write/.test(href)) score += 5;
      if (/newsletter|press|media|zip_auth/.test(href)) score -= 20;
      if (/contact/.test(href)) score += 5;

      try {
        const contactRes = await axios.get(normalized, { timeout: 3000 });
        const $$ = cheerio.load(contactRes.data);

        const form = $$('form');
        if (form.length > 0) score += 10;

        const inputs = $$('input, textarea, select, label').toArray();

        const hasBasicFields = ['name', 'email', 'message', 'subject'].some(field =>
          inputs.some(el => {
            const attr = $$(el).attr('name') || $$(el).attr('id') || $$(el).text();
            return attr.toLowerCase().includes(field);
          })
        );

        if (form.length === 1 && hasBasicFields) {
          isSimple = true;
          score += 20;
        }
      } catch {
        score -= 10;
      }

      scoredLinks.push({ url: normalized, score, simple: isSimple });
    }

    const best = scoredLinks.sort((a, b) => b.score - a.score)[0];
    return best ? { url: best.url, simple: best.simple } : { url: '', simple: false };

  } catch (err) {
    console.warn(`⚠️ Failed to fetch contact page for ${websiteUrl}: ${err.message}`);
    return { url: '', simple: false };
  }
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    const clean = `${parsed.origin}${parsed.pathname}`;
    return clean.replace(/([^:]\/)\/+/g, '$1');
  } catch {
    return url;
  }
}

async function populateReps(clearDb = false) {
  try {
    const url = 'https://www.house.gov/representatives';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const reps = [];

    $('table.table').each((i, table) => {
      const state = $(table).find('caption').text().trim();
      if (!validStates.has(state)) return;

      $(table).find('tbody tr').each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 6) {
          const district = $(cells[0]).text().trim();
          const name = $(cells[1]).text().trim();
          if (/vacancy/i.test(name)) return;

          const party = $(cells[2]).text().trim();
          const office = $(cells[3]).text().trim();
          const phone = $(cells[4]).text().trim();
          const committee = $(cells[5]).text().trim();

          const emailLink = $(cells[1]).find('a[href^="mailto:"]').attr('href');
          const email = emailLink ? emailLink.replace('mailto:', '').trim() : '';
          const website = $(cells[1]).find('a[href^="http"]').attr('href') || '';

          reps.push({
            state,
            district,
            name,
            party,
            office,
            phone,
            email,
            committee,
            website,
            contactPage: '',
          });
        }
      });
    });

    // Connect to DB
    await mongoose.connect(process.env.DB_STRING);
    console.log("Connected to MongoDB");

    if (clearDb) {
      await Representative.deleteMany({});
      console.log("Cleared existing records.");
    }

    for (const rep of reps) {
      if (rep.website) {
        const { url, simple } = await findContactPage(rep.website);
        rep.contactPage = url;
        rep.simple = simple;
    
        console.log(`→ ${rep.name} → ${url || 'No contact page found'}${simple ? ' (simple)' : ''}`);
      }
    
      await Representative.updateOne(
        { name: rep.name, state: rep.state, district: rep.district },
        { $set: rep },
        { upsert: true }
      );
    }
    

    console.log(`Done processing ${reps.length} representatives.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error populating database:", error.message);
  }
}

// CLI arg handling
const shouldClear = process.argv.includes('--clear');
populateReps(shouldClear);
