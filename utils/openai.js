require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Replaces placeholders in the prompt template with actual values.
 */
function formatPrompt(template, values) {
  return template
    .replace(/{{billTitle}}/g, values.billTitle)
    .replace(/{{billSummary}}/g, values.billSummary)
    .replace(/{{repDetails}}/g, values.repDetails)
    .replace(/{{userName}}/g, values.userName)
    .replace(/{{userStance}}/g, values.userStance);
}

async function generateEmail(billSummary, billTitle, userName, userStance, repInfo) {
  let repDetails = "";
  if (repInfo?.state && repInfo?.district) {
    repDetails = repInfo.name
      ? `Your local representative is ${repInfo.name} from ${repInfo.state} District ${repInfo.district}.`
      : `You are located in ${repInfo.state} District ${repInfo.district}.`;
  }

  const promptTemplate = process.env.EMAIL_PROMPT_TEMPLATE;

  const prompt = formatPrompt(promptTemplate, {
    billTitle,
    billSummary,
    repDetails,
    userName,
    userStance
  });

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that writes persuasive emails for civic advocacy." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating email:", error);
    throw new Error("Failed to generate email using OpenAI API.");
  }
}

module.exports = { generateEmail };
