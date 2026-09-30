import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const platform = process.argv[2];
if (!["ios", "android"].includes(platform)) {
  console.error("Usage: node scripts/mobile.mjs ios|android");
  process.exit(1);
}
function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("npm", ["run", "build"]);
if (!existsSync(platform)) run("npx", ["--no-install", "cap", "add", platform]);
run("npx", ["--no-install", "cap", "sync", platform]);
