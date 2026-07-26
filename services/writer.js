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
  const internalLinks = formatInternalLinkGuidance(editorialMemory);
  const primarySource = knowledge.primarySource || {};

  const prompt = `
You are a senior technology journalist writing for Prishora AI & Technology News.

Write an original, evidence-aware article from this research brief.

Working headline: ${knowledge.headline || ""}
Summary: ${knowledge.summary || ""}
Primary source: ${primarySource.name || "Unknown"} — ${primarySource.url || ""}

High-confidence facts:
${formatClaims(knowledge.verifiedFacts)}

Single-source claims that require explicit attribution:
${formatClaims(knowledge.singleSourceClaims)}

Uncertain claims that must not be presented as established fact:
${formatClaims(knowledge.uncertainClaims)}

Why it matters:
${knowledge.whyItMatters || ""}

Keywords:
${(knowledge.keywords || []).join(", ")}

Relevant previous Prishora articles for optional contextual linking:
${internalLinks}

Requirements:
- Write between 900 and 1200 words.
- Return only Markdown.
- Use a specific, reader-focused headline as the first H1.
- Open with a concise news lead answering what happened and why it matters.
- Add a short Key Takeaways bullet list after the introduction.
- Use at least three clear H2 sections.
- Attribute material single-source claims in natural language.
- Clearly label analysis, expectations, and unresolved questions.
- Do not convert low-confidence claims into facts.
- Do not fabricate quotations, statistics, dates, organizations, or links.
- Link to a supplied previous Prishora article only when it is genuinely relevant; never invent an internal URL.
- Keep paragraphs short and avoid generic AI phrasing, hype, repeated conclusions, and dramatic filler.
- Explain impact on users, businesses, infrastructure, policy, or the technology industry as applicable.
- End with a concise forward-looking conclusion that distinguishes known facts from what remains uncertain.
`;

  return askGemini(prompt);
}

module.exports = {
  formatClaims,
  writeArticle,
};
