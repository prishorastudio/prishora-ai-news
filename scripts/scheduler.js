const { spawn } = require("node:child_process");

const times = String(process.env.SCHEDULE_TIMES || "09:00,18:00")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value));

if (!times.length) {
  throw new Error("SCHEDULE_TIMES must contain at least one valid HH:MM value.");
}

let running = false;
let lastMinuteKey = null;

function runPipeline() {
  if (running) {
    console.log("⚠️ Scheduled run skipped because another pipeline run is still active.");
    return;
  }

  running = true;
  console.log(`\n▶ Starting scheduled pipeline at ${new Date().toLocaleString()}\n`);

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
    console.log(`\n${code === 0 ? "✅" : "❌"} Scheduled pipeline finished with exit code ${code}.\n`);
  });
}

function checkSchedule() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const minuteKey = `${now.toISOString().slice(0, 10)}-${currentTime}`;

  if (times.includes(currentTime) && minuteKey !== lastMinuteKey) {
    lastMinuteKey = minuteKey;
    runPipeline();
  }
}

console.log(`✅ Scheduler active in system timezone. Daily run times: ${times.join(", ")}`);
console.log("Keep this process running. Press Ctrl+C to stop.");
checkSchedule();
setInterval(checkSchedule, 15000);
