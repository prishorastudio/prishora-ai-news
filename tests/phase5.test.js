const assert = require("node:assert/strict");
const { parseJsonResponse } = require("../utils/jsonResponse");
const { normalizeFactCheck } = require("../services/factChecker");
const { normalizeEditorialPlan } = require("../services/seniorEditor");
const { normalizeSEO } = require("../services/seo");
const { normalizeImageData } = require("../services/imagePrompt");
const { reviewForPublishing, assertPublisherApproval } = require("../services/publisherAgent");

function run() {
  assert.deepEqual(parseJsonResponse("```json\n{\"ok\":true}\n```"), { ok: true });

  const factCheck = normalizeFactCheck({
    confidenceScore: 84,
    publishable: true,
    confirmedClaims: ["Claim A"],
    attributedClaims: ["Claim B"],
    uncertainClaims: ["Claim C"],
    blockedClaims: [],
  });
  assert.equal(factCheck.confidenceScore, 84);
  assert.equal(factCheck.publishable, true);

  const plan = normalizeEditorialPlan({
    workingHeadline: "A measured headline",
    primaryAngle: "Infrastructure resilience",
    sectionPlan: ["What happened", "Why it matters", "What comes next"],
  });
  assert.equal(plan.sectionPlan.length, 3);

  const seo = normalizeSEO({
    titleCandidates: ["AI Infrastructure Faces a Reliability Test"],
    seoTitle: "AI Infrastructure Faces a Reliability Test",
    metaDescription: "A concise description.",
    slug: "AI Infrastructure Test!",
    focusKeyword: "AI infrastructure",
    tags: ["AI", "Infrastructure"],
    excerpt: "Excerpt",
  });
  assert.equal(seo.slug, "ai-infrastructure-test");

  const imageData = normalizeImageData({ prompt: "Editorial data center scene", altText: "A data center beside power infrastructure", caption: "AI infrastructure depends on resilient power.", visualConcept: "Power resilience" });
  assert.ok(imageData.prompt);

  const qaReport = { passed: true, score: 95 };
  const pipeline = { minimumFactConfidence: 70 };
  const approved = reviewForPublishing({ qaReport, factCheck, seo, imageData, pipeline });
  assert.equal(approved.approved, true);
  assert.doesNotThrow(() => assertPublisherApproval({ qaReport, factCheck, seo, imageData, pipeline }));

  const blocked = reviewForPublishing({ qaReport, factCheck: { ...factCheck, confidenceScore: 40 }, seo, imageData, pipeline });
  assert.equal(blocked.approved, false);
  assert.ok(blocked.blockers.some((item) => item.includes("confidence")));

  console.log("✅ Phase 5 AI newsroom tests passed.");
}

run();
