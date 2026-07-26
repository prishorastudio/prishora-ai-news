const { askGemini } = require("./gemini");

async function chooseBestStory(articles) {
  const headlines = articles
    .map(
      (article, index) =>
        `${index + 1}. ${article.title}\nSource: ${article.source}`
    )
    .join("\n\n");

  const prompt = `
You are the Chief Editor of Prishora AI News.

Below are today's AI and Technology headlines.

${headlines}

Your task:

Choose the single most important story.

Return ONLY the headline exactly as written in the list.

Do not include:
- numbering
- explanations
- reasoning
- quotation marks
- any text before or after the headline
`;

  const response = await askGemini(prompt);

  return response;
}

module.exports = {
  chooseBestStory,
};