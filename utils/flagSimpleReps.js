// scripts/markSimpleForms.js
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const Representative = require('../utils/models/Representative');

async function isSimpleContactForm(url) {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(res.data);
    const html = $.text().toLowerCase();

    // Indicators of ZIP authentication (i.e., NOT simple)
    const hasZipAuth = [
      'verify residency',
      'residency verification',
      'zip authentication',
      'zip code authentication',
      'verify address',
      'address authentication'
    ].some(phrase => html.includes(phrase));

    // Check if there's at least one visible <form> tag with enough fields
    const formCount = $('form').length;
    const inputCount = $('input, textarea, select').length;

    const isClearlyFormBased = formCount === 1 && inputCount >= 5;

    return isClearlyFormBased && !hasZipAuth;
  } catch (err) {
    console.warn(`⚠️ Could not check ${url}: ${err.message}`);
    return false;
  }
}

async function markSimpleForms() {
  await mongoose.connect(process.env.DB_STRING);
  console.log("✅ Connected to MongoDB");

  const reps = await Representative.find({ contactPage: { $exists: true, $ne: '' } });

  for (const rep of reps) {
    const simple = await isSimpleContactForm(rep.contactPage);
    await Representative.updateOne({ _id: rep._id }, { $set: { simple } });
    console.log(`${rep.name} → ${simple ? '✅ simple' : '❌ not simple'}`);
  }

  await mongoose.disconnect();
  console.log("✅ Done updating simple flags.");
}

markSimpleForms();
