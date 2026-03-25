import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const runtime = process.argv[2];

if (runtime !== "bun" && runtime !== "workerd") {
  console.error('Usage: bun run scripts/prisma-generate.ts <bun|workerd>');
  process.exit(1);
}

const cwd = process.cwd();
const schemaPath = join(cwd, "prisma", "schema.prisma");
const tempSchemaPath = join(cwd, "prisma", `.schema.${runtime}.prisma`);
const generatedClientPath = join(cwd, "src", "generated", "prisma");
const prismaBin = join(cwd, "node_modules", ".bin", "prisma");

const schema = readFileSync(schemaPath, "utf8");
const nextSchema = schema.replace(/runtime\s*=\s*"[^"]+"/, `runtime  = "${runtime}"`);

if (nextSchema === schema && !schema.includes('runtime  = "bun"')) {
  console.error("Could not find Prisma generator runtime in prisma/schema.prisma");
  process.exit(1);
}

writeFileSync(tempSchemaPath, nextSchema);

try {
  rmSync(generatedClientPath, { recursive: true, force: true });

  const result = spawnSync(prismaBin, ["generate", "--schema", tempSchemaPath], {
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
} finally {
  rmSync(tempSchemaPath, { force: true });
}
