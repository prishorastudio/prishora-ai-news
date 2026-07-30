require("dotenv").config();
const { uploadImage } = require("./services/imageUpload");
const { generateFeaturedImage } = require("./services/imageGenerator");
const { generateImagePrompt } = require("./services/imagePrompt");
const { publishToBlogger } = require("./services/blogger");
const { saveArticle } = require("./services/storage");
const { generateSEO } = require("./services/seo");
const { getLatestNews } = require("./services/news");
const { chooseBestStory } = require("./services/editor");
const { clusterStories } = require("./services/storyCluster");
const { buildEditorialMemory } = require("./services/editorialMemory");
const { factCheckStory } = require("./services/factChecker");
const { createEditorialPlan } = require("./services/seniorEditor");
const { assertPublisherApproval } = require("./services/publisherAgent");
const { writeArticle } = require("./services/writer");
const { buildKnowledge } = require("./services/knowledge");
const { assertPublishable } = require("./services/qaEngine");
const { validateTheme, validateEnvironment } = require("./utils/configValidator");
const { logger } = require("./utils/logger");
const { withRetry } = require("./utils/retry");
const { theme } = require("./config/theme");
const { pipeline } = require("./config/pipeline");
const { readHistory, filterPreviouslyUsedStories, assertPublishingWindow, recordHistory } = require("./services/history");
const { getNextBloggerTopic, filterStoriesForTopic, ensurePrimaryTopicLabel } = require("./services/topicRotation");
const { createRunState, markStage, completeRun } = require("./services/runState");

const VALID_MODES = new Set(["draft", "publish", "local"]);

function validatePipelineConfig() {
  if (!VALID_MODES.has(pipeline.mode)) throw new Error(`Invalid PIPELINE_MODE "${pipeline.mode}". Use draft, publish, or local.`);
  if (pipeline.minimumQaScore < 0 || pipeline.minimumQaScore > 100) throw new Error("MINIMUM_QA_SCORE must be between 0 and 100.");
  if (pipeline.minimumFactConfidence < 0 || pipeline.minimumFactConfidence > 100) throw new Error("MINIMUM_FACT_CONFIDENCE must be between 0 and 100.");
  if (pipeline.minimumWordCount > pipeline.maximumWordCount) throw new Error("MINIMUM_WORD_COUNT cannot be greater than MAXIMUM_WORD_COUNT.");
}

function assertEditorialQuality(qaReport) {
  const failures = [];
  if (qaReport.score < pipeline.minimumQaScore) failures.push(`QA score ${qaReport.score} is below ${pipeline.minimumQaScore}`);
  if (qaReport.h2Count < pipeline.minimumH2Count) failures.push(`H2 count ${qaReport.h2Count} is below ${pipeline.minimumH2Count}`);
  if (qaReport.wordCount < pipeline.minimumWordCount) failures.push(`Word count ${qaReport.wordCount} is below ${pipeline.minimumWordCount}`);
  if (qaReport.wordCount > pipeline.maximumWordCount) failures.push(`Word count ${qaReport.wordCount} exceeds ${pipeline.maximumWordCount}`);
  if (failures.length) {
    const error = new Error(`Editorial gate blocked the run: ${failures.join("; ")}.`);
    error.qaReport = qaReport;
    throw error;
  }
}

