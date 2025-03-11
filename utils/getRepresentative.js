// utils/getRepresentative.js
const axios = require('axios');

/**
 * Fetch representative details from the Congress.gov API for a given state and district.
 *
 * @param {string} stateCode - The two-letter state code (e.g., "VA").
 * @param {number} district - The congressional district number.
 * @returns {Promise<Object>} - An object representing the representative.
 */
async function getRepresentative(stateCode, district) {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Congress API key in environment variables.");
  }
  const url = `https://api.congress.gov/v3/member/${stateCode}/${district}?api_key=${apiKey}&format=json&currentMember=True`;
  
  try {
    const response = await axios.get(url);
    const members = response.data.members;
    if (members && members.length > 0) {
      return members[0];
    } else {
      throw new Error(`No representative found for ${stateCode} district ${district}`);
    }
  } catch (error) {
    console.error("Error fetching representative:", error.message);
    throw error;
  }
}

module.exports = { getRepresentative };
