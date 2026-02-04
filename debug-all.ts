import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const issues = await prisma.issue.findMany({
    include: {
      project: true,
      workspace: true
    }
  });

  const workspaces = await prisma.workspace.findMany({
    include: {
      members: {
        include: { user: true }
      },
      projects: true
    }
  });

  console.log("=== DB DIAGNOSTICS ===");
  console.log(`\nTotal Workspaces: ${workspaces.length}`);
  workspaces.forEach(w => {
    console.log(`\nWorkspace: ${w.name} (${w.slug}) [ID: ${w.id}]`);
    console.log(`Members: ${w.members.map(m => `${m.user.name} (${m.role}) [ID: ${m.userId}]`).join(", ")}`);
    console.log(`Projects: ${w.projects.map(p => `${p.name} [ID: ${p.id}, Key: ${p.key}]`).join(", ")}`);
  });

  console.log(`\nTotal Issues: ${issues.length}`);
  issues.forEach(i => {
    console.log(`- [${i.project.key}-${i.number}] ${i.title}`);
    console.log(`  Status: ${i.status} | Priority: ${i.priority}`);
    console.log(`  Workspace ID: ${i.workspaceId}`);
    console.log(`  Project ID: ${i.projectId}`);
  });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
