// utils/getBillSummary.js
const axios = require('axios');

/**
 * Get the summary of a bill from the Congress.gov API.
 *
 * @param {number|string} congress - The Congress number (e.g., 117)
 * @param {string} billType - The type of bill (e.g., "hr", "s")
 * @param {number|string} billNumber - The bill number (e.g., 3076)
 * @returns {Promise<string>} - The text of the first summary.
 */
async function getBillSummary(congress, billType, billNumber) {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Congress API key in environment variables.");
  }
  const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}/summaries?api_key=${apiKey}&format=json`;
  
  try {
    const response = await axios.get(url);
    const summaries = response.data.summaries;
    if (!summaries || summaries.length === 0) {
      throw new Error("No summaries found for the bill.");
    }
    // Return the text of the first summary.
    return summaries[0].text;
  } catch (error) {
    console.error("Error fetching bill summary:", error.message);
    throw error;
  }
}

module.exports = { getBillSummary };
