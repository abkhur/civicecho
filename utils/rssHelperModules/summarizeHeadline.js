// utils/rssHelperModules/summarizeHeadline.js
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

/**
 * Generates a concise headline for an article using GPT, given its full text.
 */
async function summarizeHeadline(articleText) {
    try {
        const resp = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a headline generator. Provide a short, punchy headline that focuses on the actual issue/policy at hand.' },
                { role: 'user', content: `Article content: """${articleText}"""` }
            ],
            max_tokens: 20,
            temperature: 0.5,
        });
        return resp.data.choices[0].message.content.trim();
    } catch (err) {
        console.warn('summarizeHeadline failed:', err.message);
        return '';
    }
}

module.exports = summarizeHeadline;