"use client";

import Link from "next/link";

export type FilterType = "cuisine" | "time" | "diet" | "difficulty";

interface FilterTagProps {
  type: FilterType;
  value: string;
  icon?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Build explore URL with filter param. Used for linking from tags. */
export function getExploreFilterUrl(type: FilterType, value: string): string {
  const params = new URLSearchParams();
  params.set(type, value);
  return `/explore?${params.toString()}`;
}

export const FilterTag = ({
  type,
  value,
  icon,
  children,
  className = "flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-sm hover:bg-amber-100 hover:border-amber-300 transition-colors",
}: FilterTagProps) => {
  const href = getExploreFilterUrl(type, value);
  const content = children ?? value;

  return (
    <Link href={href} className={className}>
      {icon && <span className="font-semibold mr-2">{icon}</span>}
      <span>{content}</span>
    </Link>
  );
};
