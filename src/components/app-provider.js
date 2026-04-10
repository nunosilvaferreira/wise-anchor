"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import {
  addTask as addLocalTask,
  clearCompletedTasks as clearLocalCompletedTasks,
  cloneDefaultTasks,
  createDefaultAppData,
  DEFAULT_PERSONAL_DETAILS,
  loadAppData,
  normalizeAppData,
  resetDailyTasks as resetLocalDailyTasks,
  ROUTINE_SECTIONS,
  saveDailyTasks as saveLocalDailyTasks,
  savePersonalDetails as saveLocalPersonalDetails,
  sortTasks,
  TaskValidationError,
  toggleTaskCompleted as toggleLocalTaskCompleted,
  validateTaskInput,
} from "../lib/task-storage";
import {
  normalizeSupportLevel,
  qualifiesForCaregiverView,
} from "../lib/profile-utils";
import {
  firebaseAuth,
  firebaseDb,
  isFirebaseConfigured,
} from "../lib/firebase";
import {
  sendCaregiverAlert,
  unregisterStoredCaregiverPush,
} from "../lib/push-client";

const AppContext = createContext(null);

function createTimestamp() {
  return new Date().toISOString();
}

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeFeelingRecord(feeling) {
  if (!feeling || typeof feeling.id !== "string") {
    return null;
  }

  return {
    id: feeling.id,
    isUrgent: Boolean(feeling.isUrgent),
    label: typeof feeling.label === "string" ? feeling.label : "Unknown",
    message: typeof feeling.message === "string" ? feeling.message : "",
    updatedAt: typeof feeling.updatedAt === "string" ? feeling.updatedAt : "",
  };
}

function normalizeSosRecord(alert) {
  if (!alert || typeof alert.updatedAt !== "string") {
    return null;
  }

  return {
    mode: typeof alert.mode === "string" ? alert.mode : "manual",
    note: typeof alert.note === "string" ? alert.note : "",
    updatedAt: alert.updatedAt,
  };
}

function buildProfilePayload({
  caregiverUid = null,
  caregiverName = "",
  caregiverPhone = "",
  email = "",
  fullName,
  ownerUid,
  profileType,
  supportLevel,
  dateOfBirth,
}) {
  const createdAt = createTimestamp();
  const normalizedSupportLevel = normalizeSupportLevel(supportLevel);
  const personalDetails = {
    ...DEFAULT_PERSONAL_DETAILS,
    caregiverName,
    caregiverPhone,
    email,
    fullName: fullName.trim(),
    dateOfBirth,
    supportLevel: normalizedSupportLevel,
  };

  return {
    caregiverUid,
    createdAt,
    currentFeeling: null,
    dailyTasks: cloneDefaultTasks(),
    dateOfBirth,
    fullName: personalDetails.fullName,
    latestSosAlert: null,
    ownerUid,
    personalDetails,
    profileType,
    qualifiesForCaregiverView: qualifiesForCaregiverView(personalDetails),
    supportLevel: normalizedSupportLevel,
    updatedAt: createdAt,
  };
}

function normalizeProfileRecord(profileId, record) {
  const normalizedData = normalizeAppData({
    dailyTasks: record?.dailyTasks,
    personalDetails: record?.personalDetails,
  });
  const supportLevel = normalizeSupportLevel(
    record?.supportLevel ?? normalizedData.personalDetails.supportLevel
  );
  const fullName =
    typeof record?.fullName === "string" && record.fullName.trim()
      ? record.fullName.trim()
      : normalizedData.personalDetails.fullName;
  const dateOfBirth =
    typeof record?.dateOfBirth === "string"
      ? record.dateOfBirth
      : normalizedData.personalDetails.dateOfBirth;
  const personalDetails = {
    ...normalizedData.personalDetails,
    fullName,
    dateOfBirth,
    supportLevel,
  };

  return {
    id: profileId,
    ...record,
    currentFeeling: normalizeFeelingRecord(record?.currentFeeling),
    dateOfBirth,
    fullName,
    latestSosAlert: normalizeSosRecord(record?.latestSosAlert),
    personalDetails,
    qualifiesForCaregiverView: qualifiesForCaregiverView(personalDetails),
    supportLevel,
    dailyTasks: normalizedData.dailyTasks,
  };
}

