const { spawn } = require("node:child_process");

const scheduleTimezone = String(
  process.env.SCHEDULE_TIMEZONE || "Asia/Kolkata"
).trim();

const times = String(process.env.SCHEDULE_TIMES || "16:00")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value));

if (!times.length) {
  throw new Error("SCHEDULE_TIMES must contain at least one valid HH:MM value.");
}

let running = false;
let lastMinuteKey = null;

function getZonedParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: scheduleTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

function runPipeline() {
  if (running) {
    console.log("⚠️ Scheduled run skipped because another pipeline run is still active.");
    return;
  }

  running = true;
  const now = getZonedParts();
  console.log(
    `\n▶ Starting scheduled pipeline at ${now.year}-${now.month}-${now.day} ${now.hour}:${now.minute} (${scheduleTimezone})\n`
  );

  const child = spawn(process.execPath, ["index.js"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  child.on("error", (error) => {
    running = false;
    console.error(`❌ Could not start scheduled pipeline: ${error.message}`);
  });

  child.on("exit", (code) => {
    running = false;
    console.log(
      `\n${code === 0 ? "✅" : "❌"} Scheduled pipeline finished with exit code ${code}.\n`
    );
  });
}

function checkSchedule() {
  const now = getZonedParts();
  const currentTime = `${now.hour}:${now.minute}`;
  const minuteKey = `${now.year}-${now.month}-${now.day}-${currentTime}`;

  if (times.includes(currentTime) && minuteKey !== lastMinuteKey) {
    lastMinuteKey = minuteKey;
    runPipeline();
  }
}

console.log(
  `✅ Scheduler active in ${scheduleTimezone}. Daily run time(s): ${times.join(", ")}`
);
console.log("Keep this process running. Press Ctrl+C to stop.");
checkSchedule();
setInterval(checkSchedule, 15000);
