import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  cellClassName?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSearch?: (term: string) => void;
  searchable?: boolean;
  storageKey?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export const DataTable = <T extends { id: number }>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onSearch,
  searchable = true,
  storageKey,
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (!storageKey) {
      return {};
    }

    try {
      const saved = localStorage.getItem(`datatable:${storageKey}:columnWidths`);
      if (!saved) {
        return {};
      }

      const parsed = JSON.parse(saved) as Record<string, number>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null>(null);

  const parsePixelValue = (value?: string): number | null => {
    if (!value) {
      return null;
    }

    const match = value.match(/^\s*(\d+(?:\.\d+)?)px\s*$/i);
    if (!match) {
      return null;
    }

    return Number(match[1]);
  };

  const getColumnWidth = (col: Column<T>): string | undefined => {
    const resizedWidth = columnWidths[String(col.key)];
    if (resizedWidth) {
      return `${resizedWidth}px`;
    }

    return col.width;
  };

  const handleResizeStart = (event: React.MouseEvent, col: Column<T>) => {
    event.preventDefault();
    event.stopPropagation();

    const key = String(col.key);
    const currentWidth = columnWidths[key] ?? parsePixelValue(col.width) ?? 160;
    const minWidth = parsePixelValue(col.minWidth) ?? 80;

    resizingRef.current = {
      key,
      startX: event.clientX,
      startWidth: currentWidth,
      minWidth,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const current = resizingRef.current;
      if (!current) {
        return;
      }

      const deltaX = moveEvent.clientX - current.startX;
      const nextWidth = Math.max(current.minWidth, Math.round(current.startWidth + deltaX));

      setColumnWidths((prev) => ({
        ...prev,
        [current.key]: nextWidth,
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onPageChange(1);
    onSearch?.(term);
  };

  const handleSort = (col: Column<T>) => {
    if (!onSort) {
      return;
    }

    const key = col.sortKey || String(col.key);
    const nextOrder: 'asc' | 'desc' = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(key, nextOrder);
  };

  const filteredData = useMemo(() => {
    if (onSearch || !searchTerm.trim()) {
      return data;
    }

    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) {
          return false;
        }

        return String(value).toLowerCase().includes(term);
      }),
    );
  }, [columns, data, onSearch, searchTerm]);

  const displayData = filteredData;
  const displayTotal = onSearch || !searchTerm.trim() ? total : filteredData.length;
  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize));

  const inicio = displayTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const fim = displayTotal === 0 ? 0 : Math.min((page - 1) * pageSize + displayData.length, displayTotal);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    localStorage.setItem(`datatable:${storageKey}:columnWidths`, JSON.stringify(columnWidths));
  }, [columnWidths, storageKey]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {searchable && (
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 outline-none bg-transparent"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: getColumnWidth(col), minWidth: col.minWidth, maxWidth: col.maxWidth }}
                  className={`relative px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white ${col.headerClassName || ''}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col)}
                      className="inline-flex items-center gap-1 pr-3"
                    >
                      <span>{col.label}</span>
                      {sortBy === (col.sortKey || String(col.key)) ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} className="opacity-60" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                  <button
                    type="button"
                    aria-label={`Redimensionar coluna ${col.label}`}
                    onMouseDown={(event) => handleResizeStart(event, col)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none bg-transparent hover:bg-blue-200/70 dark:hover:bg-blue-700/50"
                  />
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {displayData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    style={{ width: getColumnWidth(col), minWidth: col.minWidth, maxWidth: col.maxWidth }}
                    className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 text-sm space-x-2 flex">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + ((onEdit || onDelete) ? 1 : 0)}
                  className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Nenhum resultado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {inicio} a {fim} de {displayTotal}
        </span>
        <div className="flex items-center space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-2 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium">
            {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-2 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
