"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import SiteHeader from "./site-header";
import styles from "./calm-steps.module.css";
import { getAgeFromDateOfBirth } from "../lib/profile-utils";
import { useAppContext } from "./app-provider";

const FEELINGS = [
  {
    id: "good",
    label: "Calm",
    message: "You seem steady. Keep the rhythm going with small, clear steps.",
  },
  {
    id: "uncertain",
    label: "Unsure",
    message: "Slow down and keep each next action simple.",
  },
  {
    id: "overwhelmed",
    label: "Overwhelmed",
    message: "Lower stimulation first, then focus on one safe action.",
  },
  {
    id: "frustrated",
    label: "Frustrated",
    message: "Take a short pause to reduce pressure before trying again.",
  },
  {
    id: "distressed",
    label: "Distressed",
    message: "Start with comfort and safety. You can take this one step at a time.",
  },
];

const GUIDED_PATHS = {
  good: [
    { id: "good-1", title: "Name one small win", detail: "Say it out loud or write it down." },
    { id: "good-2", title: "Choose the next routine task", detail: "Keep momentum with one action." },
  ],
  uncertain: [
    {
      id: "unsure-1",
      title: "Reduce choices",
      detail: "Pick only one of two options for the next task.",
      children: [
        {
          id: "unsure-1a",
          title: "Option A",
          detail: "Do the task that takes less than five minutes.",
        },
        {
          id: "unsure-1b",
          title: "Option B",
          detail: "Do the task that gives the fastest relief.",
        },
      ],
    },
    { id: "unsure-2", title: "Set a 5-minute timer", detail: "Start before the timer ends." },
  ],
  overwhelmed: [
    {
      id: "over-1",
      title: "Stabilize your environment",
      detail: "Lower noise and light around you.",
      children: [
        { id: "over-1a", title: "Use a comfort aid", detail: "Headphones, blanket, or weighted item." },
        { id: "over-1b", title: "Step into a quieter area", detail: "Stay there for two minutes." },
      ],
    },
    {
      id: "over-2",
      title: "Regulate breathing",
      detail: "Inhale for 4, hold 4, exhale for 6.",
      children: [
        { id: "over-2a", title: "Repeat for 3 rounds", detail: "Focus only on the count." },
      ],
    },
    { id: "over-3", title: "Restart with one tiny task", detail: "Pick the easiest action on your list." },
  ],
  frustrated: [
    { id: "frus-1", title: "Pause and reset posture", detail: "Drop shoulders and unclench jaw." },
    { id: "frus-2", title: "Describe the obstacle", detail: "Use one short sentence only." },
    { id: "frus-3", title: "Choose the next concrete action", detail: "One action, then reassess." },
  ],
  distressed: [
    {
      id: "dist-1",
      title: "Prioritize safety first",
      detail: "Move to a place where you feel physically safe.",
      children: [
        { id: "dist-1a", title: "Notify support contact", detail: "Use your emergency contact plan if needed." },
      ],
    },
    { id: "dist-2", title: "Grounding check", detail: "Name 5 things you can see and 3 you can touch." },
    { id: "dist-3", title: "Return to routine slowly", detail: "Choose one low-demand task only." },
  ],
};

const FEELING_IMAGE_ID = {
  good: "calm",
  uncertain: "unsure",
  overwhelmed: "overwhelmed",
  frustrated: "frustrated",
  distressed: "distressed",
};

function flattenGuidedSteps(steps, depth = 0) {
  // Recursively flatten nested support paths into a render-friendly list.
  if (!Array.isArray(steps) || steps.length === 0) {
    return [];
  }

  const [currentStep, ...remaining] = steps;
  const nested = flattenGuidedSteps(currentStep.children ?? [], depth + 1);

  return [
    {
      id: currentStep.id,
      title: currentStep.title,
      detail: currentStep.detail,
      depth,
    },
    ...nested,
    ...flattenGuidedSteps(remaining, depth),
  ];
}

function getAgeGroup(age) {
  // Match the saved user age to the image groups available in public assets.
  if (age < 12) {
    return "child";
  }

  if (age <= 17) {
    return "teen";
  }

  return "adult";
}

function getFeelingAsset(feelingId, ageGroup, gender) {
  // Translate internal feeling ids to the image filenames used by the UI.
  const feelingImageId = FEELING_IMAGE_ID[feelingId] ?? "calm";
  return `/calm-faces/${ageGroup}-${gender}-${feelingImageId}.png`;
}

function getPersonaLabel(ageGroup, gender) {
  if (ageGroup === "child") {
    return gender === "male" ? "Child boy (<12)" : "Child girl (<12)";
  }

  if (ageGroup === "teen") {
    return gender === "male" ? "Teenage boy (12-17)" : "Teenage girl (12-17)";
  }

  return gender === "male" ? "Man (18+)" : "Woman (18+)";
}

function getGender(genderValue) {
  return genderValue === "female" ? "female" : "male";
}

