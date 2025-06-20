// utils/trendingRss.js
const Parser = require('rss-parser');
const RSS = require('rss');
const NodeCache = require('node-cache');
const fetchArticleText = require('./rssHelperModules/fetchArticleText');
const summarizeHeadline = require('./rssHelperModules/summarizeHeadline');

// Cache daily (24h)
const xmlCache = new NodeCache({ stdTTL: 86400 });
const jsonCache = new NodeCache({ stdTTL: 86400 });

// Politico feeds only, latest 3 per category
const FEED_URLS = [
    'https://rss.politico.com/politics-news.xml',
    'https://rss.politico.com/healthcare.xml',
    'https://rss.politico.com/defense.xml',
];

/**
 * Fetch and enhance the 3 latest items from each RSS feed.
 */
async function fetchAllItems() {
    const parser = new Parser({ customFields: { item: ['content:encoded'] } });
    const all = [];

    for (const url of FEED_URLS) {
        try {
            const feed = await parser.parseURL(url);
            const latest = (feed.items || []).slice(0, 3);
            for (const item of latest) {
                const rawContent = item['content:encoded'] || item.contentSnippet || '';
                const fullText = rawContent || await fetchArticleText(item.link);
                let headline = item.title;
                if (fullText) {
                    const gen = await summarizeHeadline(fullText);
                    if (gen) headline = gen;
                }
                all.push({
                    title: headline,
                    link: item.link,
                    summary: fullText,
                    pubDate: new Date(item.pubDate || item.isoDate)
                });
            }
        } catch (err) {
            console.warn(`Failed to parse ${url}:`, err.message);
        }
    }

    return all;
}

/**
 * Generate aggregated RSS XML feed, guaranteed to have items.
 */
async function generateTrendingRss() {
    const cached = xmlCache.get('trending_rss');
    if (cached) return cached;

    let items = await fetchAllItems();
    if (!items.length) {
        items = [{ title: 'No trending issues available', link: '', summary: '', pubDate: new Date() }];
    }

    // Sort across feeds by date, take top 9
    items.sort((a, b) => b.pubDate - a.pubDate);
    const topItems = items.slice(0, 9);

    const feed = new RSS({
        title: 'CivicEcho Trending Issues',
        description: 'Daily aggregation of top political headlines.',
        feed_url: `${process.env.BASE_URL}/trending-rss.xml`,
        site_url: process.env.BASE_URL,
        ttl: 1440,
    });

    topItems.forEach(item => {
        feed.item({
            title: item.title,
            description: item.summary,
            url: item.link,
            date: item.pubDate,
        });
    });

    const xml = feed.xml({ indent: true });
    xmlCache.set('trending_rss', xml);
    return xml;
}

/**
 * Serve top 9 trending issues as JSON, with caching.
 */
async function fetchTrendingIssues() {
    const cached = jsonCache.get('trending_json');
    if (cached) return cached;

    let items = await fetchAllItems();
    if (!items.length) {
        items = [{ title: 'No trending issues available', link: '', summary: '' }];
    }

    items.sort((a, b) => b.pubDate - a.pubDate);
    const topItems = items.slice(0, 9).map(({ title, link, summary }) => ({ title, link, summary }));

    jsonCache.set('trending_json', topItems);
    return topItems;
}

module.exports = { generateTrendingRss, fetchTrendingIssues };
