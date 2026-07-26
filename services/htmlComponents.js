const { theme } = require("../config/theme");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildFeaturedImage({ imageUrl, altText }) {
  if (!imageUrl) {
    return "";
  }

  const loadingAttribute = theme.image.lazyLoading ? ' loading="lazy"' : "";

  return `
    <div style="margin:0 0 24px 0;">
      <img
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(altText)}"
        ${loadingAttribute}
        style="
          width:100%;
          max-width:${theme.image.maxWidth};
          height:auto;
          display:block;
          border-radius:${theme.image.borderRadius};
          box-shadow:${theme.image.shadow};
        "
      />
    </div>
  `;
}

function buildArticleMeta({
  category = "AI & Technology",
  readingTime = "5 min read",
  publishedDate = "",
  author = theme.brand.author,
}) {
  const dateHtml = publishedDate
    ? `<span>${escapeHtml(publishedDate)}</span>`
    : "";

  return `
    <div style="
      display:flex;
      flex-wrap:wrap;
      gap:10px 18px;
      margin:0 0 24px 0;
      padding:14px 16px;
      background:${theme.colors.surface};
      border:1px solid ${theme.colors.border};
      border-radius:${theme.radius.card};
      color:${theme.colors.muted};
      font-size:${theme.typography.metaSize};
      line-height:1.5;
    ">
      <span>${escapeHtml(category)}</span>
      <span>${escapeHtml(readingTime)}</span>
      ${dateHtml}
      <span>By ${escapeHtml(author)}</span>
    </div>
  `;
}

function buildMetaDescription(metaDescription = "") {
  if (!metaDescription) {
    return "";
  }

  return `
    <p style="
      margin:0 0 26px 0;
      padding:16px 18px;
      background:${theme.colors.surfaceSoft};
      border-left:4px solid ${theme.colors.primary};
      border-radius:${theme.radius.small};
      color:${theme.colors.text};
      font-size:16px;
      line-height:1.7;
    ">
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
        <li style="margin:0 0 8px 0;">
          <a
            href="#${escapeHtml(item.id)}"
            style="color:${theme.colors.primary};text-decoration:none;"
          >
            ${escapeHtml(item.text)}
          </a>
        </li>
      `
    )
    .join("");

  return `
    <nav style="
      margin:0 0 30px 0;
      padding:${theme.spacing.cardPadding};
      background:${theme.colors.surface};
      border:1px solid ${theme.colors.border};
      border-radius:${theme.radius.card};
    ">
      <strong style="
        display:block;
        margin:0 0 12px 0;
        color:${theme.colors.heading};
        font-size:18px;
      ">
        Table of Contents
      </strong>

      <ol style="
        margin:0 0 0 22px;
        padding:0;
        color:${theme.colors.text};
      ">
        ${links}
      </ol>
    </nav>
  `;
}

function buildAuthorBox() {
  return `
    <section style="
      margin:36px 0 0 0;
      padding:22px;
      background:${theme.colors.surface};
      border:1px solid ${theme.colors.border};
      border-radius:${theme.radius.card};
    ">
      <div style="
        margin:0 0 6px 0;
        color:${theme.colors.heading};
        font-size:20px;
        font-weight:700;
      ">
        ${escapeHtml(theme.brand.name)}
      </div>

      <div style="
        margin:0 0 10px 0;
        color:${theme.colors.primary};
        font-size:${theme.typography.smallSize};
        font-weight:600;
      ">
        ${escapeHtml(theme.brand.publication)}
      </div>

      <p style="
        margin:0;
        color:${theme.colors.muted};
        font-size:15px;
        line-height:1.7;
      ">
        ${escapeHtml(theme.brand.description)}
      </p>
    </section>
  `;
}

function buildFooter() {
  return `
    <hr style="
      margin:36px 0 20px 0;
      border:none;
      border-top:1px solid ${theme.colors.border};
    " />

    <p style="
      margin:0;
      color:${theme.colors.muted};
      font-size:${theme.typography.smallSize};
      line-height:1.6;
    ">
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
