const assert = require("node:assert/strict");
const fs = require("node:fs");
const { jaccardSimilarity, normalizeText } = require("../utils/textSimilarity");
const { scoreStories } = require("../services/editor");
const { withRetry } = require("../utils/retry");
const {
  historyFile,
  readHistory,
  writeHistory,
  isDuplicateStory,
  filterPreviouslyUsedStories,
} = require("../services/history");
const {
  getNextBloggerTopic,
  filterStoriesForTopic,
  ensurePrimaryTopicLabel,
} = require("../services/topicRotation");

async function run() {
  assert.equal(normalizeText("AI: Power-Grid!"), "ai power grid");
  assert.ok(jaccardSimilarity("AI data center power grid crisis", "Power grid crisis hits AI data centers") >= 0.7);

  assert.equal(getNextBloggerTopic([]), "Artificial Intelligence");
  assert.equal(
    getNextBloggerTopic([
      {
        createdAt: "2026-07-26T10:00:00.000Z",
        status: "draft-created",
        bloggerTopic: "Artificial Intelligence",
      },
    ]),
    "Technology"
  );
  assert.equal(
    getNextBloggerTopic([
      {
        createdAt: "2026-07-26T10:00:00.000Z",
        status: "published",
        bloggerTopic: "How-To",
      },
    ]),
    "Artificial Intelligence"
  );
  assert.equal(
    getNextBloggerTopic([
      {
        createdAt: "2026-07-26T10:00:00.000Z",
        status: "failed",
        bloggerTopic: "Artificial Intelligence",
      },
    ]),
    "Artificial Intelligence"
  );

  const topicStories = filterStoriesForTopic(
    [
      { title: "AI story", bloggerTopic: "Artificial Intelligence" },
      { title: "Gadget story", bloggerTopic: "Gadgets" },
    ],
    "Gadgets"
  );
  assert.equal(topicStories.length, 1);
  assert.equal(topicStories[0].title, "Gadget story");
  assert.deepEqual(
    ensurePrimaryTopicLabel(["Google", "technology", "Google"], "Technology"),
    ["Technology", "Google"]
  );

  const historyExisted = fs.existsSync(historyFile);
  const originalHistory = historyExisted ? fs.readFileSync(historyFile, "utf8") : null;

  try {
    writeHistory([
      {
        createdAt: "2026-07-26T10:00:00.000Z",
        status: "draft-created",
        storyTitle: "AI data centers expose power grid weakness",
        storyUrl: "https://example.com/story-one",
      },
    ]);
    const history = readHistory();
    assert.equal(history.length, 1);

    const sameUrl = isDuplicateStory(
      { title: "Different headline", link: "https://example.com/story-one" },
      history,
      0.72
    );
    assert.equal(sameUrl.duplicate, true);
    assert.equal(sameUrl.reason, "same URL");

    const filtered = filterPreviouslyUsedStories(
      [
        { title: "AI data centers expose power grid weakness", link: "https://example.com/other" },
        { title: "New robotics model improves warehouse safety", link: "https://example.com/new" },
      ],
      { history, threshold: 0.6 }
    );
    assert.equal(filtered.rejected.length, 1);
    assert.equal(filtered.accepted.length, 1);

    const now = new Date("2026-07-26T12:00:00.000Z");
    const scored = scoreStories(
      [
        {
          title: "Fresh AI infrastructure report",
          summary: "A detailed report about infrastructure reliability and public impact across multiple regions.",
          source: "Source A",
          date: "2026-07-26T11:00:00.000Z",
          credibility: 0.9,
        },
        {
          title: "Sponsored AI giveaway",
          summary: "Promotion",
          source: "Source B",
          date: "2026-07-26T11:30:00.000Z",
          credibility: 0.5,
        },
      ],
      {
        blockedTopics: ["sponsored", "giveaway"],
        approvedTopics: [],
        maximumStoryAgeHours: 72,
      },
      now
    );
    assert.equal(scored[0].eligible, true);
    assert.equal(scored.find((story) => story.title.includes("giveaway")).eligible, false);

    let attempts = 0;
    const retryResult = await withRetry(
      "test operation",
      async () => {
        attempts += 1;
        if (attempts < 2) throw new Error("temporary failure");
        return "ok";
      },
      { attempts: 2, delayMs: 0 }
    );
    assert.equal(retryResult, "ok");
    assert.equal(attempts, 2);
  } finally {
    if (historyExisted) {
      fs.writeFileSync(historyFile, originalHistory, "utf8");
    } else if (fs.existsSync(historyFile)) {
      fs.unlinkSync(historyFile);
      const directory = require("node:path").dirname(historyFile);
      try { fs.rmdirSync(directory); } catch (_) {}
    }
  }

  console.log("✅ Phase 3 automation and reliability tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
