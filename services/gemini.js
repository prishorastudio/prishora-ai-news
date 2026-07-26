const { GoogleGenAI } = require("@google/genai");
const config = require("../config/config");

const ai = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY,
});

async function askGemini(prompt) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      const isTemporaryError =
        error.status === 503 ||
        error.code === 503 ||
        error.message?.includes("high demand");

      if (!isTemporaryError || attempt === maxAttempts) {
        throw error;
      }

      console.log(
        `Gemini is busy. Retrying in 5 seconds... (${attempt}/${maxAttempts})`
      );

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

module.exports = {
  askGemini,
};