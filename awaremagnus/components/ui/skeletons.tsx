"use client";

import { Skeleton } from "@heroui/skeleton";
import { Card, CardBody } from "@heroui/card";

const skeletonBase = "rounded-lg bg-default-200";

/** Skeleton for a table with N rows and column placeholders */
export function TableSkeleton({
  rows = 5,
  cols = 7,
  className = "",
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--strokeGray)]">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="text-left py-3 px-4">
                  <Skeleton className={`${skeletonBase} h-4 w-16`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-[var(--strokeGray)] last:border-0">
                {Array.from({ length: cols }).map((_, colIdx) => (
                  <td key={colIdx} className="py-3 px-4">
                    <Skeleton
                      className={`${skeletonBase} h-4 ${
                        colIdx === 1 ? "w-32" : colIdx === 2 ? "w-24" : "w-16"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Single module card skeleton (image + title + description + buttons) */
function ModuleCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-[var(--strokeGray)] bg-white shadow-none">
      <CardBody className="p-5">
        <Skeleton className={`${skeletonBase} aspect-square w-full rounded-2xl mb-4`} />
        <Skeleton className={`${skeletonBase} h-5 w-3/4 mb-2`} />
        <Skeleton className={`${skeletonBase} h-4 w-full mb-1`} />
        <Skeleton className={`${skeletonBase} h-4 w-2/3 mb-4`} />
        <div className="flex gap-2 mt-4">
          <Skeleton className={`${skeletonBase} h-8 w-24 rounded-full`} />
          <Skeleton className={`${skeletonBase} h-8 w-16 rounded-full`} />
        </div>
      </CardBody>
    </Card>
  );
}

/** Library page skeleton: grid of module cards or table */
export function LibraryPageSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <Card className="rounded-2xl border border-[var(--strokeGray)] bg-white shadow-none">
        <CardBody className="p-0 overflow-x-auto">
          <TableSkeleton cols={8} rows={6} />
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <ModuleCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Content list / Quiz list page: table only */
export function ContentListSkeleton() {
  return <TableSkeleton cols={7} rows={5} />;
}

export function QuizListSkeleton() {
  return <TableSkeleton cols={5} rows={5} />;
}

/** Module details page: breadcrumb + title + select + content type cards */
export function ModuleDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1.5">
        <Skeleton className={`${skeletonBase} h-4 w-24`} />
        <Skeleton className={`${skeletonBase} h-4 w-4 rounded-full`} />
        <Skeleton className={`${skeletonBase} h-4 w-32`} />
      </div>
      <div>
        <Skeleton className={`${skeletonBase} h-8 w-64 mb-2`} />
        <Skeleton className={`${skeletonBase} h-4 w-full max-w-md`} />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className={`${skeletonBase} h-11 w-44 rounded-full`} />
        <Skeleton className={`${skeletonBase} h-4 w-32`} />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-2xl border border-[var(--strokeGray)] bg-white shadow-none"
          >
            <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 sm:gap-5">
              <Skeleton className={`${skeletonBase} w-20 h-20 rounded-2xl shrink-0`} />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className={`${skeletonBase} h-4 w-24`} />
                <Skeleton className={`${skeletonBase} h-3 w-40`} />
                <Skeleton className={`${skeletonBase} h-3 w-20`} />
              </div>
              <div className="flex gap-2">
                <Skeleton className={`${skeletonBase} h-8 w-16 rounded-full`} />
                <Skeleton className={`${skeletonBase} h-8 w-14 rounded-full`} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Dashboard module list page: filter + table */
export function ModuleListPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className={`${skeletonBase} h-4 w-28`} />
        <Skeleton className={`${skeletonBase} h-10 w-48 rounded-lg`} />
      </div>
      <TableSkeleton cols={5} rows={6} />
    </div>
  );
}

/** Dashboard quiz list page: filters + table */
export function QuizPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className={`${skeletonBase} h-4 w-20`} />
        <Skeleton className={`${skeletonBase} h-10 w-40 rounded-lg`} />
        <Skeleton className={`${skeletonBase} h-4 w-24`} />
        <Skeleton className={`${skeletonBase} h-10 w-40 rounded-lg`} />
      </div>
      <TableSkeleton cols={4} rows={6} />
    </div>
  );
}
