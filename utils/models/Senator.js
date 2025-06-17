// sSenator.js
const mongoose = require('mongoose');

const senatorSchema = new mongoose.Schema({
  member_full: { type: String },
  last_name: { type: String },
  first_name: { type: String },
  party: { type: String },
  state: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String }, // Now populated with email data
  website: { type: String },
  class: { type: String },
  bioguide_id: { type: String },
  leadership_position: { type: String } // optional field
});

module.exports = mongoose.model('Senator', senatorSchema);
