const fs = require("node:fs");
const path = require("node:path");
const { buildArticleHtml } = require("../services/htmlBuilder");
const { assertPublishable } = require("../services/qaEngine");
const { validateTheme } = require("../utils/configValidator");
const { theme } = require("../config/theme");

const paragraph = "Artificial intelligence publishing workflows need reliable research, clear editorial structure, secure asset handling, readable formatting, and quality controls before any draft reaches a public platform. A modular system makes each responsibility easier to test, replace, and improve without changing the complete pipeline. Human review remains important for factual accuracy, context, safety, and final publishing decisions.";

const article = `## Why the Pipeline Matters\n\n${paragraph}\n\n> [!TIP]\n> Run the local dry test before using paid AI or image services.\n\n## Renderer Features\n\n${paragraph}\n\n| Component | Validation |\n| --- | --- |\n| Callouts | Enabled |\n| Tables | Responsive |\n| Code | Highlighted |\n\n\`\`\`javascript\nconst pipeline = { phase: 2, ready: true };\nconsole.log(pipeline);\n\`\`\`\n\n![AI publishing architecture](https://example.com/architecture.jpg "Modular AI publishing architecture")\n\n## Quality Assurance\n\n${Array.from({ length: 9 }, () => paragraph).join("\n\n")}`;

const seo = {
  seoTitle: "AI Publishing Engine Phase 2 Dry Run",
  metaDescription: "A zero-cost local dry run that validates the article renderer, responsive components, metadata, theme configuration, and publishing quality gate.",
  tags: ["AI Publishing", "Quality Assurance", "Automation"],
};

const imageData = {
  altText: "Diagram of a modular AI publishing engine",
  caption: "Phase 2 modular publishing architecture.",
};

function main() {
  validateTheme(theme);
  const qaReport = assertPublishable({ article, seo, imageData });
  const html = buildArticleHtml({
    article,
    seo,
    imageUrl: "https://example.com/featured-image.jpg",
    imageData,
    publishedDate: new Date(),
  });

  const outputDirectory = path.join(process.cwd(), "output");
  const outputFile = path.join(outputDirectory, "phase-2-dry-run.html");
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputFile, html, "utf8");

  console.log("✅ Zero-cost Phase 2 dry run completed.");
  console.log(`QA score: ${qaReport.score}/100`);
  console.log(`Word count: ${qaReport.wordCount}`);
  console.log(`HTML preview: ${outputFile}`);
  console.log("No AI, image-generation, Cloudinary, or Blogger APIs were called.");
}

main();
