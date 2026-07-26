const assert = require("node:assert/strict");
const { styleArticleMarkup, buildArticleHtml } = require("../services/htmlBuilder");
const { runQualityChecks, assertPublishable } = require("../services/qaEngine");
const { validateTheme } = require("../utils/configValidator");
const { theme } = require("../config/theme");

function buildLongArticle() {
  const paragraph = "Artificial intelligence systems are changing how software teams research, design, test, and publish digital products. Responsible implementation requires clear goals, verified sources, secure handling of data, human review, and measurable quality standards. Teams should document assumptions, monitor failures, and improve workflows using evidence rather than hype.";

  return `## Overview\n\n${paragraph}\n\n> [!NOTE]\n> This is a verified editorial note for readers.\n\n## Technical Details\n\n${paragraph}\n\n| Feature | Status |\n| --- | --- |\n| QA gate | Active |\n| Renderer | Active |\n\n\`\`\`javascript\nconst status = "ready";\nconsole.log(status);\n\`\`\`\n\n![Editorial workflow](https://example.com/workflow.jpg "AI editorial workflow")\n\n## Implementation Guidance\n\n${Array.from({ length: 8 }, () => paragraph).join("\n\n")}`;
}

function run() {
  validateTheme(theme);

  const article = buildLongArticle();
  const seo = {
    seoTitle: "AI Publishing Workflow: Rendering and Quality Assurance",
    metaDescription: "Learn how a modular AI publishing workflow combines structured rendering, editorial safeguards, SEO metadata, and quality assurance before publication.",
    tags: ["Artificial Intelligence", "Publishing", "Quality Assurance"],
  };
  const imageData = { altText: "AI publishing workflow illustration", caption: "A modular editorial workflow." };

  const rendered = styleArticleMarkup(article);
  assert.match(rendered, /prishora-callout-note/);
  assert.match(rendered, /prishora-code-block/);
  assert.match(rendered, /prishora-table-wrapper/);
  assert.match(rendered, /<figcaption/);
  assert.match(rendered, /hljs/);

  const fullHtml = buildArticleHtml({
    article,
    seo,
    imageUrl: "https://example.com/featured.jpg",
    imageData,
    publishedDate: "2026-07-26",
  });
  assert.match(fullHtml, /Table of Contents/);
  assert.match(fullHtml, /AI publishing workflow illustration/);
  assert.match(fullHtml, /A modular editorial workflow/);

  const report = runQualityChecks({ article, seo, imageData });
  assert.equal(report.passed, true);
  assert.ok(report.score >= 80);
  assert.ok(report.wordCount >= 400);
  assert.doesNotThrow(() => assertPublishable({ article, seo, imageData }));

  const blocked = runQualityChecks({
    article: "## TODO\n\nPLACEHOLDER",
    seo: {},
    imageData: {},
  });
  assert.equal(blocked.passed, false);
  assert.ok(blocked.errors.length >= 3);

  console.log("✅ Phase 2 renderer and QA tests passed.");
}

run();
