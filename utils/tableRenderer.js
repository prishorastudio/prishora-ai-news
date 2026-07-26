const { theme } = require("../config/theme");

function styleTableMarkup(tableHtml = "") {
  return String(tableHtml)
    .replace(
      "<table>",
      `<table style="width:100%;min-width:${theme.table.minWidth};border-collapse:separate;border-spacing:0;color:${theme.colors.text};font-size:${theme.table.fontSize};line-height:1.55;">`
    )
    .replace(
      "<thead>",
      `<thead style="background:${theme.table.headerBackground};color:${theme.colors.heading};">`
    )
    .replaceAll(
      "<th>",
      `<th style="padding:${theme.table.cellPadding};border-right:1px solid ${theme.colors.border};border-bottom:1px solid ${theme.colors.border};text-align:left;font-weight:700;vertical-align:top;">`
    )
    .replaceAll(
      "<td>",
      `<td style="padding:${theme.table.cellPadding};border-right:1px solid ${theme.colors.border};border-bottom:1px solid ${theme.colors.border};text-align:left;vertical-align:top;background:${theme.colors.white};">`
    );
}

function renderResponsiveTables(html = "") {
  return String(html).replace(/<table>[\s\S]*?<\/table>/g, (tableHtml) => {
    const styledTable = styleTableMarkup(tableHtml);

    return `<div class="prishora-table-wrapper" style="margin:${theme.table.margin};overflow-x:auto;border:1px solid ${theme.colors.border};border-radius:${theme.table.borderRadius};background:${theme.colors.white};box-shadow:${theme.table.shadow};-webkit-overflow-scrolling:touch;">${styledTable}</div>`;
  });
}

module.exports = {
  renderResponsiveTables,
  styleTableMarkup,
};
