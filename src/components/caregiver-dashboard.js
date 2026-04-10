"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "./site-header";
import styles from "./caregiver-dashboard.module.css";
import {
  getAgeFromDateOfBirth,
  getSupportLevelLabel,
  SUPPORT_LEVEL_OPTIONS,
} from "../lib/profile-utils";
import { useAppContext } from "./app-provider";

export default function CaregiverDashboard() {
  const {
    activeProfile,
    createDependentProfile,
    isAuthenticated,
    isCloudMode,
    isFirebaseConfigured,
    linkedProfiles,
    role,
    switchActiveProfile,
  } = useAppContext();
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [supportLevel, setSupportLevel] = useState("moderate");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleCreateDependent(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      await createDependentProfile({
        dateOfBirth,
        fullName,
        supportLevel,
      });
      setFullName("");
      setDateOfBirth("");
      setSupportLevel("moderate");
      setStatus("Dependent profile created.");
    } catch (createError) {
      setError(createError.message || "Could not create the dependent profile.");
    }
  }

  async function handleSwitchProfile(profileId) {
    setStatus("");
    setError("");

    try {
      await switchActiveProfile(profileId);
      setStatus("Active dependent updated.");
    } catch (switchError) {
      setError(switchError.message || "Could not switch the active dependent.");
    }
  }

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <p className={styles.kicker}>Caregiver Area</p>
          <h1>Linked dependents</h1>
          <p className={styles.description}>
            Use this area when a child is under 18 or an adult user has severe
            support needs and a caregiver should manage the routine.
          </p>

          {!isFirebaseConfigured ? (
            <p className={styles.hint}>
              Firebase is not configured yet, so caregiver accounts are not
              available. Add the environment variables first.
            </p>
          ) : null}

          {isFirebaseConfigured && !isAuthenticated ? (
            <p className={styles.hint}>
              <Link href="/login">Sign in</Link> with a caregiver account to
              manage dependent profiles.
            </p>
          ) : null}

          {isAuthenticated && role !== "caregiver" ? (
            <p className={styles.hint}>
              This dashboard is reserved for caregiver accounts. Independent
              users can keep working from the main routine pages.
            </p>
          ) : null}

          {status ? <p className={styles.status}>{status}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
        </aside>

        <section className={styles.content}>
          <div className={styles.metaGrid}>
            <article className={styles.metaCard}>
              <h2>Sync mode</h2>
              <p>
                {isCloudMode
                  ? "Firebase sync is active. Firestore also keeps an offline cache on the device."
                  : "No synced caregiver profile is active yet."}
              </p>
            </article>
          </div>

          {role === "caregiver" ? (
            <div className={styles.profileGrid}>
              {linkedProfiles.length ? (
                linkedProfiles.map((profile) => {
                  const age = getAgeFromDateOfBirth(profile.dateOfBirth);
                  const isActive = activeProfile?.id === profile.id;

                  return (
                    <article className={styles.profileCard} key={profile.id}>
                      <div className={styles.profileCardHeader}>
                        <div>
                          <h3>{profile.fullName}</h3>
                          <p>
                            {profile.qualifiesForCaregiverView
                              ? "Caregiver area recommended"
                              : "Independent access may also be suitable"}
                          </p>
                        </div>

                        <span className={isActive ? styles.activeBadge : styles.inactiveBadge}>
                          {isActive ? "Active profile" : "Stored profile"}
                        </span>
                      </div>

                      <span className={styles.eligibleBadge}>
                        {profile.qualifiesForCaregiverView
                          ? "Eligible for caregiver workflow"
                          : "Optional caregiver workflow"}
                      </span>

                      <p className={styles.profileMeta}>
                        Age: {age ?? "Not set"} | Support level:{" "}
                        {getSupportLevelLabel(profile.supportLevel)}
                      </p>

                      {!isActive ? (
                        <button
                          className={styles.switchButton}
                          onClick={() => handleSwitchProfile(profile.id)}
                          type="button"
                        >
                          Switch to this profile
                        </button>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <p className={styles.emptyState}>
                  No dependents linked yet. Create the first one below.
                </p>
              )}

              <section className={styles.addCard}>
                <h2>Add another dependent</h2>
                <form className={styles.form} onSubmit={handleCreateDependent}>
                  <label className={styles.field}>
                    <span>Dependent name</span>
                    <input
                      onChange={(event) => setFullName(event.target.value)}
                      type="text"
                      value={fullName}
                    />
                  </label>

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

                  <button className={styles.submitButton} type="submit">
                    Create dependent profile
                  </button>
                </form>
              </section>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
