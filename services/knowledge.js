const { askGemini } = require("./gemini");

function formatSources(story = {}) {
  const sources = Array.isArray(story.corroboratingSources) && story.corroboratingSources.length
    ? story.corroboratingSources
    : [story];

  return sources.map((source, index) => `
Source ${index + 1}
Headline: ${source.title || story.title || ""}
Publisher: ${source.source || "Unknown"}
Published: ${source.date || "Unknown"}
URL: ${source.link || "Unknown"}
Summary: ${source.summary || "Not available"}
`).join("\n");
}

async function buildKnowledge(selectedStory) {
  const story = typeof selectedStory === "string"
    ? { title: selectedStory }
    : selectedStory || {};

  const prompt = `
You are the senior research analyst for Prishora AI & Technology News.

Create an evidence-aware research brief from the supplied source metadata. Compare overlapping claims across sources. Do not assume that repetition proves truth, and never invent missing details.

${formatSources(story)}

Return ONLY valid JSON in this exact structure:
{
  "mode": "news",
  "headline": "",
  "primarySource": {"name": "", "url": "", "publishedAt": ""},
  "supportingSources": [{"name": "", "url": "", "publishedAt": ""}],
  "summary": "",
  "verifiedFacts": [{"claim": "", "confidence": "high", "supportedBy": ["source name"]}],
  "singleSourceClaims": [{"claim": "", "confidence": "medium", "supportedBy": ["source name"]}],
  "uncertainClaims": [{"claim": "", "confidence": "low", "reason": ""}],
  "whyItMatters": "",
  "researchQuestions": ["", ""],
  "keywords": ["", "", ""]
}

Rules:
- Return no Markdown or code fences.
- High confidence requires clear support from at least two independent supplied sources or an unambiguous primary-source statement.
- Medium confidence is appropriate for a material claim present in only one credible supplied source.
- Low confidence is for interpretation, prediction, ambiguity, or unsupported detail.
- Preserve source URLs exactly.
- Keep every claim concise and attributable.
`;

  const response = await askGemini(prompt);
  const cleanResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const knowledge = JSON.parse(cleanResponse);
    knowledge.primarySource = knowledge.primarySource || {
      name: story.source || "Unknown",
      url: story.link || "",
      publishedAt: story.date || "",
    };
    knowledge.supportingSources = Array.isArray(knowledge.supportingSources)
      ? knowledge.supportingSources
      : [];
    knowledge.verifiedFacts = Array.isArray(knowledge.verifiedFacts) ? knowledge.verifiedFacts : [];
    knowledge.singleSourceClaims = Array.isArray(knowledge.singleSourceClaims) ? knowledge.singleSourceClaims : [];
    knowledge.uncertainClaims = Array.isArray(knowledge.uncertainClaims) ? knowledge.uncertainClaims : [];
    knowledge.keywords = Array.isArray(knowledge.keywords) ? knowledge.keywords : [];
    return knowledge;
  } catch (error) {
    console.error("Knowledge Engine Error: Invalid JSON received.");
    console.error(cleanResponse);
    throw error;
  }
}

module.exports = {
  formatSources,
  buildKnowledge,
};
