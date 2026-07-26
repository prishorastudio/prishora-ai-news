const fs = require("fs");
const path = require("path");
const { jaccardSimilarity } = require("../utils/textSimilarity");
const { historySeed } = require("../config/historySeed");

const historyDir = path.join(__dirname, "..", "output", "history");
const historyFile = path.join(historyDir, "publishing-history.json");

function normalizeUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();

    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || ["fbclid", "gclid"].includes(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
}

function ensureHistory() {
  fs.mkdirSync(historyDir, { recursive: true });
  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, `${JSON.stringify(historySeed, null, 2)}\n`, "utf8");
  }
}

function readHistory() {
  ensureHistory();
  try {
    const parsed = JSON.parse(fs.readFileSync(historyFile, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error(`Publishing history is invalid: ${error.message}`);
  }
}

function writeHistory(entries) {
  ensureHistory();
  const tempFile = `${historyFile}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  fs.renameSync(tempFile, historyFile);
}

function isDuplicateStory(article, history, threshold = 0.72) {
  const link = normalizeUrl(article?.link);
  const title = article?.title || "";

  for (const entry of history) {
    if (link && normalizeUrl(entry.storyUrl) === link) {
      return { duplicate: true, reason: "same URL", matchedEntry: entry, similarity: 1 };
    }

    const similarity = jaccardSimilarity(title, entry.storyTitle || entry.seoTitle || "");
    if (similarity >= threshold) {
      return { duplicate: true, reason: "similar headline", matchedEntry: entry, similarity };
    }
  }

  return { duplicate: false, similarity: 0 };
}

function filterPreviouslyUsedStories(articles, options = {}) {
  const history = options.history || readHistory();
  const threshold = options.threshold ?? 0.72;
  const accepted = [];
  const rejected = [];

  for (const article of articles) {
    const result = isDuplicateStory(article, history, threshold);
    if (result.duplicate) rejected.push({ article, ...result });
    else accepted.push(article);
  }

  return { accepted, rejected, history };
}

function getTodayEntries(history = readHistory(), now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return history.filter((entry) => String(entry.createdAt || "").slice(0, 10) === day);
}

function getLatestSuccessfulEntry(history = readHistory()) {
  return history
    .filter((entry) => entry.status === "draft-created" || entry.status === "published")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

function assertPublishingWindow(config, history = readHistory(), now = new Date()) {
  const todayCount = getTodayEntries(history, now).filter(
    (entry) => entry.status === "draft-created" || entry.status === "published"
  ).length;

  if (todayCount >= config.maximumPostsPerDay) {
    throw new Error(`Daily post limit reached (${todayCount}/${config.maximumPostsPerDay}).`);
  }

  const latest = getLatestSuccessfulEntry(history);
  if (latest) {
    const elapsedMinutes = (now.getTime() - new Date(latest.createdAt).getTime()) / 60000;
    if (elapsedMinutes < config.minimumMinutesBetweenPosts) {
      const remaining = Math.ceil(config.minimumMinutesBetweenPosts - elapsedMinutes);
      throw new Error(`Publishing cooldown is active. Try again in about ${remaining} minute(s).`);
    }
  }

  return true;
}

function recordHistory(entry) {
  const history = readHistory();
  const record = {
    id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt || new Date().toISOString(),
    ...entry,
  };
  history.push(record);
  writeHistory(history);
  return record;
}

module.exports = {
  historyFile,
  normalizeUrl,
  readHistory,
  writeHistory,
  isDuplicateStory,
  filterPreviouslyUsedStories,
  assertPublishingWindow,
  recordHistory,
};