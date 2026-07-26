const { generateFeaturedImage } = require("./services/imageGenerator");

async function testImage() {
  try {
    console.log("Generating test featured image...\n");

    const imageData = {
      prompt:
        "Premium cinematic technology-news illustration of artificial intelligence transforming global healthcare, realistic hospital environment, glowing medical data interfaces, doctors using advanced AI systems, clean composition, dramatic lighting, 16:9 landscape, no logos, no watermark, no readable text",
      altText:
        "Doctors using artificial intelligence systems inside a modern hospital",
      caption:
        "Artificial intelligence is becoming an important part of modern healthcare.",
    };

    const seo = {
      slug: "prishora-ai-image-test",
    };

    const result = await generateFeaturedImage(imageData, seo);

    console.log("✅ Featured image generated:");
    console.log(result);
  } catch (error) {
    console.error("❌ Image generation failed:");
    console.error(error.message || error);
  }
}

testImage();