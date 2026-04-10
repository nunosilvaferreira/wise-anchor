"use client";

import { useEffect, useState } from "react";
import SiteHeader from "./site-header";
import styles from "./settings-panel.module.css";
import {
  ROUTINE_SECTIONS,
  TASK_SCHEDULE_OPTIONS,
  WEEKDAY_OPTIONS,
} from "../lib/task-storage";
import { SUPPORT_LEVEL_OPTIONS } from "../lib/profile-utils";
import { useAppContext } from "./app-provider";

const TABS = [
  { id: "personal", label: "Personal Details" },
  { id: "tasks", label: "Daily Tasks" },
];

export default function SettingsPanel() {
  const {
    TaskValidationError,
    activeProfile,
    personalDetails: storedPersonalDetails,
    resetDailyTasks,
    saveDailyTasks,
    savePersonalDetails,
    tasks: storedTasks,
  } = useAppContext();
  const [activeTab, setActiveTab] = useState("personal");
  const [personalDetails, setPersonalDetails] = useState(storedPersonalDetails);
  const [dailyTasks, setDailyTasks] = useState(storedTasks);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // Refresh draft form values when the active synced profile changes.
    const frame = window.requestAnimationFrame(() => {
      setPersonalDetails(storedPersonalDetails);
      setDailyTasks(storedTasks);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [storedPersonalDetails, storedTasks, activeProfile?.id]);

  async function handlePersonalSave(event) {
    // Save the support profile so CalmSteps and other pages can reuse it.
    event.preventDefault();

    try {
      await savePersonalDetails(personalDetails);
      setStatus("Personal details saved.");
      setStatusType("success");
    } catch (error) {
      setStatus(error.message || "Could not save personal details right now.");
      setStatusType("error");
    }
  }

  function handleTaskChange(taskId, field, value) {
    // Apply inline task edits locally before the user commits the changes.
    setDailyTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              [field]: value,
            }
          : task
      )
    );
    setStatus("");
  }

  function handleAddTask(category) {
    // Create a sensible starter task inside the selected routine section.
    const section = ROUTINE_SECTIONS.find((item) => item.id === category);
    const nextTaskNumber =
      dailyTasks.filter((task) => task.category === category).length + 1;

    setDailyTasks((currentTasks) => [
      ...currentTasks,
      {
        id: `${Date.now()}-${category}-${nextTaskNumber}`,
        category,
        completedAt: "",
        recurrenceValue: "",
        scheduleDate: "",
        scheduleType: "daily",
        time: section?.defaultTime ?? "09:00",
        name: `${section?.label ?? "Routine"} task ${nextTaskNumber}`,
        completed: false,
      },
    ]);
    setStatus("");
  }

  function handleDeleteTask(taskId) {
    // Remove a task from the editable settings view before saving.
    setDailyTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId)
    );
    setStatus("");
  }

  async function handleTaskSave() {
    // Persist edited tasks and surface validation errors in the sidebar.
    try {
      await saveDailyTasks(dailyTasks);
      setStatus("Daily tasks saved.");
      setStatusType("success");
    } catch (error) {
      if (error instanceof TaskValidationError) {
        setStatus(error.message);
        setStatusType("error");
        return;
      }

      setStatus("Could not save tasks right now.");
      setStatusType("error");
    }
  }

  async function handleRestoreDefaults() {
    // Replace custom tasks with the predefined routine template.
    try {
      const restoredTasks = await resetDailyTasks();
      setDailyTasks(restoredTasks);
      setStatus("Default routine restored.");
      setStatusType("success");
    } catch (error) {
      setStatus(error.message || "Could not restore the default routine.");
      setStatusType("error");
    }
  }

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

      <section className={styles.wrapper}>
        <div className={styles.sidebar}>
          <p className={styles.kicker}>Settings</p>
          <h1>Support profile</h1>
          <p className={styles.description}>
            Update personal details and adjust the task schedule that appears in
            Today&apos;s Routine.
          </p>

          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                className={activeTab === tab.id ? styles.activeTab : styles.tab}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setStatus("");
                }}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {status ? (
            <p className={statusType === "error" ? styles.errorStatus : styles.status}>
              {status}
            </p>
          ) : null}
        </div>

        <section className={styles.content}>
          {activeTab === "personal" ? (
            <form className={styles.form} onSubmit={handlePersonalSave}>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Full name</span>
                  <input
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    type="text"
                    value={personalDetails.fullName}
                  />
                </label>

                <label className={styles.field}>
                  <span>Email</span>
                  <input
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    type="email"
                    value={personalDetails.email}
                  />
                </label>

                <label className={styles.field}>
                  <span>Contact</span>
                  <input
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        contact: event.target.value,
                      }))
                    }
                    type="text"
                    value={personalDetails.contact}
                  />
                </label>

                <label className={styles.field}>
                  <span>Caregiver name</span>
                  <input
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        caregiverName: event.target.value,
                      }))
                    }
                    type="text"
                    value={personalDetails.caregiverName}
                  />
                </label>

                <label className={styles.field}>
                  <span>Caregiver phone</span>
                  <input
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        caregiverPhone: event.target.value,
                      }))
                    }
                    type="tel"
                    value={personalDetails.caregiverPhone}
                  />
                </label>

                <label className={styles.field}>
                  <span>Emergency contact</span>
                  <input
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        emergencyContact: event.target.value,
                      }))
                    }
                    type="text"
                    value={personalDetails.emergencyContact}
                  />
                </label>

                <label className={styles.field}>
                  <span>Gender</span>
                  <select
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        gender: event.target.value,
                      }))
                    }
                    value={personalDetails.gender ?? "male"}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Support level</span>
                  <select
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        supportLevel: event.target.value,
                      }))
                    }
                    value={personalDetails.supportLevel ?? "moderate"}
                  >
                    {SUPPORT_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Date of birth</span>
                  <input
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        dateOfBirth: event.target.value,
                      }))
                    }
                    type="date"
                    value={personalDetails.dateOfBirth}
                  />
                </label>

                <label className={styles.field}>
                  <span>Preferred calming aid</span>
                  <input
                    onChange={(event) =>
                      setPersonalDetails((current) => ({
                        ...current,
                        sensoryPreferences: event.target.value,
                      }))
                    }
                    placeholder="Example: headphones, dim lights, blanket"
                    type="text"
                    value={personalDetails.sensoryPreferences}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>Allergies</span>
                <textarea
                  onChange={(event) =>
                    setPersonalDetails((current) => ({
                      ...current,
                      allergies: event.target.value,
                    }))
                  }
                  rows="3"
                  value={personalDetails.allergies}
                />
              </label>

              <label className={styles.field}>
                <span>Medications</span>
                <textarea
                  onChange={(event) =>
                    setPersonalDetails((current) => ({
                      ...current,
                      medications: event.target.value,
                    }))
                  }
                  rows="3"
                  value={personalDetails.medications}
                />
              </label>

              <label className={styles.field}>
                <span>Medical notes</span>
                <textarea
                  onChange={(event) =>
                    setPersonalDetails((current) => ({
                      ...current,
                      medicalNotes: event.target.value,
                    }))
                  }
                  placeholder="Add any relevant support notes, triggers, or care instructions."
                  rows="4"
                  value={personalDetails.medicalNotes}
                />
              </label>

              <button className={styles.primaryButton} type="submit">
                Save Personal Details
              </button>
            </form>
          ) : null}

          {activeTab === "tasks" ? (
            <div className={styles.tasksPanel}>
              <div className={styles.tasksHeader}>
                <div>
                  <h2>Routine Tasks</h2>
                  <p>
                    Edit the task times, names, and schedules before saving.
                  </p>
                </div>

                <div className={styles.taskActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={handleRestoreDefaults}
                    type="button"
                  >
                    Restore Default Routine
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={handleTaskSave}
                    type="button"
                  >
                    Save Daily Tasks
                  </button>
                </div>
              </div>

              <div className={styles.taskCards}>
                {ROUTINE_SECTIONS.map((section) => {
                  const sectionTasks = dailyTasks
                    .filter((task) => task.category === section.id)
                    .sort((left, right) => left.time.localeCompare(right.time));

                  return (
                    <section className={styles.taskSection} key={section.id}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <h3>{section.label}</h3>
                          <p>
                            Edit this part of the day or add more tasks to the
                            section.
                          </p>
                        </div>

                        <button
                          className={styles.secondaryButton}
                          onClick={() => handleAddTask(section.id)}
                          type="button"
                        >
                          Add Task
                        </button>
                      </div>

                      <div className={styles.taskCards}>
                        {sectionTasks.map((task) => (
                          <div className={styles.taskCard} key={task.id}>
                            <div className={styles.taskFields}>
                              <label className={styles.field}>
                                <span>Time</span>
                                <input
                                  onChange={(event) =>
                                    handleTaskChange(task.id, "time", event.target.value)
                                  }
                                  type="time"
                                  value={task.time}
                                />
                              </label>

                              <label className={styles.field}>
                                <span>Task</span>
                                <input
                                  onChange={(event) =>
                                    handleTaskChange(task.id, "name", event.target.value)
                                  }
                                  type="text"
                                  value={task.name}
                                />
                              </label>

                              <label className={styles.field}>
                                <span>Schedule</span>
                                <select
                                  onChange={(event) => {
                                    const nextScheduleType = event.target.value;

                                    handleTaskChange(task.id, "scheduleType", nextScheduleType);
                                    handleTaskChange(task.id, "scheduleDate", "");
                                    handleTaskChange(task.id, "recurrenceValue", "");
                                  }}
                                  value={task.scheduleType ?? "daily"}
                                >
                                  {TASK_SCHEDULE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              {task.scheduleType === "specific_date" ? (
                                <label className={styles.field}>
                                  <span>Date</span>
                                  <input
                                    onChange={(event) =>
                                      handleTaskChange(task.id, "scheduleDate", event.target.value)
                                    }
                                    type="date"
                                    value={task.scheduleDate ?? ""}
                                  />
                                </label>
                              ) : null}

                              {task.scheduleType === "weekly" ? (
                                <label className={styles.field}>
                                  <span>Weekday</span>
                                  <select
                                    onChange={(event) =>
                                      handleTaskChange(task.id, "recurrenceValue", event.target.value)
                                    }
                                    value={task.recurrenceValue ?? ""}
                                  >
                                    <option value="">Choose a weekday</option>
                                    {WEEKDAY_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : null}

                              {task.scheduleType === "monthly" ? (
                                <label className={styles.field}>
                                  <span>Day of month</span>
                                  <input
                                    max="31"
                                    min="1"
                                    onChange={(event) =>
                                      handleTaskChange(task.id, "recurrenceValue", event.target.value)
                                    }
                                    type="number"
                                    value={task.recurrenceValue ?? ""}
                                  />
                                </label>
                              ) : null}
                            </div>

                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteTask(task.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
