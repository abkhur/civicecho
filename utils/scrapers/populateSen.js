// populateSenatorsFromURL.js
const axios = require('axios');
const mongoose = require('mongoose');
const xml2js = require('xml2js');
require('dotenv').config();

const Senator = require('../schemas/senator.model'); // Adjust path if necessary

async function populateSenators() {
  try {
    // URL for the Senate XML file on Senate.gov
    const xmlUrl = 'https://www.senate.gov/general/contact_information/senators_cfm.xml';
    const response = await axios.get(xmlUrl);
    const xmlData = response.data;

    // Parse the XML data into a JavaScript object using xml2js
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    if (!result || !result.contact_information || !result.contact_information.member) {
      throw new Error('No senator member data found in the XML.');
    }

    const members = result.contact_information.member;
    const senators = members.map(member => ({
      member_full: member.member_full ? member.member_full[0].trim() : '',
      last_name: member.last_name ? member.last_name[0].trim() : '',
      first_name: member.first_name ? member.first_name[0].trim() : '',
      party: member.party ? member.party[0].trim() : '',
      state: member.state ? member.state[0].trim() : '',
      address: member.address ? member.address[0].trim() : '',
      phone: member.phone ? member.phone[0].trim() : '',
      email: member.email ? member.email[0].trim() : '', // Now including email
      website: member.website ? member.website[0].trim() : '',
      class: member.class ? member.class[0].trim() : '',
      bioguide_id: member.bioguide_id ? member.bioguide_id[0].trim() : '',
      leadership_position: member.leadership_position ? member.leadership_position[0].trim() : ''
    }));

    // Connect to MongoDB Atlas using the connection string from your .env file
    await mongoose.connect(process.env.DB_STRING);
    console.log("Connected to MongoDB Atlas using Mongoose");

    // Insert the senator data into the database
    await Senator.insertMany(senators);
    console.log(`Inserted ${senators.length} senators into the database.`);

    // Disconnect from the database
    await mongoose.disconnect();
    console.log("Database population complete.");
  } catch (error) {
    console.error("Error populating senators database:", error.message);
  }
}

populateSenators();
