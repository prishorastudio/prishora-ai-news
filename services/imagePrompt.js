const { askGemini } = require("./gemini");
const { parseJsonResponse } = require("../utils/jsonResponse");

function normalizeImageData(data = {}) {
  return {
    prompt: String(data.prompt || "").trim(),
    altText: String(data.altText || "").trim(),
    caption: String(data.caption || "").trim(),
    visualConcept: String(data.visualConcept || "").trim(),
    avoidElements: Array.isArray(data.avoidElements) ? data.avoidElements.filter(Boolean) : [],
  };
}

async function generateImagePrompt({ article, seo, editorialPlan = {} }) {
  const prompt = `
You are the Creative Director for Prishora AI & Technology News.

Create one distinctive premium featured-image package that visually communicates the article's real editorial angle.

SEO title: ${seo.seoTitle}
Focus keyword: ${seo.focusKeyword}
Editorial angle: ${editorialPlan.primaryAngle || "Not supplied"}
Article:
${article}

Return ONLY valid JSON:
{
  "visualConcept": "",
  "prompt": "",
  "altText": "",
  "caption": "",
  "avoidElements": []
}

Requirements:
- Premium editorial technology-news style.
- Cinematic, realistic, and suitable for a 16:9 featured image.
- One clear central concept with clean composition.
- No logos, watermarks, readable text, or clutter.
- Avoid generic humanoid robots unless essential.
- Avoid repeating common visual clichés when a more specific concept is possible.
- Alt text must describe the actual proposed scene clearly.
- Caption must be one short factual sentence.
- Return no Markdown or commentary.
`;

  return normalizeImageData(parseJsonResponse(await askGemini(prompt), "Creative Director"));
}

module.exports = {
  normalizeImageData,
  generateImagePrompt,
};
