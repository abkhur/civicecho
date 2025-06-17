// utils/getContactPage.js
const Representative = require('./models/Representative.js');
const { stateAbbreviationToFullName } = require('./stateUtils.js'); // create this map
const ordinal = require('ordinal'); // install this with: yarn add ordinal

/**
 * Get the contact page for a representative based on state abbreviation and district number
 * @param {string} stateAbbr - e.g., "KS"
 * @param {string|number} district - e.g., 3 or "03"
 * @returns {Promise<string>} - Contact page URL
 */
async function getContactPage(stateAbbr, district) {
  const fullStateName = stateAbbreviationToFullName[stateAbbr.toUpperCase()];
  if (!fullStateName) throw new Error(`Invalid state abbreviation: ${stateAbbr}`);

  const normalizedDistrict = ordinal(parseInt(district)); // "3" → "3rd"

  const rep = await Representative.findOne({
    state: fullStateName,
    district: normalizedDistrict
  });

  if (!rep || !rep.contactPage) {
    throw new Error(`No contact page found for ${fullStateName} ${normalizedDistrict}`);
  }

  return rep.contactPage;
}

module.exports = { getContactPage };
