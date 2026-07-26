const { askGemini } = require("./gemini");
const { parseJsonResponse } = require("../utils/jsonResponse");

function normalizeSEO(data = {}) {
  const candidates = Array.isArray(data.titleCandidates) ? data.titleCandidates.filter(Boolean).slice(0, 5) : [];
  return {
    seoTitle: String(data.seoTitle || candidates[0] || "").trim(),
    metaDescription: String(data.metaDescription || "").trim(),
    slug: String(data.slug || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""),
    focusKeyword: String(data.focusKeyword || "").trim(),
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean).slice(0, 8) : [],
    excerpt: String(data.excerpt || "").trim(),
    titleCandidates: candidates,
    selectionReason: String(data.selectionReason || "").trim(),
  };
}

async function generateSEO(article, options = {}) {
  const editorialPlan = options.editorialPlan || {};
  const prompt = `
You are the SEO Editor for Prishora AI News.

Create an accurate, compelling SEO package for the article. Generate multiple headline candidates, then select the strongest one without using clickbait.

Senior Editor angle:
${editorialPlan.primaryAngle || "Not supplied"}

Article:
${article}

Return ONLY valid JSON:
{
  "titleCandidates": ["", "", ""],
  "seoTitle": "",
  "selectionReason": "",
  "metaDescription": "",
  "slug": "",
  "focusKeyword": "",
  "tags": ["", "", "", "", ""],
  "excerpt": ""
}

Rules:
- SEO title must be under 60 characters and must match one titleCandidates entry.
- Meta description must be under 160 characters.
- Slug must be lowercase with hyphens only.
- Avoid sensational promises, unsupported certainty, and vague titles.
- Return no Markdown or commentary.
`;

  return normalizeSEO(parseJsonResponse(await askGemini(prompt), "SEO Editor"));
}

module.exports = {
  normalizeSEO,
  generateSEO,
};
