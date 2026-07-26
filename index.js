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

async function main() {
  console.log("Collecting the latest AI and technology news...\n");

  const articles = await getLatestNews();

  if (articles.length === 0) {
    console.log("No news articles were found.");
    return;
  }

  console.log(`Found ${articles.length} articles.`);
  console.log("AI Editor is selecting the best story...\n");

  const selectedStory = await chooseBestStory(articles);

  console.log("Selected Story:");
console.log(selectedStory);

console.log("\nBuilding knowledge...\n");

const knowledge = await buildKnowledge(selectedStory);

console.log(knowledge);

console.log("\nWriting article...\n");

const article = await writeArticle(knowledge);

console.log(article);

console.log("\nGenerating SEO data...\n");

const seo = await generateSEO(article);

console.log("\nGenerating featured image prompt...\n");

const imageData = await generateImagePrompt({
  article,
  seo,
});

console.log(imageData);

const featuredImage = await generateFeaturedImage(imageData, seo);

console.log("\nFeatured image created:\n");
console.log(featuredImage);

console.log("\nUploading featured image...\n");

const uploadedImage = await uploadImage(featuredImage);

console.log("\nFeatured image uploaded:\n");
console.log(uploadedImage);

console.log("\nSaving article...\n");

const savedFile = saveArticle(article, seo);

console.log("✅ Article saved to:");
console.log(savedFile);

console.log("\nPublishing draft to Blogger...\n");

const bloggerPost = await publishToBlogger({
  article,
  seo,
  imageUrl: uploadedImage.imageUrl,
  imageData,
});

console.log("✅ Blogger draft created:");
console.log(bloggerPost.url || bloggerPost.id);
}

main().catch(console.error);