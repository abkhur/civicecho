// utils/openai.js
require('dotenv').config();

const { Configuration, OpenAIApi } = require("openai");

// Set up the OpenAI configuration using your API key from environment variables.
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Generate a persuasive email based on bill details, user information, and local representative data.
 *
 * @param {string} billSummary - The summary of the bill.
 * @param {string} billTitle - The title of the bill.
 * @param {string} userName - The name of the user.
 * @param {string} userStance - The user's stance (e.g., "supports" or "opposes").
 * @param {Object} repInfo - Local representative data (should include state and district; name is optional).
 * @returns {Promise<string>} - A promise that resolves to the generated email content.
 */
async function generateEmail(billSummary, billTitle, userName, userStance, repInfo) {
  // Prepare representative details if provided.
  let repDetails = "";
  if (repInfo && repInfo.state && repInfo.district) {
    if (repInfo.name) {
      repDetails = `Your local representative is ${repInfo.name} from ${repInfo.state} District ${repInfo.district}.`;
    } else {
      repDetails = `You are located in ${repInfo.state} District ${repInfo.district}.`;
    }
  }

  // Construct a prompt that provides the necessary context for a persuasive email.
  const prompt = `Write a persuasive email to a congressional representative regarding the bill titled "${billTitle}". 
The bill summary is: "${billSummary}". 
${repDetails}
The sender's name is ${userName}, and they strongly ${userStance} this bill.
The email should be professional, concise, and impactful, encouraging the representative to take positive action.`;

  try {
    // Create a chat completion using GPT-3.5 Turbo.
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that writes persuasive emails for civic advocacy." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,  // Adjust the token count as needed.
      temperature: 0.7, // A moderate level of randomness for creative yet focused output.
    });

    // Extract and return the email content from the API response.
    const emailContent = response.data.choices[0].message.content;
    return emailContent;
  } catch (error) {
    console.error("Error generating email:", error);
    throw new Error("Failed to generate email using OpenAI API.");
  }
}

module.exports = { generateEmail };
