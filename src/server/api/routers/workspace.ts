import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { WorkspaceRole } from "../../../../generated/prisma/index.js";

const RESERVED_SLUGS = ["api", "workspaces", "settings", "login", "signup", "auth", "dashboard", "admin", "my-issues"];

export const workspaceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (RESERVED_SLUGS.includes(input.slug)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This slug is reserved and cannot be used.",
        });
      }

      const existing = await ctx.db.workspace.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A workspace with this slug already exists.",
        });
      }

      try {
        return await ctx.db.workspace.create({
          data: {
            name: input.name,
            slug: input.slug,
            members: {
              create: {
                userId: ctx.session.user.id,
                role: "OWNER",
              },
            },
          },
        });
      } catch (err) {
        if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A workspace with this slug already exists.",
          });
        }
        throw err;
      }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workspace.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findFirst({
        where: {
          slug: input.slug,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          members: true,
          projects: true,
        },
      });

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found or you do not have access.",
        });
      }

      return workspace;
    }),

  getMembers: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
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

      return ctx.db.workspaceMember.findMany({
        where: { workspaceId: input.workspaceId },
        include: {
          user: true,
        },
      });
    }),

  addMemberByEmail: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email(),
        role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify that the current user is an OWNER or ADMIN in this workspace
      const currentMembership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!currentMembership || (currentMembership.role !== "OWNER" && currentMembership.role !== "ADMIN")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only workspace owners or admins can add members.",
        });
      }

      // 2. Find the user by email
      const userToAdd = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!userToAdd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User with this email not found. They must have an account first.",
        });
      }

      // 3. Check if they are already a member
      const existingMembership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: userToAdd.id,
          },
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This user is already a member of the workspace.",
        });
      }

      // 4. Create the membership
      return ctx.db.workspaceMember.create({
        data: {
          workspaceId: input.workspaceId,
          userId: userToAdd.id,
          role: input.role,
        },
        include: {
          user: true,
        },
      });
    }),
});
