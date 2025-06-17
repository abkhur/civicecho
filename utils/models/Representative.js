const mongoose = require('mongoose');

const repSchema = new mongoose.Schema({
  simple: Boolean,
  state: String,
  district: String,
  name: String,
  party: String,
  office: String,
  phone: String,
  email: String,
  committee: String,
  website: String,
  contactPage: String,
}, { timestamps: true });

repSchema.index({ name: 1, state: 1, district: 1 }, { unique: true });

module.exports = mongoose.model('Representative', repSchema);
