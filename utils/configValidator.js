function getValue(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function validateTheme(theme = {}) {
  const requiredPaths = [
    "colors.primary",
    "colors.heading",
    "colors.text",
    "typography.fontFamily",
    "typography.articleSize",
    "layout.articleWidth",
    "image.maxWidth",
    "code.defaultLanguage",
    "table.minWidth",
    "callouts.note",
    "brand.name",
    "brand.publication",
    "brand.author",
  ];

  const missing = requiredPaths.filter((path) => {
    const value = getValue(theme, path);
    return value === undefined || value === null || value === "";
  });

  if (missing.length) {
    throw new Error(`Theme configuration is incomplete: ${missing.join(", ")}`);
  }

  return true;
}

function validateEnvironment({ requirePublishing = false } = {}) {
  if (!requirePublishing) return true;

  const groups = [
    {
      label: "Cloudinary",
      keys: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    },
    {
      label: "Blogger",
      keys: ["BLOGGER_BLOG_ID"],
    },
  ];

  const missingGroups = groups
    .map(({ label, keys }) => ({
      label,
      missing: keys.filter((key) => !String(process.env[key] || "").trim()),
    }))
    .filter((group) => group.missing.length);

  if (missingGroups.length) {
    const details = missingGroups
      .map((group) => `${group.label}: ${group.missing.join(", ")}`)
      .join(" | ");
    throw new Error(`Publishing environment is incomplete. ${details}`);
  }

  return true;
}

module.exports = {
  validateTheme,
  validateEnvironment,
};
