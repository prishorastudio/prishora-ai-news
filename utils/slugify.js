function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

module.exports = {
  slugify,
};
