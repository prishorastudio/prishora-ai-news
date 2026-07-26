const fs = require("fs");
const path = require("path");

function saveArticle(article, seo) {
  const outputDir = path.join(__dirname, "..", "output", "articles");

  fs.mkdirSync(outputDir, { recursive: true });

  const fileName = `${seo.slug}.md`;
  const filePath = path.join(outputDir, fileName);

  const content = `---
title: "${seo.seoTitle}"
metaDescription: "${seo.metaDescription}"
focusKeyword: "${seo.focusKeyword}"
tags: ${seo.tags.join(", ")}
excerpt: "${seo.excerpt}"
---

${article}
`;

  fs.writeFileSync(filePath, content, "utf8");

  return filePath;
}

module.exports = {
  saveArticle,
};