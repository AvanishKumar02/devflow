import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const commentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        issueId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const issue = await ctx.db.issue.findUnique({
        where: { id: input.issueId },
      });

      if (!issue) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: issue.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const comment = await ctx.db.comment.create({
        data: {
          issueId: input.issueId,
          content: input.content,
          userId: ctx.session.user.id,
        },
      });

      await ctx.db.activityLog.create({
        data: {
          issueId: input.issueId,
          userId: ctx.session.user.id,
          action: "COMMENTED",
          newValue: "Added a comment",
        },
      });

      return comment;
    }),

  listByIssue: protectedProcedure
    .input(z.object({ issueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const issue = await ctx.db.issue.findUnique({
        where: { id: input.issueId },
      });

      if (!issue) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: issue.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.comment.findMany({
        where: { issueId: input.issueId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
    }),
});
