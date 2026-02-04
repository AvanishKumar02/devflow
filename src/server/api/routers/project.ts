import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        key: z.string().min(2).max(10).toUpperCase(),
        workspaceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify workspace membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create projects in this workspace.",
        });
      }

      // Check if key is already taken in this workspace
      const existing = await ctx.db.project.findUnique({
        where: {
          workspaceId_key: {
            workspaceId: input.workspaceId,
            key: input.key,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A project with this key already exists in this workspace.",
        });
      }

      try {
        return await ctx.db.project.create({
          data: {
            name: input.name,
            key: input.key,
            workspaceId: input.workspaceId,
          },
        });
      } catch (err) {
        if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A project with this key already exists in this workspace.",
          });
        }
        throw err;
      }
    }),

  getAllByWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.project.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: { workspace: true },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

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

      return project;
    }),
});
