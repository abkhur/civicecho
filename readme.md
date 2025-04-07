# CivicEcho

CivicEcho is an open-source advocacy automation tool that empowers users to send persuasive emails to their congressional representatives. It leverages data from **Congress.gov**, **U.S. Census TIGERWeb**, and **OpenAI's GPT** to generate personalized, impactful messages based on legislative metadata and local district details.

This repository contains the **backend service** responsible for fetching bill, district, and representative information, generating email content, and preparing it for future delivery. If you're looking for the frontend, [it's right here!](https://github.com/abkhur/civicecho-site)

---

## ✨ Features

- 📜 **Bill Metadata** – Pull title and summary data from Congress.gov
- 🏛️ **District Lookup** – Use Census Geocoder API to match user address with congressional district
- 🧑‍⚖️ **Representative Scraper** – Scrape and store accurate House and Senate contact details
- ✉️ **Email Generation** – Use GPT-3.5 Turbo to generate high-quality, persuasive email content
- 🧪 **Test Coverage** – Integration tests using Jest + Supertest
- 🔍 **Bad Contact Link Finder** – Flags suspicious or ZIP-authenticated forms
- 🧱 **Modular Utilities** – Everything broken into utilities/scripts for reusability

---

## 🧠 Technology Stack

| Purpose              | Tool                      |
|----------------------|---------------------------|
| Server               | Node.js + Express         |
| Language Model       | OpenAI GPT-3.5 Turbo      |
| Scraping / Parsing   | Axios + Cheerio           |
| DB                   | MongoDB (via Mongoose)    |
| Geo/District Lookup  | U.S. Census TIGERWeb API  |
| Bill Metadata        | Congress.gov API          |
| Package Manager      | Yarn                      |
| Testing              | Jest + Supertest          |
| Environment Config   | dotenv                    |

---

## 🗂️ Project Structure

```plaintext
civicecho/
├── utils/
│   ├── schemas/
│   │   └── senator.model.js              # Mongoose schema for senators
│   ├── scrapers/
│   │   ├── populateReps.js              # House scraper
│   │   └── populateSen.js               # Senate scraper
│   ├── scripts/
│   │   └── findBadContactLinks.js       # Flags ZIP-auth pages or broken contact links
│   ├── db.js                            # MongoDB connection handler
│   ├── fetchBill.js                     # Gets bill metadata from Congress.gov
│   ├── generateEmailForBill.js         # Combines all sources + GPT call
│   ├── getBillSummary.js                # Extracts bill summaries
│   ├── getDistrict.js                   # Census Geocoder integration
│   ├── getRepresentative.js             # Rep fetcher (congress.gov fallback)
│   ├── openai.js                        # Handles OpenAI interaction
│   └── stateFipsMap.js                  # FIPS code mappings
├── .gitignore                           # gitignore
├── index.js                             # Entrypoint for CLI/test helpers
├── server.js                            # Main Express server
├── server.test.js                       # Integration test for POST /generate-email
├── LICENSE                              # GPL license
├── package.json                         # Dependencies and scripts
├── roadmap.md                           # Development roadmap
└── readme.md                            # You are here
```

---

## 🧪 API Endpoint

### `POST /generate-email`

Generates a GPT-powered email based on congressional bill metadata, user address, and selected stance.

#### 🔸 Example Request

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
  "zipCode": "24060"
}
```

#### 🔹 Example Response

```json
{
  "emailContent": "Generated persuasive email text..."
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Yarn

### Setup

```bash
git clone https://github.com/your-username/civicecho-backend
cd civicecho
yarn install
```

### Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your-openai-key
CONGRESS_API_KEY=your-congress-dot-gov-key
EMAIL_PROMPT_TEMPLATE=your-prompt-template-here
DB_STRING=mongodb+srv://youruser:yourpass@cluster.mongodb.net/civicecho
```

### Running the Server

```bash
yarn start
# → runs on http://localhost:3000
```

### Running Tests

```bash
yarn test
```

---

## 🛠 Scripts & Tools

| Script                      | Purpose                                              |
|----------------------------|------------------------------------------------------|
| `populateReps.js`          | Scrapes and stores House members in MongoDB         |
| `populateSen.js`           | Scrapes and stores Senate members in MongoDB        |
| `findBadContactLinks.js`   | Checks for broken or zip-validated contact links     |

Use them like so:

```bash
node utils/scrapers/populateReps.js --clear
```

---

## 🧾 License

This project is licensed under the **GNU General Public License v3.0**.  
You **must open source any modifications or forks** that use this backend.

> ✊ CivicEcho is a people-powered project. Thanks guys!