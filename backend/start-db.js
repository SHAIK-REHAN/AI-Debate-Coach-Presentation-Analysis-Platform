const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const dbPath = path.join(__dirname, ".db-data");
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

// Locate extracted mongod binary
const mongodPath = path.join(os.homedir(), ".cache", "mongodb-binaries", "mongod-x64-windows-8.2.6.exe");

console.log(`[MongoDB] Using binary: ${mongodPath}`);
console.log(`[MongoDB] Storage directory: ${dbPath}`);

const mongod = spawn(mongodPath, [
  "--port", "27017",
  "--dbpath", dbPath,
  "--bind_ip", "127.0.0.1,localhost"
], {
  stdio: ["ignore", "pipe", "pipe"]
});

mongod.stdout.on("data", (data) => {
  const msg = data.toString();
  if (msg.includes("Waiting for connections") || msg.includes("Listening on")) {
    console.log("[MongoDB] Standalone MongoDB Server is READY and listening on 127.0.0.1:27017");
  }
});

mongod.stderr.on("data", (data) => {
  console.error("[MongoDB Stderr]:", data.toString());
});

mongod.on("close", (code) => {
  console.log(`[MongoDB] Process exited with code ${code}`);
});

process.on("SIGINT", () => {
  console.log("[MongoDB] Stopping server...");
  mongod.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[MongoDB] Stopping server...");
  mongod.kill("SIGTERM");
  process.exit(0);
});
