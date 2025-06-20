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

  describe('Issue‐based email flow and error handling', () => {
    test('POST /generate-email (issue) returns generated email content', async () => {
      const payload = {
        congress: 119,
        billType: 'issue',
        issueTopic: 'climate change',
        userName: 'Test User',
        userStance: 'support',
        street: '800 Drillfield Dr',
        city: 'Blacksburg',
        state: 'VA',
        zipCode: '24061',
        userContext: 'I am worried about rising sea levels.'
      };

      const response = await request(app)
        .post('/generate-email')
        .send(payload)
        .set('Accept', 'application/json');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('emailContent');
      expect(response.body.emailContent).toMatch(/Subject:/);               // includes a subject line
      expect(response.body.emailContent).toMatch(/Representative/);         // mentions the rep
      console.log('Issue Email Content:', response.body.emailContent);
    });

    test('POST /generate-email missing issueTopic returns 400', async () => {
      const payload = {
        congress: 119,
        billType: 'issue',
        // issueTopic omitted!
        userName: 'Test User',
        userStance: 'support',
        street: '800 Drillfield Dr',
        city: 'Blacksburg',
        state: 'VA',
        zipCode: '24061'
      };

      const response = await request(app)
        .post('/generate-email')
        .send(payload)
        .set('Accept', 'application/json');

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/Missing issueTopic/);
    });

    test('POST /generate-email invalid address returns 500 with friendly message', async () => {
      const payload = {
        congress: 119,
        billType: 'hr',
        billNumber: 9999,
        userName: 'Test User',
        userStance: 'support',
        street: '123 Nowhere Ln',
        city: 'Gotham',
        state: 'ZZ',
        zipCode: '00000'
      };

      const response = await request(app)
        .post('/generate-email')
        .send(payload)
        .set('Accept', 'application/json');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/Address not found|couldn't find a representative/);
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });


  describe('Trending Issues RSS Feed', () => {
    test('GET /trending-rss.xml returns valid RSS feed', async () => {
      const response = await request(app)
        .get('/trending-rss.xml')
        .set('Accept', 'application/rss+xml');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/rss\+xml/);

      const xml = response.text;
      expect(xml).toMatch(/<\?xml\s+version="1.0"/);
      expect(xml).toMatch(/<rss[^>]*>/);
      expect(xml).toMatch(/<channel>/);
      expect(xml).toMatch(/<item>/);

      const itemCount = (xml.match(/<item>/g) || []).length;
      expect(itemCount).toBeGreaterThanOrEqual(0);

      // Extract and print all <item><title>…</title></item> headlines
      const titles = [];
      const titleRegex = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
      let match;
      while ((match = titleRegex.exec(xml)) !== null) {
        titles.push(match[1]);
      }
      console.log(`Fetched ${itemCount} RSS items. Headlines:`, titles);
    });

    test('Cached feed should not break on repeated calls', async () => {
      await request(app).get('/trending-rss.xml');
      const response2 = await request(app).get('/trending-rss.xml');
      expect(response2.statusCode).toBe(200);
      expect(response2.text).toBeDefined();
    });
  });

  describe('Trending Issues JSON Endpoint', () => {
    test('GET /trending-issues returns an array of issues with expected shape', async () => {
      const response = await request(app)
        .get('/trending-issues')
        .set('Accept', 'application/json');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('issues');
      expect(Array.isArray(response.body.issues)).toBe(true);
      expect(response.body.issues.length).toBeGreaterThanOrEqual(0);

      // Validate shape and collect titles
      const titles = [];
      response.body.issues.forEach(issue => {
        expect(issue).toHaveProperty('title');
        expect(typeof issue.title).toBe('string');
        expect(issue).toHaveProperty('link');
        expect(typeof issue.link).toBe('string');
        expect(issue).toHaveProperty('summary');
        expect(typeof issue.summary).toBe('string');
        titles.push(issue.title);
      });

      console.log(`Fetched ${titles.length} JSON issues. Titles:`, titles);
    });

    test('Cached JSON feed remains stable on repeated calls', async () => {
      const first = await request(app).get('/trending-issues');
      const second = await request(app).get('/trending-issues');
      expect(second.statusCode).toBe(200);
      expect(second.body.issues).toEqual(first.body.issues);
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});
