import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@planora.com" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@planora.com",
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("Admin user seeded: admin@planora.com / admin123 (role: admin)");
  } else {
    console.log("Admin user already exists, skipping seed.");
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
