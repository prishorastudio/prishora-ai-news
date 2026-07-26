require("dotenv").config();
const { uploadImage } = require("./services/imageUpload");
const { generateFeaturedImage } = require("./services/imageGenerator");
const { generateImagePrompt } = require("./services/imagePrompt");
const { publishToBlogger } = require("./services/blogger");
const { saveArticle } = require("./services/storage");
const { generateSEO } = require("./services/seo");
const { getLatestNews } = require("./services/news");
const { chooseBestStory } = require("./services/editor");
const { writeArticle } = require("./services/writer");
const { buildKnowledge } = require("./services/knowledge");
const { assertPublishable } = require("./services/qaEngine");
const { validateTheme, validateEnvironment } = require("./utils/configValidator");
const { logger } = require("./utils/logger");
const { withRetry } = require("./utils/retry");
const { theme } = require("./config/theme");
const { pipeline } = require("./config/pipeline");
const {
  readHistory,
  filterPreviouslyUsedStories,
  assertPublishingWindow,
  recordHistory,
} = require("./services/history");
const {
  createRunState,
  markStage,
  completeRun,
} = require("./services/runState");

const VALID_MODES = new Set(["draft", "publish", "local"]);

function validatePipelineConfig() {
  if (!VALID_MODES.has(pipeline.mode)) {
    throw new Error(`Invalid PIPELINE_MODE "${pipeline.mode}". Use draft, publish, or local.`);
  }
  if (pipeline.minimumQaScore < 0 || pipeline.minimumQaScore > 100) {
    throw new Error("MINIMUM_QA_SCORE must be between 0 and 100.");
  }
  if (pipeline.minimumWordCount > pipeline.maximumWordCount) {
    throw new Error("MINIMUM_WORD_COUNT cannot be greater than MAXIMUM_WORD_COUNT.");
  }
}

function assertEditorialQuality(qaReport) {
  const failures = [];
  if (qaReport.score < pipeline.minimumQaScore) {
    failures.push(`QA score ${qaReport.score} is below ${pipeline.minimumQaScore}`);
  }
  if (qaReport.h2Count < pipeline.minimumH2Count) {
    failures.push(`H2 count ${qaReport.h2Count} is below ${pipeline.minimumH2Count}`);
  }
  if (qaReport.wordCount < pipeline.minimumWordCount) {
    failures.push(`Word count ${qaReport.wordCount} is below ${pipeline.minimumWordCount}`);
  }
  if (qaReport.wordCount > pipeline.maximumWordCount) {
    failures.push(`Word count ${qaReport.wordCount} exceeds ${pipeline.maximumWordCount}`);
  }
  if (failures.length) {
    const error = new Error(`Phase 3 editorial gate blocked the run: ${failures.join("; ")}.`);
    error.qaReport = qaReport;
    throw error;
  }
}

