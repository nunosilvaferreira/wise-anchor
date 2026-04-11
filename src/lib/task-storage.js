const APP_STORAGE_KEY = "wise-anchor-app-data";
const LEGACY_TASKS_KEY = "wise-anchor-tasks";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAY_PATTERN = /^[0-6]$/;
const MONTHLY_DAY_PATTERN = /^(?:[1-9]|[12]\d|3[01])$/;

export const TASK_SCHEDULE_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "specific_date", label: "Specific date" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const HISTORY_RETENTION_OPTIONS = [
  { value: "forever", label: "Keep forever" },
  { value: "month", label: "Keep one month" },
  { value: "week", label: "Keep one week" },
];

export const WEEKDAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

export const ROUTINE_SECTIONS = [
  {
    id: "morning",
    label: "Morning Routine",
    defaultTime: "07:00",
    tasks: [
      { id: "wake-up", time: "07:00", name: "Wake up gently and stretch" },
      { id: "wash-face", time: "07:15", name: "Wash face and brush teeth" },
      { id: "breakfast", time: "07:30", name: "Have breakfast and drink water" },
      { id: "prepare-day", time: "08:00", name: "Get dressed and pack comfort items" },
    ],
  },
  {
    id: "lunch",
    label: "Lunch Time Routine",
    defaultTime: "12:00",
    tasks: [
      { id: "preview-lunch", time: "12:00", name: "Check lunch plan and preferred foods" },
      { id: "eat-lunch", time: "12:30", name: "Eat lunch in a calm space" },
      { id: "quiet-break", time: "12:50", name: "Take a quiet sensory break" },
    ],
  },
  {
    id: "afternoon",
    label: "Afternoon Routine",
    defaultTime: "14:00",
    tasks: [
      { id: "review-plan", time: "14:00", name: "Review the afternoon plan" },
      { id: "focused-task", time: "15:00", name: "Complete one focused task with a timer" },
      { id: "movement-break", time: "16:00", name: "Take a short movement or walking break" },
    ],
  },
  {
    id: "dinner",
    label: "Dinner Time Routine",
    defaultTime: "18:00",
    tasks: [
      { id: "prepare-dinner", time: "18:00", name: "Prepare dinner with a simple checklist" },
      { id: "eat-dinner", time: "18:30", name: "Eat dinner and drink water" },
      { id: "table-reset", time: "19:00", name: "Clear the table and reset the space" },
    ],
  },
  {
    id: "evening",
    label: "Evening Routine",
    defaultTime: "19:30",
    tasks: [
      { id: "evening-reset", time: "19:30", name: "Prepare for the evening routine" },
      { id: "comfort-time", time: "20:00", name: "Choose a calming activity or comfort item" },
      { id: "tomorrow-plan", time: "20:30", name: "Review tomorrow's plan" },
    ],
  },
  {
    id: "night",
    label: "Night Routine",
    defaultTime: "21:00",
    tasks: [
      { id: "bedroom-reset", time: "21:00", name: "Dim lights and prepare the bedroom" },
      { id: "hygiene", time: "21:15", name: "Brush teeth and complete hygiene routine" },
      { id: "sleep", time: "21:30", name: "Settle into bed with a calming cue" },
    ],
  },
];

export const DEFAULT_PERSONAL_DETAILS = {
  fullName: "",
  email: "",
  gender: "male",
  supportLevel: "moderate",
  caregiverName: "",
  caregiverPhone: "",
  contact: "",
  emergencyContact: "",
  dateOfBirth: "",
  allergies: "",
  medications: "",
  medicalNotes: "",
  sensoryPreferences: "",
};

export const DEFAULT_DAILY_TASKS = ROUTINE_SECTIONS.flatMap((section) =>
  section.tasks.map((task) => ({
    ...task,
    category: section.id,
    completed: false,
    completedAt: "",
    recurrenceValue: "",
    scheduleDate: "",
    scheduleType: "daily",
  }))
);

