const express = require('express');
const dotenv = require('dotenv');
const { generateEmailForBill } = require('./utils/generateEmailForBill');
const { fetchBillDetails } = require('./utils/fetchBill'); // (if still needed elsewhere)
const { getDistrictFromAddress } = require('./utils/getDistrict');
const { getRepresentative } = require('./utils/getRepresentative');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.post('/generate-email', async (req, res) => {
  const { congress, billType, billNumber, userName, userStance, street, city, state, zipCode } = req.body;
  
  if (!congress || !billType || !billNumber || !userName || !userStance || !street || !city || !state || !zipCode) {
    return res.status(400).json({
      error: 'Missing required parameters. Please include congress, billType, billNumber, userName, userStance, street, city, state, and zipCode.'
    });
  }
  
  try {
    // Get district info and then representative details
    const districtInfo = await getDistrictFromAddress(street, city, state, zipCode);
    const districtNumber = parseInt(districtInfo.district, 10);
    const repInfo = await getRepresentative(state, districtNumber);
    
    // Generate the email content using the summary from the summaries endpoint.
    const emailContent = await generateEmailForBill(congress, billType, billNumber, userName, userStance, repInfo);
    res.status(200).json({ emailContent });
  } catch (error) {
    console.error("Error in /generate-email route:", error);
    res.status(500).json({ error: 'Failed to generate email.' });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`CivicEcho server running on http://localhost:${port}`);
  });
}

module.exports = app;
