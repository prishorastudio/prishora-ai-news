const { authorizeGoogle } = require("./auth/googleAuth");

async function testAuth() {
  try {
    console.log("Testing Google authentication...\n");

    await authorizeGoogle();

    console.log("\n✅ Google authentication successful.");
    console.log("token.json has been created.");
  } catch (error) {
    console.error("\n❌ Google authentication failed.");
    console.error(error.message || error);
  }
}

testAuth();