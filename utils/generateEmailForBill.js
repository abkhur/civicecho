// utils/generateEmailForBill.js
const { getBillSummary } = require('./getBillSummary');
const { fetchBillDetails } = require('./fetchBill');
const { generateEmail } = require('./openai');

/**
 * Generate an email for a bill by fetching its summary from the Congress.gov API and then passing it to GPT.
 *
 * @param {number|string} congress - The Congress number.
 * @param {string} billType - The bill type (e.g., "hr").
 * @param {number|string} billNumber - The bill number.
 * @param {string} userName - The user's name.
 * @param {string} userStance - The user's stance (e.g., "supports" or "opposes").
 * @param {Object} repInfo - (Optional) Representative information to include in the prompt.
 * @returns {Promise<string>} - The generated email content.
 */
async function generateEmailForBill(congress, billType, billNumber, userName, userStance, repInfo) {
  // Fetch bill details to extract the bill title.
  const billDetails = await fetchBillDetails(congress, billType, billNumber);
  const billTitle = billDetails.title || "Unknown Bill Title";
  
  // Fetch the bill summary using the summaries endpoint.
  const summaryText = await getBillSummary(congress, billType, billNumber);
  
  // Now, pass the summary and title to GPT using your generateEmail function.
  const emailContent = await generateEmail(summaryText, billTitle, userName, userStance, repInfo);
  return emailContent;
}

module.exports = { generateEmailForBill };
