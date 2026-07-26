const { marked } = require("marked");
const { theme } = require("../config/theme");
const { calculateReadingTime } = require("../utils/readingTime");
const {
  buildFeaturedImage,
  buildArticleMeta,
  buildMetaDescription,
  buildAuthorBox,
  buildFooter,
} = require("./htmlComponents");

function formatPublishedDate(date = new Date()) {
  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(parsedDate);
}

function styleArticleMarkup(markdown = "") {
  return marked
    .parse(markdown)
    .replaceAll(
      "<h2>",
      `<h2 style="margin:${theme.spacing.section} 0 14px;font-size:${theme.typography.h2Size};line-height:1.3;color:${theme.colors.heading};">`
    )
    .replaceAll(
      "<h3>",
      `<h3 style="margin:28px 0 12px;font-size:${theme.typography.h3Size};line-height:1.35;color:${theme.colors.heading};">`
    )
    .replaceAll(
      "<p>",
      `<p style="margin:0 0 ${theme.spacing.paragraph};line-height:${theme.typography.lineHeight};color:${theme.colors.text};">`
    )
    .replaceAll(
      "<ul>",
      `<ul style="margin:0 0 20px 24px;padding:0;color:${theme.colors.text};">`
    )
    .replaceAll(
      "<ol>",
      `<ol style="margin:0 0 20px 24px;padding:0;color:${theme.colors.text};">`
    )
    .replaceAll(
      "<li>",
      '<li style="margin:0 0 10px;line-height:1.7;">'
    )
    .replaceAll(
      "<blockquote>",
      `<blockquote style="margin:24px 0;padding:16px 20px;border-left:4px solid ${theme.colors.primary};background:${theme.colors.surface};color:${theme.colors.text};font-style:italic;">`
    )
    .replaceAll(
      "<a ",
      `<a style="color:${theme.colors.primary};text-decoration:none;" `
    );
}

function buildArticleHtml({
  article,
  seo,
  imageUrl,
  imageData,
  publishedDate = new Date(),
}) {
  const title = seo?.seoTitle || `${theme.brand.name} ${theme.brand.publication}`;
  const metaDescription = seo?.metaDescription || "";
  const category = Array.isArray(seo?.tags) && seo.tags.length
    ? seo.tags[0]
    : theme.brand.publication;
  const altText = imageData?.altText || imageData?.imageAlt || title;
  const readingTime = calculateReadingTime(article);
  const articleHtml = styleArticleMarkup(article || "");

  return `
    <article style="
      max-width:${theme.layout.articleWidth};
      margin:0 auto;
      font-family:${theme.typography.fontFamily};
      color:${theme.colors.text};
      font-size:${theme.typography.articleSize};
      line-height:${theme.typography.lineHeight};
    ">
      ${buildFeaturedImage({ imageUrl, altText })}

      ${buildArticleMeta({
        category,
        readingTime: readingTime.text,
        publishedDate: formatPublishedDate(publishedDate),
        author: theme.brand.author,
      })}

      ${buildMetaDescription(metaDescription)}

      <div class="prishora-article-content">
        ${articleHtml}
      </div>

      ${buildAuthorBox()}
      ${buildFooter()}
    </article>
  `;
}

module.exports = {
  buildArticleHtml,
  formatPublishedDate,
  styleArticleMarkup,
};