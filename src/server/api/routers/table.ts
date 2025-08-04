import type { Cell, Column, Prisma, Row } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { faker } from '@faker-js/faker';

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

const filterSchema = z.object({
  columnId: z.string(),
  type: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan']),
  value: z.string(),
});

const sortSchema = z.object({
  columnId: z.string(),
  direction: z.enum(['asc', 'desc']),
});


  export const tableRouter = createTRPCRouter({
    getById: privateProcedure
      .input(
        z.object({ tableId: z.string() })
      )     
      .query(async ({ ctx, input }) => {
        const table = await ctx.db.table.findUnique({
          where: { id: input.tableId },
          include: {
            columns: {
              orderBy: {
                order: 'asc',
              }
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
        const newOrder = (maxOrder._max.order ?? 0) + 1;

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

  getRowsWithOperations: publicProcedure
    .input(z.object({
      tableId: z.string(),
      limit: z.number().min(1).max(1000).default(100),
      cursor: z.string().nullish(),
      filters: z.array(filterSchema).default([]),
      sort: z.array(sortSchema).default([]),
      search: z.string().default(''),
    }))
    .query(async ({ input }) => {
      const { tableId, limit, cursor, filters, sort, search } = input;

      // Get table info and columns for validation and processing
      const table = await db.table.findUnique({
        where: { id: tableId },
        include: { 
          columns: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!table) {
        throw new Error('Table not found');
      }

      // Build where conditions for the Row query
      const whereConditions: Prisma.RowWhereInput[] = [
        { tableId: tableId }
      ];

      // Add search conditions if search term exists
      if (search.trim()) {
        const searchConditions: Prisma.RowWhereInput[] = [];
        
        for (const column of table.columns) {
          if (column.type === 'TEXT') {
            searchConditions.push({
              cells: {
                some: {
                  columnId: column.id,
                  textValue: {
                    contains: search,
                    mode: 'insensitive'
                  }
                }
              }
            });
          } else if (column.type === 'NUMBER') {
            const numValue = Number(search);
            if (!isNaN(numValue)) {
              searchConditions.push({
                cells: {
                  some: {
                    columnId: column.id,
                    numberValue: numValue
                  }
                }
              });
            }
          }
        }

        if (searchConditions.length > 0) {
          whereConditions.push({
            OR: searchConditions
          });
        }
      }

      // Add filter conditions
      for (const filter of filters) {
        const column = table.columns.find(c => c.id === filter.columnId);
        if (!column) continue;

        const filterCondition: Prisma.RowWhereInput = {
          cells: {
            some: {
              columnId: filter.columnId,
            }
          }
        };

        if (column.type === 'TEXT') {
          switch (filter.type) {
            case 'equals':
              (filterCondition.cells as any).some.textValue = {
                equals: filter.value,
                mode: 'insensitive'
              };
              break;
            case 'notEquals':
              (filterCondition.cells as any).some.textValue = {
                not: {
                  equals: filter.value,
                  mode: 'insensitive'
                }
              };
              break;
            case 'contains':
              (filterCondition.cells as any).some.textValue = {
                contains: filter.value,
                mode: 'insensitive'
              };
              break;
            case 'notContains':
              whereConditions.push({
                NOT: {
                  cells: {
                    some: {
                      columnId: filter.columnId,
                      textValue: {
                        contains: filter.value,
                        mode: 'insensitive'
                      }
                    }
                  }
                }
              });
              continue; // Skip adding the regular condition
          }
        } else if (column.type === 'NUMBER') {
          const numValue = Number(filter.value);
          if (isNaN(numValue)) continue;

          switch (filter.type) {
            case 'equals':
              (filterCondition.cells as any).some.numberValue = numValue;
              break;
            case 'notEquals':
              (filterCondition.cells as any).some.numberValue = {
                not: numValue
              };
              break;
            case 'greaterThan':
              (filterCondition.cells as any).some.numberValue = {
                gt: numValue
              };
              break;
            case 'lessThan':
              (filterCondition.cells as any).some.numberValue = {
                lt: numValue
              };
              break;
          }
        }

        whereConditions.push(filterCondition);
      }

      // Build the final where clause
      const whereClause: Prisma.RowWhereInput = 
        whereConditions.length > 1 
          ? { AND: whereConditions }
          : whereConditions[0] ?? { tableId };

      // Get total count for pagination info (before applying cursor)
      const totalCount = await db.row.count({
        where: whereClause
      });

      // Prepare orderBy clause for sorting
      let orderBy: Prisma.RowOrderByWithRelationInput[] = [];
      
      if (sort.length > 0) {
        // For complex sorting by cell values, we need to use a different approach
        // Since Prisma doesn't support ordering by related fields directly in this case,
        // we'll fetch all matching rows and sort them in memory for now
        // For better performance with large datasets, consider using raw SQL
        
        orderBy = [{ order: 'asc' }]; // Default fallback to row order
      } else {
        orderBy = [{ order: 'asc' }];
      }

      // Execute the main query
      let queryOptions: Prisma.RowFindManyArgs = {
        where: whereClause,
        include: {
          cells: {
            include: {
              column: true // Include column info for sorting
            }
          }
        },
        orderBy,
        take: limit + 1,
      };

      // Add cursor pagination
      if (cursor) {
        queryOptions.cursor = { id: cursor };
        queryOptions.skip = 1;
      }
      

      let rows = await db.row.findMany(queryOptions) as (Row & {
        cells: (Cell & { column: Column })[]
      })[];

      // Apply sorting in memory if needed (for complex multi-column sorts)
      if (sort.length > 0) {
        rows.sort((a, b) => {
          for (const sortConfig of sort) {
            const column = table.columns.find(c => c.id === sortConfig.columnId);
            if (!column) continue;

            const aCell = a.cells.find(c => c.columnId === sortConfig.columnId);
            const bCell = b.cells.find(c => c.columnId === sortConfig.columnId);

            let aValue: string | number = '';
            let bValue: string | number = '';

            if (column.type === 'TEXT') {
              aValue = aCell?.textValue ?? '';
              bValue = bCell?.textValue ?? '';
            } else if (column.type === 'NUMBER') {
              aValue = aCell?.numberValue ?? 0;
              bValue = bCell?.numberValue ?? 0;
            }

            let comparison = 0;
            if (column.type === 'TEXT') {
              comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
            } else {
              comparison = Number(aValue) - Number(bValue);
            }

            if (comparison !== 0) {
              return sortConfig.direction === 'desc' ? -comparison : comparison;
            }
          }
          return 0;
        });
      }

      // Handle pagination cursor
      let nextCursor: string | undefined = undefined;
      if (rows.length > limit) {
        const nextItem = rows.pop();
        nextCursor = nextItem!.id;
      }

      // Clean up the response to match your existing format
      const cleanRows = rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => ({
          id: cell.id,
          rowId: cell.rowId,
          columnId: cell.columnId,
          textValue: cell.textValue,
          numberValue: cell.numberValue,
        }))
      }));

      return {
        rows: cleanRows,
        nextCursor,
        totalCount,
      };
    }),

});
