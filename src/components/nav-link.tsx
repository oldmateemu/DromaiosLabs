"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function isActivePath(pathname: string, href: string) {
  const current = pathname.split("?")[0] || "/";
  if (href === "/") return current === "/";
  return current === href || current.startsWith(`${href}/`);
}

export function AppNavLink({
  href,
  className,
  activeClassName = "sidebar-link-active",
  children
}: {
  href: string;
  className: string;
  activeClassName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);
  return (
    <Link className={`${className}${active ? ` ${activeClassName}` : ""}`} href={href}>
      {children}
    </Link>
  );
}
