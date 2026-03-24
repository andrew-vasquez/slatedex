import "dotenv/config";
import { UserRole } from "../src/generated/prisma/client";
import { prisma } from "../src/db";
import { primeBunRuntime } from "../src/lib/runtime";

primeBunRuntime();

type CliArgs = {
  email: string | null;
  username: string | null;
  role: UserRole;
};

function parseRole(raw: string): UserRole {
  const normalized = raw.trim().toUpperCase();
  if (normalized === UserRole.USER || normalized === UserRole.ADMIN || normalized === UserRole.OWNER) {
    return normalized;
  }
  throw new Error("Role must be one of USER, ADMIN, OWNER.");
}

function parseArgs(argv: string[]): CliArgs {
  let email: string | null = null;
  let username: string | null = null;
  let role: UserRole | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email") {
      email = (argv[i + 1] ?? "").trim().toLowerCase();
      i += 1;
      continue;
    }
    if (arg === "--username") {
      username = (argv[i + 1] ?? "").trim().toLowerCase();
      i += 1;
      continue;
    }
    if (arg === "--role") {
      role = parseRole(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
  }

  if (!role || (!email && !username) || (email && username)) {
    throw new Error(
      "Usage: bun run set-user-role --role <USER|ADMIN|OWNER> [--email <email> | --username <username>]"
    );
  }

  return { email, username, role };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const user = await prisma.user.findFirst({
    where: args.email
      ? {
          email: {
            equals: args.email,
            mode: "insensitive",
          },
        }
      : {
          username: args.username ?? undefined,
        },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("User not found for provided identifier.");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: args.role },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  });

  console.log(
    `Updated role for ${updated.username ?? updated.email} from ${user.role} to ${updated.role}.`
  );
}

main()
  .catch((error) => {
    console.error("[set-user-role] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

