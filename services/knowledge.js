const { askGemini } = require("./gemini");

async function buildKnowledge(selectedStory) {
  const prompt = `
You are an AI Research Analyst.

Analyze this selected story:

"${selectedStory}"

Return ONLY valid JSON in this exact structure:

{
  "mode": "news",
  "headline": "",
  "summary": "",
  "keyFacts": [
    "",
    "",
    ""
  ],
  "whyItMatters": "",
  "researchQuestions": [
    "",
    ""
  ],
  "keywords": [
    "",
    "",
    ""
  ]
}

Rules:
- Do not return Markdown.
- Do not wrap the JSON in code fences.
- Do not add any explanation before or after the JSON.
- Do not invent precise facts that cannot be confirmed from the headline.
- Put uncertain details inside researchQuestions instead of presenting them as facts.
`;

 const response = await askGemini(prompt);

// Remove Markdown code fences if Gemini returns them
const cleanResponse = response
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

try {
  const knowledge = JSON.parse(cleanResponse);
  return knowledge;
} catch (error) {
  console.error("Knowledge Engine Error: Invalid JSON received.");
  console.error(cleanResponse);
  throw error;
}
}

module.exports = {
  buildKnowledge,
};