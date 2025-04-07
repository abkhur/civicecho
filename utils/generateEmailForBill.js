const { getBillSummary } = require('./getBillSummary');
const { fetchBillDetails } = require('./fetchBill');
const { generateEmail } = require('./openai');

/**
 * Generate an email for a bill by fetching its summary and sending it to GPT.
 */
async function generateEmailForBill(
  congress,
  billType,
  billNumber,
  userName,
  userStance,
  repInfo,
  street,
  city,
  state,
  zipCode,
  userContext = ""
) {
  const billDetails = await fetchBillDetails(congress, billType, billNumber);
  const billTitle = billDetails.title || "Unknown Bill Title";
  const summaryText = await getBillSummary(congress, billType, billNumber);

  return await generateEmail(
    summaryText,
    billTitle,
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

module.exports = { generateEmailForBill };
