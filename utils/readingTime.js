const DEFAULT_WORDS_PER_MINUTE = 220;

function stripMarkup(content = "") {
  return String(content)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(content = "") {
  const plainText = stripMarkup(content);

  if (!plainText) {
    return 0;
  }

  return plainText.split(/\s+/).filter(Boolean).length;
}

function calculateReadingTime(
  content = "",
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE
) {
  const safeWordsPerMinute = Number(wordsPerMinute);

  if (!Number.isFinite(safeWordsPerMinute) || safeWordsPerMinute <= 0) {
    throw new TypeError("wordsPerMinute must be a positive number.");
  }

  const words = countWords(content);
  const minutes = Math.max(1, Math.ceil(words / safeWordsPerMinute));

  return {
    words,
    minutes,
    text: `${minutes} min read`,
  };
}

module.exports = {
  DEFAULT_WORDS_PER_MINUTE,
  stripMarkup,
  countWords,
  calculateReadingTime,
};