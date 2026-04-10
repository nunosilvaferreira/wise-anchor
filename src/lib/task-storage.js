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

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function cloneDefaultTasks() {
  return DEFAULT_DAILY_TASKS.map((task) => ({ ...task }));
}

export function createDefaultAppData() {
  return {
    personalDetails: { ...DEFAULT_PERSONAL_DETAILS },
    dailyTasks: cloneDefaultTasks(),
  };
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
    const currentDate = [
      date.getFullYear(),
      `${date.getMonth() + 1}`.padStart(2, "0"),
      `${date.getDate()}`.padStart(2, "0"),
    ].join("-");

    return task?.scheduleDate === currentDate;
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
    name: trimmedName,
    time,
    category,
    recurrenceValue:
      normalizedScheduleType === "weekly" || normalizedScheduleType === "monthly"
        ? recurrenceValue
        : "",
    scheduleDate: normalizedScheduleType === "specific_date" ? scheduleDate : "",
    scheduleType: normalizedScheduleType,
  };
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

  return {
    personalDetails,
    dailyTasks: sortTasks(incomingTasks.map(normalizeTask)),
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
      personalDetails: { ...DEFAULT_PERSONAL_DETAILS },
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
    return saveAppData(migratedData);
  }

  try {
    const parsedData = JSON.parse(savedData);
    return saveAppData(parsedData);
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
    name,
    time: time || "18:00",
    category: category || ROUTINE_SECTIONS[4].id,
    recurrenceValue,
    scheduleDate,
    scheduleType,
  });
  const nextTasks = [
    ...appData.dailyTasks,
    {
      id: `${Date.now()}`,
      category: validTask.category,
      time: validTask.time,
      name: validTask.name,
      completed: false,
      completedAt: "",
      recurrenceValue: validTask.recurrenceValue,
      scheduleDate: validTask.scheduleDate,
      scheduleType: validTask.scheduleType,
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
      name: task.name,
      time: task.time,
      category: task.category,
      recurrenceValue: task.recurrenceValue,
      scheduleDate: task.scheduleDate,
      scheduleType: task.scheduleType,
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
  // Remove completed items to keep the visible routine focused on pending work.
  const tasks = loadTasks();
  const nextTasks = tasks.filter((task) => !task.completed);
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

export class TaskValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "TaskValidationError";
    this.field = field;
  }
}