function getSectionIndex(category) {
  const index = ROUTINE_SECTIONS.findIndex((section) => section.id === category);
  return index === -1 ? 0 : index;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidCategory(category) {
  return ROUTINE_SECTIONS.some((section) => section.id === category);
}

function normalizeTime(value, fallback) {
  return typeof value === "string" && TIME_PATTERN.test(value) ? value : fallback;
}

function normalizeScheduleType(value) {
  return TASK_SCHEDULE_OPTIONS.some((option) => option.value === value)
    ? value
    : "daily";
}

function normalizeScheduleValue(scheduleType, value) {
  const safeValue = typeof value === "string" ? value : "";

  if (scheduleType === "weekly" && WEEKDAY_PATTERN.test(safeValue)) {
    return safeValue;
  }

  if (scheduleType === "monthly" && MONTHLY_DAY_PATTERN.test(safeValue)) {
    return safeValue;
  }

  return "";
}

function normalizeScheduleDate(value) {
  return typeof value === "string" && DATE_PATTERN.test(value) ? value : "";
}

function normalizeHistoryRetention(value) {
  return HISTORY_RETENTION_OPTIONS.some((option) => option.value === value)
    ? value
    : "forever";
}

function parseDateKey(value) {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function getRetentionDays(retention) {
  if (retention === "week") {
    return 7;
  }

  if (retention === "month") {
    return 30;
  }

  return null;
}

function normalizeTask(task, index) {
  // Repair incomplete stored tasks while preserving existing user data.
  const fallback = DEFAULT_DAILY_TASKS[index] ?? {
    id: `task-${index + 1}`,
    category: ROUTINE_SECTIONS[0].id,
    time: "09:00",
    name: `Routine task ${index + 1}`,
    completed: false,
  };

  return {
    id: task?.id ?? fallback.id,
    category:
      typeof task?.category === "string" && isValidCategory(task.category)
        ? task.category
        : fallback.category,
    time: normalizeTime(task?.time, fallback.time),
    name: typeof task?.name === "string" && task.name ? task.name : fallback.name,
    completed: Boolean(task?.completed),
    completedAt: typeof task?.completedAt === "string" ? task.completedAt : "",
    recurrenceValue: normalizeScheduleValue(
      normalizeScheduleType(task?.scheduleType),
      task?.recurrenceValue
    ),
    scheduleDate: normalizeScheduleDate(task?.scheduleDate),
    scheduleType: normalizeScheduleType(task?.scheduleType),
  };
}

function createHistoryTaskSnapshot(task, completed = false) {
  return {
    category: task.category,
    completed,
    completedAt: completed ? task.completedAt : "",
    id: task.id,
    name: task.name,
    recurrenceValue: task.recurrenceValue,
    scheduleDate: task.scheduleDate,
    scheduleType: task.scheduleType,
    time: task.time,
  };
}

function normalizeTaskHistoryEntry(entry, index) {
  const date = normalizeScheduleDate(entry?.date) || `1970-01-${`${index + 1}`.padStart(2, "0")}`;
  const tasks = sortTasks(
    (Array.isArray(entry?.tasks) ? entry.tasks : []).map((task, taskIndex) =>
      normalizeTask(task, taskIndex)
    )
  );
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;

  return {
    completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    completedTasks,
    date,
    missedTasks: totalTasks - completedTasks,
    tasks,
    totalTasks,
  };
}

function mergeTaskHistoryEntries(existingEntries, nextEntries) {
  const mergedEntries = new Map(
    existingEntries.map((entry) => [entry.date, entry])
  );

  nextEntries.forEach((entry) => {
    mergedEntries.set(entry.date, entry);
  });

  return [...mergedEntries.values()].sort((left, right) => right.date.localeCompare(left.date));
}

function pruneTaskHistory(history, retention, todayKey) {
  const retentionDays = getRetentionDays(retention);

  if (!retentionDays) {
    return history;
  }

  const todayDate = parseDateKey(todayKey);

  if (!todayDate) {
    return history;
  }

  const cutoffDate = addDays(todayDate, -(retentionDays - 1));
  const cutoffKey = getDateKey(cutoffDate);

  return history.filter((entry) => entry.date >= cutoffKey);
}

function resetTaskCompletion(tasks) {
  return tasks.map((task) => ({
    ...task,
    completed: false,
    completedAt: "",
  }));
}

function createTaskHistoryEntry(tasks, dateKey, useStoredCompletionState = false) {
  const date = parseDateKey(dateKey);

  if (!date) {
    return null;
  }

  const scheduledTasks = sortTasks(
    tasks.filter((task) => isTaskScheduledForDate(task, date))
  );

  if (!scheduledTasks.length) {
    return null;
  }

  const entryTasks = scheduledTasks.map((task) =>
    createHistoryTaskSnapshot(task, useStoredCompletionState ? task.completed : false)
  );
  const completedTasks = entryTasks.filter((task) => task.completed).length;
  const totalTasks = entryTasks.length;

  return {
    completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    completedTasks,
    date: dateKey,
    missedTasks: totalTasks - completedTasks,
    tasks: entryTasks,
    totalTasks,
  };
}

function getArchiveDateKeys(lastRoutineDate, todayKey) {
  const startDate = parseDateKey(lastRoutineDate);
  const todayDate = parseDateKey(todayKey);

  if (!startDate || !todayDate || startDate >= todayDate) {
    return [];
  }

  const keys = [];
  let cursor = startDate;

  while (cursor < todayDate) {
    keys.push(getDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return keys;
}

export function sortTasks(tasks) {
  // Keep tasks ordered by routine section, then time, then name.
  return [...tasks].sort((left, right) => {
    const sectionDifference = getSectionIndex(left.category) - getSectionIndex(right.category);

    if (sectionDifference !== 0) {
      return sectionDifference;
    }

    const timeDifference = left.time.localeCompare(right.time);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.name.localeCompare(right.name);
  });
}

export function cloneDefaultTasks() {
  return DEFAULT_DAILY_TASKS.map((task) => ({ ...task }));
}

export function getDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, "0"),
    `${date.getDate()}`.padStart(2, "0"),
  ].join("-");
}

export function createDefaultAppData() {
  return {
    dailyTasks: cloneDefaultTasks(),
    historyRetention: "forever",
    lastRoutineDate: getDateKey(),
    personalDetails: { ...DEFAULT_PERSONAL_DETAILS },
    taskHistory: [],
  };
}

export function getTaskScheduleSummary(task) {
  const scheduleType = normalizeScheduleType(task?.scheduleType);

  if (scheduleType === "specific_date") {
    return task?.scheduleDate ? `On ${task.scheduleDate}` : "Specific date";
  }

  if (scheduleType === "weekly") {
    return WEEKDAY_OPTIONS.find((option) => option.value === task?.recurrenceValue)?.label ?? "Weekly";
  }

  if (scheduleType === "monthly") {
    return task?.recurrenceValue ? `Day ${task.recurrenceValue} each month` : "Monthly";
  }

  return "Every day";
}

export function isTaskScheduledForDate(task, date = new Date()) {
  const scheduleType = normalizeScheduleType(task?.scheduleType);

  if (scheduleType === "specific_date") {
    return task?.scheduleDate === getDateKey(date);
  }

  if (scheduleType === "weekly") {
    return task?.recurrenceValue === `${date.getDay()}`;
  }

  if (scheduleType === "monthly") {
    return task?.recurrenceValue === `${date.getDate()}`;
  }

  return true;
}

export function validateTaskInput({
  name,
  time,
  category,
  scheduleDate = "",
  recurrenceValue = "",
  scheduleType = "daily",
}) {
  // Throw explicit validation errors so UI forms can show friendly feedback.
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const normalizedScheduleType = normalizeScheduleType(scheduleType);

  if (!trimmedName) {
    throw new TaskValidationError("Task name is required.", "name");
  }

  if (trimmedName.length < 3) {
    throw new TaskValidationError("Task name must be at least 3 characters.", "name");
  }

  if (!TIME_PATTERN.test(time)) {
    throw new TaskValidationError("Please provide a valid time in HH:MM format.", "time");
  }

  if (!isValidCategory(category)) {
    throw new TaskValidationError("Please choose a valid routine section.", "category");
  }

  if (normalizedScheduleType === "specific_date" && !DATE_PATTERN.test(scheduleDate)) {
    throw new TaskValidationError("Please choose the date for this task.", "scheduleDate");
  }

  if (normalizedScheduleType === "weekly" && !WEEKDAY_PATTERN.test(recurrenceValue)) {
    throw new TaskValidationError("Please choose the weekday for this weekly task.", "recurrenceValue");
  }

  if (normalizedScheduleType === "monthly" && !MONTHLY_DAY_PATTERN.test(recurrenceValue)) {
    throw new TaskValidationError("Please choose a monthly day between 1 and 31.", "recurrenceValue");
  }

  return {
    category,
    name: trimmedName,
    recurrenceValue:
      normalizedScheduleType === "weekly" || normalizedScheduleType === "monthly"
        ? recurrenceValue
        : "",
    scheduleDate: normalizedScheduleType === "specific_date" ? scheduleDate : "",
    scheduleType: normalizedScheduleType,
    time,
  };
}

export function normalizeAppData(data) {
  // Merge saved data with defaults to support older storage shapes safely.
  const defaultData = createDefaultAppData();
  const personalDetails = {
    ...defaultData.personalDetails,
    ...(data?.personalDetails ?? {}),
  };
  const incomingTasks = Array.isArray(data?.dailyTasks)
    ? data.dailyTasks
    : defaultData.dailyTasks;
  const taskHistory = Array.isArray(data?.taskHistory)
    ? data.taskHistory.map(normalizeTaskHistoryEntry)
    : [];
  const historyRetention = normalizeHistoryRetention(data?.historyRetention);
  const lastRoutineDate = normalizeScheduleDate(data?.lastRoutineDate) || getDateKey();

  return {
    dailyTasks: sortTasks(incomingTasks.map(normalizeTask)),
    historyRetention,
    lastRoutineDate,
    personalDetails,
    taskHistory: pruneTaskHistory(taskHistory, historyRetention, getDateKey()),
  };
}

export function reconcileAppDataForDate(data, currentDate = new Date()) {
  const normalizedData = normalizeAppData(data);
  const todayKey = getDateKey(currentDate);
  const lastRoutineDate = normalizedData.lastRoutineDate;

  if (!lastRoutineDate || lastRoutineDate === todayKey) {
    return {
      data:
        lastRoutineDate === todayKey
          ? normalizedData
          : {
              ...normalizedData,
              lastRoutineDate: todayKey,
            },
      didRollover: !lastRoutineDate,
    };
  }

  if (lastRoutineDate > todayKey) {
    return {
      data: {
        ...normalizedData,
        lastRoutineDate: todayKey,
      },
      didRollover: true,
    };
  }

  const archiveEntries = getArchiveDateKeys(lastRoutineDate, todayKey)
    .map((dateKey, index) =>
      createTaskHistoryEntry(
        normalizedData.dailyTasks,
        dateKey,
        index === 0
      )
    )
    .filter(Boolean);
  const mergedTaskHistory = pruneTaskHistory(
    mergeTaskHistoryEntries(normalizedData.taskHistory, archiveEntries),
    normalizedData.historyRetention,
    todayKey
  );

  return {
    data: {
      ...normalizedData,
      dailyTasks: resetTaskCompletion(normalizedData.dailyTasks),
      lastRoutineDate: todayKey,
      taskHistory: mergedTaskHistory,
    },
    didRollover: true,
  };
}

function saveAppData(appData) {
  // Save only normalized data so every page reads the same structure.
  const normalizedData = normalizeAppData(appData);

  if (canUseStorage()) {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(normalizedData));
  }

  return normalizedData;
}

