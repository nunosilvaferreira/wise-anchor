"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteHeader from "./site-header";
import styles from "./auth-form.module.css";
import { SUPPORT_LEVEL_OPTIONS } from "../lib/profile-utils";
import { useAppContext } from "./app-provider";

export default function RegisterForm() {
  const router = useRouter();
  const { isFirebaseConfigured, registerAccount } = useAppContext();
  const [role, setRole] = useState("caregiver");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [supportLevel, setSupportLevel] = useState("moderate");
  const [dependentFullName, setDependentFullName] = useState("");
  const [dependentDateOfBirth, setDependentDateOfBirth] = useState("");
  const [dependentSupportLevel, setDependentSupportLevel] = useState("moderate");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    try {
      await registerAccount({
        dateOfBirth,
        dependentDateOfBirth,
        dependentFullName,
        dependentSupportLevel,
        caregiverPhone,
        email,
        fullName,
        password,
        role,
        supportLevel,
      });

      setSuccess("Account created successfully. Redirecting...");
      router.push(role === "caregiver" ? "/caregiver" : "/");
    } catch (registerError) {
      setError(registerError.message || "Registration failed. Please try again.");
    }
  }

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.card}>
        <p className={styles.kicker}>Account Setup</p>
        <h1>Register</h1>
        <p className={styles.description}>
          Create either a caregiver account that manages dependents or an
          independent account for a functional autistic user.
        </p>

        {!isFirebaseConfigured ? (
          <p className={styles.setupNotice}>
            Firebase registration is disabled until the `NEXT_PUBLIC_FIREBASE_*`
            variables are configured locally and in Netlify.
          </p>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? <p className={styles.success}>{success}</p> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Account role</span>
              <select onChange={(event) => setRole(event.target.value)} value={role}>
                <option value="caregiver">Parent or caregiver</option>
                <option value="independent">Independent autistic user</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Full name</span>
              <input
                onChange={(event) => setFullName(event.target.value)}
                type="text"
                value={fullName}
              />
            </label>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>

            <label className={styles.field}>
              <span>Password</span>
              <input
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Confirm password</span>
            <input
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
          </label>

          {role === "independent" ? (
            <section className={styles.section}>
              <h2>Independent profile</h2>
              <p className={styles.hint}>
                This profile is used when the autistic user manages their own
                routine directly.
              </p>

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Date of birth</span>
                  <input
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    type="date"
                    value={dateOfBirth}
                  />
                </label>

                <label className={styles.field}>
                  <span>Support level</span>
                  <select
                    onChange={(event) => setSupportLevel(event.target.value)}
                    value={supportLevel}
                  >
                    {SUPPORT_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          ) : null}

          {role === "caregiver" ? (
            <section className={styles.section}>
              <h2>First dependent</h2>
              <p className={styles.hint}>
                The caregiver area becomes especially relevant when the
                dependent is under 18 or is 18+ with severe support needs.
              </p>

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Dependent name</span>
                  <input
                    onChange={(event) => setDependentFullName(event.target.value)}
                    type="text"
                    value={dependentFullName}
                  />
                </label>

                <label className={styles.field}>
                  <span>Date of birth</span>
                  <input
                    onChange={(event) => setDependentDateOfBirth(event.target.value)}
                    type="date"
                    value={dependentDateOfBirth}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>Caregiver phone</span>
                <input
                  onChange={(event) => setCaregiverPhone(event.target.value)}
                  placeholder="Example: +351 912 345 678"
                  type="tel"
                  value={caregiverPhone}
                />
              </label>

              <label className={styles.field}>
                <span>Support level</span>
                <select
                  onChange={(event) => setDependentSupportLevel(event.target.value)}
                  value={dependentSupportLevel}
                >
                  {SUPPORT_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          ) : null}

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              disabled={!isFirebaseConfigured}
              type="submit"
            >
              Create Account
            </button>
            <Link className={styles.secondaryLink} href="/login">
              Already have an account?
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
