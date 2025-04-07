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
    .replace(/{{userStance}}/g, values.userStance)
    .replace(/{{userContext}}/g, values.userContext || "")
    .replace(/{{userAddress}}/g, values.userAddress || "");
}

async function generateEmail(
  billSummary,
  billTitle,
  userName,
  userStance,
  repInfo,
  street,
  city,
  state,
  zipCode,
  userContext = ""
) {
  const fullAddress = `${street}, ${city}, ${state} ${zipCode}`;
  const repDetails = repInfo?.name && repInfo?.state && repInfo?.district
    ? `Your local representative is ${repInfo.name} from ${repInfo.state} District ${repInfo.district}.`
    : repInfo?.state && repInfo?.district
    ? `You are located in ${repInfo.state} District ${repInfo.district}.`
    : "";

  const prompt = formatPrompt(process.env.EMAIL_PROMPT_TEMPLATE, {
    billTitle,
    billSummary,
    repDetails,
    userName,
    userStance,
    userContext,
    userAddress: fullAddress
  });

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that writes persuasive emails for civic advocacy. You will receive structured prompts with information about a bill, a constituent's opinion, and other context. Respond with a polished email from the constituent to their congressional representative. Never generate content that includes hate speech or incites harm."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI generation failed:", error.message);
    throw new Error('Failed to generate email.');
  }
}

module.exports = { generateEmail };