function migrateLegacyTasks() {
  // Upgrade the older task-only storage format into the current app structure.
  const legacyTasks = window.localStorage.getItem(LEGACY_TASKS_KEY);

  if (!legacyTasks) {
    return createDefaultAppData();
  }

  try {
    const parsedLegacyTasks = JSON.parse(legacyTasks);

    if (!Array.isArray(parsedLegacyTasks)) {
      return createDefaultAppData();
    }

    return {
      ...createDefaultAppData(),
      dailyTasks: parsedLegacyTasks.map((task, index) =>
        normalizeTask(
          {
            ...task,
            time: task?.time ?? DEFAULT_DAILY_TASKS[index]?.time ?? "09:00",
          },
          index
        )
      ),
    };
  } catch {
    return createDefaultAppData();
  }
}

export function loadAppData() {
  // Load persisted data and self-heal broken or outdated storage entries.
  if (!canUseStorage()) {
    return createDefaultAppData();
  }

  const savedData = window.localStorage.getItem(APP_STORAGE_KEY);

  if (!savedData) {
    const migratedData = migrateLegacyTasks();
    return saveAppData(reconcileAppDataForDate(migratedData).data);
  }

  try {
    const parsedData = JSON.parse(savedData);
    return saveAppData(reconcileAppDataForDate(parsedData).data);
  } catch {
    return saveAppData(createDefaultAppData());
  }
}