export default function CalmSteps() {
  const [selectedFeeling, setSelectedFeeling] = useState(FEELINGS[0]);
  const {
    activeProfile,
    personalDetails,
    role,
    triggerSosAlert,
    updateFeelingStatus,
  } = useAppContext();
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const savedFeeling = FEELINGS.find(
      (feeling) => feeling.id === activeProfile?.currentFeeling?.id
    );

    if (savedFeeling) {
      const frame = window.requestAnimationFrame(() => {
        setSelectedFeeling(savedFeeling);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    return undefined;
  }, [activeProfile?.currentFeeling?.id]);

  async function handleFeelingSelect(feeling) {
    setSelectedFeeling(feeling);
    setError("");

    try {
      await updateFeelingStatus(feeling);
      setStatus(
        ["overwhelmed", "frustrated", "distressed"].includes(feeling.id)
          ? "Feeling updated. A caregiver push alert is sent when a caregiver device is registered."
          : "Feeling updated."
      );
    } catch (saveError) {
      setError(saveError.message || "Could not update the current feeling.");
    }
  }

  async function handleSendSos() {
    setError("");

    try {
      await triggerSosAlert({
        mode: "calm_steps",
        note: "SOS triggered from the Calm Steps page.",
      });
      setStatus(
        "SOS alert saved. A push notification is also sent when a caregiver device is registered."
      );
    } catch (sosError) {
      setError(sosError.message || "Could not send the SOS alert.");
    }
  }

  const gender = getGender(personalDetails.gender);
  const age = getAgeFromDateOfBirth(personalDetails.dateOfBirth);
  const effectiveAge = age ?? 18;
  const hasProfileData = age !== null && Boolean(personalDetails.gender);
  const ageGroup = getAgeGroup(effectiveAge);
  const personaLabel = getPersonaLabel(ageGroup, gender);
  const caregiverPhone = personalDetails.caregiverPhone.trim();
  const showSupportActions =
    role !== "caregiver" &&
    (activeProfile?.profileType === "dependent" || Boolean(caregiverPhone));
  const guidedSteps = useMemo(
    () => flattenGuidedSteps(GUIDED_PATHS[selectedFeeling.id] ?? []),
    [selectedFeeling]
  );

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
        <div className={styles.hero}>
          <p className={styles.kicker}>CalmSteps</p>
          <h1>How do you feel?</h1>
          <p className={styles.description}>
            Choose the mood that feels closest right now. The app will suggest a guided
            sequence you can follow in order.
          </p>
        </div>

        <section className={styles.profileCard}>
          <div className={styles.fieldGroup}>
            <p className={styles.fieldLabel}>Age (from DOB)</p>
            <p className={styles.profileValue}>{age ?? "Not set"}</p>
          </div>

          <div className={styles.fieldGroup}>
            <p className={styles.fieldLabel}>Gender (from Settings)</p>
            <p className={styles.profileValue}>
              {gender === "male" ? "Male" : "Female"}
            </p>
          </div>

          <p className={styles.personaLabel}>Active avatar set: {personaLabel}</p>
          {!hasProfileData ? (
            <p className={styles.profileHint}>
              Add Date of Birth and Gender in Settings for precise avatar selection.
            </p>
          ) : null}
        </section>

        <div className={styles.feelingsGrid}>
          {FEELINGS.map((feeling) => (
            <button
              className={
                selectedFeeling.id === feeling.id ? styles.activeFeeling : styles.feeling
              }
              key={feeling.id}
              onClick={() => handleFeelingSelect(feeling)}
              type="button"
            >
              <Image
                alt={`${feeling.label} ${personaLabel}`}
                className={styles.avatar}
                src={getFeelingAsset(feeling.id, ageGroup, gender)}
                width={140}
                height={110}
              />
              <span className={styles.feelingLabel}>{feeling.label}</span>
            </button>
          ))}
        </div>

        <section className={styles.supportPanel}>
          <div className={styles.selectedMood}>
            <Image
              alt={`${selectedFeeling.label} ${personaLabel}`}
              className={styles.selectedAvatar}
              src={getFeelingAsset(selectedFeeling.id, ageGroup, gender)}
              width={180}
              height={160}
            />
            <div>
              <h2>{selectedFeeling.label}</h2>
              <p>{selectedFeeling.message}</p>
            </div>
          </div>

          {selectedFeeling.id === "overwhelmed" ||
          selectedFeeling.id === "frustrated" ||
          selectedFeeling.id === "distressed" ? (
            <p className={styles.urgentNotice}>
              This feeling is marked as urgent for caregiver visibility.
            </p>
          ) : null}

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

          {status ? <p className={styles.status}>{status}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.pathHeader}>
            <h3>Guided Sequence</h3>
            <p>{guidedSteps.length} steps generated by recursive nested support paths.</p>
          </div>

          <ol className={styles.guidedList}>
            {guidedSteps.map((step) => (
              <li
                className={styles.guidedItem}
                key={step.id}
                style={{ marginLeft: `${step.depth * 16}px` }}
              >
                <p className={styles.guidedTitle}>{step.title}</p>
                <p className={styles.guidedDetail}>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </main>
  );
}
