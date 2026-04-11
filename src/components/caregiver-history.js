"use client";

import { format, parseISO } from "date-fns";
import { useState } from "react";
import SiteHeader from "./site-header";
import styles from "./caregiver-history.module.css";
import { HISTORY_RETENTION_OPTIONS } from "../lib/task-storage";
import { useAppContext } from "./app-provider";

function formatHistoryDate(dateKey) {
  return format(parseISO(`${dateKey}T00:00:00`), "EEEE, MMM d");
}

function formatChartDate(dateKey) {
  return format(parseISO(`${dateKey}T00:00:00`), "dd/MM");
}

export default function CaregiverHistory() {
  const {
    activeProfile,
    historyRetention,
    linkedProfiles,
    saveHistoryRetention,
    switchActiveProfile,
  } = useAppContext();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const historyEntries = activeProfile?.taskHistory ?? [];
  const chartEntries = [...historyEntries].slice(0, 14).reverse();
  const missedEntries = historyEntries.filter((entry) => entry.missedTasks > 0);
  const averageCompletion = historyEntries.length
    ? Math.round(
        historyEntries.reduce((total, entry) => total + entry.completionRate, 0) /
          historyEntries.length
      )
    : 0;
  const totalMissedTasks = historyEntries.reduce(
    (total, entry) => total + entry.missedTasks,
    0
  );
  const missedTaskCounts = Object.entries(
    missedEntries.reduce((counts, entry) => {
      entry.tasks
        .filter((task) => !task.completed)
        .forEach((task) => {
          counts[task.name] = (counts[task.name] ?? 0) + 1;
        });

      return counts;
    }, {})
  )
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6);
  const highestMissedCount = missedTaskCounts[0]?.[1] ?? 1;

  async function handleRetentionChange(event) {
    setStatus("");
    setError("");

    try {
      await saveHistoryRetention(event.target.value);
      setStatus("History retention updated.");
    } catch (saveError) {
      setError(saveError.message || "Could not update the history retention.");
    }
  }

  async function handleSwitchProfile(profileId) {
    setStatus("");
    setError("");

    try {
      await switchActiveProfile(profileId);
      setStatus("History view updated to the selected dependent.");
    } catch (switchError) {
      setError(switchError.message || "Could not switch to that dependent.");
    }
  }

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <p className={styles.kicker}>Caregiver History</p>
          <h1>Routine history</h1>
          <p className={styles.description}>
            Review missed tasks from previous days, keep the history for a week,
            a month, or forever, and track completion trends over time.
          </p>

          <label className={styles.field}>
            <span>History retention</span>
            <select onChange={handleRetentionChange} value={historyRetention}>
              {HISTORY_RETENTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {linkedProfiles.length > 1 ? (
            <div className={styles.profileList}>
              {linkedProfiles.map((profile) => {
                const isActive = activeProfile?.id === profile.id;

                return (
                  <button
                    className={isActive ? styles.activeProfileButton : styles.profileButton}
                    key={profile.id}
                    onClick={() => handleSwitchProfile(profile.id)}
                    type="button"
                  >
                    {profile.fullName}
                  </button>
                );
              })}
            </div>
          ) : null}

          {status ? <p className={styles.status}>{status}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
        </aside>

        <section className={styles.content}>
          <div className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <h2>Tracked days</h2>
              <strong>{historyEntries.length}</strong>
              <p>Archived routine days inside the current retention window.</p>
            </article>

            <article className={styles.summaryCard}>
              <h2>Average completion</h2>
              <strong>{averageCompletion}%</strong>
              <p>Average completion rate across the saved history.</p>
            </article>

            <article className={styles.summaryCard}>
              <h2>Missed tasks</h2>
              <strong>{totalMissedTasks}</strong>
              <p>Total unfinished tasks recorded in the saved history.</p>
            </article>
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Completion trend</h2>
                <p>The latest archived days for {activeProfile?.fullName ?? "this dependent"}.</p>
              </div>
            </div>

            {chartEntries.length ? (
              <div className={styles.chart}>
                {chartEntries.map((entry) => (
                  <div className={styles.chartColumn} key={entry.date}>
                    <div className={styles.chartTrack}>
                      <div
                        className={styles.chartFill}
                        style={{ height: `${Math.max(entry.completionRate, 6)}%` }}
                      />
                    </div>
                    <strong>{entry.completionRate}%</strong>
                    <span>{formatChartDate(entry.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>
                No archived days yet. The first history entry is saved the day after tasks are shown.
              </p>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Most missed tasks</h2>
                <p>Tasks that were skipped most often inside the saved history.</p>
              </div>
            </div>

            {missedTaskCounts.length ? (
              <div className={styles.missedChart}>
                {missedTaskCounts.map(([taskName, count]) => (
                  <div className={styles.missedRow} key={taskName}>
                    <div className={styles.missedMeta}>
                      <span>{taskName}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className={styles.missedTrack}>
                      <div
                        className={styles.missedFill}
                        style={{ width: `${Math.max((count / highestMissedCount) * 100, 10)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>
                No missed tasks are stored in the current history range.
              </p>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Missed task history</h2>
                <p>Days where at least one task was left unfinished.</p>
              </div>
            </div>

            {missedEntries.length ? (
              <div className={styles.historyList}>
                {missedEntries.map((entry) => (
                  <article className={styles.historyCard} key={entry.date}>
                    <div className={styles.historyCardHeader}>
                      <h3>{formatHistoryDate(entry.date)}</h3>
                      <span>
                        {entry.completedTasks}/{entry.totalTasks} completed
                      </span>
                    </div>

                    <ul className={styles.taskList}>
                      {entry.tasks
                        .filter((task) => !task.completed)
                        .map((task) => (
                          <li className={styles.taskItem} key={`${entry.date}-${task.id}`}>
                            <span>{task.time}</span>
                            <p>{task.name}</p>
                          </li>
                        ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>
                No unfinished tasks are recorded in the saved history.
              </p>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
