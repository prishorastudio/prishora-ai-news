const { BLOGGER_TOPICS } = require("./news");

const SUCCESSFUL_STATUSES = new Set(["draft-created", "published"]);

function getSuccessfulTopicEntries(history = []) {
  return history.filter(
    (entry) =>
      SUCCESSFUL_STATUSES.has(entry?.status) &&
      BLOGGER_TOPICS.includes(entry?.bloggerTopic)
  );
}

function getNextBloggerTopic(history = []) {
  const successfulEntries = getSuccessfulTopicEntries(history).sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );

  if (!successfulEntries.length) {
    return BLOGGER_TOPICS[0];
  }

  const latestTopic = successfulEntries[successfulEntries.length - 1].bloggerTopic;
  const currentIndex = BLOGGER_TOPICS.indexOf(latestTopic);

  return BLOGGER_TOPICS[(currentIndex + 1) % BLOGGER_TOPICS.length];
}

function filterStoriesForTopic(articles = [], topic) {
  if (!BLOGGER_TOPICS.includes(topic)) {
    throw new Error(`Unknown Blogger topic: ${topic}`);
  }

  return articles.filter(
    (article) => article?.bloggerTopic === topic || article?.category === topic
  );
}

function ensurePrimaryTopicLabel(tags = [], topic) {
  const normalizedTags = Array.isArray(tags) ? tags : [];
  const uniqueTags = normalizedTags.filter(
    (tag, index, values) =>
      typeof tag === "string" &&
      tag.trim() &&
      values.findIndex(
        (candidate) =>
          typeof candidate === "string" &&
          candidate.trim().toLowerCase() === tag.trim().toLowerCase()
      ) === index
  );

  return [
    topic,
    ...uniqueTags.filter((tag) => tag.trim().toLowerCase() !== topic.toLowerCase()),
  ];
}

module.exports = {
  SUCCESSFUL_STATUSES,
  getSuccessfulTopicEntries,
  getNextBloggerTopic,
  filterStoriesForTopic,
  ensurePrimaryTopicLabel,
};
