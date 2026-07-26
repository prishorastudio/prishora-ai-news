function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function listFromEnv(name, fallback = []) {
  const raw = String(process.env[name] || "").trim();
  if (!raw) return fallback;
  return raw.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function booleanFromEnv(name, fallback) {
  const raw = String(process.env[name] ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw);
}

const pipeline = {
  mode: String(process.env.PIPELINE_MODE || "draft").toLowerCase(),
  minimumQaScore: numberFromEnv("MINIMUM_QA_SCORE", 90),
  minimumH2Count: numberFromEnv("MINIMUM_H2_COUNT", 2),
  minimumWordCount: numberFromEnv("MINIMUM_WORD_COUNT", 700),
  maximumWordCount: numberFromEnv("MAXIMUM_WORD_COUNT", 1800),
  maximumStoryAgeHours: numberFromEnv("MAXIMUM_STORY_AGE_HOURS", 72),
  minimumMinutesBetweenPosts: numberFromEnv("MINIMUM_MINUTES_BETWEEN_POSTS", 180),
  maximumPostsPerDay: numberFromEnv("MAXIMUM_POSTS_PER_DAY", 3),
  duplicateSimilarityThreshold: numberFromEnv("DUPLICATE_SIMILARITY_THRESHOLD", 0.72),
  storyClusterThreshold: numberFromEnv("STORY_CLUSTER_THRESHOLD", 0.42),
  minimumIndependentSources: numberFromEnv("MINIMUM_INDEPENDENT_SOURCES", 1),
  newsroomEnabled: booleanFromEnv("NEWSROOM_ENABLED", true),
  minimumFactConfidence: numberFromEnv("MINIMUM_FACT_CONFIDENCE", 70),
  retryAttempts: numberFromEnv("RETRY_ATTEMPTS", 2),
  retryDelayMs: numberFromEnv("RETRY_DELAY_MS", 1500),
  approvedTopics: listFromEnv("APPROVED_TOPICS"),
  blockedTopics: listFromEnv("BLOCKED_TOPICS", ["rumor", "giveaway", "sponsored"]),
};

module.exports = {
  pipeline,
};
