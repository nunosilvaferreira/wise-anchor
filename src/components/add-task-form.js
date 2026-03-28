"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteHeader from "./site-header";
import styles from "./add-task-form.module.css";
import { addTask, ROUTINE_SECTIONS, TaskValidationError } from "../lib/task-storage";

export default function AddTaskForm() {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [taskTime, setTaskTime] = useState("18:00");
  const [taskCategory, setTaskCategory] = useState(ROUTINE_SECTIONS[4].id);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    // Let storage validation decide whether this task is safe to save.
    event.preventDefault();
    setError("");

    try {
      addTask({
        name: taskName,
        category: taskCategory,
        time: taskTime,
      });

      router.push("/");
    } catch (error) {
      if (error instanceof TaskValidationError) {
        setError(error.message);
        return;
      }

      setError("Something went wrong while saving the task.");
    }
  }

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.card}>
        <p className={styles.kicker}>Task Entry</p>
        <h1>Add a New Task</h1>
        <p className={styles.description}>
          Create an extra routine step and choose the time it should appear in
          Today&apos;s Routine.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="taskInput">
            Task name
          </label>
          <input
            className={styles.input}
            id="taskInput"
            onChange={(event) => {
              setTaskName(event.target.value);
              if (error) {
                setError("");
              }
            }}
            placeholder="Example: Pack school bag"
            type="text"
            value={taskName}
          />

          <label className={styles.label} htmlFor="taskTime">
            Task time
          </label>
          <input
            className={styles.input}
            id="taskTime"
            onChange={(event) => setTaskTime(event.target.value)}
            type="time"
            value={taskTime}
          />

          <label className={styles.label} htmlFor="taskCategory">
            Routine section
          </label>
          <select
            className={styles.input}
            id="taskCategory"
            onChange={(event) => setTaskCategory(event.target.value)}
            value={taskCategory}
          >
            {ROUTINE_SECTIONS.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit">
              Save Task
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
