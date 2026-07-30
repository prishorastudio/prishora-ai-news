const { marked, Renderer } = require("marked");
const { theme } = require("../config/theme");
const { generateTableOfContents } = require("../utils/tocGenerator");
const { renderCodeBlock } = require("../utils/codeBlockRenderer");
const { renderResponsiveTables } = require("../utils/tableRenderer");
const { renderCallouts } = require("../utils/calloutRenderer");
const { renderArticleImage } = require("../utils/imageRenderer");
const {
  buildFeaturedImage,
  buildMetaDescription,
  buildTableOfContents,
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

function createMarkdownRenderer() {
  const renderer = new Renderer();

  renderer.code = function code(token) {
    return renderCodeBlock(token?.text || "", token?.lang || "");
  };

  renderer.image = function image(token) {
    return renderArticleImage({
      src: token?.href || "",
      alt: token?.text || "",
      caption: token?.title || "",
    });
  };

  return renderer;
}

function styleArticleMarkup(markdown = "") {
  const markdownWithCallouts = renderCallouts(markdown);

  const parsedHtml = marked.parse(markdownWithCallouts, {
    renderer: createMarkdownRenderer(),
  });

  return renderResponsiveTables(parsedHtml);
}

function buildArticleHtml({
  article,
  seo,
  imageUrl,
  imageData,
}) {
  const title =
    seo?.seoTitle ||
    `${theme.brand.name} ${theme.brand.publication}`;

  const metaDescription = seo?.metaDescription || "";
  const altText =
    imageData?.altText ||
    imageData?.imageAlt ||
    title;

  const caption =
    imageData?.caption ||
    imageData?.imageCaption ||
    "";

  const cleanArticleHtml = styleArticleMarkup(article || "");

  const { html: articleHtml, items: tocItems } =
    generateTableOfContents(cleanArticleHtml);

  return `
    ${buildFeaturedImage({
      imageUrl,
      altText,
      caption,
    })}

    ${buildMetaDescription(metaDescription)}

    ${buildTableOfContents(tocItems)}

    <div class="prishora-article-content">
      ${articleHtml}
    </div>

    ${buildFooter()}
  `;
}

module.exports = {
  buildArticleHtml,
  formatPublishedDate,
  styleArticleMarkup,
  createMarkdownRenderer,
};
