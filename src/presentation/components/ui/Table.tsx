"use client"

import React, { type ReactNode } from "react";
import { cn } from "@/shared/utils/class-utils";
export interface ColumnDef<T> {
  readonly accessorKey: keyof T;
  readonly header: ReactNode;
  readonly cell?: (value: T[keyof T], row: T) => ReactNode;
  readonly sortable?: boolean;
  readonly width?: string;
}

export interface TableProps<T> {
  readonly data: readonly T[];
  readonly columns: readonly ColumnDef<T>[];
  readonly loading?: boolean;
  readonly onRowClick?: (row: T) => void;
  readonly emptyMessage?: string;
  readonly striped?: boolean;
  readonly bordered?: boolean;
}

export interface TableState {
  readonly sortColumn: string | null;
  readonly sortDirection: 'asc' | 'desc';
}

export function Table<T>({ 
  data, 
  columns, 
  loading = false,
  onRowClick,
  emptyMessage = "No data available",
  striped = true,
  bordered = true
}: TableProps<T>) {
  const [sortState, setSortState] = React.useState<TableState>({
    sortColumn: null,
    sortDirection: 'asc'
  });

  const sortedData = React.useMemo(() => {
    if (!sortState.sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const valueA = a[sortState.sortColumn as keyof T];
      const valueB = b[sortState.sortColumn as keyof T];
      
      let comparison = 0;
      if (valueA < valueB) comparison = -1;
      if (valueA > valueB) comparison = 1;
      
      return sortState.sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState]);

  const handleSort = (column: string) => {
    setSortState(prev => {
      if (prev.sortColumn === column) {
        return {
          sortColumn: column,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
        };
      }
      return { sortColumn: column, sortDirection: 'asc' };
    });
  };

  if (loading) {
    return (
      <div className="w-full animate-pulse space-y-4">
        <div className="h-8 bg-charcoal-200 rounded w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-charcoal-100 rounded w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-charcoal-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-charcoal-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-6 py-4 text-left text-sm font-semibold text-charcoal-900",
                    column.sortable && "cursor-pointer hover:bg-charcoal-100"
                  )}
                  onClick={() => column.sortable && handleSort(column.accessorKey as string)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <svg 
                        className="h-4 w-4 text-charcoal-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M12 6v12m0 0l-6-6m6 6l6-6"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-200">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-charcoal-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "hover:bg-gold-50 transition-colors",
                    onRowClick && "cursor-pointer",
                    striped && rowIndex % 2 === 1 && "even:bg-charcoal-50"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className={cn("px-6 py-4 text-sm", bordered && "border-r border-charcoal-200 last:border-r-0")}>
                      {column.cell 
                        ? column.cell(row[column.accessorKey as keyof T], row)
                        : String(row[column.accessorKey as keyof T])
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}