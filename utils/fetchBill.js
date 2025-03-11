// utils/fetchBill.js
require('dotenv').config();
const axios = require('axios');

/**
 * Fetch detailed bill information from the Congress.gov API.
 *
 * @param {number|string} congress - The Congress number (e.g., 117)
 * @param {string} billType - The type of bill (e.g., "hr", "s", "hjres", etc.)
 * @param {number|string} billNumber - The bill number (e.g., 3076)
 * @returns {Promise<Object>} A promise that resolves to the bill data object.
 */
async function fetchBillDetails(congress, billType, billNumber) {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Congress API key in environment variables.");
  }

  // Construct the API URL using the official endpoint.
  // Example: https://api.congress.gov/v3/bill/117/hr/3076?api_key=YOUR_API_KEY&format=json
  const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}?api_key=${apiKey}&format=json`;

  try {
    const response = await axios.get(url);
    
    // The response should have a "bill" key with the detailed data.
    if (response.status === 200 && response.data && response.data.bill) {
      const billData = response.data.bill;
      return billData;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching bill details:", error);
    throw new Error("Failed to fetch bill details from Congress.gov");
  }
}

module.exports = { fetchBillDetails };
