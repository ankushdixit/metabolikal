"use client";

import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ValidatedCSVRow } from "@/lib/csv-parser";
import { useState, useMemo } from "react";

interface CSVPreviewTableProps {
  rows: ValidatedCSVRow[];
  showOnlyErrors?: boolean;
  className?: string;
}

const PAGE_SIZE = 10;

/**
 * CSV Preview Table Component
 * Displays parsed CSV data with validation error highlighting
 */
export function CSVPreviewTable({ rows, showOnlyErrors = false, className }: CSVPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter rows based on showOnlyErrors
  const filteredRows = useMemo(() => {
    return showOnlyErrors ? rows.filter((row) => !row.isValid) : rows;
  }, [rows, showOnlyErrors]);

  // Paginate
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [showOnlyErrors]);

  if (filteredRows.length === 0) {
    return (
      <div className={cn("p-8 text-center bg-card border border-border", className)}>
        <p className="text-muted-foreground font-bold">
          {showOnlyErrors ? "No rows with errors" : "No data to preview"}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground w-12">
                Row
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground w-12">
                Status
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground min-w-[200px]">
                Name
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                Calories
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                Protein
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                Serving
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                Veg
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground min-w-[200px]">
                Errors
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row) => {
              const errorFields = new Set(row.errors.map((e) => e.field));

              return (
                <TableRow
                  key={row.rowNumber}
                  className={cn("border-border", !row.isValid && "bg-red-500/5")}
                >
                  <TableCell className="text-muted-foreground font-bold text-sm">
                    {row.rowNumber}
                  </TableCell>
                  <TableCell>
                    {row.isValid ? (
                      <CheckCircle2 className="h-5 w-5 text-neon-green" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className={cn("font-bold", errorFields.has("name") && "text-red-500")}>
                    {row.data.name || <span className="text-muted-foreground italic">Empty</span>}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-muted-foreground",
                      errorFields.has("calories") && "text-red-500 font-bold"
                    )}
                  >
                    {row.data.calories || "-"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-muted-foreground",
                      errorFields.has("protein") && "text-red-500 font-bold"
                    )}
                  >
                    {row.data.protein ? `${row.data.protein}g` : "-"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-muted-foreground",
                      errorFields.has("serving_size") && "text-red-500 font-bold"
                    )}
                  >
                    {row.data.serving_size || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.data.is_vegetarian?.toLowerCase() === "true" ||
                    row.data.is_vegetarian?.toLowerCase() === "yes" ||
                    row.data.is_vegetarian === "1"
                      ? "Yes"
                      : "No"}
                  </TableCell>
                  <TableCell>
                    {row.errors.length > 0 ? (
                      <ul className="text-sm text-red-500 space-y-1">
                        {row.errors.map((error, idx) => (
                          <li key={idx} className="font-bold">
                            <span className="uppercase text-xs">{error.field}:</span>{" "}
                            {error.message}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-neon-green font-bold text-sm">Valid</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-bold">
            Page {currentPage} of {totalPages} ({filteredRows.length} rows)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-athletic p-2 bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn-athletic p-2 bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
