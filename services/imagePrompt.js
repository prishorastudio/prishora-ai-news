const { askGemini } = require("./gemini");

async function generateImagePrompt({ article, seo }) {
  const prompt = `
You are a creative director for Prishora AI & Technology News.

Create one premium featured-image prompt for the following article.

SEO Title:
${seo.seoTitle}

Focus Keyword:
${seo.focusKeyword}

Article:
${article}

Return ONLY valid JSON in this exact format:

{
  "prompt": "",
  "altText": "",
  "caption": ""
}

Image requirements:
- Premium editorial technology-news style
- Cinematic and realistic
- Strong central visual concept
- Clean professional composition
- Suitable for a 16:9 blog featured image
- No logos
- No watermarks
- No readable text inside the image
- Avoid clutter
- Avoid generic robots unless essential to the story
- Visually communicate the article's main conflict or development
- Alt text must clearly describe the image
- Caption must be one short sentence
- Return only JSON
- Do not use Markdown or code fences
`;

  const response = await askGemini(prompt);

  const cleanResponse = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanResponse);
}

module.exports = {
  generateImagePrompt,
};