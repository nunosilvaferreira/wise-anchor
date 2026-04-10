"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SiteHeader from "./site-header";
import styles from "./auth-form.module.css";
import { useAppContext } from "./app-provider";

export default function LoginForm() {
  const router = useRouter();
  const {
    isAuthenticated,
    isFirebaseConfigured,
    isSessionReady,
    login,
    role,
  } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isSessionReady && isAuthenticated) {
      router.replace(role === "caregiver" ? "/caregiver" : "/");
    }
  }, [isAuthenticated, isSessionReady, role, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      router.push("/");
    } catch (loginError) {
      setError(loginError.message || "Login failed. Please try again.");
    }
  }

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.card}>
        <p className={styles.kicker}>Account Access</p>
        <h1>Login</h1>
        <p className={styles.description}>
          Sign in to access routines, caregiver monitoring, and urgent support
          actions.
        </p>

        {!isFirebaseConfigured ? (
          <p className={styles.setupNotice}>
            Firebase login is disabled until the `NEXT_PUBLIC_FIREBASE_*`
            variables are configured locally and in Netlify.
          </p>
        ) : null}

        <p className={styles.hint}>
          Mobile biometric login is not enabled in this version. A secure
          implementation would require passkeys or a native mobile wrapper,
          not stored passwords in the browser.
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              disabled={!isFirebaseConfigured}
              type="submit"
            >
              Sign In
            </button>
            <Link className={styles.secondaryLink} href="/register">
              Create Account
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
