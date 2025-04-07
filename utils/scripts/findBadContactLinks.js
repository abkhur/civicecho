const mongoose = require('mongoose');
require('dotenv').config();

const repSchema = new mongoose.Schema({
  name: String,
  state: String,
  district: String,
  contactUrl: String,
});
const Representative = mongoose.model('Representative', repSchema);

async function findBrokenContactLinks() {
  try {
    await mongoose.connect(process.env.DB_STRING);
    console.log("Connected to MongoDB");

    const reps = await Representative.find({});
    const badLinks = [];

    reps.forEach(rep => {
      const url = rep.contactUrl;

      if (
        !url ||
        url.trim() === "" ||
        url.includes('//') && url.indexOf('//', 8) !== -1 || // multiple slashes
        url.includes('newsletter') ||
        url.includes('press') ||
        url.includes('media') ||
        url.includes('map') ||
        url.includes('subscribe') ||
        url.includes('splash') ||
        url.endsWith('.gov') ||
        url.includes('contact/email-me') && url.length < 45 // catch bad redirects
      ) {
        badLinks.push({ name: rep.name, state: rep.state, district: rep.district, url });
      }
    });

    console.log(`\n🔍 Found ${badLinks.length} suspicious or missing contact links:\n`);
    badLinks.forEach(rep => {
      console.log(`→ ${rep.name} (${rep.state}-${rep.district}): ${rep.url || "No link"}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error checking contact links:", err.message);
  }
}

findBrokenContactLinks();