async function main() {
  const runState = createRunState();
  let selectedStory;
  let seo;
  let savedFile;
  let targetTopic;

  try {
    validateTheme(theme);
    validatePipelineConfig();
    markStage(runState, "configuration-validated", { mode: pipeline.mode, newsroomEnabled: pipeline.newsroomEnabled });

    const history = readHistory();
    if (pipeline.mode !== "local") assertPublishingWindow(pipeline, history);
    targetTopic = getNextBloggerTopic(history);

    logger.info(`Pipeline mode: ${pipeline.mode.toUpperCase()}`);
    logger.info(`AI Newsroom: ${pipeline.newsroomEnabled ? "ENABLED" : "DISABLED"}`);
    logger.info(`Scheduled Blogger topic: ${targetTopic}`);
    logger.step("News Scout is collecting stories");
    const allArticles = await getLatestNews();
    const articles = filterStoriesForTopic(allArticles, targetTopic);
    markStage(runState, "news-collected", {
      articleCount: articles.length,
      totalCollected: allArticles.length,
      bloggerTopic: targetTopic,
    });

    if (!Array.isArray(articles) || !articles.length) {
      completeRun(runState, "skipped", {
        reason: `No eligible stories were found for ${targetTopic}.`,
        bloggerTopic: targetTopic,
      });
      logger.warning(`No eligible stories were found for ${targetTopic}. The topic rotation was not advanced.`);
      return;
    }

    const duplicateCheck = filterPreviouslyUsedStories(articles, { history, threshold: pipeline.duplicateSimilarityThreshold });
    duplicateCheck.rejected.forEach(({ article, reason, similarity }) => logger.warning(`Skipped duplicate: ${article.title} (${reason}, ${Math.round(similarity * 100)}% match)`));
    if (!duplicateCheck.accepted.length) {
      completeRun(runState, "skipped", {
        reason: `All collected ${targetTopic} stories were previously used.`,
        bloggerTopic: targetTopic,
      });
      logger.warning(`All collected ${targetTopic} stories were previously used. The topic rotation was not advanced.`);
      return;
    }

    const clusteredStories = clusterStories(duplicateCheck.accepted, pipeline.storyClusterThreshold);
    logger.info(`News Scout grouped ${duplicateCheck.accepted.length} eligible ${targetTopic} reports into ${clusteredStories.length} story clusters.`);
    logger.step(`News Scout is selecting the strongest ${targetTopic} story cluster`);
    selectedStory = await chooseBestStory(clusteredStories, pipeline);
    selectedStory.bloggerTopic = targetTopic;
    selectedStory.category = targetTopic;
    logger.info("Selected story", selectedStory.title);
    markStage(runState, "story-selected", {
      storyTitle: selectedStory.title,
      storyUrl: selectedStory.link,
      source: selectedStory.source,
      sourceCount: selectedStory.sourceCount || 1,
      editorialScore: selectedStory.editorialScore,
      bloggerTopic: targetTopic,
    });

    const editorialMemory = buildEditorialMemory(selectedStory, history);
    logger.step("Research Analyst is building the evidence brief");
    const knowledge = await buildKnowledge(selectedStory);
    markStage(runState, "knowledge-built", { sourceCount: selectedStory.sourceCount || 1, bloggerTopic: targetTopic });

    let factCheck = { confidenceScore: 100, publishable: true, confirmedClaims: [], attributedClaims: [], uncertainClaims: [], blockedClaims: [], verificationNotes: [] };
    let editorialPlan = {};
    if (pipeline.newsroomEnabled) {
      logger.step("Fact Checker is reviewing evidence and uncertainty");
      factCheck = await factCheckStory({ selectedStory, knowledge });
      markStage(runState, "fact-check-completed", { confidenceScore: factCheck.confidenceScore, publishable: factCheck.publishable });

      logger.step("Senior Editor is defining the article angle");
      editorialPlan = await createEditorialPlan({ selectedStory, knowledge, factCheck, editorialMemory });
      markStage(runState, "editorial-plan-created", { workingHeadline: editorialPlan.workingHeadline, primaryAngle: editorialPlan.primaryAngle });
    }

    logger.step("Staff Writer is drafting the article");
    const article = await writeArticle(knowledge, { factCheck, editorialPlan, editorialMemory });
    markStage(runState, "article-written");

    logger.step("SEO Editor is preparing and selecting headlines");
    seo = await generateSEO(article, { editorialPlan });
    seo.tags = ensurePrimaryTopicLabel(seo.tags, targetTopic);
    markStage(runState, "seo-generated", {
      slug: seo.slug,
      seoTitle: seo.seoTitle,
      titleCandidates: seo.titleCandidates,
      bloggerTopic: targetTopic,
      tags: seo.tags,
    });

    logger.step("Creative Director is preparing the featured-image concept");
    const imageData = await generateImagePrompt({ article, seo, editorialPlan });
    markStage(runState, "image-prompt-generated", { visualConcept: imageData.visualConcept });

    logger.step("Publisher is running final quality assurance");
    const qaReport = assertPublishable({ article, seo, imageData });
    assertEditorialQuality(qaReport);
    const publisherDecision = assertPublisherApproval({ qaReport, factCheck, seo, imageData, pipeline });
    logger.success(`Publisher approved the article. QA ${qaReport.score}/100; fact confidence ${publisherDecision.confidenceScore}/100.`);
    publisherDecision.warnings.forEach((warning) => logger.warning(warning));
    markStage(runState, "publisher-approved", { qaReport, publisherDecision });

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
        factConfidence: factCheck.confidenceScore,
        bloggerTopic: targetTopic,
      });
      logger.success(`Local-only run completed. Topic rotation was not advanced. Report: ${reportFile}`);
      return;
    }

    validateEnvironment({ requirePublishing: true });
    const retryOptions = {
      attempts: pipeline.retryAttempts,
      delayMs: pipeline.retryDelayMs,
      onRetry: ({ label, attempt, attempts, error }) => logger.warning(`${label} failed on attempt ${attempt}/${attempts}: ${error.message}`),
    };

    logger.step("Generating featured image");
    const featuredImage = await withRetry("Featured image generation", () => generateFeaturedImage(imageData, seo), retryOptions);
    markStage(runState, "image-generated");

    logger.step("Uploading featured image");
    const uploadedImage = await withRetry("Featured image upload", () => uploadImage(featuredImage), retryOptions);
    if (!uploadedImage?.imageUrl) throw new Error("Image upload completed without returning an image URL.");
    markStage(runState, "image-uploaded", { imageUrl: uploadedImage.imageUrl });

    const isDraft = pipeline.mode === "draft";
    logger.step(isDraft ? "Creating Blogger draft" : "Publishing to Blogger");
    const bloggerPost = await withRetry("Blogger submission", () => publishToBlogger({ article, seo, imageUrl: uploadedImage.imageUrl, imageData, isDraft }), retryOptions);
    if (!bloggerPost?.id && !bloggerPost?.url) throw new Error("Blogger did not return a post ID or URL.");

    const finalStatus = isDraft ? "draft-created" : "published";
    const historyRecord = recordHistory({
      status: finalStatus,
      bloggerTopic: targetTopic,
      storyTitle: selectedStory.title,
      storyUrl: selectedStory.link,
      source: selectedStory.source,
      sourcePublishedAt: selectedStory.date,
      sourceCount: selectedStory.sourceCount || 1,
      editorialScore: selectedStory.editorialScore,
      factConfidence: factCheck.confidenceScore,
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
      bloggerTopic: targetTopic,
      storyTitle: selectedStory.title,
      storyUrl: selectedStory.link,
      seoTitle: seo.seoTitle,
      qaScore: qaReport.score,
      factConfidence: factCheck.confidenceScore,
      savedFile,
      bloggerPostId: bloggerPost.id || null,
      bloggerUrl: bloggerPost.url || null,
      imageUrl: uploadedImage.imageUrl,
      historyId: historyRecord.id,
    });

    logger.success(`${isDraft ? "Blogger draft created" : "Blogger post published"}: ${bloggerPost.url || bloggerPost.id}`);
    logger.info(`Completed Blogger topic: ${targetTopic}`);
    logger.info(`Post ID: ${bloggerPost.id || "Not returned"}`);
    logger.info(`Run report: ${reportFile}`);
  } catch (error) {
    completeRun(runState, "failed", {
      failedStage: runState.stage,
      error: error.message,
      bloggerTopic: targetTopic || null,
      storyTitle: selectedStory?.title || null,
      storyUrl: selectedStory?.link || null,
      seoTitle: seo?.seoTitle || null,
      savedFile: savedFile || null,
    });
    throw error;
  }
}

main().catch((error) => {
  if (error.qaReport) logger.error("QA blocked publishing.", error.qaReport);
  else if (error.publisherDecision) logger.error("Publisher Agent blocked publishing.", error.publisherDecision);
  else logger.error(error.message || "Pipeline failed.");
  if (process.env.DEBUG === "true") console.error(error);
  process.exitCode = 1;
});
