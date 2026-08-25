"use client";

import { Button } from "@/components/ui/button";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
      <p className="text-[12px] text-muted-foreground">
        Menampilkan {start}-{end} dari {totalItems} data
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <NavArrowLeft width={16} height={16} />
        </Button>
        <span className="px-1 text-[13px] text-muted-foreground">
          Halaman {currentPage} dari {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <NavArrowRight width={16} height={16} />
        </Button>
      </div>
    </div>
  );
}
