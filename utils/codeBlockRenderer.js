const { theme } = require("../config/theme");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeLanguage(language = "") {
  const cleanLanguage = String(language)
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9_+#.-]/g, "");

  return cleanLanguage || theme.code.defaultLanguage;
}

function renderCodeBlock(code = "", language = "") {
  const label = normalizeLanguage(language);

  return `
    <div class="prishora-code-block" style="
      margin:${theme.code.margin};
      overflow:hidden;
      background:${theme.colors.codeBackground};
      border:1px solid ${theme.code.borderColor};
      border-radius:${theme.code.borderRadius};
      box-shadow:${theme.code.shadow};
    ">
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:${theme.code.headerPadding};
        background:${theme.code.headerBackground};
        border-bottom:1px solid ${theme.code.borderColor};
        color:${theme.code.labelColor};
        font-family:${theme.code.fontFamily};
        font-size:${theme.code.labelSize};
        line-height:1.4;
        text-transform:uppercase;
        letter-spacing:.06em;
      ">
        <span>${escapeHtml(label)}</span>
        <button
          type="button"
          aria-label="Copy code"
          onclick="navigator.clipboard && navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText)"
          style="
            padding:4px 9px;
            background:transparent;
            border:1px solid ${theme.code.buttonBorderColor};
            border-radius:${theme.radius.small};
            color:${theme.colors.codeText};
            cursor:pointer;
            font:inherit;
            text-transform:none;
            letter-spacing:0;
          "
        >Copy</button>
      </div>
      <pre style="
        margin:0;
        padding:${theme.code.contentPadding};
        overflow-x:auto;
        color:${theme.colors.codeText};
        background:${theme.colors.codeBackground};
        font-family:${theme.code.fontFamily};
        font-size:${theme.code.fontSize};
        line-height:${theme.code.lineHeight};
        tab-size:2;
        white-space:pre;
      "><code>${escapeHtml(code).replace(/\n$/, "")}</code></pre>
    </div>
  `;
}

module.exports = {
  renderCodeBlock,
};
