const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Prishora-AI-News/1.0",
  },
});

const FEEDS = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", credibility: 0.9 },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", credibility: 0.9 },
  { url: "https://www.wired.com/feed/tag/ai/latest/rss", credibility: 0.88 },
];

function normalizeDate(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function getLatestNews() {
  const articles = [];

  for (const feed of FEEDS) {
    try {
      const rss = await parser.parseURL(feed.url);

      rss.items.slice(0, 8).forEach((item) => {
        if (!item?.title || !item?.link) return;

        articles.push({
          title: String(item.title).trim(),
          link: String(item.link).trim(),
          guid: String(item.guid || item.id || item.link).trim(),
          source: String(rss.title || new URL(feed.url).hostname).trim(),
          date: normalizeDate(item.isoDate || item.pubDate),
          summary: String(item.contentSnippet || item.summary || "").trim(),
          credibility: feed.credibility,
        });
      });
    } catch (error) {
      console.log(`Failed to read ${feed.url}: ${error.message}`);
    }
  }

  const seen = new Set();
  return articles.filter((article) => {
    const key = article.link.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  FEEDS,
  getLatestNews,
};
