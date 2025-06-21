
# CivicEcho – Backend

This is the backend for [**CivicEcho**](https://civicecho.org), a people-powered advocacy tool that helps users send persuasive, AI-generated messages to their congressional representatives. It connects real legislative data with user input and delivers clean, professional email content that actually gets seen.

This server handles everything from bill metadata scraping to district lookups, email generation, trending issue feeds, and campaign storage. It’s built to be modular, readable, and ready-ish for scale (but still understandable if you're skimming it at 3AM lol)

If you're looking for the frontend:  
--> [**civicecho-site**](https://github.com/abkhur/civicecho-site)

---

## 🔥 Features

- **AI Email Generation** — Uses GPT-3.5 to write persuasive, district-aware messages
- **Bill Lookup** — Pulls title/summary from Congress.gov
- **District Detection** — Maps user addresses to congressional districts via Census
-  **Representative Fetching** — Pulls rep metadata and finds best contact pages
- **Bad Contact Link Detection** — Flags ZIP-auth-only or broken submission forms
- **Trending Issue Feeds** — Aggregates news + summaries via RSS
- **Campaign API** — Lets users create and list public shareable campaigns
- **Modular Utilities** — Everything broken out into clean, reusable modules

---

## Tech Stack

| Role               | Tool                      |
|--------------------|---------------------------|
| Server             | Node.js + Express         |
| Language Model     | OpenAI GPT-3.5            |
| Scraping           | Axios + Cheerio           |
| DB                 | MongoDB (via Mongoose)    |
| Geocoding          | U.S. Census TIGERWeb API, LocationIQ  |
| Metadata           | Congress.gov API          |
| Testing            | Jest + Supertest          |
| Environment Config | dotenv                    |
| Package Manager    | Yarn                      |

---

## 📂 File Overview

```	
civicecho/
├── utils/
│ ├── schemas/ # Mongoose schemas
│ ├── scrapers/ # Rep/senator population scripts
│ ├── rssHelperModules/ # News summarization utils
│ ├── scripts/ # Misc. Scripts
│
│ ├── generateEmailForBill.js
│ ├── generateEmailForIssue.js
│ ├── getDistrict.js
│ ├── getRepresentative.js
│ ├── getContactPage.js
│ ├── getBillSummary.js
│ ├── flagSimpleReps.js #for testing
│ ├── fetchBill.js
│ ├── openai.js
│ ├── db.js
│ ├── stateUtils.js
│ ├── trendingRss.js
│ └── stateFipsMap.js
│
├── server.js # Express server with all routes
├── server.test.js # Integration tests
├── roadmap.md # Project roadmap / dev notes
├── package.json
└── .env.example
```


---

## 📬 API Endpoints

### `POST /generate-email`
Generates an AI-written email for a specific bill **or** general issue.

#### Body Example (bill):
```json
{
  "congress": 119,
  "billType": "hr",
  "billNumber": 1161,
  "userName": "Test User",
  "userStance": "against",
  "street": "800 Drillfield Dr",
  "city": "Blacksburg",
  "state": "VA",
  "zipCode": "24060",
  "userContext": "I'm a student at Virginia Tech..."
}
```

#### Body Example (issue-based):
```json
{
  "billType": "issue",
  "issueTopic": "Student loan forgiveness",
  "issueSummary": "Why forgiving student debt matters to me.",
  "userName": "Test User",
  "userStance": "support",
  "street": "800 Drillfield Dr",
  "city": "Blacksburg",
  "state": "VA",
  "zipCode": "24060"
}
```

### POST /get-contact-page

Returns the best available contact page for a representative, given an address.

### GET /trending-issues

Returns a JSON feed of hot-button topics derived from real news.

### GET /trending-rss.xml

Returns an RSS feed version of the same trending issues.

### POST /extract-article

Scrapes and summarizes article text from a given URL. Used for trend detection.

### POST /campaigns

Creates a new CivicEcho campaign:

```json
{
  "title": "Against war in the Middle East",
  "description": "I thought we already learned our lesson once!",
  "issueTopic": "War in the Middle East",
  "issueSummary": "Concerns around entering a conflict.",
  "createdBy": "abkhur"
}
```

### GET /campaigns

Returns a list of the most recent campaigns.

### GET /campaigns/:slug

Returns detailed info for a single campaign.

---

## Local Dev Setup
### 1. Clone & Install

```bash
git clone https://github.com/abkhur/civicecho-backend
cd civicecho-backend
yarn install
```

### 2. Add a .env file:

```bash
OPENAI_API_KEY=your-openai-key
CONGRESS_API_KEY=your-congress-dot-gov-key
EMAIL_PROMPT_TEMPLATE=your-email-prompt
DB_STRING=mongodb+srv://username:password@cluster.mongodb.net/civicecho
```

### 3. Run the server

```bash
yarn start
 ➜ http://localhost:3000
 ```

### 4. Run the tests
```bash
yarn test
```
---

## 🛠️ Developer Tools
Script	Description
populateReps.js	Scrapes all House members and stores them
populateSen.js	Scrapes all current Senators
findBadContactLinks.js	Detects unusable or ZIP-walled contact forms

| Script | Description |
|--|--|
| populateReps.js | Scrapes all House members and stores them in a MongoDB database |
| populateSen.js | Scrapes all current Senators |
|findBadContactLinks.js	|Detects unusable or ZIP-walled contact forms|
|node utils/scrapers/populateReps.js --clear| Clears DB (used for testing

---
## License

GNU Affero General Public License v3.0 (AGPL-3.0)
You may fork, self-host, and remix this code — but any publicly accessible version must also be open-sourced under the same license.

#### CivicEcho is meant to empower, not profit. Keep it free. Keep it public.
----

##  Notes from Abdul

This backend is still evolving — more routes are coming soon. Feel free to open issues, make PRs, or fork it and do something cool. Just keep the spirit of it alive.
