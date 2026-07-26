const Parser = require("rss-parser");

const parser = new Parser();

const FEEDS = [
  "https://feeds.feedburner.com/oreilly/radar",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"
];

async function getLatestNews() {
  let articles = [];

  for (const feed of FEEDS) {
    try {
      const rss = await parser.parseURL(feed);

      rss.items.slice(0, 5).forEach((item) => {
        articles.push({
          title: item.title,
          link: item.link,
          source: rss.title,
          date: item.pubDate,
        });
      });
    } catch (err) {
      console.log(`Failed to read ${feed}`);
    }
  }

  return articles;
}

module.exports = {
  getLatestNews,
};