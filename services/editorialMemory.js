const { jaccardSimilarity } = require("../utils/textSimilarity");

function buildEditorialMemory(selectedStory, history = [], options = {}) {
  const limit = options.limit || 3;
  const minimumSimilarity = options.minimumSimilarity ?? 0.18;

  return history
    .filter((entry) => entry.status === "draft-created" || entry.status === "published")
    .map((entry) => ({
      title: entry.seoTitle || entry.storyTitle || "",
      url: entry.bloggerUrl || "",
      similarity: jaccardSimilarity(
        selectedStory?.title || "",
        `${entry.storyTitle || ""} ${entry.seoTitle || ""}`
      ),
      createdAt: entry.createdAt,
    }))
    .filter((entry) => entry.title && entry.url && entry.similarity >= minimumSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

function formatInternalLinkGuidance(memory = []) {
  if (!memory.length) return "No relevant previous Prishora articles are available.";

  return memory
    .map((entry) => `- ${entry.title}: ${entry.url}`)
    .join("\n");
}

module.exports = {
  buildEditorialMemory,
  formatInternalLinkGuidance,
};
