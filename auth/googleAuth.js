const fs = require("fs");
const http = require("http");
const path = require("path");
const { exec } = require("child_process");
const { google } = require("googleapis");

const CREDENTIALS_PATH = path.join(__dirname, "..", "credentials.json");
const TOKEN_PATH = path.join(__dirname, "..", "token.json");

const SCOPES = [
  "https://www.googleapis.com/auth/blogger",
  "https://www.googleapis.com/auth/drive.file",
];

function parseJsonEnvironment(name) {
  const raw = String(process.env[name] || "").trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${name} must contain valid JSON: ${error.message}`);
  }
}

function readCredentials() {
  const environmentCredentials = parseJsonEnvironment("GOOGLE_CREDENTIALS_JSON");
  if (environmentCredentials) {
    return environmentCredentials.installed || environmentCredentials.web || environmentCredentials;
  }

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      "Google credentials are missing. Provide GOOGLE_CREDENTIALS_JSON or credentials.json."
    );
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  return credentials.installed || credentials.web;
}

function createOAuthClientFromToken(token) {
  if (!token?.client_id || !token?.client_secret || !token?.refresh_token) {
    throw new Error(
      "Google token must include client_id, client_secret, and refresh_token."
    );
  }

  const oauthClient = new google.auth.OAuth2(
    token.client_id,
    token.client_secret
  );

  oauthClient.setCredentials({
    refresh_token: token.refresh_token,
  });

  return oauthClient;
}

function loadSavedCredentials() {
  const environmentToken = parseJsonEnvironment("GOOGLE_TOKEN_JSON");
  if (environmentToken) {
    return createOAuthClientFromToken(environmentToken);
  }

  if (!fs.existsSync(TOKEN_PATH)) {
    return null;
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  return createOAuthClientFromToken(token);
}

function saveCredentials(client, clientDetails) {
  const tokenData = {
    type: "authorized_user",
    client_id: clientDetails.client_id,
    client_secret: clientDetails.client_secret,
    refresh_token: client.credentials.refresh_token,
  };

  fs.writeFileSync(
    TOKEN_PATH,
    JSON.stringify(tokenData, null, 2),
    "utf8"
  );
}

async function authorizeGoogle() {
  const savedClient = loadSavedCredentials();

  if (savedClient) {
    return savedClient;
  }

  if (process.env.CI) {
    throw new Error(
      "GOOGLE_TOKEN_JSON is required in CI. Add the complete token.json content as an encrypted GitHub Actions secret."
    );
  }

  const clientDetails = readCredentials();

  return new Promise((resolve, reject) => {
    const server = http.createServer();

    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      const redirectUri = `http://127.0.0.1:${port}`;

      const oauthClient = new google.auth.OAuth2(
        clientDetails.client_id,
        clientDetails.client_secret,
        redirectUri
      );

      const authUrl = oauthClient.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
      });

      console.log("\nOpening Google authorization...");
      console.log("If the browser does not open, copy this URL:\n");
      console.log(authUrl);

      exec(`start "" "${authUrl}"`);

      server.on("request", async (request, response) => {
        try {
          const requestUrl = new URL(request.url, redirectUri);
          const code = requestUrl.searchParams.get("code");

          if (!code) {
            response.statusCode = 204;
            response.end();
            return;
          }

          response.end(
            "Google authentication successful. You may close this window."
          );
          server.close();

          const { tokens } = await oauthClient.getToken(code);
          oauthClient.setCredentials(tokens);

          if (!tokens.refresh_token) {
            throw new Error(
              "No refresh token was returned. Remove Google access for this app and try again."
            );
          }

          saveCredentials(oauthClient, clientDetails);
          resolve(oauthClient);
        } catch (error) {
          server.close();
          reject(error);
        }
      });
    });

    server.on("error", reject);
  });
}

module.exports = {
  authorizeGoogle,
};