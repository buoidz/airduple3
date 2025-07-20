import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

export const workspaceRouter = createTRPCRouter({
  create: privateProcedure
    .input(
      z.object({ 
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser.id;

      const workspaces = await ctx.db.workspace.create({
        data: {
          name: input.name,
          ownerId: currentUser
        },
      });
    }),
  
  getAll: privateProcedure
    .query(async ({ ctx }) => {
      const workspaces = await ctx.db.workspace.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          tables: true,
        },
      });
      console.log("Fetched workspaces:", workspaces); // add this

      return workspaces;
    }),

  createTableDefault: privateProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser.id;

      const workspace = await ctx.db.workspace.findUnique({
        where: { id: input.workspaceId },
        select: { id: true, ownerId: true },
      });

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        });
      }

      const table = await ctx.db.table.create({
        data: {
          workspaceId: input.workspaceId,
          userId: currentUser,
          name: input.name,
          columns: {
            create: [
              {
                name: 'Name',
                type: 'TEXT', 
                order: 0,
              },
              {
                name: 'Note', 
                type: 'TEXT', 
                order: 1,
              },
            ],
          },
        },
      });
    }),
});
