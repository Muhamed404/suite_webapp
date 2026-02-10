"use client";

import clsx from "clsx";

/** Simple outline icon for empty states - folder/document style */
function EmptyStateIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={clsx("w-16 h-16 text-[var(--darkgray)]/40", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      viewBox="0 0 24 24"
    >
      <path
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface EmptyStateProps {
  /** Main headline, e.g. "No modules yet" */
  title: string;
  /** Short description below the title */
  description: string;
  /** Primary CTA (button or link) */
  action: React.ReactNode;
  /** Optional custom icon; defaults to folder icon */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Empty state block for lists (modules, content, quizzes).
 * App-style: centered, icon + headline + description + CTA.
 */
export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      aria-label={title}
      className={clsx(
        "rounded-2xl border border-[var(--strokeGray)] bg-white py-16 px-8 text-center w-full",
        className
      )}
      role="status"
    >
      <div className="flex justify-center mb-5">{icon ?? <EmptyStateIcon />}</div>
      <h3 className="text-lg font-semibold text-[var(--mainblue)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--darkgray)] mb-6 leading-relaxed">{description}</p>
      <div className="flex justify-center">{action}</div>
    </div>
  );
}
