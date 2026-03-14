const APP_STORAGE_KEY = "wise-anchor-app-data";
const LEGACY_TASKS_KEY = "wise-anchor-tasks";

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

function normalizeTask(task, index) {
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
      typeof task?.category === "string" && task.category
        ? task.category
        : fallback.category,
    time: typeof task?.time === "string" && task.time ? task.time : fallback.time,
    name: typeof task?.name === "string" && task.name ? task.name : fallback.name,
    completed: Boolean(task?.completed),
  };
}

function normalizeAppData(data) {
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
  const normalizedData = normalizeAppData(appData);

  if (canUseStorage()) {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(normalizedData));
  }

  return normalizedData;
}

function migrateLegacyTasks() {
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
  const appData = loadAppData();
  const nextTasks = [
    ...appData.dailyTasks,
    {
      id: `${Date.now()}`,
      category: category || ROUTINE_SECTIONS[4].id,
      time: time || "18:00",
      name,
      completed: false,
    },
  ];

  return saveAppData({
    ...appData,
    dailyTasks: nextTasks,
  }).dailyTasks;
}

export function saveDailyTasks(tasks) {
  const appData = loadAppData();

  return saveAppData({
    ...appData,
    dailyTasks: tasks,
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
  const tasks = loadTasks();
  const nextTasks = tasks.filter((task) => !task.completed);
  return saveDailyTasks(nextTasks);
}

export function savePersonalDetails(personalDetails) {
  const appData = loadAppData();

  return saveAppData({
    ...appData,
    personalDetails: {
      ...appData.personalDetails,
      ...personalDetails,
    },
  }).personalDetails;
}
