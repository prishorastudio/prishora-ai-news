function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(token = "") {
  if (token.length > 4 && token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.length > 4 && token.endsWith("es")) {
    return token.slice(0, -2);
  }

  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }

  return token;
}

function tokenize(value = "") {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length > 2)
      .map(normalizeToken)
  );
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
