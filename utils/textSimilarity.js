function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value = "") {
  return new Set(normalizeText(value).split(" ").filter((token) => token.length > 2));
}

function jaccardSimilarity(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (!leftTokens.size || !rightTokens.size) return 0;

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
}

module.exports = {
  normalizeText,
  jaccardSimilarity,
};
