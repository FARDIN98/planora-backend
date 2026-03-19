import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@planora.com" },
  });

  if (!existingAdmin) {
    // Create user via Better Auth API (handles password hashing via scrypt)
    const result = await auth.api.signUpEmail({
      body: {
        name: "Admin",
        email: "admin@planora.com",
        password: "admin123",
      },
    });

    if (result) {
      // Update role to admin via Prisma (signUpEmail creates with default "user" role)
      await prisma.user.update({
        where: { email: "admin@planora.com" },
        data: { role: "admin" },
      });
      console.log("Admin user seeded: admin@planora.com / admin123 (role: admin)");
    } else {
      console.error("Failed to create admin user via auth.api.signUpEmail");
    }
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
