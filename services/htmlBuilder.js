const { marked } = require("marked");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildArticleHtml({
  article,
  seo,
  imageUrl,
  imageData,
}) {
  const title = seo?.seoTitle || "Prishora AI & Technology News";
  const metaDescription = seo?.metaDescription || "";
  const altText =
    imageData?.altText ||
    imageData?.imageAlt ||
    title;

  const articleHtml = marked
  .parse(article || "")
  .replaceAll(
    "<h2>",
    '<h2 style="margin:34px 0 14px;font-size:28px;line-height:1.3;color:#111827;">'
  )
  .replaceAll(
    "<h3>",
    '<h3 style="margin:28px 0 12px;font-size:22px;line-height:1.35;color:#1f2937;">'
  )
  .replaceAll(
    "<p>",
    '<p style="margin:0 0 18px;line-height:1.8;color:#374151;">'
  )
  .replaceAll(
    "<ul>",
    '<ul style="margin:0 0 20px 24px;padding:0;color:#374151;">'
  )
  .replaceAll(
    "<ol>",
    '<ol style="margin:0 0 20px 24px;padding:0;color:#374151;">'
  )
  .replaceAll(
    "<li>",
    '<li style="margin:0 0 10px;line-height:1.7;">'
  )
  .replaceAll(
    "<blockquote>",
    '<blockquote style="margin:24px 0;padding:16px 20px;border-left:4px solid #2563eb;background:#f8fafc;color:#374151;font-style:italic;">'
  )
  .replaceAll(
    "<a ",
    '<a style="color:#2563eb;text-decoration:none;" '
  );

  const featuredImageHtml = imageUrl
    ? `
      <div style="margin:0 0 28px 0;">
        <img
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(altText)}"
          style="
            width:100%;
            height:auto;
            display:block;
            border-radius:14px;
          "
        />
      </div>
    `
    : "";

  const descriptionHtml = metaDescription
    ? `
      <p style="
        margin:0 0 24px 0;
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
    `
    : "";

  return `
    <article style="
      max-width:820px;
      margin:0 auto;
      font-family:Arial, Helvetica, sans-serif;
      color:#1f2937;
      font-size:17px;
      line-height:1.8;
    ">
      ${featuredImageHtml}

      
      ${descriptionHtml}

      <div class="prishora-article-content">
        ${articleHtml}
      </div>

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
        Published by Prishora Studio | AI &amp; Technology News
      </p>
    </article>
  `;
}

module.exports = {
  buildArticleHtml,
};