import { rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const generatedClientPath = join(cwd, "src", "generated", "prisma");
const prismaBin = join(cwd, "node_modules", ".bin", "prisma");

rmSync(generatedClientPath, { recursive: true, force: true });

const result = spawnSync(prismaBin, ["generate"], {
  cwd,
  stdio: "inherit",
  env: process.env,
});

if (typeof result.status === "number" && result.status !== 0) {
  process.exit(result.status);
}

if (result.error) {
  throw result.error;
}
