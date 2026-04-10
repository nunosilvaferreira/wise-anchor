"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteHeader from "./site-header";
import styles from "./add-task-form.module.css";
import {
  ROUTINE_SECTIONS,
  TASK_SCHEDULE_OPTIONS,
  WEEKDAY_OPTIONS,
} from "../lib/task-storage";
import { useAppContext } from "./app-provider";

export default function AddTaskForm() {
  const router = useRouter();
  const { TaskValidationError, addTask } = useAppContext();
  const [taskName, setTaskName] = useState("");
  const [taskTime, setTaskTime] = useState("18:00");
  const [taskCategory, setTaskCategory] = useState(ROUTINE_SECTIONS[4].id);
  const [scheduleType, setScheduleType] = useState("daily");
  const [scheduleDate, setScheduleDate] = useState("");
  const [recurrenceValue, setRecurrenceValue] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    // Let storage validation decide whether this task is safe to save.
    event.preventDefault();
    setError("");

    try {
      await addTask({
        name: taskName,
        category: taskCategory,
        recurrenceValue,
        scheduleDate,
        scheduleType,
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
          Create an extra routine step and choose whether it should happen
          every day, on a specific date, weekly, or monthly.
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

          <label className={styles.label} htmlFor="scheduleType">
            Schedule
          </label>
          <select
            className={styles.input}
            id="scheduleType"
            onChange={(event) => {
              const nextScheduleType = event.target.value;

              setScheduleType(nextScheduleType);
              setScheduleDate("");
              setRecurrenceValue("");
            }}
            value={scheduleType}
          >
            {TASK_SCHEDULE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {scheduleType === "specific_date" ? (
            <>
              <label className={styles.label} htmlFor="scheduleDate">
                Task date
              </label>
              <input
                className={styles.input}
                id="scheduleDate"
                onChange={(event) => setScheduleDate(event.target.value)}
                type="date"
                value={scheduleDate}
              />
            </>
          ) : null}

          {scheduleType === "weekly" ? (
            <>
              <label className={styles.label} htmlFor="recurrenceWeekday">
                Weekday
              </label>
              <select
                className={styles.input}
                id="recurrenceWeekday"
                onChange={(event) => setRecurrenceValue(event.target.value)}
                value={recurrenceValue}
              >
                <option value="">Choose a weekday</option>
                {WEEKDAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {scheduleType === "monthly" ? (
            <>
              <label className={styles.label} htmlFor="monthlyDay">
                Day of month
              </label>
              <input
                className={styles.input}
                id="monthlyDay"
                max="31"
                min="1"
                onChange={(event) => setRecurrenceValue(event.target.value)}
                placeholder="Example: 15"
                type="number"
                value={recurrenceValue}
              />
            </>
          ) : null}

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
