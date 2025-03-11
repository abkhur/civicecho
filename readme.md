# CivicEcho

  

CivicEcho is an open-source advocacy automation tool that empowers users to send persuasive emails to their congressional representatives. The project leverages data from the Congress.gov API and the U.S. Census Geocoder API along with OpenAI’s GPT-3.5 Turbo to generate personalized, impactful messages based on current legislative information and local district details.

  

## Features

  

-  **Bill Data:** Retrieve detailed bill information and summaries from Congress.gov.

-  **District Lookup:** Use geoLookup via the Census Geocoder API to determine the congressional district based on a full address.

-  **Representative Lookup:** Fetch current representative details using the Congress.gov API.

-  **AI-Powered Emails:** Generate persuasive emails with context that includes the bill summary, title, and local representative details.

-  **Integration Testing:** End-to-end tests built with Jest and Supertest ensure robust API functionality.

  

## Technology Stack

  

-  **Backend:** Node.js, Express

-  **Package Manager:** Yarn

-  **HTTP Client:** Axios

-  **Environment Variables:** dotenv

-  **AI Integration:** OpenAI API (GPT-3.5 Turbo)

-  **Testing:** Jest, Supertest

  

## Project Structure

```
CivicEcho/

├── .env # Environment variables (API keys)

├── package.json

├── .gitignore

├── server.js # Main Express server

├── server.test.js # Integration tests for the API

├── index.js # todo

└── utils/

	├── fetchBill.js # Fetches bill details from Congress.gov

	├── getDistrict.js # Uses the Census Geocoder API (geoLookup) to get district info

	├── getRepresentative.js # Fetches representative details from Congress.gov

	├── getBillSummary.js # Fetches bill summary text from Congress.gov

	├── generateEmailForBill.js# Combines bill summary, title, and rep info to generate email content

	└── openai.js # Integrates with the OpenAI API to generate persuasive emails

```

## Getting Started

  

### Prerequisites

  

- **Node.js:** v14 or higher

- **Yarn**

  

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>

cd CivicEcho
```

  

2.  **Install dependencies:**

```bash
yarn install
```

  

3.  **Set up environment variables:**

  

Create a `.env` file in the root of the project and add:

```dotenv
OPENAI_API_KEY=your-openai-api-key
CONGRESS_API_KEY=your-congress-api-key
```

  

### Running the Server

  

Start the server by running:

```bash
yarn start
```

The server will run on `http://localhost:3000` by default.

  

### Running Tests

Run the integration tests with:

```bash
yarn test
```

  

## API Endpoint

  

### POST `/generate-email`

  

Generate a persuasive email that incorporates bill data, local district information, and representative details.

  

#### Request Body Example

  

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

  

#### Workflow

  

1.  **Bill Details:** The server fetches the bill details (including the title) and a summary from the Congress.gov API.

2.  **District Lookup:** The Census Geocoder API (with geoLookup and layer 54) is used to determine the congressional district from the full address.

3.  **Representative Lookup:** The representative for the given state and district is fetched from the Congress.gov member endpoint.

4.  **Email Generation:** The gathered data is sent to the OpenAI API to generate a persuasive email that is then returned to the client.

  

#### Response Example

  

```json
{
"emailContent": "Generated persuasive email text..."
}
```

  

## Contributing

  

Contributions are welcome! Please fork the repository, create a feature branch, and open a pull request with your changes. For major changes, please open an issue first to discuss what you would like to change.

  

## License

  

This project is licensed under the [MIT License](LICENSE).
