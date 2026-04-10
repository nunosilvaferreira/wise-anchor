"use client";

import { useEffect, useState } from "react";
import { format, parse } from "date-fns";
import SiteHeader from "./site-header";
import styles from "./routine-board.module.css";
import {
  getTaskScheduleSummary,
  isTaskScheduledForDate,
  ROUTINE_SECTIONS,
} from "../lib/task-storage";
import { useAppContext } from "./app-provider";

function formatDay(date) {
  // Use date-fns to keep day formatting readable and consistent.
  return format(date, "EEEE, MMMM d, yyyy");
}

function formatTime(date) {
  // Format times once here so cards and task insights use the same output.
  return format(date, "h:mm a");
}

function toDateFromTime(time, now) {
  // Convert stored HH:mm task strings into Date objects for comparisons.
  return parse(time, "HH:mm", now);
}

export default function RoutineBoard() {
  const {
    activeProfile,
    clearCompletedTasks,
    personalDetails,
    role,
    tasks,
    triggerSosAlert,
    toggleTaskCompleted,
  } = useAppContext();
  const [now, setNow] = useState(() => new Date());
  const [isReady, setIsReady] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    // Refresh the clock every second so the dashboard stays current.
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  async function handleToggle(taskId) {
    // Persist the task state change, then update local component state.
    try {
      setActionError("");
      setActionStatus("");
      await toggleTaskCompleted(taskId);
    } catch (error) {
      setActionError(error.message || "Could not update that task right now.");
    }
  }

  async function handleClearCompleted() {
    // Remove completed items from storage and refresh the rendered list.
    try {
      setActionError("");
      setActionStatus("");
      await clearCompletedTasks();
    } catch (error) {
      setActionError(error.message || "Could not clear completed tasks right now.");
    }
  }

  async function handleSendSos() {
    try {
      setActionError("");
      await triggerSosAlert({
        mode: "manual",
        note: "SOS requested from the routine dashboard.",
      });
      setActionStatus(
        "SOS alert saved. A push notification is also sent when a caregiver device is registered."
      );
    } catch (error) {
      setActionError(error.message || "Could not send SOS right now.");
    }
  }

  const visibleTasks = tasks.filter((task) => isTaskScheduledForDate(task, now));
  const completedCount = visibleTasks.filter((task) => task.completed).length;
  const remainingCount = visibleTasks.length - completedCount;
  const completionRate = visibleTasks.length
    ? Math.round((completedCount / visibleTasks.length) * 100)
    : 0;
  const pendingTasks = visibleTasks.filter((task) => !task.completed);

  const sortedPendingTasks = pendingTasks
    .map((task) => ({
      ...task,
      scheduleDate: toDateFromTime(task.time, now),
    }))
    .sort((left, right) => left.scheduleDate - right.scheduleDate);

  const nextTask =
    sortedPendingTasks.find((task) => task.scheduleDate >= now) ??
    sortedPendingTasks[0] ??
    null;

  const sectionStats = ROUTINE_SECTIONS.map((section) => {
    const sectionTasks = visibleTasks.filter((task) => task.category === section.id);
    const completedInSection = sectionTasks.reduce(
      (count, task) => count + (task.completed ? 1 : 0),
      0
    );
    const totalInSection = sectionTasks.length;
    const percentage = totalInSection
      ? Math.round((completedInSection / totalInSection) * 100)
      : 0;

    return {
      id: section.id,
      label: section.label,
      totalInSection,
      completedInSection,
      percentage,
      remainingInSection: totalInSection - completedInSection,
    };
  }).filter((section) => section.totalInSection > 0);

  const highestLoadSection = [...sectionStats].sort((left, right) => {
    if (right.remainingInSection !== left.remainingInSection) {
      return right.remainingInSection - left.remainingInSection;
    }

    return left.label.localeCompare(right.label);
  })[0];

  const greetingName = personalDetails.fullName || "friend";
  const caregiverPhone = personalDetails.caregiverPhone.trim();
  const showSupportActions =
    role !== "caregiver" &&
    (activeProfile?.profileType === "dependent" || Boolean(caregiverPhone));

  if (!isReady) {
    return (
      <main className={styles.page}>
        <SiteHeader />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Daily Support Planner</p>
          <h1>Welcome back, {greetingName}.</h1>
          <p className={styles.description}>
            Stay grounded with a clear routine, visible timing, and calm pacing
            through the day.
          </p>
          {showSupportActions ? (
            <div className={styles.supportActions}>
              <button
                className={styles.sosButton}
                onClick={handleSendSos}
                type="button"
              >
                Send SOS Alert
              </button>
              {caregiverPhone ? (
                <a
                  className={styles.mobileCallButton}
                  href={`tel:${caregiverPhone.replace(/\s+/g, "")}`}
                >
                  Call Caregiver
                </a>
              ) : null}
            </div>
          ) : null}
          {actionStatus ? <p className={styles.status}>{actionStatus}</p> : null}
          {actionError ? <p className={styles.error}>{actionError}</p> : null}
        </div>

        <div className={styles.clockCard}>
          <p className={styles.clockLabel}>Current day</p>
          <strong className={styles.clockDay}>{formatDay(now)}</strong>
          <p className={styles.clockLabel}>Current time</p>
          <strong className={styles.clockTime}>{formatTime(now)}</strong>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Today&apos;s routine</h2>
            <p>{`${completedCount} completed, ${remainingCount} remaining (${completionRate}% done)`}</p>
          </div>

          <button
            className={styles.secondaryAction}
            onClick={handleClearCompleted}
            type="button"
          >
            Clear Completed
          </button>
        </div>

        <section className={styles.insightsGrid}>
          <article className={styles.insightCard}>
            <h3>Next Task</h3>
            {nextTask ? (
              <p>
                {nextTask.name} at {formatTime(nextTask.scheduleDate)}
              </p>
            ) : (
              <p>No scheduled tasks left for today.</p>
            )}
          </article>

          <article className={styles.insightCard}>
            <h3>Most Remaining</h3>
            <p>
              {highestLoadSection
                ? `${highestLoadSection.label} (${highestLoadSection.remainingInSection} pending)`
                : "No pending tasks in any section."}
            </p>
          </article>
        </section>

        <section className={styles.progressSection}>
          <h3>Progress by Section</h3>
          <div className={styles.progressGrid}>
            {sectionStats.map((section) => (
              <article className={styles.progressCard} key={section.id}>
                <p className={styles.progressLabel}>{section.label}</p>
                <p className={styles.progressMeta}>
                  {section.completedInSection}/{section.totalInSection} completed
                </p>
                <div className={styles.progressTrack}>
                  <span
                    className={styles.progressFill}
                    style={{ width: `${section.percentage}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.taskGroups}>
          {ROUTINE_SECTIONS.map((section) => {
            const sectionTasks = visibleTasks.filter((task) => task.category === section.id);

            if (!sectionTasks.length) {
              return null;
            }

            return (
              <section className={styles.taskSection} key={section.id}>
                <h3 className={styles.sectionTitle}>{section.label}</h3>

                <ul className={styles.taskList}>
                  {sectionTasks.map((task) => (
                    <li
                      className={task.completed ? styles.completedItem : styles.taskItem}
                      key={task.id}
                    >
                      <button
                        className={styles.taskButton}
                        onClick={() => handleToggle(task.id)}
                        type="button"
                      >
                        <div className={styles.taskMeta}>
                          <span className={styles.taskTime}>{task.time}</span>
                          <div className={styles.taskText}>
                            <span className={styles.taskName}>{task.name}</span>
                            <span className={styles.taskSchedule}>
                              {getTaskScheduleSummary(task)}
                            </span>
                          </div>
                        </div>
                        <span className={styles.taskStatus}>
                          {task.completed ? "Completed" : "Mark Complete"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {!visibleTasks.length ? (
          <div className={styles.emptyState}>
            <h3>No routine tasks scheduled for today</h3>
            <p>
              Add a task with today&apos;s date, or create a weekly/monthly task
              that matches the current day.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
