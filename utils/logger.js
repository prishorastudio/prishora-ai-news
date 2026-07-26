function write(level, message, data) {
  const prefix = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    step: "▶",
  }[level] || "•";

  console.log(`${prefix} ${message}`);

  if (data !== undefined) {
    console.log(data);
  }
}

const logger = {
  info(message, data) {
    write("info", message, data);
  },
  success(message, data) {
    write("success", message, data);
  },
  warning(message, data) {
    write("warning", message, data);
  },
  error(message, data) {
    write("error", message, data);
  },
  step(message) {
    console.log(`\n▶ ${message}\n`);
  },
};

module.exports = {
  logger,
};
