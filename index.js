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
const { theme } = require("./config/theme");

async function main() {
  validateTheme(theme);
  logger.step("Collecting the latest AI and technology news");

  const articles = await getLatestNews();

  if (!Array.isArray(articles) || articles.length === 0) {
    logger.warning("No news articles were found.");
    return;
  }

  logger.info(`Found ${articles.length} articles.`);
  logger.step("AI Editor is selecting the best story");
  const selectedStory = await chooseBestStory(articles);
  logger.info("Selected story", selectedStory);

  logger.step("Building knowledge");
  const knowledge = await buildKnowledge(selectedStory);

  logger.step("Writing article");
  const article = await writeArticle(knowledge);

  logger.step("Generating SEO data");
  const seo = await generateSEO(article);

  logger.step("Generating featured-image instructions");
  const imageData = await generateImagePrompt({ article, seo });

  logger.step("Running quality assurance");
  const qaReport = assertPublishable({ article, seo, imageData });
  logger.success(`QA passed with score ${qaReport.score}/100.`);
  logger.info(`Word count: ${qaReport.wordCount}`);
  logger.info(`H2 sections: ${qaReport.h2Count}`);
  logger.info(`Average sentence length: ${qaReport.readability.averageWordsPerSentence} words`);

  qaReport.warnings.forEach((warning) => logger.warning(warning));

  validateEnvironment({ requirePublishing: true });

  logger.step("Generating featured image");
  const featuredImage = await generateFeaturedImage(imageData, seo);

  logger.step("Uploading featured image");
  const uploadedImage = await uploadImage(featuredImage);

  if (!uploadedImage?.imageUrl) {
    throw new Error("Image upload completed without returning an image URL.");
  }

  logger.step("Saving article locally");
  const savedFile = saveArticle(article, seo);
  logger.success(`Article saved to ${savedFile}`);

  logger.step("Publishing draft to Blogger");
  const bloggerPost = await publishToBlogger({
    article,
    seo,
    imageUrl: uploadedImage.imageUrl,
    imageData,
  });

  if (!bloggerPost?.id && !bloggerPost?.url) {
    throw new Error("Blogger did not return a post ID or URL.");
  }

  logger.success(`Blogger draft created: ${bloggerPost.url || bloggerPost.id}`);
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
