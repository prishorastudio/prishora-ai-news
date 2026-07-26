const { askGemini } = require("./gemini");
const { parseJsonResponse } = require("../utils/jsonResponse");

function normalizeEditorialPlan(plan = {}) {
  return {
    workingHeadline: String(plan.workingHeadline || "").trim(),
    primaryAngle: String(plan.primaryAngle || "").trim(),
    audience: String(plan.audience || "Technology readers").trim(),
    keyQuestion: String(plan.keyQuestion || "").trim(),
    sectionPlan: Array.isArray(plan.sectionPlan) ? plan.sectionPlan.filter(Boolean).slice(0, 8) : [],
    requiredAttributions: Array.isArray(plan.requiredAttributions) ? plan.requiredAttributions.filter(Boolean) : [],
    avoidClaims: Array.isArray(plan.avoidClaims) ? plan.avoidClaims.filter(Boolean) : [],
    tone: String(plan.tone || "Measured, clear, and analytical").trim(),
  };
}

async function createEditorialPlan({ selectedStory, knowledge, factCheck, editorialMemory = [] }, ask = askGemini) {
  const prompt = `
You are the Senior Editor of Prishora AI News.

Create an editorial plan that is useful, specific, evidence-aware, and not sensational. The writer must respect the Fact Checker's blocked and uncertain claims.

Selected story:
${JSON.stringify(selectedStory, null, 2)}

Research brief:
${JSON.stringify(knowledge, null, 2)}

Fact-check report:
${JSON.stringify(factCheck, null, 2)}

Relevant previous Prishora articles:
${JSON.stringify(editorialMemory, null, 2)}

Return ONLY valid JSON:
{
  "workingHeadline": "",
  "primaryAngle": "",
  "audience": "",
  "keyQuestion": "",
  "sectionPlan": [],
  "requiredAttributions": [],
  "avoidClaims": [],
  "tone": ""
}

Rules:
- Plan 4 to 6 substantive H2 sections.
- Avoid clickbait and unsupported certainty.
- Include internal links only when genuinely relevant.
- Return no Markdown or commentary.
`;

  return normalizeEditorialPlan(parseJsonResponse(await ask(prompt), "Senior Editor"));
}

module.exports = {
  normalizeEditorialPlan,
  createEditorialPlan,
};
