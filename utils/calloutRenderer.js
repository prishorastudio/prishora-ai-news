const { theme } = require("../config/theme");

const CALLOUT_PATTERN = /^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|SUCCESS)\]\s*$/i;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCallout(type, bodyLines = []) {
  const key = String(type).toLowerCase();
  const config = theme.callouts[key] || theme.callouts.note;
  const body = bodyLines
    .map((line) => line.replace(/^>\s?/, "").trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 8px 0;">${escapeHtml(line)}</p>`)
    .join("")
    .replace(/<\/p>$/, "</p>");

  return `
<div class="prishora-callout prishora-callout-${key}" style="margin:${theme.callouts.margin};padding:${theme.callouts.padding};background:${config.background};border:1px solid ${config.border};border-left:5px solid ${config.accent};border-radius:${theme.callouts.borderRadius};color:${config.text};">
  <div style="margin:0 0 7px 0;font-weight:700;color:${config.accent};letter-spacing:.03em;">${config.icon} ${escapeHtml(config.label)}</div>
  <div style="line-height:1.7;">${body}</div>
</div>`;
}

function renderCallouts(markdown = "") {
  const lines = String(markdown).split(/\r?\n/);
  const output = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(CALLOUT_PATTERN);

    if (!match) {
      output.push(lines[index]);
      continue;
    }

    const bodyLines = [];
    let cursor = index + 1;

    while (cursor < lines.length && /^>/.test(lines[cursor])) {
      bodyLines.push(lines[cursor]);
      cursor += 1;
    }

    output.push(renderCallout(match[1], bodyLines));
    index = cursor - 1;
  }

  return output.join("\n");
}

module.exports = {
  renderCallouts,
};