async function main() {
  const runState = createRunState();
  let selectedStory;
  let seo;
  let savedFile;

  try {
    validateTheme(theme);
    validatePipelineConfig();
    markStage(runState, "configuration-validated", { mode: pipeline.mode });

    const history = readHistory();
    if (pipeline.mode !== "local") {
      assertPublishingWindow(pipeline, history);
    }

    logger.info(`Pipeline mode: ${pipeline.mode.toUpperCase()}`);
    logger.step("Collecting the latest AI and technology news");
    const articles = await getLatestNews();
    markStage(runState, "news-collected", { articleCount: articles.length });

    if (!Array.isArray(articles) || articles.length === 0) {
      completeRun(runState, "skipped", { reason: "No news articles were found." });
      logger.warning("No news articles were found.");
      return;
    }

    const duplicateCheck = filterPreviouslyUsedStories(articles, {
      history,
      threshold: pipeline.duplicateSimilarityThreshold,
    });

    duplicateCheck.rejected.forEach(({ article, reason, similarity }) => {
      logger.warning(`Skipped duplicate: ${article.title} (${reason}, ${Math.round(similarity * 100)}% match)`);
    });

    if (!duplicateCheck.accepted.length) {
      completeRun(runState, "skipped", { reason: "All collected stories were previously used." });
      logger.warning("All collected stories were previously used. No API generation was started.");
      return;
    }

    logger.info(`Found ${articles.length} articles; ${duplicateCheck.accepted.length} are eligible after duplicate checks.`);
    logger.step("AI Editor is selecting the best story");
    selectedStory = await chooseBestStory(duplicateCheck.accepted, pipeline);
    logger.info("Selected story", selectedStory.title);
    markStage(runState, "story-selected", {
      storyTitle: selectedStory.title,
      storyUrl: selectedStory.link,
      source: selectedStory.source,
      editorialScore: selectedStory.editorialScore,
    });

    logger.step("Building knowledge");
    const knowledge = await buildKnowledge(selectedStory);
    markStage(runState, "knowledge-built");

    logger.step("Writing article");
    const article = await writeArticle(knowledge);
    markStage(runState, "article-written");

    logger.step("Generating SEO data");
    seo = await generateSEO(article);
    markStage(runState, "seo-generated", { slug: seo.slug, seoTitle: seo.seoTitle });

    logger.step("Generating featured-image instructions");
    const imageData = await generateImagePrompt({ article, seo });
    markStage(runState, "image-prompt-generated");

    logger.step("Running quality assurance");
    const qaReport = assertPublishable({ article, seo, imageData });
    assertEditorialQuality(qaReport);
    logger.success(`QA passed with score ${qaReport.score}/100.`);
    logger.info(`Word count: ${qaReport.wordCount}`);
    logger.info(`H2 sections: ${qaReport.h2Count}`);
    logger.info(`Average sentence length: ${qaReport.readability.averageWordsPerSentence} words`);
    qaReport.warnings.forEach((warning) => logger.warning(warning));
    markStage(runState, "qa-passed", { qaReport });

    logger.step("Saving recoverable article checkpoint");
    savedFile = saveArticle(article, seo);
    logger.success(`Article saved to ${savedFile}`);
    markStage(runState, "article-saved", { savedFile });

    if (pipeline.mode === "local") {
      const reportFile = completeRun(runState, "local-complete", {
        storyTitle: selectedStory.title,
        storyUrl: selectedStory.link,
        savedFile,
        qaScore: qaReport.score,
      });
      logger.success(`Local-only run completed. Report: ${reportFile}`);
      return;
    }

    validateEnvironment({ requirePublishing: true });

    const retryOptions = {
      attempts: pipeline.retryAttempts,
      delayMs: pipeline.retryDelayMs,
      onRetry: ({ label, attempt, attempts, error }) => {
        logger.warning(`${label} failed on attempt ${attempt}/${attempts}: ${error.message}`);
      },
    };

    logger.step("Generating featured image");
    const featuredImage = await withRetry(
      "Featured image generation",
      () => generateFeaturedImage(imageData, seo),
      retryOptions
    );
    markStage(runState, "image-generated");

    logger.step("Uploading featured image");
    const uploadedImage = await withRetry(
      "Featured image upload",
      () => uploadImage(featuredImage),
      retryOptions
    );

    if (!uploadedImage?.imageUrl) {
      throw new Error("Image upload completed without returning an image URL.");
    }
    markStage(runState, "image-uploaded", { imageUrl: uploadedImage.imageUrl });

    const isDraft = pipeline.mode === "draft";
    logger.step(isDraft ? "Creating Blogger draft" : "Publishing to Blogger");
    const bloggerPost = await withRetry(
      "Blogger submission",
      () => publishToBlogger({
        article,
        seo,
        imageUrl: uploadedImage.imageUrl,
        imageData,
        isDraft,
      }),
      retryOptions
    );

    if (!bloggerPost?.id && !bloggerPost?.url) {
      throw new Error("Blogger did not return a post ID or URL.");
    }

    const finalStatus = isDraft ? "draft-created" : "published";
    const historyRecord = recordHistory({
      status: finalStatus,
      storyTitle: selectedStory.title,
      storyUrl: selectedStory.link,
      source: selectedStory.source,
      sourcePublishedAt: selectedStory.date,
      editorialScore: selectedStory.editorialScore,
      seoTitle: seo.seoTitle,
      slug: seo.slug,
      qaScore: qaReport.score,
      bloggerPostId: bloggerPost.id || null,
      bloggerUrl: bloggerPost.url || null,
      imageUrl: uploadedImage.imageUrl,
      savedFile,
      runId: runState.runId,
    });

    const reportFile = completeRun(runState, finalStatus, {
      storyTitle: selectedStory.title,
      storyUrl: selectedStory.link,
      seoTitle: seo.seoTitle,
      qaScore: qaReport.score,
      savedFile,
      bloggerPostId: bloggerPost.id || null,
      bloggerUrl: bloggerPost.url || null,
      imageUrl: uploadedImage.imageUrl,
      historyId: historyRecord.id,
    });

    logger.success(`${isDraft ? "Blogger draft created" : "Blogger post published"}: ${bloggerPost.url || bloggerPost.id}`);
    logger.info(`Post ID: ${bloggerPost.id || "Not returned"}`);
    logger.info(`Run report: ${reportFile}`);
  } catch (error) {
    completeRun(runState, "failed", {
      failedStage: runState.stage,
      error: error.message,
      storyTitle: selectedStory?.title || null,
      storyUrl: selectedStory?.link || null,
      seoTitle: seo?.seoTitle || null,
      savedFile: savedFile || null,
    });
    throw error;
  }
}

main().catch((error) => {
  if (error.qaReport) {
    logger.error("QA blocked publishing.", error.qaReport);
  } else {
    logger.error(error.message || "Pipeline failed.");
  }

  if (process.env.DEBUG === "true") {
    console.error(error);
  }

  process.exitCode = 1;
});
