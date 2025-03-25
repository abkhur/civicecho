// populateReps.js
const axios = require('axios');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
require('dotenv').config();

// Define a Mongoose schema for a representative
const repSchema = new mongoose.Schema({
  state: String,
  district: String,
  name: String,
  party: String,
  office: String,
  phone: String,
  email: String,       // Optional, if available
  committee: String,
});

const Representative = mongoose.model('Representative', repSchema);

/**
 * Fetch the representatives page from House.gov, scrape contact information,
 * and insert the data into the MongoDB database.
 */
async function populateReps() {
  try {
    // Fetch the representatives page directly from House.gov
    const url = 'https://www.house.gov/representatives';
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    const reps = [];
    
    // Iterate over each table on the page; each table typically corresponds to a state.
    $('table.table').each((i, table) => {
      // Get the state name from the table caption.
      const state = $(table).find('caption').text().trim();
      
      // Iterate over each row in the table's tbody.
      $(table).find('tbody tr').each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 6) { // Expect at least 6 columns per row.
          const district = $(cells[0]).text().trim();
          const name = $(cells[1]).text().trim();
          const party = $(cells[2]).text().trim();
          const office = $(cells[3]).text().trim();
          const phone = $(cells[4]).text().trim();
          const committee = $(cells[5]).text().trim();
          
          // Attempt to extract an email if a mailto link exists in the name column.
          let email = '';
          const mailtoLink = $(cells[1]).find('a[href^="mailto:"]').attr('href');
          if (mailtoLink) {
            email = mailtoLink.replace('mailto:', '').trim();
          }
          
          // Only add rows that have a valid name and phone number.
          if (name && phone) {
            reps.push({ state, district, name, party, office, phone, email, committee });
          }
        }
      });
    });
    
    // Connect to MongoDB Atlas using Mongoose.
    await mongoose.connect(process.env.DB_STRING);
    console.log("Connected to MongoDB Atlas using Mongoose");
    
    // Insert scraped representative data into the database.
    await Representative.insertMany(reps);
    console.log(`Inserted ${reps.length} representatives into the database.`);
    
    // Disconnect from the database.
    await mongoose.disconnect();
    console.log("Database population complete.");
  } catch (error) {
    console.error("Error populating database:", error.message);
  }
}

// Run the population script.
populateReps();
