import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: {
        accounts: {
          select: {
            providerId: true,
            createdAt: true
          }
        },
        memberships: {
          include: {
            workspace: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (users.length === 0) {
      console.log("No users found in the database.");
    } else {
      console.log(`Found ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`\n--- User ${index + 1} ---`);
        console.log(`Name:  ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`ID:    ${user.id}`);
        console.log(`Joined: ${user.createdAt.toLocaleString()}`);
        if (user.accounts.length > 0) {
          console.log(`Auth Providers: ${user.accounts.map(a => a.providerId).join(", ")}`);
        }
        if (user.memberships.length > 0) {
          console.log(`Workspaces: ${user.memberships.map(m => m.workspace.name).join(", ")}`);
        }
      });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
