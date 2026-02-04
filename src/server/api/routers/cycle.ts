import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const cycleRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        startDate: z.date(),
        endDate: z.date(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.cycle.create({
        data: {
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          projectId: input.projectId,
        },
      });
    }),

  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.cycle.findMany({
        where: { projectId: input.projectId },
        orderBy: { startDate: "desc" },
      });
    }),

  getCurrent: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const now = new Date();
      return ctx.db.cycle.findFirst({
        where: {
          projectId: input.projectId,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });
    }),
});