export function loadTasks() {
  return loadAppData().dailyTasks;
}

export function loadPersonalDetails() {
  return loadAppData().personalDetails;
}

export function addTask({
  name,
  time,
  category,
  scheduleDate = "",
  recurrenceValue = "",
  scheduleType = "daily",
}) {
  // Validate before creating a new task so invalid entries never reach storage.
  const appData = loadAppData();
  const validTask = validateTaskInput({
    category: category || ROUTINE_SECTIONS[4].id,
    name,
    recurrenceValue,
    scheduleDate,
    scheduleType,
    time: time || "18:00",
  });
  const nextTasks = [
    ...appData.dailyTasks,
    {
      category: validTask.category,
      completed: false,
      completedAt: "",
      id: `${Date.now()}`,
      name: validTask.name,
      recurrenceValue: validTask.recurrenceValue,
      scheduleDate: validTask.scheduleDate,
      scheduleType: validTask.scheduleType,
      time: validTask.time,
    },
  ];

  return saveAppData({
    ...appData,
    dailyTasks: nextTasks,
  }).dailyTasks;
}

export function saveDailyTasks(tasks) {
  // Revalidate edited tasks before committing them to localStorage.
  const sanitizedTasks = tasks.map((task) => {
    const validTask = validateTaskInput({
      category: task.category,
      name: task.name,
      recurrenceValue: task.recurrenceValue,
      scheduleDate: task.scheduleDate,
      scheduleType: task.scheduleType,
      time: task.time,
    });

    return {
      ...task,
      ...validTask,
      completedAt: typeof task.completedAt === "string" ? task.completedAt : "",
    };
  });
  const appData = loadAppData();

  return saveAppData({
    ...appData,
    dailyTasks: sanitizedTasks,
  }).dailyTasks;
}

