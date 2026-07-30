const { theme } = require("../config/theme");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildFeaturedImage({ imageUrl, altText, caption = "" }) {
  if (!imageUrl) {
    return "";
  }

  const loadingAttribute = theme.image.lazyLoading ? ' loading="lazy"' : "";
  const captionHtml = theme.image.showCaption && caption
    ? `<figcaption>${escapeHtml(caption)}</figcaption>`
    : "";

  return `
    <figure class="prishora-figure">
      <img
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(altText)}"
        ${loadingAttribute}
      />
      ${captionHtml}
    </figure>
  `;
}

function buildArticleMeta({
  category = theme.brand.publication,
  readingTime = "",
  publishedDate = "",
  author = theme.brand.author,
} = {}) {
  const metaItems = [
    category ? escapeHtml(category) : "",
    readingTime ? escapeHtml(readingTime) : "",
    publishedDate ? escapeHtml(publishedDate) : "",
    author ? `By ${escapeHtml(author)}` : "",
  ]
    .filter(Boolean)
    .map((item) => `<span>${item}</span>`)
    .join("");

  if (!metaItems) {
    return "";
  }

  return `<div class="prishora-generated-meta">${metaItems}</div>`;
}

function buildMetaDescription(metaDescription = "") {
  if (!metaDescription) {
    return "";
  }

  return `
    <p class="prishora-intro-box">
      ${escapeHtml(metaDescription)}
    </p>
  `;
}

function buildTableOfContents(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  const links = items
    .map(
      (item) => `
        <li>
          <a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a>
        </li>
      `
    )
    .join("");

  return `
    <nav class="prishora-toc">
      <strong>Table of Contents</strong>
      <ol>
        ${links}
      </ol>
    </nav>
  `;
}

function buildAuthorBox() {
  return `
    <section class="prishora-author-box">
      <strong>${escapeHtml(theme.brand.name)}</strong>
      <p>${escapeHtml(theme.brand.description)}</p>
    </section>
  `;
}

function buildFooter() {
  return `
    <p class="prishora-author-note">
      Published by ${escapeHtml(theme.brand.name)} | ${escapeHtml(theme.brand.publication)}
    </p>
  `;
}

module.exports = {
  escapeHtml,
  buildFeaturedImage,
  buildArticleMeta,
  buildMetaDescription,
  buildTableOfContents,
  buildAuthorBox,
  buildFooter,
};
