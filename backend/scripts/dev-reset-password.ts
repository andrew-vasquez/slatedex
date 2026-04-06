import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/db";

type CliArgs = {
  email: string;
  password: string;
  force: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  let email = "";
  let password = "";
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email") {
      email = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg === "--password") {
      password = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg === "--force") {
      force = true;
    }
  }

  if (!email || !password) {
    throw new Error(
      "Usage: bun run reset-password --email <email> --password <new-password> [--force]"
    );
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  return { email, password, force };
}

async function main() {
  const { email, password, force } = parseArgs(process.argv.slice(2));

  if (process.env.NODE_ENV === "production" && !force) {
    throw new Error("Refusing to run in production without --force.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      accounts: {
        where: { providerId: "credential" },
        select: { id: true },
      },
    },
  });

  if (!user) {
    throw new Error(`No user found for email: ${normalizedEmail}`);
  }

  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    if (user.email !== normalizedEmail) {
      await tx.user.update({
        where: { id: user.id },
        data: { email: normalizedEmail },
      });
    }

    if (user.accounts.length > 0) {
      await tx.account.update({
        where: { id: user.accounts[0]!.id },
        data: { password: hashedPassword },
      });
      return;
    }

    await tx.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
  });

  console.log(`Password reset successfully for ${normalizedEmail}`);
}

main()
  .catch((error) => {
    console.error("[reset-password] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
