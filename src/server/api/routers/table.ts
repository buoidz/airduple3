import type { Prisma } from "@prisma/client";
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

  addColumn: privateProcedure
    .input(z.object({
      tableId: z.string(),
      name: z.string().min(1),
      type: z.enum(["TEXT", "NUMBER"]) // matches enum in Prisma
    }))
    .mutation(async ({ ctx, input }) => {
      const { tableId, name, type } = input;

      return await ctx.db.$transaction(async (tx) => {
        // Get the current max order
        const lastColumn = await tx.column.findFirst({
          where: { tableId },
          orderBy: { order: "desc" }
        });

        const newOrder = lastColumn ? lastColumn.order + 1 : 0;

        const newColumn = await tx.column.create({
          data: {
            tableId,
            name,
            type,
            order: newOrder
          }
        });

        const rows = await tx.row.findMany({
          where: { tableId },
          select: { id: true }
        });

        if (rows.length > 0) {
          await tx.cell.createMany({
            data: rows.map(row => ({
              rowId: row.id,
              columnId: newColumn.id,
              textValue: type === "TEXT" ? null : undefined,
              numberValue: type === "NUMBER" ? null : undefined,
            }))
          });
        }

        return newColumn;
      });
    }),

  updateCell: privateProcedure
    .input(z.object({
      tableId: z.string(),
      rowIndex: z.number(),
      columnId: z.string(),
      value: z.string()
    }))
    .mutation(async({ ctx, input }) => {
      const row = await ctx.db.row.findFirst({
        where: { 
          tableId: input.tableId,
          order: input.rowIndex
        },
        include: { cells: true },
      });

      if (!row) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Row not found"
      });

      const column = await ctx.db.column.findUnique({
        where: { id: input.columnId },
        select: { type: true }, // Assuming Column model has a type field
      });

      if (!column) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Column not found",
        });
      }

      const cell = row.cells.find(c => c.columnId === input.columnId);
      if (!cell) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cell not found"
      });

      const isNumberColumn = column.type === "NUMBER"; 
      let cellData: Prisma.CellUpdateInput;


      if (isNumberColumn) {
        // Validate that the value is a valid number
        const parsedValue = parseFloat(input.value);
        if (input.value !== "" && isNaN(parsedValue)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid number format for numeric column",
          });
        }
        cellData = {
          textValue: null,
          numberValue: input.value === "" ? null : parsedValue,
        };
      } else {
        cellData = {
          textValue: input.value,
          numberValue: null,
        };
      }


      await ctx.db.cell.update({
        where: { id: cell.id },
        data: {           
          textValue: cellData.textValue,
          numberValue: cellData.numberValue, 
        },
      })
    }),



  // create: privateProcedure
  //   .input(
  //     z.object({
  //       tableId: z.string(),
  //       cells: z.array(
  //         z.object({
  //           columnId: z.string(),
  //           textValue: z.string().optional(),
  //           numberValue: z.number().optional(),
  //         })
  //       ),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const table = await ctx.db.table.findUnique({
  //       where: { id: input.tableId },
  //     });

  //     if (!table) {
  //       throw new TRPCError({
  //         code: 'NOT_FOUND',
  //         message: 'Table not found',
  //       });
  //     }

  //     return ctx.db.$transaction(async (db) => {
  //       const maxOrder = await db.row.aggregate({
  //         where: { tableId: input.tableId },
  //         _max: { order: true },
  //       });

  //       const order = (maxOrder._max.order ?? -1) + 1;

  //       const row = await db.row.create({
  //         data: {
  //           tableId: input.tableId,
  //           order,
  //         },
  //       });

  //       const cellData = input.cells.map((cell) => ({
  //         rowId: row.id,
  //         columnId: cell.columnId,
  //         textValue: cell.textValue,
  //         numberValue: cell.numberValue,
  //       }));

  //       await db.cell.createMany({
  //         data: cellData,
  //       });

  //       return db.row.findUnique({
  //         where: { id: row.id },
  //         include: { cells: true },
  //       });
  //     });
  //   }),
});
