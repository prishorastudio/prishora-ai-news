const { askGemini } = require("./gemini");

async function buildKnowledge(selectedStory) {
  const story = typeof selectedStory === "string"
    ? { title: selectedStory }
    : selectedStory || {};

  const prompt = `
You are an AI Research Analyst.

Analyze this selected story using only the supplied metadata and clearly separate confirmed information from open questions.

Headline: ${story.title || ""}
Source: ${story.source || "Unknown"}
Published: ${story.date || "Unknown"}
URL: ${story.link || "Unknown"}
Feed summary: ${story.summary || "Not available"}

Return ONLY valid JSON in this exact structure:

{
  "mode": "news",
  "headline": "",
  "source": "",
  "sourceUrl": "",
  "publishedAt": "",
  "summary": "",
  "keyFacts": ["", "", ""],
  "whyItMatters": "",
  "researchQuestions": ["", ""],
  "keywords": ["", "", ""]
}

Rules:
- Do not return Markdown or code fences.
- Do not add text before or after the JSON.
- Do not invent precise facts that are not supported by the supplied metadata.
- Treat the feed summary as source material, not as independently verified truth.
- Put uncertain details inside researchQuestions.
- Preserve the source URL exactly.
`;

  const response = await askGemini(prompt);
  const cleanResponse = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const knowledge = JSON.parse(cleanResponse);
    knowledge.source = knowledge.source || story.source || "Unknown";
    knowledge.sourceUrl = story.link || knowledge.sourceUrl || "";
    knowledge.publishedAt = story.date || knowledge.publishedAt || "";
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
