const mongoose = require('mongoose');
const slugify = require('slugify');

const CampaignSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    issueTopic: { type: String, required: true },
    issueSummary: String,
    slug: { type: String, required: true, unique: true },
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
});

// generate slug before save
CampaignSchema.pre('validate', function () {
    if (this.title && !this.slug) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
});

module.exports = mongoose.model('Campaign', CampaignSchema);
