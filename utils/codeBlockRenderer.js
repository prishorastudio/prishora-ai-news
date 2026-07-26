const hljs = require("highlight.js");
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

function highlightCode(code = "", language = "") {
  const normalized = normalizeLanguage(language);

  try {
    if (normalized !== theme.code.defaultLanguage && hljs.getLanguage(normalized)) {
      return hljs.highlight(String(code), {
        language: normalized,
        ignoreIllegals: true,
      }).value;
    }

    return hljs.highlightAuto(String(code)).value;
  } catch (error) {
    return escapeHtml(code);
  }
}

function renderCodeBlock(code = "", language = "") {
  const label = normalizeLanguage(language);
  const highlightedCode = highlightCode(String(code).replace(/\n$/, ""), label);

  return `
    <style>
      .prishora-code-block .hljs-comment,.prishora-code-block .hljs-quote{color:#94a3b8;font-style:italic}.prishora-code-block .hljs-keyword,.prishora-code-block .hljs-selector-tag,.prishora-code-block .hljs-literal{color:#c084fc}.prishora-code-block .hljs-string,.prishora-code-block .hljs-regexp,.prishora-code-block .hljs-addition{color:#86efac}.prishora-code-block .hljs-number,.prishora-code-block .hljs-symbol,.prishora-code-block .hljs-bullet{color:#fbbf24}.prishora-code-block .hljs-title,.prishora-code-block .hljs-section,.prishora-code-block .hljs-function{color:#60a5fa}.prishora-code-block .hljs-attr,.prishora-code-block .hljs-attribute,.prishora-code-block .hljs-variable,.prishora-code-block .hljs-template-variable{color:#67e8f9}.prishora-code-block .hljs-built_in,.prishora-code-block .hljs-type{color:#fb7185}.prishora-code-block .hljs-meta{color:#f9a8d4}.prishora-code-block .hljs-deletion{color:#fca5a5}
    </style>
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
      "><code class="hljs language-${escapeHtml(label)}">${highlightedCode}</code></pre>
    </div>
  `;
}

module.exports = {
  renderCodeBlock,
  highlightCode,
};
