import { describe, expect, it } from "vitest";
import { buildPaginatedResult, toPrismaSkipTake } from "../../src/lib/pagination.js";

describe("pagination helpers", () => {
  it("converts page/pageSize to Prisma skip/take", () => {
    expect(toPrismaSkipTake({ page: 1, pageSize: 20 })).toEqual({ skip: 0, take: 20 });
    expect(toPrismaSkipTake({ page: 3, pageSize: 10 })).toEqual({ skip: 20, take: 10 });
  });

  it("computes totalPages, rounding up", () => {
    const result = buildPaginatedResult([1, 2, 3], 25, { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(25);
  });

  it("never reports fewer than 1 totalPages, even with zero results", () => {
    const result = buildPaginatedResult([], 0, { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(1);
  });
});
