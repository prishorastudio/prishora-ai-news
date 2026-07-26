const { askGemini } = require("./gemini");

function hoursOld(date, now = new Date()) {
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - timestamp) / 3600000);
}

function containsAny(text, terms = []) {
  const haystack = String(text || "").toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function scoreStories(articles, config, now = new Date()) {
  return articles
    .map((article) => {
      const age = hoursOld(article.date, now);
      const blocked = containsAny(`${article.title} ${article.summary}`, config.blockedTopics);
      const approved = !config.approvedTopics.length || containsAny(
        `${article.title} ${article.summary}`,
        config.approvedTopics
      );
      const freshness = age <= 6 ? 1 : age <= 24 ? 0.85 : age <= 48 ? 0.65 : age <= 72 ? 0.45 : 0.15;
      const credibility = Number(article.credibility || 0.5);
      const summaryQuality = article.summary?.length >= 80 ? 0.1 : 0;
      const sourceCount = Math.max(1, Number(article.sourceCount || 1));
      const corroboration = Math.min(0.2, (sourceCount - 1) * 0.08);
      const score = freshness * 0.45 + credibility * 0.3 + summaryQuality + corroboration;

      return {
        ...article,
        ageHours: Math.round(age * 10) / 10,
        sourceCount,
        corroborationScore: Math.round(corroboration * 100),
        editorialScore: Math.round(score * 100),
        eligible: !blocked && approved && age <= config.maximumStoryAgeHours,
        rejectionReason: blocked
          ? "blocked topic"
          : !approved
            ? "outside approved topics"
            : age > config.maximumStoryAgeHours
              ? "too old"
              : null,
      };
    })
    .sort((a, b) => b.editorialScore - a.editorialScore);
}

async function chooseBestStory(articles, config) {
  const scored = scoreStories(articles, config);
  const candidates = scored.filter((article) => article.eligible).slice(0, 10);

  if (!candidates.length) {
    throw new Error("No eligible story remained after editorial filtering.");
  }

  const headlines = candidates
    .map(
      (article, index) =>
        `${index + 1}. ${article.title}\nPrimary source: ${article.source}\nIndependent sources: ${article.sourceCount}\nAge: ${article.ageHours} hours\nEditorial score: ${article.editorialScore}`
    )
    .join("\n\n");

  const prompt = `
You are the Chief Editor of Prishora AI News.

Choose the single most important, useful, and credible story from this ranked shortlist.
Prefer stories with clear public impact, original reporting, independent corroboration, and long-term relevance.
Avoid promotional, speculative, repetitive, or weak stories. Treat a story covered by multiple independent sources as stronger evidence, but do not confuse repeated syndication with verification.

${headlines}

Return ONLY the candidate number. Do not add any other text.
`;

  const response = await askGemini(prompt);
  const selectedIndex = Number.parseInt(String(response).match(/\d+/)?.[0], 10) - 1;
  const selected = candidates[selectedIndex];

  if (!selected) {
    return candidates[0];
  }

  return selected;
}

module.exports = {
  hoursOld,
  scoreStories,
  chooseBestStory,
};
