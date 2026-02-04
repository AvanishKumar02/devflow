import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { IssueStatus, IssuePriority } from "../../../../generated/prisma";

export const issueRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.nativeEnum(IssueStatus).default(IssueStatus.TODO),
        priority: z.nativeEnum(IssuePriority).default(IssuePriority.NONE),
        projectId: z.string(),
        workspaceId: z.string(),
        assigneeId: z.string().optional(),
        cycleId: z.string().optional(),
        epicId: z.string().optional(),
        parentId: z.string().optional(),
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

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // If assignee provided, verify they are in the workspace
      if (input.assigneeId) {
        const assigneeMembership = await ctx.db.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: input.workspaceId,
              userId: input.assigneeId,
            },
          },
        });
        if (!assigneeMembership) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Assignee must be a member of the workspace",
          });
        }
      }

      // Verify epic belongs to the project if provided
      if (input.epicId) {
        const epic = await ctx.db.epic.findUnique({
          where: { id: input.epicId },
        });
        if (epic?.projectId !== input.projectId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The selected epic does not belong to this project",
          });
        }
      }

      // Use transaction with a lock to prevent race conditions on issue numbers
      return ctx.db.$transaction(async (tx) => {
        // Lock the project record to serialize issue creation within this project
        // This prevents two concurrent requests from getting the same nextNumber
        await tx.$executeRaw`SELECT id FROM "Project" WHERE id = ${input.projectId} FOR UPDATE`;

        const lastIssue = await tx.issue.findFirst({
          where: { projectId: input.projectId },
          orderBy: { number: "desc" },
          select: { number: true },
        });

        const nextNumber = (lastIssue?.number ?? 0) + 1;

        const issue = await tx.issue.create({
          data: {
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            number: nextNumber,
            projectId: input.projectId,
            workspaceId: input.workspaceId,
            creatorId: ctx.session.user.id,
            assigneeId: input.assigneeId,
            cycleId: input.cycleId,
            epicId: input.epicId,
            parentId: input.parentId,
          },
        });

        await tx.activityLog.create({
          data: {
            issueId: issue.id,
            userId: ctx.session.user.id,
            action: "CREATED",
            newValue: `Issue ${nextNumber} created`,
          },
        });

        return issue;
      });
    }),

  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        status: z.nativeEnum(IssueStatus).optional(),
        priority: z.nativeEnum(IssuePriority).optional(),
        assigneeId: z.string().optional(),
      })
    )
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

      return ctx.db.issue.findMany({
        where: {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          status: input.status,
          priority: input.priority,
          assigneeId: input.assigneeId,
        },
        include: {
          assignee: true,
          project: true,
          epic: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.nativeEnum(IssueStatus).optional(),
        priority: z.nativeEnum(IssuePriority).optional(),
        assigneeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.$transaction(async (tx) => {
        const issue = await tx.issue.findUnique({
          where: { id },
        });

        if (!issue) throw new TRPCError({ code: "NOT_FOUND" });

        // Verify membership in issue's workspace
        const membership = await tx.workspaceMember.findUnique({
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

        // If assignee changing, verify membership
        if (data.assigneeId) {
          const assigneeMembership = await tx.workspaceMember.findUnique({
            where: {
              workspaceId_userId: {
                workspaceId: issue.workspaceId,
                userId: data.assigneeId,
              },
            },
          });
          if (!assigneeMembership) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid assignee" });
          }
        }

        const updatedIssue = await tx.issue.update({
          where: { id },
          data,
        });

        if (data.status && data.status !== issue.status) {
          await tx.activityLog.create({
            data: {
              issueId: id,
              userId: ctx.session.user.id,
              action: "STATUS_CHANGE",
              oldValue: issue.status,
              newValue: data.status,
            },
          });
        }

        return updatedIssue;
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const issue = await ctx.db.issue.findUnique({
        where: { id: input.id },
        include: {
          assignee: true,
          creator: true,
          project: true,
          epic: true,
          comments: {
            include: { user: true },
            orderBy: { createdAt: "desc" },
          },
          activityLogs: {
            orderBy: { createdAt: "desc" },
          },
          tags: {
            include: { tag: true },
          },
        },
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

      return issue;
    }),
});