export function resetDailyTasks() {
  const appData = loadAppData();

  return saveAppData({
    ...appData,
    dailyTasks: cloneDefaultTasks(),
  }).dailyTasks;
}

export function toggleTaskCompleted(taskId) {
  // Flip a single task without mutating the rest of the collection.
  const tasks = loadTasks();
  const nextTasks = tasks.map((task) =>
    task.id === taskId
      ? (() => {
          const nextCompleted = !task.completed;

          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : "",
          };
        })()
      : task
  );

  return saveDailyTasks(nextTasks);
}

export function clearCompletedTasks() {
  // Reset completed states without deleting routine definitions from future days.
  const tasks = loadTasks();
  const nextTasks = tasks.map((task) =>
    task.completed
      ? {
          ...task,
          completed: false,
          completedAt: "",
        }
      : task
  );

  return saveDailyTasks(nextTasks);
}

export function savePersonalDetails(personalDetails) {
  // Merge profile updates instead of replacing the whole profile object.
  const appData = loadAppData();

  return saveAppData({
    ...appData,
    personalDetails: {
      ...appData.personalDetails,
      ...personalDetails,
    },
  }).personalDetails;
}

export function saveHistoryRetention(historyRetention) {
  const appData = loadAppData();
  const normalizedRetention = normalizeHistoryRetention(historyRetention);

  return saveAppData({
    ...appData,
    historyRetention: normalizedRetention,
    taskHistory: pruneTaskHistory(
      appData.taskHistory,
      normalizedRetention,
      getDateKey()
    ),
  }).historyRetention;
}

export class TaskValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "TaskValidationError";
    this.field = field;
  }
}
