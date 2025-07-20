import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

export const tableRouter = createTRPCRouter({
  getById: privateProcedure
    .input(
      z.object({ tableId: z.string() })
    )     
    .query(async ({ ctx, input }) => {
      const table = ctx.db.table.findUnique({
        where: { id: input.tableId },
        include: {
          columns: {
            orderBy: {
              order: 'asc',
            }
          },
          rows: {
            orderBy: {
              order: 'asc',
            },
            include: {
              cells: true,
            },
          },
        },
      });

      if (!table) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Table not found',
        });
      }

      return table;
    }),
});
