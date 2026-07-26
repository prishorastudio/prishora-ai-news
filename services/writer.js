const { askGemini } = require("./gemini");
const { formatInternalLinkGuidance, buildEditorialMemory } = require("./editorialMemory");
const { readHistory } = require("./history");

function formatClaims(claims = []) {
  if (!claims.length) return "- None supplied";
  return claims.map((item) => {
    const claim = typeof item === "string" ? item : item.claim;
    const confidence = typeof item === "string" ? "unspecified" : item.confidence;
    const supportedBy = Array.isArray(item.supportedBy) ? item.supportedBy.join(", ") : "";
    return `- ${claim} [confidence: ${confidence}${supportedBy ? `; sources: ${supportedBy}` : ""}]`;
  }).join("\n");
}

async function writeArticle(knowledge, options = {}) {
  const editorialMemory = options.editorialMemory || buildEditorialMemory(
    { title: knowledge.headline || knowledge.summary || "" },
    readHistory()
  );
  const factCheck = options.factCheck || {};
  const editorialPlan = options.editorialPlan || {};
  const internalLinks = formatInternalLinkGuidance(editorialMemory);
  const primarySource = knowledge.primarySource || {};

  const prompt = `
You are the Staff Writer for Prishora AI & Technology News.

Write an original, evidence-aware article from the approved newsroom package.

Working headline: ${editorialPlan.workingHeadline || knowledge.headline || ""}
Primary angle: ${editorialPlan.primaryAngle || knowledge.whyItMatters || ""}
Audience: ${editorialPlan.audience || "Technology readers"}
Key question: ${editorialPlan.keyQuestion || ""}
Preferred section plan: ${(editorialPlan.sectionPlan || []).join(" | ")}
Tone: ${editorialPlan.tone || "Measured, clear, and analytical"}

Research summary: ${knowledge.summary || ""}
Primary source: ${primarySource.name || "Unknown"} — ${primarySource.url || ""}

High-confidence facts:
${formatClaims(knowledge.verifiedFacts || factCheck.confirmedClaims)}

Single-source claims requiring attribution:
${formatClaims(knowledge.singleSourceClaims || factCheck.attributedClaims)}

Uncertain claims:
${formatClaims(knowledge.uncertainClaims || factCheck.uncertainClaims)}

Claims that must not appear:
${formatClaims([...(factCheck.blockedClaims || []), ...(editorialPlan.avoidClaims || [])])}

Required attributions:
${formatClaims(editorialPlan.requiredAttributions || [])}

Why it matters:
${knowledge.whyItMatters || ""}

Relevant previous Prishora articles for optional linking:
${internalLinks}

Requirements:
- Write between 900 and 1200 words.
- Return only Markdown.
- Use a specific, reader-focused headline as the first H1.
- Open with a concise news lead answering what happened and why it matters.
- Add a short Key Takeaways bullet list after the introduction.
- Use 4 to 6 clear H2 sections.
- Follow the Senior Editor's angle and section plan when supplied.
- Attribute material single-source claims in natural language.
- Clearly label analysis, expectations, and unresolved questions.
- Never include blocked claims or convert uncertainty into fact.
- Do not fabricate quotations, statistics, dates, organizations, or links.
- Link to at most two supplied Prishora articles, only when genuinely relevant.
- Keep paragraphs short and avoid generic AI phrasing, hype, repetition, and filler.
- End with a concise conclusion distinguishing known facts from uncertainty.
`;

  return askGemini(prompt);
}

module.exports = {
  formatClaims,
  writeArticle,
};