export function AppProvider({ children }) {
  const [localData, setLocalData] = useState(() => createDefaultAppData());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [currentUser, setCurrentUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [linkedProfiles, setLinkedProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);

  useEffect(() => {
    // Refresh local fallback storage after hydration so guest mode matches the device state.
    const frame = window.requestAnimationFrame(() => {
      setLocalData(loadAppData());
      setHasHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseDb || !currentUser) {
      const frame = window.requestAnimationFrame(() => {
        setAccount(null);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const unsubscribe = onSnapshot(doc(firebaseDb, "users", currentUser.uid), (snapshot) => {
      setAccount(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseDb || !currentUser || account?.role !== "caregiver") {
      const frame = window.requestAnimationFrame(() => {
        setLinkedProfiles([]);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const caregiverProfilesQuery = query(
      collection(firebaseDb, "profiles"),
      where("caregiverUid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(caregiverProfilesQuery, (snapshot) => {
      const profiles = snapshot.docs
        .map((profileSnapshot) =>
          normalizeProfileRecord(profileSnapshot.id, profileSnapshot.data())
        )
        .sort((left, right) => left.fullName.localeCompare(right.fullName));

      setLinkedProfiles(profiles);
    });

    return unsubscribe;
  }, [account?.role, currentUser]);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseDb || !account?.activeProfileId) {
      const frame = window.requestAnimationFrame(() => {
        setActiveProfile(null);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const unsubscribe = onSnapshot(
      doc(firebaseDb, "profiles", account.activeProfileId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setActiveProfile(null);
          return;
        }

        setActiveProfile(normalizeProfileRecord(snapshot.id, snapshot.data()));
      }
    );

    return unsubscribe;
  }, [account?.activeProfileId]);

  const isAuthenticated = Boolean(currentUser);
  const waitingForActiveProfile = Boolean(
    isFirebaseConfigured &&
      isAuthenticated &&
      account?.activeProfileId &&
      !activeProfile
  );
  const isSessionReady = !isFirebaseConfigured
    ? hasHydrated
    : authReady && (!isAuthenticated || Boolean(account)) && !waitingForActiveProfile;
  const isCloudMode = Boolean(
    isFirebaseConfigured && isAuthenticated && account && activeProfile
  );
  const defaultData = createDefaultAppData();
  const useLocalFallback = !isFirebaseConfigured || !isAuthenticated || !account;
  const tasks = isCloudMode
    ? activeProfile.dailyTasks
    : useLocalFallback
      ? localData.dailyTasks
      : defaultData.dailyTasks;
  const personalDetails = isCloudMode
    ? activeProfile.personalDetails
    : useLocalFallback
      ? localData.personalDetails
      : defaultData.personalDetails;

  async function syncLocalData() {
    setLocalData(loadAppData());
  }

  async function replaceActiveCloudTasks(nextTasks) {
    if (!firebaseDb || !activeProfile) {
      throw new Error("No active synced profile is available.");
    }

    const sanitizedTasks = sortTasks(
      nextTasks.map((task) => {
        const validTask = validateTaskInput({
          category: task.category,
          name: task.name,
          time: task.time,
        });

        return {
          ...task,
          ...validTask,
          completed: Boolean(task.completed),
          completedAt: typeof task.completedAt === "string" ? task.completedAt : "",
          id: task.id ?? createTaskId(),
        };
      })
    );

    await setDoc(
      doc(firebaseDb, "profiles", activeProfile.id),
      {
        dailyTasks: sanitizedTasks,
        updatedAt: createTimestamp(),
      },
      { merge: true }
    );

    return sanitizedTasks;
  }

  async function persistActiveCloudPersonalDetails(updates) {
    if (!firebaseDb || !activeProfile) {
      throw new Error("No active synced profile is available.");
    }

    const nextPersonalDetails = {
      ...activeProfile.personalDetails,
      ...updates,
      supportLevel: normalizeSupportLevel(
        updates.supportLevel ?? activeProfile.personalDetails.supportLevel
      ),
    };

    const nextFullName = nextPersonalDetails.fullName.trim();
    const nextPayload = {
      dateOfBirth: nextPersonalDetails.dateOfBirth,
      fullName: nextFullName,
      personalDetails: nextPersonalDetails,
      qualifiesForCaregiverView: qualifiesForCaregiverView(nextPersonalDetails),
      supportLevel: nextPersonalDetails.supportLevel,
      updatedAt: createTimestamp(),
    };

    await setDoc(doc(firebaseDb, "profiles", activeProfile.id), nextPayload, {
      merge: true,
    });

    if (currentUser && account?.role !== "caregiver") {
      await setDoc(
        doc(firebaseDb, "users", currentUser.uid),
        {
          fullName: nextFullName,
          updatedAt: createTimestamp(),
        },
        { merge: true }
      );
    }

    return nextPersonalDetails;
  }

  async function registerAccount({
    dateOfBirth = "",
    dependentDateOfBirth = "",
    dependentFullName = "",
    dependentSupportLevel = "moderate",
    caregiverPhone = "",
    email,
    fullName,
    password,
    role,
    supportLevel = "moderate",
  }) {
    if (!isFirebaseConfigured || !firebaseAuth || !firebaseDb) {
      throw new Error(
        "Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* variables first."
      );
    }

    const trimmedFullName = fullName.trim();

    if (!trimmedFullName) {
      throw new Error("Full name is required.");
    }

    if (!email.trim()) {
      throw new Error("Email is required.");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    if (role !== "caregiver" && role !== "independent") {
      throw new Error("Please choose a valid account role.");
    }

    if (role === "caregiver" && !dependentFullName.trim()) {
      throw new Error("Caregiver registration requires the first dependent name.");
    }

    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email.trim(),
      password
    );
    const createdUser = credential.user;
    const profileRef = doc(collection(firebaseDb, "profiles"));
    const createdAt = createTimestamp();

    await updateProfile(createdUser, { displayName: trimmedFullName });

    if (role === "caregiver") {
      await Promise.all([
        setDoc(
          doc(firebaseDb, "users", createdUser.uid),
          {
            activeProfileId: profileRef.id,
            createdAt,
            email: email.trim(),
            fullName: trimmedFullName,
            role,
            updatedAt: createdAt,
          },
          { merge: true }
        ),
        setDoc(
          profileRef,
          buildProfilePayload({
            caregiverUid: createdUser.uid,
            caregiverName: trimmedFullName,
            caregiverPhone,
            dateOfBirth: dependentDateOfBirth,
            fullName: dependentFullName,
            ownerUid: createdUser.uid,
            profileType: "dependent",
            supportLevel: dependentSupportLevel,
          })
        ),
      ]);

      return;
    }

    await Promise.all([
      setDoc(
        doc(firebaseDb, "users", createdUser.uid),
        {
          activeProfileId: profileRef.id,
          createdAt,
          email: email.trim(),
          fullName: trimmedFullName,
          role,
          updatedAt: createdAt,
        },
        { merge: true }
      ),
      setDoc(
        profileRef,
        buildProfilePayload({
          dateOfBirth,
          email: email.trim(),
          fullName: trimmedFullName,
          ownerUid: createdUser.uid,
          profileType: "self",
          supportLevel,
        })
      ),
    ]);
  }

  async function login(email, password) {
    if (!isFirebaseConfigured || !firebaseAuth) {
      throw new Error(
        "Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* variables first."
      );
    }

    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  }

  async function logout() {
    if (!firebaseAuth) {
      return;
    }

    if (currentUser) {
      await unregisterStoredCaregiverPush(currentUser).catch(() => null);
    }

    await signOut(firebaseAuth);
  }

  async function switchActiveProfile(profileId) {
    if (!firebaseDb || !currentUser) {
      throw new Error("You need a synced account to switch profiles.");
    }

    await setDoc(
      doc(firebaseDb, "users", currentUser.uid),
      {
        activeProfileId: profileId,
        updatedAt: createTimestamp(),
      },
      { merge: true }
    );
  }

  async function createDependentProfile({
    caregiverPhone = "",
    dateOfBirth = "",
    fullName,
    supportLevel = "moderate",
  }) {
    if (!firebaseDb || !currentUser || account?.role !== "caregiver") {
      throw new Error("Only caregiver accounts can create dependent profiles.");
    }

    const trimmedFullName = fullName.trim();

    if (!trimmedFullName) {
      throw new Error("Dependent name is required.");
    }

    const profileRef = doc(collection(firebaseDb, "profiles"));

    await setDoc(
      profileRef,
      buildProfilePayload({
        caregiverUid: currentUser.uid,
        caregiverName: account?.fullName ?? "",
        caregiverPhone,
        dateOfBirth,
        fullName: trimmedFullName,
        ownerUid: currentUser.uid,
        profileType: "dependent",
        supportLevel,
      })
    );

    if (!account.activeProfileId) {
      await switchActiveProfile(profileRef.id);
    }
  }

  async function addTask(input) {
    if (isCloudMode) {
      const validTask = validateTaskInput({
        category: input.category || ROUTINE_SECTIONS[4].id,
        name: input.name,
        recurrenceValue: input.recurrenceValue || "",
        scheduleDate: input.scheduleDate || "",
        scheduleType: input.scheduleType || "daily",
        time: input.time || "18:00",
      });

      return replaceActiveCloudTasks([
        ...tasks,
        {
          ...validTask,
          completed: false,
          completedAt: "",
          id: createTaskId(),
        },
      ]);
    }

    const nextTasks = addLocalTask(input);
    await syncLocalData();
    return nextTasks;
  }

  async function saveDailyTasks(nextTasks) {
    if (isCloudMode) {
      return replaceActiveCloudTasks(nextTasks);
    }

    const savedTasks = saveLocalDailyTasks(nextTasks);
    await syncLocalData();
    return savedTasks;
  }

  async function resetDailyTasks() {
    if (isCloudMode) {
      return replaceActiveCloudTasks(cloneDefaultTasks());
    }

    const restoredTasks = resetLocalDailyTasks();
    await syncLocalData();
    return restoredTasks;
  }

  async function toggleTaskCompleted(taskId) {
    if (isCloudMode) {
      const nextTasks = tasks.map((task) =>
        task.id === taskId
          ? (() => {
              const nextCompleted = !task.completed;

              return {
                ...task,
                completed: nextCompleted,
                completedAt: nextCompleted ? createTimestamp() : "",
              };
            })()
          : task
      );

      return replaceActiveCloudTasks(nextTasks);
    }

    const toggledTasks = toggleLocalTaskCompleted(taskId);
    await syncLocalData();
    return toggledTasks;
  }

  async function clearCompletedTasks() {
    if (isCloudMode) {
      const nextTasks = tasks.filter((task) => !task.completed);
      return replaceActiveCloudTasks(nextTasks);
    }

    const remainingTasks = clearLocalCompletedTasks();
    await syncLocalData();
    return remainingTasks;
  }

  async function savePersonalDetails(nextDetails) {
    if (isCloudMode) {
      return persistActiveCloudPersonalDetails(nextDetails);
    }

    const savedDetails = saveLocalPersonalDetails(nextDetails);
    await syncLocalData();
    return savedDetails;
  }

  async function updateFeelingStatus(feeling) {
    if (!isCloudMode || !firebaseDb || !activeProfile) {
      throw new Error("You need an active synced profile to save feelings.");
    }

    const nextFeeling = {
      id: feeling.id,
      isUrgent: ["overwhelmed", "frustrated", "distressed"].includes(feeling.id),
      label: feeling.label,
      message: feeling.message,
      updatedAt: createTimestamp(),
    };

    await setDoc(
      doc(firebaseDb, "profiles", activeProfile.id),
      {
        currentFeeling: nextFeeling,
        updatedAt: nextFeeling.updatedAt,
      },
      { merge: true }
    );

    if (nextFeeling.isUrgent && currentUser && activeProfile.caregiverUid) {
      // Push delivery is best-effort. The routine state is still saved even if no caregiver
      // device is registered or the network request fails.
      await sendCaregiverAlert(currentUser, {
        alertType: "feeling",
        feelingId: nextFeeling.id,
        feelingLabel: nextFeeling.label,
        profileId: activeProfile.id,
      }).catch(() => null);
    }

    return nextFeeling;
  }

  async function triggerSosAlert({
    mode = "manual",
    note = "User requested urgent caregiver support.",
  } = {}) {
    if (!isCloudMode || !firebaseDb || !activeProfile) {
      throw new Error("You need an active synced profile to trigger SOS.");
    }

    const nextAlert = {
      mode,
      note,
      updatedAt: createTimestamp(),
    };

    await setDoc(
      doc(firebaseDb, "profiles", activeProfile.id),
      {
        latestSosAlert: nextAlert,
        updatedAt: nextAlert.updatedAt,
      },
      { merge: true }
    );

    if (currentUser && activeProfile.caregiverUid) {
      await sendCaregiverAlert(currentUser, {
        alertType: "sos",
        note: nextAlert.note,
        profileId: activeProfile.id,
      }).catch(() => null);
    }

    return nextAlert;
  }

  const value = {
    account,
    activeProfile,
    TaskValidationError,
    addTask,
    authReady,
    clearCompletedTasks,
    createDependentProfile,
    currentUser,
    isAuthenticated,
    isCloudMode,
    isFirebaseConfigured,
    isSessionReady,
    linkedProfiles,
    login,
    logout,
    personalDetails,
    registerAccount,
    resetDailyTasks,
    role: account?.role ?? "guest",
    saveDailyTasks,
    savePersonalDetails,
    switchActiveProfile,
    tasks,
    toggleTaskCompleted,
    triggerSosAlert,
    updateFeelingStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider.");
  }

  return context;
}
