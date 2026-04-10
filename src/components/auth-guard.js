"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth-guard.module.css";
import { useAppContext } from "./app-provider";

export default function AuthGuard({
  children,
  requireCaregiver = false,
}) {
  const router = useRouter();
  const {
    isAuthenticated,
    isSessionReady,
    role,
  } = useAppContext();

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requireCaregiver && role !== "caregiver") {
      router.replace("/");
    }
  }, [isAuthenticated, isSessionReady, requireCaregiver, role, router]);

  if (!isSessionReady) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Checking your session</h1>
          <p>Please wait while WiseAnchor confirms your account access.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || (requireCaregiver && role !== "caregiver")) {
    return null;
  }

  return children;
}
