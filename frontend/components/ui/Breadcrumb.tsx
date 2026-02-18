import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span
                  className="select-none text-[0.6rem]"
                  style={{ color: "var(--text-muted)", opacity: 0.55 }}
                  aria-hidden="true"
                >
                  ›
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: isLast ? "var(--text-secondary)" : "var(--text-muted)" }}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{ color: "var(--text-muted)", textDecoration: "none" }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
