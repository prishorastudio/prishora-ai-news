function parseJsonResponse(response, label = "AI response") {
  const cleaned = String(response || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`${label} returned invalid JSON: ${error.message}`);
  }
}

module.exports = {
  parseJsonResponse,
};
