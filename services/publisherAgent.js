function reviewForPublishing({ qaReport, factCheck, seo, imageData, pipeline }) {
  const blockers = [];
  const warnings = [];

  if (!factCheck?.publishable) blockers.push("Fact Checker marked the story as not publishable.");
  if (Number(factCheck?.confidenceScore || 0) < Number(pipeline.minimumFactConfidence || 70)) {
    blockers.push(`Fact confidence ${factCheck?.confidenceScore || 0} is below ${pipeline.minimumFactConfidence || 70}.`);
  }
  if ((factCheck?.blockedClaims || []).length) {
    warnings.push(`${factCheck.blockedClaims.length} blocked claim(s) must not appear in the article.`);
  }
  if (!seo?.seoTitle || !seo?.metaDescription || !seo?.slug) blockers.push("SEO package is incomplete.");
  if (!imageData?.prompt || !imageData?.altText) blockers.push("Creative package is incomplete.");
  if (!qaReport?.passed) blockers.push("Core QA did not pass.");

  return {
    approved: blockers.length === 0,
    blockers,
    warnings,
    confidenceScore: Number(factCheck?.confidenceScore || 0),
  };
}

function assertPublisherApproval(input) {
  const decision = reviewForPublishing(input);
  if (!decision.approved) {
    const error = new Error(`Publisher Agent blocked the run: ${decision.blockers.join(" ")}`);
    error.publisherDecision = decision;
    throw error;
  }
  return decision;
}

module.exports = {
  reviewForPublishing,
  assertPublisherApproval,
};
