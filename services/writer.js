const { askGemini } = require("./gemini");

async function writeArticle(knowledge) {
  const prompt = `
You are a professional technology journalist writing for Prishora AI & Technology News.

Use the following research brief to write an original article.

Headline:
${knowledge.headline}

Summary:
${knowledge.summary}

Key Facts:
${knowledge.keyFacts.map((fact) => `- ${fact}`).join("\n")}

Why It Matters:
${knowledge.whyItMatters}

Keywords:
${knowledge.keywords.join(", ")}

Requirements:
- Write between 900 and 1200 words
- Use natural, professional English
- Write like an experienced technology journalist, not like a generic AI assistant
- Create a strong, specific headline
- Begin with a short, engaging introduction
- Use clear H2 headings
- Keep paragraphs short, usually 2 to 4 sentences
- Vary sentence length and rhythm
- Avoid repetitive phrases and repeated conclusions
- Avoid exaggerated claims and dramatic filler
- Explain the impact on users, businesses, and the technology industry
- Include a short "Key Takeaways" bullet list after the introduction
- Use bullet points only where they improve readability
- Clearly separate confirmed facts from analysis or possible implications
- Do not invent unsupported details
- Do not mention the research brief, JSON, prompts, or AI generation
- End with a concise conclusion
- Return only the article in Markdown
`;

  return askGemini(prompt);
}

module.exports = {
  writeArticle,
};