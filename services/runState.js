const fs = require("fs");
const path = require("path");

const runsDir = path.join(__dirname, "..", "output", "runs");

function createRunState() {
  const startedAt = new Date().toISOString();
  return {
    runId: startedAt.replace(/[:.]/g, "-") + `-${Math.random().toString(36).slice(2, 7)}`,
    startedAt,
    completedAt: null,
    status: "running",
    stage: "initializing",
    stages: [],
    costs: {},
  };
}

function persistRunState(state) {
  fs.mkdirSync(runsDir, { recursive: true });
  const filePath = path.join(runsDir, `${state.runId}.json`);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
  return filePath;
}

function markStage(state, stage, details = {}) {
  state.stage = stage;
  state.stages.push({ stage, at: new Date().toISOString(), ...details });
  persistRunState(state);
}

function completeRun(state, status, details = {}) {
  state.status = status;
  state.completedAt = new Date().toISOString();
  Object.assign(state, details);
  return persistRunState(state);
}

module.exports = {
  createRunState,
  persistRunState,
  markStage,
  completeRun,
};
