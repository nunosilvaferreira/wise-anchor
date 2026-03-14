"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site-header.module.css";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/add-task", label: "Add Task" },
  { href: "/settings", label: "Settings" },
  { href: "/calm-steps", label: "CalmSteps" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/">
        WiseAnchor
      </Link>

      <nav className={styles.nav}>
        {LINKS.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              className={isActive ? styles.activeLink : styles.link}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
