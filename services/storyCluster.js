const { jaccardSimilarity } = require("../utils/textSimilarity");

function sourceKey(article = {}) {
  return String(article.source || article.link || "unknown").toLowerCase();
}

function clusterStories(articles = [], threshold = 0.42) {
  const clusters = [];

  for (const article of articles) {
    let bestCluster = null;
    let bestSimilarity = 0;

    for (const cluster of clusters) {
      const similarity = jaccardSimilarity(article.title, cluster.representative.title);
      if (similarity > bestSimilarity) {
        bestCluster = cluster;
        bestSimilarity = similarity;
      }
    }

    if (bestCluster && bestSimilarity >= threshold) {
      bestCluster.articles.push(article);
      bestCluster.sources.add(sourceKey(article));
      if ((article.editorialScore || 0) > (bestCluster.representative.editorialScore || 0)) {
        bestCluster.representative = article;
      }
    } else {
      clusters.push({
        representative: article,
        articles: [article],
        sources: new Set([sourceKey(article)]),
      });
    }
  }

  return clusters
    .map((cluster) => ({
      ...cluster.representative,
      sourceCount: cluster.sources.size,
      corroboratingSources: cluster.articles.map((article) => ({
        title: article.title,
        source: article.source,
        link: article.link,
        date: article.date,
        summary: article.summary,
      })),
      clusterSize: cluster.articles.length,
    }))
    .sort((a, b) => {
      const sourceDifference = b.sourceCount - a.sourceCount;
      return sourceDifference || (b.editorialScore || 0) - (a.editorialScore || 0);
    });
}

module.exports = {
  clusterStories,
};
