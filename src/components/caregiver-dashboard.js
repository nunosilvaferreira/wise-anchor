"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "./site-header";
import styles from "./caregiver-dashboard.module.css";
import {
  getAgeFromDateOfBirth,
  getSupportLevelLabel,
  SUPPORT_LEVEL_OPTIONS,
} from "../lib/profile-utils";
import { isTaskScheduledForDate } from "../lib/task-storage";
import { useAppContext } from "./app-provider";
import {
  ensureCaregiverPushRegistration,
  getPushPermissionState,
  isPushConfigured,
  isPushSupported,
  sendCaregiverPushTest,
  subscribeToForegroundMessages,
} from "../lib/push-client";

export default function CaregiverDashboard() {
  const {
    activeProfile,
    createDependentProfile,
    currentUser,
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
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(
    getPushPermissionState()
  );
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const pushConfigured = isPushConfigured();

  const linkedProfilesSummary = useMemo(
    () =>
      linkedProfiles.map((profile) => {
        const todayTasks = profile.dailyTasks.filter((task) =>
          isTaskScheduledForDate(task, new Date())
        );
        const completedToday = todayTasks.filter((task) => task.completed);
        const recentCompletedTasks = [...completedToday]
          .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
          .slice(0, 3);

        return {
          ...profile,
          caregiverPhone: profile.personalDetails.caregiverPhone,
          completedToday,
          recentCompletedTasks,
          todayTasks,
        };
      }),
    [linkedProfiles]
  );

  const urgentAlerts = useMemo(
    () =>
      linkedProfilesSummary.flatMap((profile) => {
        const alerts = [];

        if (profile.currentFeeling?.isUrgent) {
          alerts.push({
            id: `${profile.id}-feeling-${profile.currentFeeling.updatedAt}`,
            message: `${profile.fullName} feels ${profile.currentFeeling.label}.`,
            timestamp: profile.currentFeeling.updatedAt,
          });
        }

        if (profile.latestSosAlert?.updatedAt) {
          alerts.push({
            id: `${profile.id}-sos-${profile.latestSosAlert.updatedAt}`,
            message: `${profile.fullName} triggered SOS support.`,
            timestamp: profile.latestSosAlert.updatedAt,
          });
        }

        return alerts;
      }),
    [linkedProfilesSummary]
  );

  useEffect(() => {
    let cancelled = false;

    isPushSupported().then((supported) => {
      if (!cancelled) {
        setPushSupported(supported);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      role !== "caregiver" ||
      !currentUser ||
      !pushConfigured ||
      notificationPermission !== "granted"
    ) {
      return undefined;
    }

    let active = true;

    ensureCaregiverPushRegistration(currentUser)
      .then((token) => {
        if (active && token) {
          setPushEnabled(true);
          setNotificationPermission(getPushPermissionState());
        }
      })
      .catch(() => {
        if (active) {
          setPushEnabled(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentUser, notificationPermission, pushConfigured, role]);

  useEffect(() => {
    if (role !== "caregiver" || !currentUser || !pushConfigured || !pushSupported) {
      return undefined;
    }

    let unsubscribe = () => {};
    let cancelled = false;

    subscribeToForegroundMessages((payload) => {
      const title = payload.notification?.title ?? "WiseAnchor alert";
      const body = payload.notification?.body ?? "New caregiver notification.";

      setStatus(`${title}: ${body}`);
      setNotificationPermission(getPushPermissionState());

      if (typeof window !== "undefined" && window.Notification?.permission === "granted") {
        new window.Notification(title, { body });
      }
    }).then((nextUnsubscribe) => {
      if (cancelled) {
        nextUnsubscribe();
        return;
      }

      unsubscribe = nextUnsubscribe;
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [currentUser, pushConfigured, pushSupported, role]);

  async function handleCreateDependent(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      await createDependentProfile({
        dateOfBirth,
        fullName,
        caregiverPhone,
        supportLevel,
      });
      setFullName("");
      setDateOfBirth("");
      setCaregiverPhone("");
      setSupportLevel("moderate");
      setStatus("Dependent profile created.");
    } catch (createError) {
      setError(createError.message || "Could not create the dependent profile.");
    }
  }

  async function handleEnableNotifications() {
    if (!currentUser) {
      setError("Sign in with a caregiver account first.");
      return;
    }

    setError("");
    setStatus("");
    setPushBusy(true);

    try {
      const token = await ensureCaregiverPushRegistration(currentUser, {
        requestPermission: true,
      });

      setNotificationPermission(getPushPermissionState());
      setPushEnabled(Boolean(token));
      setStatus("Push alerts enabled on this device.");
    } catch (pushError) {
      setNotificationPermission(getPushPermissionState());
      setPushEnabled(false);
      setError(pushError.message || "Could not enable push notifications.");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleTestNotification() {
    if (!currentUser) {
      setError("Sign in with a caregiver account first.");
      return;
    }

    setError("");
    setStatus("");

    try {
      const result = await sendCaregiverPushTest(currentUser);

      if (result.skipped === "no_registered_tokens") {
        setError("Enable push alerts on this device before sending a test.");
        return;
      }

      setStatus("Test push notification sent.");
    } catch (pushError) {
      setError(pushError.message || "Could not send the push test.");
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

            <article className={styles.metaCard}>
              <h2>Push alerts</h2>
              <p>
                {!pushConfigured
                  ? "Add NEXT_PUBLIC_FIREBASE_VAPID_KEY and the Firebase Admin credentials before enabling caregiver push alerts."
                  : !pushSupported
                    ? "This browser does not support Firebase push notifications."
                    : pushEnabled
                      ? "Push alerts are active on this device for urgent feelings and SOS requests."
                      : notificationPermission === "denied"
                        ? "Browser notifications are blocked. Allow them in browser settings, then try again."
                        : "Enable push alerts so this caregiver device receives real-time notifications even when the dashboard is closed."}
              </p>
              {!pushEnabled && pushConfigured && pushSupported ? (
                <button
                  className={styles.switchButton}
                  disabled={pushBusy}
                  onClick={handleEnableNotifications}
                  type="button"
                >
                  {pushBusy ? "Connecting..." : "Enable push alerts"}
                </button>
              ) : null}
              {pushEnabled ? (
                <button
                  className={styles.switchButton}
                  onClick={handleTestNotification}
                  type="button"
                >
                  Send test push
                </button>
              ) : null}
            </article>
          </div>

          {urgentAlerts.length ? (
            <section className={styles.alertsPanel}>
              <h2>Urgent alerts</h2>
              <div className={styles.alertList}>
                {urgentAlerts.map((alert) => (
                  <article className={styles.alertCard} key={alert.id}>
                    <p>{alert.message}</p>
                    <span>
                      {formatDistanceToNow(new Date(alert.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {role === "caregiver" ? (
            <div className={styles.profileGrid}>
              {linkedProfilesSummary.length ? (
                linkedProfilesSummary.map((profile) => {
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

                      <p className={styles.profileMeta}>
                        Feeling: {profile.currentFeeling?.label ?? "No recent update"}
                        {profile.currentFeeling?.updatedAt
                          ? ` (${formatDistanceToNow(new Date(profile.currentFeeling.updatedAt), {
                              addSuffix: true,
                            })})`
                          : ""}
                      </p>

                      <p className={styles.profileMeta}>
                        Completed today: {profile.completedToday.length}/{profile.todayTasks.length}
                      </p>

                      {profile.caregiverPhone ? (
                        <p className={styles.profileMeta}>
                          Caregiver phone: {profile.caregiverPhone}
                        </p>
                      ) : null}

                      {profile.recentCompletedTasks.length ? (
                        <div className={styles.completedList}>
                          {profile.recentCompletedTasks.map((task) => (
                            <p className={styles.completedItem} key={task.id}>
                              {task.name}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.profileMeta}>
                          No completed tasks recorded for today yet.
                        </p>
                      )}

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
