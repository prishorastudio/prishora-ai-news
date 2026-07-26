const { askGemini } = require("./gemini");
const { parseJsonResponse } = require("../utils/jsonResponse");

function normalizeFactCheck(report = {}) {
  return {
    confidenceScore: Math.max(0, Math.min(100, Number(report.confidenceScore || 0))),
    publishable: report.publishable !== false,
    confirmedClaims: Array.isArray(report.confirmedClaims) ? report.confirmedClaims.filter(Boolean) : [],
    attributedClaims: Array.isArray(report.attributedClaims) ? report.attributedClaims.filter(Boolean) : [],
    uncertainClaims: Array.isArray(report.uncertainClaims) ? report.uncertainClaims.filter(Boolean) : [],
    blockedClaims: Array.isArray(report.blockedClaims) ? report.blockedClaims.filter(Boolean) : [],
    verificationNotes: Array.isArray(report.verificationNotes) ? report.verificationNotes.filter(Boolean) : [],
  };
}

async function factCheckStory({ selectedStory, knowledge }, ask = askGemini) {
  const sources = selectedStory?.corroboratingSources || [selectedStory];
  const sourceMaterial = sources
    .filter(Boolean)
    .map((source, index) => `${index + 1}. ${source.title || "Untitled"}\nSource: ${source.source || "Unknown"}\nURL: ${source.link || "Unknown"}\nSummary: ${source.summary || "Not available"}`)
    .join("\n\n");

  const prompt = `
You are the Fact Checker for Prishora AI News.

Evaluate the research brief against the supplied source metadata. Do not use outside facts. A claim supported by only one feed must remain attributed to that source. Do not treat unanswered research questions as facts.

Research brief:
${JSON.stringify(knowledge, null, 2)}

Source material:
${sourceMaterial}

Return ONLY valid JSON:
{
  "confidenceScore": 0,
  "publishable": true,
  "confirmedClaims": [],
  "attributedClaims": [],
  "uncertainClaims": [],
  "blockedClaims": [],
  "verificationNotes": []
}

Rules:
- confidenceScore must be 0 to 100.
- blockedClaims must include any precise claim unsupported by the supplied material.
- publishable must be false only when the story cannot be written responsibly from the available evidence.
- Return no Markdown or commentary.
`;

  return normalizeFactCheck(parseJsonResponse(await ask(prompt), "Fact Checker"));
}

module.exports = {
  normalizeFactCheck,
  factCheckStory,
};
