// server.test.js
require('dotenv').config();
jest.setTimeout(15000); // Increase timeout to 15 seconds
const request = require('supertest');
const app = require('./server');

describe('CivicEcho API Integration Tests', () => {
  test('POST /generate-email returns generated email content', async () => {
    const payload = {
      congress: 119,
      billType: "hr",
      billNumber: 1161,
      userName: "Test User",
      userStance: "against",
      street: "800 Drillfield Dr",  // Example street address
      city: "Blacksburg",       // Example city
      state: "VA",            // Example state
      zipCode: "24061"        // Example ZIP code
    };

    const response = await request(app)
      .post('/generate-email')
      .send(payload)
      .set('Accept', 'application/json');

    // Check that we got a 200 status code and an emailContent property in the response
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('emailContent');

    // Optionally, log the generated email content for manual verification.
    console.log("Generated Email Content:", response.body.emailContent);
  });
});
