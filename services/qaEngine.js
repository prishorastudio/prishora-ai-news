function countWords(value = "") {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function getHeadings(article = "") {
  return String(article)
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,3})\s+(.+?)\s*#*$/))
    .filter(Boolean)
    .map((match) => ({ level: match[1].length, text: match[2].trim() }));
}

function findDuplicateHeadings(headings = []) {
  const counts = new Map();

  headings.forEach(({ text }) => {
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([heading]) => heading);
}

function estimateReadability(article = "") {
  const plainText = String(article)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ");
  const sentences = plainText.split(/[.!?]+/).filter((item) => item.trim()).length || 1;
  const words = countWords(plainText);
  return {
    averageWordsPerSentence: Number((words / sentences).toFixed(1)),
    sentenceCount: sentences,
  };
}

function inspectLinks(article = "") {
  const links = [...String(article).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1].trim());
  const invalid = links.filter((href) => {
    if (!href || href === "#") return true;
    if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href)) return false;
    return /^(javascript:|data:)/i.test(href) || !href.includes(".");
  });

  return { total: links.length, invalid };
}

function runQualityChecks({ article = "", seo = {}, imageData = {} } = {}) {
  const errors = [];
  const warnings = [];
  const wordCount = countWords(article);
  const headings = getHeadings(article);
  const h2Count = headings.filter((heading) => heading.level === 2).length;
  const duplicateHeadings = findDuplicateHeadings(headings);
  const readability = estimateReadability(article);
  const links = inspectLinks(article);
  const title = String(seo?.seoTitle || "").trim();
  const description = String(seo?.metaDescription || "").trim();
  const tags = Array.isArray(seo?.tags) ? seo.tags.filter(Boolean) : [];
  const altText = String(imageData?.altText || imageData?.imageAlt || "").trim();

  if (!article.trim()) errors.push("Article body is empty.");
  if (wordCount < 400) errors.push(`Article is too short (${wordCount} words; minimum 400).`);
  if (h2Count < 2) warnings.push("Article should contain at least two H2 sections.");
  if (duplicateHeadings.length) warnings.push(`Duplicate headings detected: ${duplicateHeadings.join(", ")}.`);
  if (readability.averageWordsPerSentence > 28) {
    warnings.push(`Average sentence length is ${readability.averageWordsPerSentence} words; aim for 28 or fewer.`);
  }
  if (links.invalid.length) errors.push(`Invalid or unsafe links detected: ${links.invalid.join(", ")}.`);
  if (!title) errors.push("SEO title is missing.");
  if (title.length > 70) warnings.push(`SEO title is ${title.length} characters; recommended maximum is 70.`);
  if (!description) errors.push("Meta description is missing.");
  if (description && (description.length < 110 || description.length > 165)) {
    warnings.push(`Meta description is ${description.length} characters; recommended range is 110–165.`);
  }
  if (tags.length === 0) warnings.push("No SEO tags were generated.");
  if (tags.length > 10) warnings.push(`Too many SEO tags were generated (${tags.length}; recommended maximum is 10).`);
  if (!altText) warnings.push("Featured image alt text is missing.");
  if (/\b(TODO|TBD|PLACEHOLDER|INSERT HERE|LOREM IPSUM)\b/i.test(article)) {
    errors.push("Article contains an unfinished placeholder.");
  }
  if (/<script\b|javascript:|onerror\s*=|onclick\s*=/i.test(article)) {
    errors.push("Article contains unsafe executable markup.");
  }

  const score = Math.max(0, 100 - errors.length * 25 - warnings.length * 5);

  return {
    passed: errors.length === 0,
    score,
    wordCount,
    headingCount: headings.length,
    h2Count,
    linkCount: links.total,
    readability,
    errors,
    warnings,
  };
}

function assertPublishable(input) {
  const report = runQualityChecks(input);

  if (!report.passed) {
    const error = new Error(`QA failed: ${report.errors.join(" ")}`);
    error.name = "QualityAssuranceError";
    error.qaReport = report;
    throw error;
  }

  return report;
}

module.exports = {
  countWords,
  getHeadings,
  findDuplicateHeadings,
  estimateReadability,
  inspectLinks,
  runQualityChecks,
  assertPublishable,
};
