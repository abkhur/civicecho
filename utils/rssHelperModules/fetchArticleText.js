// utils/rssHelperModules/fetchArticleText.js
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

/**
 * Fetches the full article text from a URL using Readability.
 * Falls back to empty string on failure.
 */
async function fetchArticleText(url) {
    try {
        const { data: html } = await axios.get(url, { timeout: 5000 });
        const dom = new JSDOM(html, { url });
        const article = new Readability(dom.window.document).parse();
        return article ? article.textContent : '';
    } catch (err) {
        console.warn('fetchArticleText failed:', err.message);
        return '';
    }
}

module.exports = fetchArticleText;