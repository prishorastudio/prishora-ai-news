const { theme } = require("../config/theme");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderArticleImage({ src = "", alt = "", caption = "" } = {}) {
  if (!src) return "";

  const loadingAttribute = theme.image.lazyLoading ? ' loading="lazy"' : "";
  const captionHtml = theme.image.showCaption && caption
    ? `<figcaption style="margin:${theme.image.captionMargin};color:${theme.colors.muted};font-size:${theme.image.captionSize};line-height:1.55;text-align:center;">${escapeHtml(caption)}</figcaption>`
    : "";

  return `
<figure class="prishora-article-image" style="margin:${theme.image.articleMargin};">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${loadingAttribute} style="width:100%;max-width:${theme.image.maxWidth};height:auto;display:block;border-radius:${theme.image.borderRadius};box-shadow:${theme.image.shadow};" />
  ${captionHtml}
</figure>`;
}

module.exports = {
  renderArticleImage,
};
