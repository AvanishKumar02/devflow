import { appRouter } from "./src/server/api/root.js";
import { createTRPCContext } from "./src/server/api/trpc.js";
import { db } from "./src/server/db.js";

async function main() {
  // Simulate a session for Averis Q
  const userId = "8khCJHrRPQreDEsrvY6YVu9X80WJYLpu";
  const workspaceId = "cmpa2hca500009edwnuyho7ys"; // dev
  const projectId = "cmpa2imub00049edw1v5jdeqb"; // Windows trial

  console.log("=== SIMULATING TRPC CALL ===");
  
  const ctx = await createTRPCContext({
    headers: new Headers(),
  });
  
  // Override session for simulation
  (ctx as any).session = {
    user: { id: userId, name: "Averis Q", email: "averisqwertion@proton.me" },
    expires: new Date(Date.now() + 1000 * 60 * 60).toISOString()
  };

  const caller = appRouter.createCaller(ctx);

  try {
    const issues = await caller.issue.list({
      workspaceId,
      projectId,
      status: undefined,
      priority: undefined
    });

    console.log(`\nResults: ${issues.length} issues returned`);
    issues.forEach(i => console.log(`- ${i.title} (${i.status})`));
  } catch (e) {
    console.error("TRPC Error:", e);
  }

  await db.$disconnect();
}

main().catch(console.error);
