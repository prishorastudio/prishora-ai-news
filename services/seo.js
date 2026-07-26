const { askGemini } = require("./gemini");

async function generateSEO(article) {
  const prompt = `
You are an SEO specialist.

Based on the following article, generate SEO information.

Article:

${article}

Return ONLY valid JSON in this exact format:

{
  "seoTitle": "",
  "metaDescription": "",
  "slug": "",
  "focusKeyword": "",
  "tags": [
    "",
    "",
    "",
    "",
    ""
  ],
  "excerpt": ""
}

Rules:
- SEO title should be under 60 characters.
- Meta description should be under 160 characters.
- Slug must be lowercase with hyphens only.
- Return only JSON.
- Do not use Markdown.
- Do not wrap the response in code fences.
`;

  const response = await askGemini(prompt);

  const cleanResponse = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanResponse);
}

module.exports = {
  generateSEO,
};