const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Prishora-AI-News/1.0",
  },
});

const BLOGGER_TOPICS = [
  "Artificial Intelligence",
  "Technology",
  "Apps & Software",
  "Gadgets",
  "Cybersecurity",
  "How-To",
];

const FEEDS = [
  {
    name: "TechCrunch AI",
    category: "Artificial Intelligence",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    credibility: 0.9,
  },
  {
    name: "WIRED AI",
    category: "Artificial Intelligence",
    url: "https://www.wired.com/feed/tag/ai/latest/rss",
    credibility: 0.88,
  },
  {
    name: "TechCrunch",
    category: "Technology",
    url: "https://techcrunch.com/feed/",
    credibility: 0.9,
  },
  {
    name: "Ars Technica",
    category: "Technology",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    credibility: 0.9,
  },
  {
    name: "Android Authority",
    category: "Apps & Software",
    url: "https://www.androidauthority.com/feed/",
    credibility: 0.84,
  },
  {
    name: "9to5Google",
    category: "Apps & Software",
    url: "https://9to5google.com/feed/",
    credibility: 0.86,
  },
  {
    name: "Engadget",
    category: "Gadgets",
    url: "https://www.engadget.com/rss.xml",
    credibility: 0.88,
  },
  {
    name: "Tom's Hardware",
    category: "Gadgets",
    url: "https://www.tomshardware.com/feeds/all",
    credibility: 0.86,
  },
  {
    name: "BleepingComputer",
    category: "Cybersecurity",
    url: "https://www.bleepingcomputer.com/feed/",
    credibility: 0.92,
  },
  {
    name: "The Hacker News",
    category: "Cybersecurity",
    url: "https://feeds.feedburner.com/TheHackersNews",
    credibility: 0.88,
  },
  {
    name: "How-To Geek",
    category: "How-To",
    url: "https://www.howtogeek.com/feed/",
    credibility: 0.84,
  },
  {
    name: "MakeUseOf",
    category: "How-To",
    url: "https://www.makeuseof.com/feed/",
    credibility: 0.82,
  },
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

      rss.items.slice(0, 5).forEach((item) => {
        if (!item?.title || !item?.link) return;

        articles.push({
          title: String(item.title).trim(),
          link: String(item.link).trim(),
          guid: String(item.guid || item.id || item.link).trim(),
          source: String(feed.name || rss.title || new URL(feed.url).hostname).trim(),
          category: feed.category,
          bloggerTopic: feed.category,
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
  BLOGGER_TOPICS,
  FEEDS,
  getLatestNews,
};
