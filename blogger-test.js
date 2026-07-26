const { google } = require("googleapis");
const { authorizeGoogle } = require("./auth/googleAuth");

const BLOG_ID = "6715335500222382013";

async function testBloggerWrite() {
  try {
    console.log("Testing Blogger WRITE permission...\n");

    const auth = await authorizeGoogle();

    const blogger = google.blogger({
      version: "v3",
      auth,
    });

    const response = await blogger.posts.insert({
      blogId: BLOG_ID,
      isDraft: true,
      requestBody: {
        title: "Prishora Write Test",
        content:
          "<h2>Hello Blogger</h2><p>This is a write permission test.</p>",
        labels: ["Test"],
      },
    });

    console.log("✅ Draft created successfully!");
    console.log(response.data.url);
  } catch (error) {
    console.error("\n========== FULL ERROR ==========\n");

    console.dir(error.response?.data, {
      depth: null,
      colors: true,
    });

    console.log("\nStatus:", error.response?.status);

    console.log("\nHeaders:");

    console.dir(error.response?.headers, {
      depth: null,
      colors: true,
    });
  }
}

testBloggerWrite();