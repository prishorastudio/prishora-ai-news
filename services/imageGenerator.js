const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const config = require("../config/config");

const ai = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY,
});

async function generateFeaturedImage(imageData, seo) {
  const interaction = await ai.interactions.create({
    model: "gemini-3.1-flash-image",
    input: imageData.prompt,
  });

  const generatedImage = interaction.output_image;

  if (!generatedImage) {
    throw new Error("Nano Banana did not return an image.");
  }

  const outputDir = path.join(__dirname, "..", "output", "images");
  fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(outputDir, `${seo.slug}.png`);
  const buffer = Buffer.from(generatedImage.data, "base64");

  fs.writeFileSync(filePath, buffer);

  return {
    filePath,
    altText: imageData.altText,
    caption: imageData.caption,
  };
}

module.exports = {
  generateFeaturedImage,
};