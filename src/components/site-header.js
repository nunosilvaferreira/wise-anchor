"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import styles from "./site-header.module.css";
import { useAppContext } from "./app-provider";

// Keep the shared navigation focused on the routes users need every day.
const BASE_LINKS = [
  { href: "/", label: "Today" },
  { href: "/add-task", label: "Add Task" },
  { href: "/settings", label: "Settings" },
  { href: "/calm-steps", label: "Calm Steps" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeProfile,
    account,
    isAuthenticated,
    isFirebaseConfigured,
    isSessionReady,
    logout,
    role,
  } = useAppContext();
  const links = !isAuthenticated
    ? []
    : role === "caregiver"
      ? [
          ...BASE_LINKS,
          { href: "/caregiver", label: "Caregiver" },
          { href: "/caregiver/history", label: "History" },
        ]
      : BASE_LINKS;
  const accountLabel =
    activeProfile?.fullName || account?.fullName || "Synced account";

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className={styles.header}>
      <div className={styles.brandRow}>
        <Link className={styles.brand} href="/">
          <Image
            alt="Wise Anchor"
            className={styles.brandLogo}
            height={92}
            priority
            src="/wiseanchor-logo.png"
            width={180}
          />
        </Link>
        {isAuthenticated && isSessionReady ? (
          <span className={styles.accountLabel}>{accountLabel}</span>
        ) : null}
      </div>

      <div className={styles.actions}>
        {links.length ? (
          <nav className={styles.nav}>
            {links.map((link) => {
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
        ) : null}

        <div className={styles.authActions}>
          {!isSessionReady ? <span className={styles.helperText}>Loading session...</span> : null}

          {isSessionReady && isAuthenticated ? (
            <button className={styles.authButton} onClick={handleLogout} type="button">
              Sign Out
            </button>
          ) : null}

          {isSessionReady && !isAuthenticated && isFirebaseConfigured ? (
            <>
              <Link className={styles.authButton} href="/login">
                Login
              </Link>
              <Link className={styles.authPrimaryButton} href="/register">
                Register
              </Link>
            </>
          ) : null}

          {isSessionReady && !isFirebaseConfigured && !isAuthenticated ? (
            <span className={styles.helperText}>Add Firebase env vars to enable login.</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
