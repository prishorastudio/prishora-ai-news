const assert = require("node:assert/strict");
const { clusterStories } = require("../services/storyCluster");
const { buildEditorialMemory } = require("../services/editorialMemory");
const { formatSources } = require("../services/knowledge");
const { formatClaims } = require("../services/writer");
const { scoreStories } = require("../services/editor");

function run() {
  const stories = [
    {
      title: "AI data centers expose power grid weakness",
      source: "Publisher A",
      link: "https://example.com/a",
      date: "2026-07-26T10:00:00.000Z",
      summary: "A detailed report on power infrastructure pressure from new AI facilities.",
      credibility: 0.9,
    },
    {
      title: "Power grid weakness exposed by AI data centers",
      source: "Publisher B",
      link: "https://example.com/b",
      date: "2026-07-26T10:30:00.000Z",
      summary: "Independent coverage of electricity reliability risks around AI infrastructure.",
      credibility: 0.85,
    },
    {
      title: "New warehouse robot improves picking safety",
      source: "Publisher C",
      link: "https://example.com/c",
      date: "2026-07-26T11:00:00.000Z",
      summary: "A separate robotics report with operational safety details.",
      credibility: 0.8,
    },
  ];

  const clustered = clusterStories(stories, 0.4);
  assert.equal(clustered.length, 2);
  assert.equal(clustered[0].sourceCount, 2);
  assert.equal(clustered[0].corroboratingSources.length, 2);

  const scored = scoreStories(clustered, {
    blockedTopics: [],
    approvedTopics: [],
    maximumStoryAgeHours: 72,
  }, new Date("2026-07-26T12:00:00.000Z"));
  assert.ok(scored[0].corroborationScore > 0);

  const sourceText = formatSources(clustered[0]);
  assert.match(sourceText, /Publisher A/);
  assert.match(sourceText, /Publisher B/);

  const claims = formatClaims([
    { claim: "Grid capacity is constrained.", confidence: "high", supportedBy: ["A", "B"] },
  ]);
  assert.match(claims, /confidence: high/);
  assert.match(claims, /sources: A, B/);

  const memory = buildEditorialMemory(
    { title: "AI power grid infrastructure" },
    [
      {
        status: "published",
        storyTitle: "AI infrastructure and the electricity grid",
        seoTitle: "How AI Infrastructure Is Changing the Grid",
        bloggerUrl: "https://example.com/previous",
        createdAt: "2026-07-20T10:00:00.000Z",
      },
    ],
    { minimumSimilarity: 0.1 }
  );
  assert.equal(memory.length, 1);
  assert.equal(memory[0].url, "https://example.com/previous");

  console.log("✅ Phase 4 editorial intelligence tests passed.");
}

run();
