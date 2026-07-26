const { slugify } = require("./slugify");

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function generateTableOfContents(html = "") {
  const slugCounts = new Map();
  const items = [];

  const content = String(html).replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level, attributes = "", innerHtml) => {
      const text = stripHtml(innerHtml);

      if (!text) {
        return match;
      }

      const baseSlug = slugify(text);
      const nextCount = (slugCounts.get(baseSlug) || 0) + 1;
      slugCounts.set(baseSlug, nextCount);

      const id = nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`;
      const cleanAttributes = attributes.replace(/\s+id=("[^"]*"|'[^']*')/i, "");

      items.push({
        id,
        text,
        level: Number(level),
      });

      return `<h${level}${cleanAttributes} id="${id}">${innerHtml}</h${level}>`;
    }
  );

  return {
    html: content,
    items,
  };
}

module.exports = {
  generateTableOfContents,
  stripHtml,
};
