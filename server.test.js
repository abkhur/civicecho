const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./server');
require('dotenv').config();

jest.setTimeout(15000); // Increase timeout to 15 seconds

describe('CivicEcho API Integration Tests', () => {
  test('POST /generate-email returns generated email content', async () => {
    const payload = {
      congress: 119,
      billType: "hr",
      billNumber: 1161,
      userName: "Test User",
      userStance: "against",
      street: "800 Drillfield Dr",
      city: "Blacksburg",
      state: "VA",
      zipCode: "24061"
    };

    const response = await request(app)
      .post('/generate-email')
      .send(payload)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('emailContent');
    console.log("Generated Email Content:", response.body.emailContent);
  });

  test('POST /get-contact-page returns a valid contact page URL for a given address', async () => {
    const payload = {
      street: "800 Drillfield Dr",
      city: "Blacksburg",
      state: "VA",
      zipCode: "24061"
    };

    const response = await request(app)
      .post('/get-contact-page')
      .send(payload)
      .set('Accept', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('contactPage');
    expect(typeof response.body.contactPage).toBe('string');
    expect(response.body.contactPage).toMatch(/^https?:\/\//);
    console.log("Contact Page:", response.body.contactPage);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});
