"use client";

import { useEffect, useState } from "react";
import SiteHeader from "./site-header";
import styles from "./routine-board.module.css";
import {
  clearCompletedTasks,
  loadPersonalDetails,
  loadTasks,
  ROUTINE_SECTIONS,
  toggleTaskCompleted,
} from "../lib/task-storage";

function formatDay(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function RoutineBoard() {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [personalDetails] = useState(() => loadPersonalDetails());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function handleToggle(taskId) {
    const nextTasks = toggleTaskCompleted(taskId);
    setTasks(nextTasks);
  }

  function handleClearCompleted() {
    const nextTasks = clearCompletedTasks();
    setTasks(nextTasks);
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;
  const greetingName = personalDetails.fullName || "friend";

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
            <p>{`${completedCount} completed, ${remainingCount} remaining`}</p>
          </div>

          <button
            className={styles.secondaryAction}
            onClick={handleClearCompleted}
            type="button"
          >
            Clear Completed
          </button>
        </div>

        <div className={styles.taskGroups}>
          {ROUTINE_SECTIONS.map((section) => {
            const sectionTasks = tasks.filter((task) => task.category === section.id);

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
                          <span className={styles.taskName}>{task.name}</span>
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

        {!tasks.length ? (
          <div className={styles.emptyState}>
            <h3>No routine tasks available</h3>
            <p>
              Open Settings and restore the daily tasks list, or add your own
              task from the Add Task page.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
