  import type { Prisma } from "@prisma/client";
  import { TRPCError } from "@trpc/server";
  import { z } from "zod";
  import { faker } from '@faker-js/faker';

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
            // rows: {
            //   orderBy: {
            //     order: 'asc',
            //   },
            //   include: {
            //     cells: true,
            //   },
            // },
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

    addFakeRows: privateProcedure
      .input(
        z.object({
          tableId: z.string(),
          rowCount: z.number().min(1).max(50000), // Limit to prevent abuse
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { tableId, rowCount } = input;

        // Fetch columns to know the structure
        const columns = await ctx.db.column.findMany({
          where: { tableId },
          orderBy: { order: 'asc' },
        });

        // Get the maximum order for the table
        const maxOrder = await ctx.db.row.aggregate({
          where: { tableId },
          _max: { order: true },
        });
        const startOrder = (maxOrder._max.order ?? 0) + 1;

        // Generate fake rows with order
        const rowsData = Array.from({ length: rowCount }, (_, i) => ({
          id: faker.string.uuid(),
          tableId,
          order: startOrder + i, 
          cells: {
            create: columns.map((col) => ({
              columnId: col.id,
              textValue: col.type === 'TEXT' ? faker.lorem.words({ min: 1, max: 3 }) : undefined,
              numberValue: col.type === 'NUMBER' ? faker.number.int({ min: 1, max: 100 }) : undefined,
            })),
          },
        }));

        // Create rows in batches
        const batchSize = 1000;
        const createdRows = [];
        for (let i = 0; i < rowsData.length; i += batchSize) {
          const batch = rowsData.slice(i, i + batchSize);
          await ctx.db.row.createMany({
            data: batch.map((row) => ({ id: row.id, tableId, order: row.order })),
            skipDuplicates: true,
          });
          // Create cells for the batch
          const allCellsInBatch = batch.flatMap((row) =>
            row.cells.create.map((cell) => ({
              ...cell,
              rowId: row.id,
            }))
          );

          await ctx.db.cell.createMany({
            data: allCellsInBatch,
            skipDuplicates: true,
          });

          createdRows.push(...batch);
        }

        return { count: createdRows.length };
      }),

      addRow: privateProcedure
      .input(
        z.object({ tableId: z.string() })
      )
      .mutation(async ({ ctx, input }) => {
        const { tableId } = input;

        // Fetch columns to know the structure
        const columns = await ctx.db.column.findMany({
          where: { tableId },
          orderBy: { order: 'asc' },
        });

        // Get the maximum order for the table
        const maxOrder = await ctx.db.row.aggregate({
          where: { tableId },
          _max: { order: true },
        });
        const newOrder = (maxOrder._max.order || 0) + 1;

        // Create row
        const newRow = await ctx.db.row.create({
          data: { tableId, order: newOrder },
        });

        // Create cells in bulk
        await ctx.db.cell.createMany({
          data: columns.map((col) => ({
            rowId: newRow.id,
            columnId: col.id,
            textValue: col.type === "TEXT" ? null : undefined,
            numberValue: col.type === "NUMBER" ? null : undefined,
          })),
        });

        return { id: newRow.id };

      }),

  getRows: privateProcedure
    .input(
      z.object({
        tableId: z.string(),
        limit: z.number().min(1).max(1000).default(1000), // Cap at 1000 rows per page
        cursor: z.string().optional(), // Cursor for pagination (row ID)
      })
    )
    .query(async ({ ctx, input }) => {
      const { tableId, limit, cursor } = input;

      // Ensure user has access db the table (via workspace or direct ownership)
      const table = await ctx.db.table.findFirst({
        where: {
          id: tableId,
          OR: [
            { userId: ctx.currentUser.id },
            { workspace: { ownerId: ctx.currentUser.id } },
          ],
        },
      });

      if (!table) {
        throw new Error('Table not found or unauthorized');
      }

      // Fetch rows with pagination
      const rows = await ctx.db.row.findMany({
        where: { tableId },
        take: limit + 1, // Fetch one extra row to determine if there's a next page
        skip: cursor ? 1 : 0, // Skip the cursor row if provided
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { order: 'asc' }, // Use the `order` field for consistent pagination
        include: {
          cells: {
            select: {
              id: true,
              columnId: true,
              textValue: true,
              numberValue: true,
            },
          },
        },
      });

      const hasNextPage = rows.length > limit;
      const resultRows = hasNextPage ? rows.slice(0, limit) : rows;
      const nextCursor = hasNextPage && rows.length > 0 ? rows[limit - 1]?.id ?? null : null;

      return {
        rows: resultRows,
        nextCursor,
        hasNextPage,
      };
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
