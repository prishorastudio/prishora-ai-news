const { askGemini } = require("./services/gemini");

async function test() {
  try {
    console.log("Testing Gemini...\n");

    const response = await askGemini(
      "Reply with exactly these two words: Hello Prishora"
    );

    console.log("Response:");
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}

test();