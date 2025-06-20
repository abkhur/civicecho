// utils/generateEmailForIssue.js
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Generate a persuasive email for a general policy or issue, with optional news context.
 * @param {string} issueTopic - The title of the issue/topic.
 * @param {string} userName - The sender's name.
 * @param {string} userStance - 'support' or 'oppose'.
 * @param {object} repInfo - Representative info (name, state, district).
 * @param {string} street
 * @param {string} city
 * @param {string} state
 * @param {string} zipCode
 * @param {string} [userContext] - Additional user context.
 * @param {string} [issueSummary] - Full article content or summary from RSS feed.
 */
async function generateEmailForIssue(
    issueTopic,
    userName,
    userStance,
    repInfo,
    street,
    city,
    state,
    zipCode,
    userContext = '',
    issueSummary = ''
) {
    const fullAddress = `${street}, ${city}, ${state} ${zipCode}`;
    const repDetails = repInfo?.name && repInfo?.state && repInfo?.district
        ? `Your local representative is ${repInfo.name} from ${repInfo.state} District ${repInfo.district}.`
        : repInfo?.state && repInfo?.district
            ? `You are located in ${repInfo.state} District ${repInfo.district}.`
            : '';

    // Build prompt with optional news context
    const promptParts = [];
    promptParts.push(`Write a persuasive email to a congressional representative regarding the issue: "${issueTopic}".`);
    if (issueSummary) {
        promptParts.push(`Here is some recent news context on this issue: "${issueSummary}".`);
    }
    if (repDetails) {
        promptParts.push(repDetails);
    }
    promptParts.push(`The sender's name is ${userName}, and they strongly ${userStance} this issue.`);
    if (userContext) {
        promptParts.push(`They also provided personal context: "${userContext}".`);
    }
    promptParts.push(
        `The email should be professional, concise, and impactful, encouraging the representative to take positive action. ` +
        `Include a subject line as the first line, then two newlines, and close with a respectful signoff and the sender's full address: ${fullAddress}.`
    );

    const prompt = promptParts.join(' ');

    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a helpful assistant that writes persuasive emails for civic advocacy. ' +
                        'You will receive structured prompts with an issue, optional news context, and constituent details. ' +
                        'Respond with a polished email addressed to the constituent’s representative. ' +
                        'Always include a subject line as the first line. Do not include any hate speech or incitements to harm.'
                },
                { role: 'user', content: prompt }
            ],
            max_tokens: 600,
            temperature: 0.7,
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI generation failed (issue flow):', error.message);
        throw new Error('Failed to generate issue-based email.');
    }
}

module.exports = { generateEmailForIssue };
