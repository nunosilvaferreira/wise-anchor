const APP_STORAGE_KEY = "wise-anchor-app-data";
const LEGACY_TASKS_KEY = "wise-anchor-tasks";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
  }))
);

function getSectionIndex(category) {
  const index = ROUTINE_SECTIONS.findIndex((section) => section.id === category);
  return index === -1 ? 0 : index;
}

function sortTasks(tasks) {
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

function cloneDefaultTasks() {
  return DEFAULT_DAILY_TASKS.map((task) => ({ ...task }));
}

function createDefaultAppData() {
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

function validateTaskInput({ name, time, category }) {
  // Throw explicit validation errors so UI forms can show friendly feedback.
  const trimmedName = typeof name === "string" ? name.trim() : "";

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

  return {
    name: trimmedName,
    time,
    category,
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
  };
}

function normalizeAppData(data) {
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

export function addTask({ name, time, category }) {
  // Validate before creating a new task so invalid entries never reach storage.
  const appData = loadAppData();
  const validTask = validateTaskInput({
    name,
    time: time || "18:00",
    category: category || ROUTINE_SECTIONS[4].id,
  });
  const nextTasks = [
    ...appData.dailyTasks,
    {
      id: `${Date.now()}`,
      category: validTask.category,
      time: validTask.time,
      name: validTask.name,
      completed: false,
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
    });

    return {
      ...task,
      ...validTask,
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
      ? {
          ...task,
          completed: !task.completed,
        }
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
