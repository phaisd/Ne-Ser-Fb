'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface UserPaginationProps {
  position: 'top' | 'bottom';
  startIndex: number;
  endIndex: number;
  totalItems: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
}

export function UserPagination({
  position,
  startIndex,
  endIndex,
  totalItems,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  totalPages,
}: UserPaginationProps) {
  if (totalItems === 0) return null;

  const activePage = Math.min(currentPage, totalPages);
  const maxButtons = 5;
  let startPage = Math.max(1, activePage - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div
      className={`px-4 py-3 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        position === 'top' ? 'border-b border-slate-200/80' : 'border-t border-slate-200/80'
      } text-xs text-slate-600`}
    >
      {/* Left: Summary and Page Size */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            แสดงลำดับที่ <span className="font-bold text-slate-900">{startIndex + 1}</span> -{' '}
            <span className="font-bold text-slate-900">{endIndex}</span> จากทั้งหมด{' '}
            <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {totalItems}
            </span>{' '}
            รายชื่อ
          </span>
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <span className="text-slate-500">แสดงหน้าละ:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer shadow-2xs"
          >
            <option value={10}>10 ท่าน</option>
            <option value={15}>15 ท่าน (แนะนำ)</option>
            <option value={25}>25 ท่าน</option>
            <option value={50}>50 ท่าน</option>
            <option value={100}>100 ท่าน</option>
          </select>
        </div>
      </div>

      {/* Right: Left/Right Pagination Controller */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => setCurrentPage(1)}
          disabled={activePage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          title="ไปหน้าแรกสุด (ซ้ายสุด)"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={activePage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-800 font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          title="เลื่อนไปหน้าก่อนหน้า (ซ้าย)"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
          <span className="hidden md:inline text-xs">◀ ก่อนหน้า</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {startPage > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="w-7 h-7 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 text-slate-400 font-bold">...</span>}
            </>
          )}

          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrentPage(p)}
              className={`w-7 h-7 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                activePage === p
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm ring-2 ring-sky-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-1 text-slate-400 font-bold">...</span>}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className="w-7 h-7 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={activePage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-800 font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          title="เลื่อนไปหน้าถัดไป (ขวา)"
        >
          <span className="hidden md:inline text-xs">ถัดไป ▶</span>
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => setCurrentPage(totalPages)}
          disabled={activePage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          title="ไปหน้าสุดท้าย (ขวาสุด)"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Page Badge Indicator */}
        <div className="ml-2 hidden sm:flex items-center text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-1 rounded-lg">
          หน้า {activePage}/{totalPages}
        </div>
      </div>
    </div>
  );
}
