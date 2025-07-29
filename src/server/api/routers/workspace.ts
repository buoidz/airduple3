import { ColumnType } from "@prisma/client";
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
      const { workspaceId, name } = input;
      const userId = ctx.currentUser.id;

      // 1. Create the Table
      const table = await ctx.db.$transaction(async (tx) => {

        const newTable = await ctx.db.table.create({
          data: {
            name: name,
            workspaceId,
            userId
          }
        });

        // 2. Create two columns: name & note
        const columns = await ctx.db.column.createMany({
          data: [
            { tableId: newTable.id, name: "Name", type: ColumnType.TEXT, order: 0 },
            { tableId: newTable.id, name: "Note", type: ColumnType.TEXT, order: 1 }
          ]
        });

        // 3. Fetch column IDs to use in cells
        const createdColumns = await ctx.db.column.findMany({
          where: { tableId: newTable.id },
          select: { id: true }
        });

        // 4. Create 3 rows and corresponding empty cells
        for (let i = 0; i < 3; i++) {
          const row = await ctx.db.row.create({
            data: {
              tableId: newTable.id,
              order: i
            }
          });

          await ctx.db.cell.createMany({
            data: createdColumns.map(col => ({
              rowId: row.id,
              columnId: col.id,
              textValue: ""
            }))
          });
        }
      
      });

      return table;
    })
});
