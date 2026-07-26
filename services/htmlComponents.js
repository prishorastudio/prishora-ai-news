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

  return `
    <div style="margin:0 0 24px 0;">
      <img
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(altText)}"
        style="
          width:100%;
          height:auto;
          display:block;
          border-radius:16px;
        "
      />
    </div>
  `;
}

function buildArticleMeta({
  category = "AI & Technology",
  readingTime = "5 min read",
  publishedDate = "",
  author = "Prishora Studio",
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
      background:#f8fafc;
      border:1px solid #e5e7eb;
      border-radius:10px;
      color:#4b5563;
      font-size:14px;
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
      background:#f5f7fa;
      border-left:4px solid #2563eb;
      border-radius:8px;
      color:#374151;
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
            style="color:#2563eb;text-decoration:none;"
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
      padding:20px;
      background:#f8fafc;
      border:1px solid #e5e7eb;
      border-radius:12px;
    ">
      <strong style="
        display:block;
        margin:0 0 12px 0;
        color:#111827;
        font-size:18px;
      ">
        Table of Contents
      </strong>

      <ol style="
        margin:0 0 0 22px;
        padding:0;
        color:#374151;
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
      background:#f8fafc;
      border:1px solid #e5e7eb;
      border-radius:12px;
    ">
      <div style="
        margin:0 0 6px 0;
        color:#111827;
        font-size:20px;
        font-weight:700;
      ">
        Prishora Studio
      </div>

      <div style="
        margin:0 0 10px 0;
        color:#2563eb;
        font-size:14px;
        font-weight:600;
      ">
        AI &amp; Technology News
      </div>

      <p style="
        margin:0;
        color:#4b5563;
        font-size:15px;
        line-height:1.7;
      ">
        Curated coverage of artificial intelligence, technology,
        cybersecurity, startups and digital innovation.
      </p>
    </section>
  `;
}

function buildFooter() {
  return `
    <hr style="
      margin:36px 0 20px 0;
      border:none;
      border-top:1px solid #e5e7eb;
    " />

    <p style="
      margin:0;
      color:#6b7280;
      font-size:14px;
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