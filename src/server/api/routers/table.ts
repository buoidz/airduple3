import type { Cell, Column, Prisma, Row } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { faker } from '@faker-js/faker';

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
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
  .input(
    z.object({
      tableId: z.string(),
      name: z.string().min(1),
      type: z.enum(["TEXT", "NUMBER"]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { tableId, name, type } = input;

    return ctx.db.$transaction(async (tx) => {
      const lastColumn = await tx.column.findFirst({
        where: { tableId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = lastColumn ? lastColumn.order + 1 : 0;

      const newColumn = await tx.column.create({
        data: {
          tableId,
          name,
          type,
          order: newOrder,
        },
      });

      await tx.$executeRaw`
        INSERT INTO "Cell" ("id", "rowId", "columnId", "textValue", "numberValue")
        SELECT uuid_generate_v4(), r.id, ${newColumn.id}, 
               ${type === "TEXT" ? null : undefined}::text,
               ${type === "NUMBER" ? null : undefined}::double precision
        FROM "Row" r
        WHERE r."tableId" = ${tableId};
      `;

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
        select: { type: true },
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
        rowCount: z.number().min(1).max(50000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tableId, rowCount } = input;

      const columns = await ctx.db.column.findMany({
        where: { tableId },
        orderBy: { order: 'asc' },
      });

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

      const columns = await ctx.db.column.findMany({
        where: { tableId },
        orderBy: { order: 'asc' },
      });

      const maxOrder = await ctx.db.row.aggregate({
        where: { tableId },
        _max: { order: true },
      });
      const newOrder = (maxOrder._max.order ?? 0) + 1;

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
        limit: z.number().min(1).max(1000).default(1000), 
        cursor: z.string().optional(), 
      })
    )
    .query(async ({ ctx, input }) => {
      const { tableId, limit, cursor } = input;

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
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { order: 'asc' },
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

  getRowsWithOperations: privateProcedure
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

      for (const filter of filters) {
        const column = table.columns.find((c) => c.id === filter.columnId);
        if (!column) continue;

        if (column.type === 'TEXT') {
          const textFilterMap: Record<string, Prisma.StringFilter> = {
            equals: { equals: filter.value, mode: 'insensitive' },
            notEquals: { not: filter.value, mode: 'insensitive' },
            contains: { contains: filter.value, mode: 'insensitive' },
          };

          if (filter.type === 'notContains') {
            whereConditions.push({
              NOT: {
                cells: {
                  some: {
                    columnId: filter.columnId,
                    textValue: {
                      contains: filter.value,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            });
            continue;
          }

          if (textFilterMap[filter.type]) {
            whereConditions.push({
              cells: {
                some: {
                  columnId: filter.columnId,
                  textValue: textFilterMap[filter.type],
                },
              },
            });
          }
        } else if (column.type === 'NUMBER') {
          const numValue = Number(filter.value);
          if (isNaN(numValue)) continue;

          const numberFilterMap: Record<string, Prisma.FloatNullableFilter> = {
            equals: { equals: numValue },
            notEquals: { not: numValue },
            greaterThan: { gt: numValue },
            lessThan: { lt: numValue },
          };

          if (numberFilterMap[filter.type]) {
            whereConditions.push({
              cells: {
                some: {
                  columnId: filter.columnId,
                  numberValue: numberFilterMap[filter.type],
                },
              },
            });
          }
        }
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
        orderBy = [{ order: 'asc' }];
      } else {
        orderBy = [{ order: 'asc' }];
      }

      // Execute the main query
      const queryOptions: Prisma.RowFindManyArgs = {
        where: whereClause,
        include: {
          cells: {
            include: {
              column: true
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
      

      const rows = await db.row.findMany(queryOptions) as (Row & {
        cells: (Cell & { column: Column })[]
      })[];

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

      let nextCursor: string | undefined = undefined;
      if (rows.length > limit) {
        const nextItem = rows.pop();
        nextCursor = nextItem!.id;
      }

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
