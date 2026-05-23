import { PrismaClient } from "./src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const email = "asdsad@gmaiil.com";
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });
    if (user) {
      console.log("Found user:", JSON.stringify(user, null, 2));
    } else {
      console.log("User not found with email:", email);
    }
  } catch (error) {
    console.error("Error searching for user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
