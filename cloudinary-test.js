require("dotenv").config();

const { uploadImage } = require("./services/imageUpload");

async function test() {
  try {
    const result = await uploadImage({
      filePath: "./output/images/prishora-ai-image-test.png",
    });

    console.log("\n✅ Upload Successful\n");
    console.log(result);
  } catch (err) {
    console.error(err);
  }
}

test();