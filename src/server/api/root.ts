import { postRouter } from "@/server/api/routers/post";
import { workspaceRouter } from "@/server/api/routers/workspace";
import { projectRouter } from "@/server/api/routers/project";
import { issueRouter } from "@/server/api/routers/issue";
import { commentRouter } from "@/server/api/routers/comment";
import { cycleRouter } from "@/server/api/routers/cycle";
import { epicRouter } from "@/server/api/routers/epic";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  workspace: workspaceRouter,
  project: projectRouter,
  issue: issueRouter,
  comment: commentRouter,
  cycle: cycleRouter,
  epic: epicRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
