function countWords(value = "") {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function runQualityChecks({ article = "", seo = {}, imageData = {} } = {}) {
  const errors = [];
  const warnings = [];
  const wordCount = countWords(article);
  const h2Count = (String(article).match(/^##\s+/gm) || []).length;
  const title = String(seo?.seoTitle || "").trim();
  const description = String(seo?.metaDescription || "").trim();
  const tags = Array.isArray(seo?.tags) ? seo.tags.filter(Boolean) : [];
  const altText = String(imageData?.altText || imageData?.imageAlt || "").trim();

  if (!article.trim()) errors.push("Article body is empty.");
  if (wordCount < 400) errors.push(`Article is too short (${wordCount} words; minimum 400).`);
  if (h2Count < 2) warnings.push("Article should contain at least two H2 sections.");
  if (!title) errors.push("SEO title is missing.");
  if (title.length > 70) warnings.push(`SEO title is ${title.length} characters; recommended maximum is 70.`);
  if (!description) errors.push("Meta description is missing.");
  if (description.length < 110 || description.length > 165) {
    warnings.push(`Meta description is ${description.length} characters; recommended range is 110–165.`);
  }
  if (tags.length === 0) warnings.push("No SEO tags were generated.");
  if (!altText) warnings.push("Featured image alt text is missing.");
  if (/\b(TODO|TBD|PLACEHOLDER|INSERT HERE)\b/i.test(article)) {
    errors.push("Article contains an unfinished placeholder.");
  }

  const score = Math.max(0, 100 - errors.length * 25 - warnings.length * 5);

  return {
    passed: errors.length === 0,
    score,
    wordCount,
    errors,
    warnings,
  };
}

function assertPublishable(input) {
  const report = runQualityChecks(input);

  if (!report.passed) {
    const error = new Error(`QA failed: ${report.errors.join(" ")}`);
    error.qaReport = report;
    throw error;
  }

  return report;
}

module.exports = {
  countWords,
  runQualityChecks,
  assertPublishable,
};
